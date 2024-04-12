/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

function UnauthorizedResponse(err, req, res, next) {
  if (
    err.status === 401 ||
    err.name === 'UnauthorizedError'
  ) {

  }
  next(err)
}

function DefaultErrorResponse(err, req, res, next) {
  let stack, status = 500, errors = []

  if (err.message) errors = [err.message]
  if (err.error) errors = [err.error, ...errors]
  if (err.errors) {
    for (const [key, value] of Object.entries(err.errors)) {
      if (typeof value !== 'string') continue
      errors.push(`${key} ${value}`)
    }
  }
  const response =
  {
    success: false,
    status: err.status || 500,
    stack: err.stack || new Error().stack,
    errors: errors,
    data: err.data,
  }
  res.status(status).json(response)
  console.log(response)
}

const responseOrder = [
  UnauthorizedResponse,
  DefaultErrorResponse,
]

module.exports = responseOrder
