/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

class SmError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.toJSON = () => ({ error: this.message });
    }
}

class ClientError extends SmError {
    constructor(detail) {
        super('Incorrect request.');
        this.status = 400;
        this.detail = detail;
    }
}

class AuthorizeError extends SmError {
    constructor(detail) {
        super('Request not authorized.');
        this.status = 401;
        this.detail = detail;
    }
}

class PrivilegeError extends SmError {
    constructor(detail) {
        super('User has insufficient privilege to complete this request.');
        this.status = 403;
        this.detail = detail;
    }
}
class NotFoundError extends SmError {
    constructor(detail) {
        super('Resource not found.');
        this.status = 404;
        this.detail = detail;
    }
}

class UnprocessableError extends SmError {
    constructor(detail) {
        super('Unprocessable Entity.');
        this.status = 422;
        this.detail = detail;
    }
}

class InternalError extends SmError {
    constructor(error) {
        super(error.message);
        this.status = 500;
        this.detail = { error };
    }
}

class OIDCProviderError extends SmError {
    constructor(detail) {
        super('OIDC Provider is unreachable, unable to validate token.');
        this.status = 503;
        this.detail = detail;
    }
}

class SigningKeyNotFoundError extends SmError {
    constructor(detail) {
        super('Unknown signing key, unable to validate token.');
        this.status = 401;
        this.detail = detail;
    }
}

class InsecureTokenError extends SmError {
    constructor(detail) {
        super('Insecure token presented and STIGMAN_DEV_ALLOW_INSECURE_TOKENS is false.');
        this.status = 401;
        this.detail = detail;
    }
}

class NoTokenError extends SmError {
    constructor(detail) {
        super('Request requires an access token.');
        this.status = 401;
        this.detail = detail;
    }
}

class OutOfScopeError extends SmError {
    constructor(detail) {
        super('Required scopes were not found in token.');
        this.status = 403;
        this.detail = detail;
    }
}

class ElevationError extends SmError {
    constructor(detail) {
        super('Request requires parameter elevate=true.');
        this.status = 403;
        this.detail = detail;
    }
}

class InvalidElevationError extends SmError {
    constructor(detail) {
        super('Invalid use of parameter elevate=true.');
        this.status = 403;
        this.detail = detail;
    }
}

class UserUnavailableError extends SmError {
    constructor(detail) {
        super('User status is "unavailable".');
        this.status = 403;
        this.detail = detail;
    }
}

class UserInconsistentError extends SmError {
    constructor(detail) {
        super('Setting collectionGrants or userGroups is inconsistent with status "unavailable".');
        this.status = 422;
        this.detail = detail;
    }
}

module.exports = {
    SmError,
    AuthorizeError,
    PrivilegeError,
    NotFoundError,
    ClientError,
    UnprocessableError,
    OIDCProviderError,
    SigningKeyNotFoundError,
    NoTokenError,
    OutOfScopeError,
    ElevationError,
    InvalidElevationError,
    InternalError,
    InsecureTokenError,
    UserUnavailableError,
    UserInconsistentError,
};
