/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const config = require('./config')

const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')
const retry = require('async-retry')
const _ = require('lodash')
const { promisify } = require('util')
const User = require(`../Services/mysql/usersService`)
const axios = require('axios')

let jwksUri
let client

const privilegeGetter = new Function("obj", "return obj?." + config.oauth.claims.privileges + " || [];");

const verifyRequest = async function (req, requiredScopes, securityDefinition) {
    console.log("Getting to verify Request")
    const token = getBearerToken(req)
    if (!token) {
        throw ({ status: 401, message: 'OIDC bearer token must be provided' })
    }
    const options = {
        algorithms: ['RS256']
    }
    const decoded = await verifyAndDecodeToken(token, getKey, options)
    req.access_token = decoded
    req.bearer = token
    req.userObject = {
        username: decoded[config.oauth.claims.username] || decoded[config.oauth.claims.servicename] || 'null',
        displayName: decoded[config.oauth.claims.name] || decoded[config.oauth.claims.username] || decoded[config.oauth.claims.servicename] || 'USER',
        email: decoded[config.oauth.claims.email] || 'None Provided'
    }

    const grantedScopes = typeof decoded[config.oauth.claims.scope] === 'string' ?
        decoded[config.oauth.claims.scope].split(' ') :
        decoded[config.oauth.claims.scope]
    console.log("GrantedScope: ",grantedScopes)
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
        throw ({ status: 403, message: 'Not in scope' })
    }
    else {
        // Get privileges      
        const privileges = {}
        privileges.canCreateCollection = privilegeGetter(decoded).includes('create_collection')
        privileges.canAdmin = privilegeGetter(decoded).includes('admin')

        req.userObject.privileges = privileges
        /* const response = await User.getUserByUsername(req.userObject.username, ['collectionGrants', 'statistics'], false, null)   
         req.userObject.userId = response?.userId || null
         req.userObject.collectionGrants = response?.collectionGrants || []
         req.userObject.statistics = response?.statistics || {}
         
         const refreshFields = {}
         let now = new Date().toUTCString()
         now = new Date(now).getTime()
         now = now / 1000 | 0 //https://stackoverflow.com/questions/7487977/using-bitwise-or-0-to-floor-a-number

         if (!response?.statistics?.lastAccess || now - response?.statistics?.lastAccess >= config.settings.lastAccessResolution) {
             refreshFields.lastAccess = now
         }
         if (!response?.statistics?.lastClaims || decoded.jti !== response?.statistics?.lastClaims?.jti) {
             refreshFields.lastClaims = decoded
         }
         if (req.userObject.username && (refreshFields.lastAccess || refreshFields.lastClaims)) {
             const userId = await User.setUserData(req.userObject, refreshFields)
             if (userId != req.userObject.userId) {
                 req.userObject.userId = userId.toString()
             }
         }

         */
        if ('elevate' in req.query && (req.query.elevate === 'true' && !req.userObject.privileges.canAdmin)) {
            throw ({ status: 403, message: 'User has insufficient privilege to complete this request.' })
        }
        return true;
    }

}

const verifyAndDecodeToken = promisify(jwt.verify)

const getBearerToken = req => {
    if (!req.headers.authorization) return
    const headerParts = req.headers.authorization.split(' ')
    if (headerParts[0].toLowerCase() === 'bearer') return headerParts[1]
}

function getKey(header, callback) {
    try {
        // console.log("getKey header: ", header)
        // console.log("client: ", client)
        client.getSigningKey(header.kid, function (err, key) {
            if (!err) {
                var signingKey = key.publicKey || key.rsaPublicKey
                callback(null, signingKey)
            } else {
                console.log("err: ", err)
                callback(err, null)
            }
        })
    } catch (error) {
        console.log("err: ", error)
    }

}

let initAttempt = 0
async function initializeAuth() {
    const retries = 24
    const wellKnown = `${config.oauth.authority}/.well-known/openid-configuration`
    // console.log("within initializeAuth... ")
    async function getJwks() {
        // logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, attempt: ++initAttempt })

        // console.log("wellknown: ", wellKnown)
        try {
            const openidConfig = (await axios.get(wellKnown)).data
            if (openidConfig) {

                // logger.writeDebug('oidc', 'discovery', { metadataUri: wellKnown, metadata: openidConfig})
                if (!openidConfig.jwks_uri) {
                    throw (new Error('No jwks_uri property found'))
                }
                // console.log("openidConfig.jwks_uri: ", openidConfig.jwks_uri)
                jwksUri = openidConfig.jwks_uri
                client = jwksClient({
                    jwksUri: jwksUri
                })
                // console.log("client: ", client)
            }

        } catch (error) {
            console.log("axios.get err: ", error)
        }
    }
    await retry(getJwks, {
        retries,
        factor: 1,
        minTimeout: 5 * 1000,
        maxTimeout: 5 * 1000,
        onRetry: (error) => {
            //logger.writeError('oidc', 'discovery', { success: false, metadataUri: wellKnown, message: error.message })
        }
    })
    //logger.writeInfo('oidc', 'discovery', { success: true, metadataUri: wellKnown, jwksUri: jwksUri })
}

module.exports = { verifyRequest, initializeAuth }