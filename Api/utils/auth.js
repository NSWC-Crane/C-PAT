/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const jwt = require('express-jwt');
//const jwt = require('jsonwebtoken');
//const { expressjwt: jwt } = require("express-jwt");

//const expressJwt = require('express-jwt');
//const { expressjwt: jwt } = require("express-jwt");
//var jwt = require('express-jwt');

const getTokenFromHeaders = function(req) {
  const { headers: { authorization }} = req;
  if (authorization && authorization.split(' ')[0] === 'Bearer') {
    return authorization.split(' ')[1];
  }
  return null;
}

/**
 * auth middleware
 *
 * @description Determines whether or not a route requires authentication.
 */
const auth = {
  // optional: jwt({
  //   secret: 'wpm_token',
  //   userProperty: 'payload',
  //   getToken: getTokenFromHeaders,
  //   credentialsRequired: false,
  //   algorithms: ['HS256']
  // }),
  // required: jwt({
  //   secret: 'wpm_token',
  //   userProperty: 'payload',
  //   getToken: getTokenFromHeaders,
  //   algorithms: ['HS256']
  // }),
};

module.exports = auth;
