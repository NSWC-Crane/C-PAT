/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

const config = require('../utils/config');
const logger = require('./logger')
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const retry = require('async-retry');
const _ = require('lodash');
const { promisify } = require('util');
const User = require('../Services/usersService')
const axios = require('axios');
const SmError = require('./error');
const { differenceInMinutes } = require('date-fns');
const https = require('https');
const http = require('http');

let jwksUri
let client

const privilegeGetter = new Function("obj", "return obj?." + config.oauth.claims.privileges + " || [];");

const verifyRequest = async function (req, requiredScopes, securityDefinition) {
    const token = getBearerToken(req)
    if (!token) {
        throw (new SmError.AuthorizeError("OIDC bearer token must be provided"))
    }
    const options = {
        algorithms: ['RS256']
    }
    const decoded = await verifyAndDecodeToken(token, getKey, options)
    req.access_token = decoded
    req.bearer = token
    req.userObject = {
        email: decoded[config.oauth.claims.email] ?? 'None Provided',
        firstName: decoded[config.oauth.claims.firstname] ?? '',
        lastName: decoded[config.oauth.claims.lastname] ?? '',
        fullName: decoded[config.oauth.claims.fullname] ?? '',
    }

    const usernamePrecedence = [config.oauth.claims.username, "preferred_username", config.oauth.claims.servicename, "azp", "client_id", "clientId"]
    req.userObject.userName = decoded[usernamePrecedence.find(element => !!decoded[element])]
    if (req.userObject.userName === undefined) {
        throw (new SmError.PrivilegeError("No token claim mappable to username found"))
    }

    req.userObject.displayName = decoded[config.oauth.claims.name] ?? req.userObject.userName
    const grantedScopes = typeof decoded[config.oauth.claims.scope] === 'string' ?
        decoded[config.oauth.claims.scope].split(' ') :
        decoded[config.oauth.claims.scope]
    const commonScopes = _.intersectionWith(grantedScopes, requiredScopes, function (gs, rs) {
        if (gs === rs) return gs
        let gsTokens = gs.split(":").filter(i => i.length)
        let rsTokens = rs.split(":").filter(i => i.length)
        if (gsTokens.length === 0) {
            return false
        }
        else {
            return gsTokens.every((t, i) => rsTokens[i] === t)
        }
    })
    if (commonScopes.length == 0) {
        throw (new SmError.PrivilegeError("Not in scope"))
    }
    else {
        let isAdmin = privilegeGetter(decoded).includes('admin');
        req.userObject.isAdmin = isAdmin;

        const currentUserData = await User.getUserByUserName(req.userObject.userName);
        if (currentUserData?.length > 1) req.userObject = currentUserData;
        req.userObject.userId = currentUserData?.userId || null;

        const refreshFields = {}
        let now = new Date();

        if (!currentUserData?.lastAccess || differenceInMinutes(now, currentUserData?.lastAccess) >= config.settings.lastAccessResolution) {
            refreshFields.lastAccess = now
        }
        if (!currentUserData?.lastClaims || decoded.jti !== currentUserData?.lastClaims?.jti) {
            refreshFields.lastClaims = decoded
        }

        if (req.userObject.userName && (refreshFields.lastAccess || refreshFields.lastClaims)) {
            if (req.userObject.userId === null) {
                const userId = await User.setUserData(req.userObject, refreshFields, true);
                if (userId?.insertId && userId?.insertId != req.userObject.userId) {
                    req.userObject.userId = userId?.insertId?.toString();
                }
            } else {
                const userId = await User.setUserData(req.userObject, refreshFields, false);
                if (userId?.insertId && userId?.insertId != req.userObject.userId) {
                    req.userObject.userId = userId?.insertId?.toString();
                }
                if (!config.client.features.marketplaceDisabled && differenceInMinutes(now, currentUserData?.lastAccess) >= 720 && currentUserData?.points) {
                    await User.dailyPoints(req.userObject.userId);
                } else if (!config.client.features.marketplaceDisabled && differenceInMinutes(now, currentUserData?.lastAccess) >= 60 && currentUserData?.points) {
                    await User.hourlyPoints(req.userObject.userId);
                }
            }
        }
        if ('elevate' in req.query && (req.query.elevate === 'true' && req.userObject.isAdmin !== true)) {
            throw (new SmError.PrivilegeError("User has insufficient privilege to complete this request."))
        }
        return true;
    }

}

const verifyAndDecodeToken = promisify(jwt.verify);

const getBearerToken = req => {
    if (!req.headers.authorization) return
    const headerParts = req.headers.authorization.split(' ')
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1]
}

async function getKey(header, callback) {
    async function fetchSigningKey() {
        return await new Promise((resolve, reject) => {
            client.getSigningKey(header.kid, (err, key) => {
                if (err) {
                    reject(err);
                } else {
                    const signingKey = key.publicKey || key.rsaPublicKey;
                    resolve(signingKey);
                }
            });
        });
    }

    try {
        const signingKey = await retry(
            fetchSigningKey,
            {
                retries: 3,
                factor: 1,
                minTimeout: 1000,
                maxTimeout: 1000,
                onRetry: (error) => {
                    logger.writeError('oidc', 'jwks', {
                        success: false,
                        kid: header.kid,
                        message: error.message
                    });
                }
            }
        );

        logger.writeDebug('oidc', 'jwks', {
            success: true,
            kid: header.kid
        });

        callback(null, signingKey);
    } catch (error) {
        logger.writeError('oidc', 'jwks', {
            success: false,
            kid: header.kid,
            message: error.message,
            final: true
        });
        callback(error, null);
    }
}

let initAttempt = 0
async function initializeAuth(depStatus) {
    const retries = 24
    const wellKnown = `${config.oauth.authority}/.well-known/openid-configuration`
    async function getJwks() {
        logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, attempt: ++initAttempt })

        const openidConfig = (await axios.get(wellKnown)).data

        logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, metadata: openidConfig })
        if (!openidConfig.jwks_uri) {
            throw (new Error('No jwks_uri property found'))
        }
        jwksUri = openidConfig.jwks_uri
        const isHttps = jwksUri.toLowerCase().startsWith('https');
        const requestAgent = isHttps ?
            new https.Agent({
                keepAlive: true,
                keepAliveMsecs: 3000,
                maxSockets: 25,
                maxFreeSockets: 12,
                timeout: 10000
            }) :
            new http.Agent({
                keepAlive: true,
                keepAliveMsecs: 3000,
                maxSockets: 25,
                maxFreeSockets: 12,
                timeout: 10000
            });

        client = jwksClient({
            cache: true,
            cacheMaxEntries: 10,
            cacheMaxAge: 600000,
            jwksUri: jwksUri,
            timeout: 10000,
            rateLimit: true,
            jwksRequestsPerMinute: 30,
            requestAgent,
            handleSigningKeyError: async (err, cb) => {
                logger.writeError('oidc', 'jwks', {
                    error: err.message,
                    code: err.code
                });
                if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
                    client.getSigningKey.cache.reset();
                }
                cb(err);
            }
        })
    }

    await retry(getJwks, {
        retries,
        factor: 1.5,
        minTimeout: 2 * 1000,
        maxTimeout: 10 * 1000,
        onRetry: (error) => {
            logger.writeError('oidc', 'discovery', { success: false, metadataUri: wellKnown, message: error.message })
        }
    })

    logger.writeInfo('oidc', 'discovery', { success: true, metadataUri: wellKnown, jwksUri: jwksUri })
    depStatus.auth = 'up'
}

module.exports = {
    verifyRequest,
    initializeAuth,
};