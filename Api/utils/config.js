/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const package = require("../package.json")

let config = {
    version: package.version,
    commit: {
        branch: process.env.COMMIT_BRANCH || 'na',
        sha: process.env.COMMIT_SHA || 'na',
        tag: process.env.COMMIT_TAG || 'na',
        describe: process.env.COMMIT_DESCRIBE || 'na'
    },
    settings: {
        setClassification: process.env.POAM_CLASSIFICATION,
        lastAccessResolution: 60,
        // Supported POAM_DEV_RESPONSE_VALIDATION values: 
        // "logOnly" (logs failing response, but still sends them) 
        // "none"(no validation performed)
        responseValidation: process.env.POAM_DEV_RESPONSE_VALIDATION || "none"

    },
    client: {
        clientId: process.env.POAM_CLIENT_ID || "stig-manager",
        authority: process.env.POAM_CLIENT_OIDC_PROVIDER || process.env.POAM_OIDC_PROVIDER || "http://localhost:8080/auth/realms/poam",
        apiBase: process.env.POAM_CLIENT_API_BASE || "api",
        disabled: process.env.POAM_CLIENT_DISABLED === "true",
        directory: process.env.POAM_CLIENT_DIRECTORY || '../../client/dist',
        extraScopes: process.env.POAM_CLIENT_EXTRA_SCOPES,
        scopePrefix: process.env.POAM_CLIENT_SCOPE_PREFIX,
        refreshToken: {
            disabled: process.env.POAM_CLIENT_REFRESH_DISABLED ? process.env.POAM_CLIENT_REFRESH_DISABLED === "true" : false,
        },
        welcome: {
            image: process.env.POAM_CLIENT_WELCOME_IMAGE || "",
            message: process.env.POAM_CLIENT_WELCOME_MESSAGE || "",
            title: process.env.POAM_CLIENT_WELCOME_TITLE || "",
            link: process.env.POAM_CLIENT_WELCOME_LINK || ""
        }
    },
    docs: {
        disabled: process.env.POAM_DOCS_DISABLED  === "true",
        docsDirectory: process.env.POAM_DOCS_DIRECTORY || '../../docs/_build/html',
    },    
    http: {
        address: process.env.POAM_API_ADDRESS || "0.0.0.0",
        port: process.env.POAM_API_PORT || 54000,
        maxJsonBody: process.env.POAM_API_MAX_JSON_BODY || "5242880",
        maxUpload: process.env.POAM_API_MAX_UPLOAD || "1073741824"
    },
    database: {
        type: process.env.POAM_DB_TYPE || "mysql",
        host: process.env.POAM_DB_HOST || "localhost",
        port: process.env.POAM_DB_PORT || 3306,
        schema: process.env.POAM_DB_SCHEMA || "poamtracking",
        username: process.env.POAM_DB_USER || "root",
        password: process.env.POAM_DB_PASSWORD || "root",
        maxConnections: process.env.POAM_DB_MAX_CONNECTIONS || 25,
        tls: {
            ca_file: process.env.POAM_DB_TLS_CA_FILE,
            cert_file: process.env.POAM_DB_TLS_CERT_FILE,
            key_file: process.env.POAM_DB_TLS_KEY_FILE
        },
        revert: process.env.POAM_DB_REVERT === "true",
        toJSON: function () {
            let {password, ...props} = this
            props.password = !!password
            return props          
        }
    },
    init: {
        importStigs: process.env.POAM_INIT_IMPORT_STIGS === "true",
        importScap: process.env.POAM_INIT_IMPORT_SCAP === "true"
    },
    swaggerUi: {
        enabled: process.env.POAM_SWAGGER_ENABLED === "true", 
        authority: process.env.POAM_SWAGGER_OIDC_PROVIDER || process.env.POAM_SWAGGER_AUTHORITY || process.env.POAM_OIDC_PROVIDER || "http://localhost:8080/auth/realms/poam", 
        server: process.env.POAM_SWAGGER_SERVER || "http://localhost:54000/api",
        oauth2RedirectUrl: process.env.POAM_SWAGGER_REDIRECT || "http://localhost:54000/api-docs/oauth2-redirect.html"
    },
    oauth: {
        authority: process.env.POAM_OIDC_PROVIDER || process.env.POAM_API_AUTHORITY || "http://127.0.0.1:8080/realms/C-PAT",
        claims: {
            scope: process.env.POAM_JWT_SCOPE_CLAIM || "scope",
            username: process.env.POAM_JWT_USERNAME_CLAIM || "preferred_username",
            servicename: process.env.POAM_JWT_SERVICENAME_CLAIM || "clientId",
            name: process.env.POAM_JWT_NAME_CLAIM || process.env.POAM_JWT_USERNAME_CLAIM || "name",
            privileges: formatChain(process.env.POAM_JWT_PRIVILEGES_CLAIM || "realm_access.roles"),
            email: process.env.POAM_JWT_EMAIL_CLAIM || "email"
        }
    },
    log: {
        level: parseInt(process.env.POAM_LOG_LEVEL) || 3,
        mode: process.env.POAM_LOG_MODE || 'combined' 
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
