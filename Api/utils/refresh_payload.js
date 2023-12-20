/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const userService = require('../Services/mysql/usersService')
//const userService = require('./usersService')
//const util = require('util');

const refreshPayload = async function(payload, jwtSignOptions) {
  console.log("refreshPayLoad payload: ", payload)
  //const refreshUser = util.promisify(User.refresh);
  try {
    const user = await userService.getUserByUserID(payload.userId)
    console.log("refreshPayload user: ",user)
    return userService.generateJWT(payload, jwtSignOptions,user)
  } catch (err) {
    throw err
  }
}

module.exports = refreshPayload;
