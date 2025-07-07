/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const config = require('./config');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const retry = require('async-retry');
const _ = require('lodash');
const UserService = require(`../Services/usersService`);
const SmError = require('./error');
const state = require('./state');
const JWKSCache = require('./jwksCache');
const { differenceInMinutes } = require('date-fns');

let jwksCache;

const privilegeGetter = new Function('obj', 'return obj?.' + config.oauth.claims.privilegesChain + ' || [];');

function decodeToken(tokenJWT) {
    const tokenObj = jwt.decode(tokenJWT, { complete: true });
    if (!tokenObj) {
        throw new SmError.AuthorizeError('Token is not valid JWT');
    }
    return tokenObj;
}

function checkInsecureKid(tokenObj) {
    if (!config.oauth.allowInsecureTokens && config.oauth.insecureKids?.includes(tokenObj.header.kid)) {
        throw new SmError.InsecureTokenError(`Insecure kid found: ${tokenObj.header.kid}`);
    }
}

async function getSigningKey(tokenObj, req) {
    let signingKey = jwksCache.getKey(tokenObj.header.kid);
    logger.writeDebug('auth', 'signingKey', { kid: tokenObj.header.kid, url: req.url });

    if (signingKey === null) {
        const result = await jwksCache.refreshCache(false);
        if (result) {
            signingKey = jwksCache.getKey(tokenObj.header.kid);
        }
        if (!result || !signingKey) {
            signingKey = 'unknown';
            jwksCache.setKey(tokenObj.header.kid, signingKey);
            logger.writeWarn('auth', 'unknownKid', { kid: tokenObj.header.kid });
        }
    }

    if (signingKey === 'unknown') {
        throw new SmError.SigningKeyNotFoundError(`Signing key unknown for kid: ${tokenObj.header.kid}`);
    }

    return signingKey;
}

function verifyToken(tokenJWT, signingKey) {
    try {
        const verifyOptions = config.oauth.audienceValue ? { audience: config.oauth.audienceValue } : undefined;
        jwt.verify(tokenJWT, signingKey, verifyOptions);
    } catch (e) {
        throw new SmError.AuthorizeError(e.message);
    }
}

const validateToken = async function (req, res, next) {
    try {
        const tokenJWT = getBearerToken(req);
        if (tokenJWT) {
            const tokenObj = decodeToken(tokenJWT);
            checkInsecureKid(tokenObj);
            const signingKey = await getSigningKey(tokenObj, req);
            verifyToken(tokenJWT, signingKey);

            req.access_token = tokenObj.payload;
            req.bearer = tokenJWT;
        }
        next();
    } catch (e) {
        next(e);
    }
};

async function handleUserDataRefresh(currentUserData, tokenPayload) {
    const refreshFields = {};
    const now = new Date();

    if (!currentUserData?.lastAccess || differenceInMinutes(now, currentUserData?.lastAccess) >= config.settings.lastAccessResolution) {
        refreshFields.lastAccess = now;
    }

    if (
        !currentUserData?.lastClaims ||
        tokenPayload[config.oauth.claims.assertion] !== currentUserData?.lastClaims?.[config.oauth.claims.assertion]
    ) {
        refreshFields.lastClaims = tokenPayload;
    }

    return refreshFields;
}

async function handlePointsUpdate(userId, lastAccess, hasPoints) {
    const now = new Date();
    if (!config.client.features.marketplaceDisabled && hasPoints) {
        if (differenceInMinutes(now, lastAccess) >= 720) {
            await UserService.dailyPoints(userId);
        } else if (differenceInMinutes(now, lastAccess) >= 60) {
            await UserService.hourlyPoints(userId);
        }
    }
}

const setupUser = async function (req, res, next) {
    try {
        if (req.access_token) {
            const tokenPayload = req.access_token;

            req.userObject = {
                email: tokenPayload[config.oauth.claims.email] ?? 'None Provided',
                firstName: tokenPayload[config.oauth.claims.firstname] ?? '',
                lastName: tokenPayload[config.oauth.claims.lastname] ?? '',
                fullName: tokenPayload[config.oauth.claims.fullname] ?? '',
            };

            const usernamePrecedence = [
                config.oauth.claims.username,
                'preferred_username',
                config.oauth.claims.servicename,
                'azp',
                'client_id',
                'clientId',
            ];
            req.userObject.userName = tokenPayload[usernamePrecedence.find(element => !!tokenPayload[element])];

            if (req.userObject.userName === undefined) {
                throw new SmError.AuthorizeError('No token claim mappable to username found');
            }

            req.userObject.displayName = tokenPayload[config.oauth.claims.name] ?? req.userObject.userName;

            req.userObject.isAdmin = privilegeGetter(tokenPayload).includes('admin');

            const currentUserData = await UserService.getUserByUserName(req.userObject.userName);
            if (currentUserData?.length > 1) req.userObject = currentUserData;
            req.userObject.userId = currentUserData?.userId || null;

            const refreshFields = await handleUserDataRefresh(currentUserData, tokenPayload);

            if (req.userObject.userName && (refreshFields.lastAccess || refreshFields.lastClaims)) {
                if (req.userObject.userId === null) {
                    const userId = await UserService.setUserData(req.userObject, refreshFields, true);
                    if (userId?.insertId && userId?.insertId != req.userObject.userId) {
                        req.userObject.userId = userId?.insertId?.toString();
                    }
                } else {
                    const userId = await UserService.setUserData(req.userObject, refreshFields, false);
                    if (userId?.insertId && userId?.insertId != req.userObject.userId) {
                        req.userObject.userId = userId?.insertId?.toString();
                    }
                    await handlePointsUpdate(req.userObject.userId, currentUserData?.lastAccess, currentUserData?.points);
                }
            }
        }
        next();
    } catch (e) {
        next(e);
    }
};

const validateOauthSecurity = function (req, requiredScopes) {
    if (!req.access_token) {
        throw new SmError.NoTokenError();
    }

    const tokenPayload = req.access_token;

    const grantedScopes =
        typeof tokenPayload[config.oauth.claims.scope] === 'string'
            ? tokenPayload[config.oauth.claims.scope].split(' ')
            : Array.isArray(tokenPayload[config.oauth.claims.scope])
              ? tokenPayload[config.oauth.claims.scope]
              : [];
    const commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function (gs, rs) {
        if (gs === rs) return gs;
        let gsTokens = gs.split(':').filter(i => i.length);
        let rsTokens = rs.split(':').filter(i => i.length);
        if (gsTokens.length === 0) {
            return false;
        } else {
            return gsTokens.every((t, i) => rsTokens[i] === t);
        }
    });
    if (commonScopes.length == 0) {
        throw new SmError.OutOfScopeError();
    }

    return true;
};

const getBearerToken = req => {
    if (!req.headers.authorization) return;
    const headerParts = req.headers.authorization.split(' ');
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
};

const containsInsecureKids = kids => {
    return kids.some(kid => config.oauth.insecureKids?.includes(kid));
};

const setupJwks = async function (jwksUri) {
    jwksCache = new JWKSCache({
        jwksUri,
        cacheMaxAge: (config.oauth.cacheMaxAge || 10) * 60 * 1000,
    });
    jwksCache.on('cacheUpdate', cache => {
        logger.writeDebug('auth', 'jwksCacheEvent', { event: 'cacheUpdate', kids: jwksCache.getKidTypes() });
    });
    jwksCache.on('cacheStale', cache => {
        logger.writeDebug('auth', 'jwksCacheEvent', { event: 'cacheStale', message: cache });
        state.setOidcStatus(false);
        jwksCache.once('cacheUpdate', cache => {
            state.setOidcStatus(true);
        });
    });

    const cacheResult = await jwksCache.refreshCache(false);
    if (!cacheResult) throw new Error('refresh jwks cache failed');
    const kids = jwksCache.getKids();
    if (!config.oauth.allowInsecureTokens && containsInsecureKids(kids)) {
        throw new Error('insecure_kid - JWKS contains insecure key IDs and CPAT_DEV_ALLOW_INSECURE_TOKENS is false');
    }

    logger.writeDebug('auth', 'discovery', { jwksUri, kids: jwksCache.getKidTypes() });
};

let initAttempt = 0;
async function initializeAuth() {
    const retries = config.settings.dependencyRetries || 24;
    const metadataUri = `${config.oauth.authority}/.well-known/openid-configuration`;
    let jwksUri;

    async function getJwks(bail) {
        logger.writeDebug('auth', 'discovery', { metadataUri, attempt: ++initAttempt });
        const response = await fetch(metadataUri, { method: 'GET' });
        const openidConfig = await response.json();
        logger.writeDebug('auth', 'discovery', { metadataUri, metadata: openidConfig });

        if (!openidConfig.jwks_uri) {
            const message = 'No jwks_uri property found in oidcConfig';
            logger.writeError('auth', 'discovery', { success: false, metadataUri, message });
            bail(new Error(message));
            return;
        }
        jwksUri = openidConfig.jwks_uri;

        try {
            await setupJwks(jwksUri);
        } catch (error) {
            if (error.message.startsWith('insecure_kid -')) {
                logger.writeError('auth', 'discovery', { success: false, metadataUri, message: error.message });
                bail(error);
                return;
            }
            throw error;
        }
    }

    await retry(getJwks, {
        retries,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        onRetry: error => {
            state.setStatus(false);
            logger.writeError('auth', 'discovery', { success: false, metadataUri, message: error.message });
        },
    });

    logger.writeInfo('auth', 'discovery', { success: true, metadataUri, jwksUri });
    state.setOidcStatus(true);
}

module.exports = { validateToken, setupUser, validateOauthSecurity, initializeAuth, privilegeGetter };
