/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

var common = require('./common')
var authentication = require('./websocket/authentication')

exports.init = (io) => {
  io
    .of('/notifications')
    .use(authentication)
    .on('connection', (socket) => {
      // upon connection, send user notifications
      if (
        socket.request.user.notifications &&
        socket.request.user.notifications.queue
      ) {
        socket.emit('notify', JSON.stringify(
          socket.request.user.notifications.queue
        ));
      }

      // catch internal server events
      common.serverEvents.on('notify', (userid, notification) => {
        if (socket.request.user.id === userid) {
          socket.emit('notify', JSON.stringify(notification));
        }
      });

      // catch event response sent from client
      // socket.on('notify', () => {})
    })
}
