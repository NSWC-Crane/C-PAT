/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

require('dotenv').config();
const cpatPackage = require('../package.json');

const insecureKids = ['FJ86GcF3jTbNLOco4NvZkUCIUmfYCqoqtOQeMfbhNlE'];

let config = {
    version: cpatPackage.version,
    settings: {
        basePath: process.env.CPAT_BASE_PATH || '',
        setClassification: process.env.CPAT_CLASSIFICATION || 'U',
        lastAccessResolution: 60,
        responseValidation: process.env.CPAT_DEV_RESPONSE_VALIDATION || 'none',
        dodDeployment: process.env.CPAT_DOD_DEPLOYMENT !== 'false',
        inactivityTimeout: process.env.CPAT_INACTIVITY_TIMEOUT ? parseInt(process.env.CPAT_INACTIVITY_TIMEOUT) * 60 * 1000 : 15 * 60 * 1000,
    },
    client: {
        authority: process.env.CPAT_CLIENT_OIDC_PROVIDER || process.env.CPAT_OIDC_PROVIDER || 'http://localhost:8080/auth/realms/RMFTools',
        apiBase: process.env.CPAT_API_BASE || 'api',
        disabled: process.env.CPAT_CLIENT_DISABLED === 'true',
        directory: process.env.CPAT_CLIENT_DIRECTORY || '../client/dist/browser',
        extraScopes: process.env.CPAT_EXTRA_SCOPES,
        scopePrefix: process.env.CPAT_SCOPE_PREFIX,
        refreshToken: {
            disabled: process.env.CPAT_CLIENT_REFRESH_DISABLED ? process.env.CPAT_CLIENT_REFRESH_DISABLED === 'true' : false,
        },
        features: {
            marketplaceDisabled: process.env.CPAT_MARKETPLACE_DISABLED ? process.env.CPAT_MARKETPLACE_DISABLED === 'true' : false,
        },
    },
    stigman: {
        clientId: process.env.STIGMAN_OIDC_CLIENT_ID || 'stig-manager',
        apiUrl: process.env.STIGMAN_API_URL || 'http://localhost:54000/api',
        scopePrefix: process.env.STIGMAN_SCOPE_PREFIX,
        extraScopes: process.env.STIGMAN_EXTRA_SCOPES,
    },
    tenable: {
        enabled: process.env.TENABLE_ENABLED === 'true',
        url: process.env.TENABLE_URL || '',
        accessKey: process.env.TENABLE_ACCESS_KEY,
        secretKey: process.env.TENABLE_SECRET_KEY,
    },
    docs: {
        disabled: process.env.CPAT_DOCS_DISABLED ? process.env.CPAT_DOCS_DISABLED === 'true' : false,
        docsDirectory: process.env.CPAT_DOCS_DIRECTORY || '../docs/_build/html',
    },
    http: {
        address: process.env.CPAT_API_ADDRESS || '0.0.0.0',
        port: process.env.CPAT_API_PORT || 8086,
        maxJsonBody: process.env.CPAT_API_MAX_JSON_BODY || '52428800',
        maxUpload: process.env.CPAT_API_MAX_UPLOAD || '52428800',
        rateLimit: process.env.CPAT_API_RATE_LIMIT || '10000',
    },
    database: {
        acquire: process.env.CPAT_DB_ACQUIRE || 30000,
        dialect: process.env.CPAT_DB_DIALECT || 'mysql',
        host: process.env.CPAT_DB_HOST || 'localhost',
        idle: process.env.CPAT_DB_IDLE || 10000,
        port: process.env.CPAT_DB_PORT || 3306,
        schema: process.env.CPAT_DB_SCHEMA || 'cpat',
        password: process.env.CPAT_DB_PASSWORD,
        username: process.env.CPAT_DB_USER,
        maxConnections: process.env.CPAT_DB_MAX_CONNECTIONS || 25,
        minConnections: process.env.CPAT_DB_MIN_CONNECTIONS || 0,
        tls: {
            ca_file: process.env.CPAT_DB_TLS_CA_FILE,
            cert_file: process.env.CPAT_DB_TLS_CERT_FILE,
            key_file: process.env.CPAT_DB_TLS_KEY_FILE,
        },
        revert: process.env.CPAT_DB_REVERT === 'true',
        toJSON: function () {
            let { password, ...props } = this;
            props.password = !!password;
            return props;
        },
    },
    swaggerUi: {
        enabled: process.env.CPAT_SWAGGER_ENABLED === 'true',
        authority: process.env.CPAT_OIDC_PROVIDER || 'http://localhost:8080/auth/realms/RMFTools',
        server: process.env.CPAT_SWAGGER_SERVER || 'http://localhost:8086/api',
        oauth2RedirectUrl: process.env.CPAT_SWAGGER_REDIRECT || 'http://localhost:8086/api-docs/oauth2-redirect.html',
    },
    oauth: {
        clientId: process.env.CPAT_OIDC_CLIENT_ID || 'c-pat',
        authority: process.env.CPAT_OIDC_PROVIDER || 'http://localhost:8080/realms/RMFTools',
        allowInsecureTokens: process.env.CPAT_DEV_ALLOW_INSECURE_TOKENS === 'true',
        insecureKids,
        cacheMaxAge: Math.min(Math.max(process.env.CPAT_JWKS_CACHE_MAX_AGE, 1) || 10, 35791),
        audienceValue: process.env.CPAT_JWT_AUD_VALUE,
        claims: {
            scope: process.env.CPAT_JWT_SCOPE_CLAIM || 'scope',
            username: process.env.CPAT_JWT_USERNAME_CLAIM || 'preferred_username',
            servicename: process.env.CPAT_JWT_SERVICENAME_CLAIM,
            fullname: process.env.CPAT_JWT_NAME_CLAIM || process.env.CPAT_JWT_USERNAME_CLAIM || 'name',
            firstname: process.env.CPAT_JWT_FIRST_NAME_CLAIM || 'given_name',
            lastname: process.env.CPAT_JWT_LAST_NAME_CLAIM || 'family_name',
            privilegesSql: formatMySqlJsonPath(process.env.CPAT_JWT_PRIVILEGES_CLAIM || 'realm_access.roles'),
            privilegesChain: formatJsChain(process.env.CPAT_JWT_PRIVILEGES_CLAIM || 'realm_access.roles'),
            email: process.env.CPAT_JWT_EMAIL_CLAIM || 'email',
            assertion: process.env.CPAT_JWT_ASSERTION_CLAIM || 'jti',
        },
    },
    ai: {
        enabled: process.env.CPAT_AI_ENABLED === 'true',
        provider: process.env.CPAT_AI_PROVIDER,
        modelName: process.env.CPAT_AI_MODEL_NAME,
        apiKey: process.env.CPAT_AI_API_KEY,
        aiBaseURL: process.env.CPAT_AI_BASE_URL,
    },
    log: {
        level: parseInt(process.env.CPAT_LOG_LEVEL) || 3,
        mode: process.env.CPAT_LOG_MODE || 'combined',
    },
};

function formatJsChain(path) {
    const components = path?.split('.');
    if (components?.length === 1) return path;
    for (let x = 0; x < components.length; x++) {
        components[x] = `['${components[x]}']`;
    }
    return components.join('?.');
}

function formatMySqlJsonPath(path) {
    return path
        ?.split('.')
        .map(p => `"${p}"`)
        .join('.');
}

module.exports = config;
