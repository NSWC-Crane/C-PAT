/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const passport = require('passport');
const LocalStrategy = require('passport-local');
const userService = require('../Services/mysql/usersService');

/**
 * Local Strategy
 *
 * @param username
 * @param password
 */
passport.use(
  new LocalStrategy(
    async (username, password, done) => {
      //console.log("passport.use...");
    await userService.getUserByNamePassword(username, password, (err, user) => {
      console.log("passpport... username, password...", JSON.stringify(user))
      if (err) { 
        console.log('passport.use user.authentication err: ' + JSON.stringify(err));
        return done(null, false, err);
      }
      return done(null, user);
    });
  })
)
