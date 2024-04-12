/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/
require('dotenv').config();
const package = require("../package.json")

let config = {
    version: package.version,
    commit: {
        branch: process.env.COMMIT_BRANCH,
        sha: process.env.COMMIT_SHA,
        tag: process.env.COMMIT_TAG,
        describe: process.env.COMMIT_DESCRIBE
    },
    settings: {
        setClassification: process.env.POAM_CLASSIFICATION,
        lastAccessResolution: 60,
        responseValidation: process.env.POAM_DEV_RESPONSE_VALIDATION

    },
    cpat: {
        host: process.env.CPAT_HOST,
        port: process.env.CPAT_PORT,
    },
    client: {
        clientId: process.env.POAM_CLIENT_ID,
        authority: process.env.POAM_CLIENT_OIDC_PROVIDER || process.env.POAM_OIDC_PROVIDER,
        apiBase: process.env.POAM_CLIENT_API_BASE,
        disabled: process.env.POAM_CLIENT_DISABLED,
        directory: process.env.POAM_CLIENT_DIRECTORY,
        extraScopes: process.env.POAM_CLIENT_EXTRA_SCOPES,
        scopePrefix: process.env.POAM_CLIENT_SCOPE_PREFIX,
        refreshToken: {
            disabled: process.env.POAM_CLIENT_REFRESH_DISABLED ? process.env.POAM_CLIENT_REFRESH_DISABLED === "true" : false,
        },
        welcome: {
            image: process.env.POAM_CLIENT_WELCOME_IMAGE,
            message: process.env.POAM_CLIENT_WELCOME_MESSAGE,
            title: process.env.POAM_CLIENT_WELCOME_TITLE,
            link: process.env.POAM_CLIENT_WELCOME_LINK
        }
    },
    docs: {
        disabled: process.env.POAM_DOCS_DISABLED,
        docsDirectory: process.env.POAM_DOCS_DIRECTORY,
    },    
    http: {
        address: process.env.POAM_API_ADDRESS,
        port: process.env.POAM_API_PORT,
        maxJsonBody: process.env.POAM_API_MAX_JSON_BODY,
        maxUpload: process.env.POAM_API_MAX_UPLOAD
    },
    database: {
        type: process.env.DB_TYPE,
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        schema: process.env.DB_SCHEMA,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        maxConnections: process.env.DB_MAX_CONNECTIONS, 
        minConnections: process.env.DB_MIN_CONNECTIONS,   
        acquire: process.env.DB_ACQUIRE,
        idle: process.env.DB_IDLE,   
        tls: {
            ca_file: process.env.DB_TLS_CA_FILE,
            cert_file: process.env.DB_TLS_CERT_FILE,
            key_file: process.env.DB_TLS_KEY_FILE
        },
        revert: process.env.DB_REVERT,
        toJSON: function () {
            let {password, ...props} = this
            props.password = !!password
            return props          
        }
    },
    init: {
        importStigs: process.env.POAM_INIT_IMPORT_STIGS,
        importScap: process.env.POAM_INIT_IMPORT_SCAP
    },
    swaggerUi: {
        enabled: process.env.POAM_SWAGGER_ENABLED, 
        authority: process.env.POAM_SWAGGER_OIDC_PROVIDER, 
        server: process.env.POAM_SWAGGER_SERVER,
        oauth2RedirectUrl: process.env.POAM_SWAGGER_REDIRECT
    },
    oauth: {
        authority: process.env.POAM_OIDC_PROVIDER || process.env.POAM_API_AUTHORITY,
        claims: {
            scope: process.env.POAM_JWT_SCOPE_CLAIM,
            username: process.env.POAM_JWT_USERNAME_CLAIM,
            servicename: process.env.POAM_JWT_SERVICENAME_CLAIM,
            name: process.env.POAM_JWT_NAME_CLAIM || process.env.POAM_JWT_USERNAME_CLAIM,
            privileges: formatChain(process.env.POAM_JWT_PRIVILEGES_CLAIM || "realm_access.roles"),
            email: process.env.POAM_JWT_EMAIL_CLAIM
        }
    },
    log: {
        level: parseInt(process.env.POAM_LOG_LEVEL) || 3,
        mode: process.env.POAM_LOG_MODE
    }
}

function formatChain(path) {
    const components = path?.split('.')
    if (components?.length === 1) return path
    for (let x=0; x < components.length; x++) {
      components[x] = `['${components[x]}']`
    }
    return components.join('?.')
  }
  
module.exports = config
