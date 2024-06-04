/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
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
const { format, isAfter  } = require('date-fns');

let jwksUri;
let client;

const privilegeGetter = new Function("obj", "return obj?." + config.oauth.claims.privileges + " || [];");

const verifyRequest = async function (req, requiredScopes, securityDefinition) {
    const token = getBearerToken(req);
    if (!token) {
        throw new SmError.AuthorizeError("OIDC bearer token must be provided");
    }

    const options = { algorithms: ['RS256'] };
    const decoded = await verifyAndDecodeToken(token, getKey, options);
    req.access_token = decoded;
    req.bearer = token;

    req.userObject = {
        userName: decoded[config.oauth.claims.username],
        firstName: decoded[config.oauth.claims.firstname] || 'null',
        lastName: decoded[config.oauth.claims.lastname] || 'null',
        fullName: decoded[config.oauth.claims.fullname] || 'null',
        email: decoded[config.oauth.claims.email],
        lastClaims: req.access_token,
    };

    const usernamePrecedence = [config.oauth.claims.username, "preferred_username", config.oauth.claims.servicename, "azp", "client_id", "clientId"];
    req.userObject.userName = decoded[usernamePrecedence.find(element => !!decoded[element])];

    if (req.userObject.userName === undefined) {
        throw new SmError.PrivilegeError("No token claim mappable to username found");
    }

    let scopeClaim;
    if (decoded[config.oauth.claims.scope]) {
        scopeClaim = decoded[config.oauth.claims.scope];
    } else if (decoded.scope) {
        scopeClaim = decoded.scope;
    } else {
        scopeClaim = null;
    }

    let grantedScopes = [];

    if (typeof scopeClaim === 'string') {
        grantedScopes = scopeClaim.split(' ');
    } else if (Array.isArray(scopeClaim)) {
        grantedScopes = scopeClaim;
    } else {
        logger.writeError('verifyRequest', 'invalidScopeType', { scopeClaim, grantedScopes });
    }
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
    });

    if (commonScopes.length == 0) {
        throw (new SmError.PrivilegeError("Not in scope"))
    } else {  
        const permissions = {};
        permissions.canAdmin = privilegeGetter(decoded).includes('admin');
        req.userObject.isAdmin = permissions.canAdmin ? 1 : 0;
        const response = await User.getUserByUserName(req.userObject.userName);

        req.userObject.userId = response?.userId || null;

        let now = new Date();
        let formattedNow = format(now, 'yyyy-MM-dd HH:mm:ss');

        if (!response?.lastAccess) {
            req.userObject.lastAccess = formattedNow;
        } else {
            let lastAccessDate = new Date(response.lastAccess);
            if (isAfter(now, lastAccessDate)) {
                req.userObject.lastAccess = formattedNow;
            } else {
                req.userObject.lastAccess = response.lastAccess;
            }
        }
        if (!response?.lastClaims || decoded.jti !== response?.lastClaims?.jti) {
            req.userObject.lastClaims = decoded
        } else {
            req.userObject.lastClaims = response.lastClaims
        }

        if (req.userObject.userName) {
            const userResponse = await User.setUserData(req.userObject);
            const userId = userResponse.userId;
            if (userId !== req.userObject.userId) {
                req.userObject.userId = userId;
            }
        }

        if ('elevate' in req.query && req.query.elevate === 'true' && !permissions.canAdmin) {
            throw new SmError.PrivilegeError("User has insufficient privilege to complete this request.");
        }
        return true;
    }
};

const verifyAndDecodeToken = promisify(jwt.verify);

const getBearerToken = req => {
    if (!req.headers.authorization) return;
    const headerParts = req.headers.authorization.split(' ');
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1];
}

function getKey(header, callback) {
    try {
        client.getSigningKey(header.kid, function (err, key) {
            if (!err) {
                var signingKey = key.publicKey || key.rsaPublicKey;
                callback(null, signingKey);
            } else {
                callback(err, null);
            }
        });
    } catch (error) {
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
        client = jwksClient({
            jwksUri: jwksUri
        })
    }
    await retry(getJwks, {
        retries,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
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
