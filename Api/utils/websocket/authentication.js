/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const jwt = require('jsonwebtoken')
const Users = require('../../Services/mysql/usersService')
const tokenGenerator = require('../token-generator');

module.exports = function(socket, next) {
  try {
    var token = socket.handshake.query.token
    const payload = tokenGenerator.verify(token, { algorithms: ["HS256"] });
    Users.getUserByUserID(payload.userId)
      .exec(function(err, user) {
        if (err) next(new Error(err.message));
        else if (!user) next(new Error('Websocket Error: user not found'));
        else {
          socket.request.user = user;
          next();
        }
      });
  } catch(err) {
    next(new Error(err.message));
  }
}
