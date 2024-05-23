/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

class SmError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.toJSON = () => ({ error: this.message })
  }
}


class ClientError extends SmError {
  constructor(detail) {
    super('Incorrect request.')
    this.status = 400
    this.detail = detail
  }
}

class AuthorizeError extends SmError {
  constructor(detail) {
    super('Request not authorized.')
    this.status = 401
    this.detail = detail
  }
}

class PrivilegeError extends SmError {
  constructor(detail) {
    super('User has insufficient privilege to complete this request.')
    this.status = 403
    this.detail = detail
  }
}
class NotFoundError extends SmError {
  constructor(detail) {
    super('Resource not found.')
    this.status = 404
    this.detail = detail
  }
}

class UnprocessableError extends SmError {
  constructor(detail) {
    super('Unprocessable Entity.')
    this.status = 422
    this.detail = detail
  }
}

class InternalError extends SmError {
  constructor(error) {
    super(error.message)
    this.detail = { error }
  }
}

module.exports = {
  SmError,
  AuthorizeError,  
  PrivilegeError,
  NotFoundError,
  ClientError,
  UnprocessableError,
  InternalError 
}
