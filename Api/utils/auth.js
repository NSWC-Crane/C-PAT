/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const { expressjwt: jwt } = require('express-jwt');


const getTokenFromHeaders = function(req) {
  const { headers: { authorization }} = req;
  if (authorization && authorization.split(' ')[0] === 'Bearer') {
    return authorization.split(' ')[1];
  }
  return null;
}

const auth = {
   optional: jwt({
     secret: process.env.JWT_SECRET_KEY,
     userProperty: 'payload',
     getToken: getTokenFromHeaders,
     credentialsRequired: false,
     algorithms: ['HS256']
   }),
   required: jwt({
     secret: process.env.JWT_SECRET_KEY,
     userProperty: 'payload',
     getToken: getTokenFromHeaders,
     algorithms: ['HS256']
   }),
};

module.exports = auth;
