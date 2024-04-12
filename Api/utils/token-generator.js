/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

const jwt = require('jsonwebtoken');

class TokenGenerator {
  constructor(secretOrPrivateKey, secretOrPublicKey, options) {
    this.secretOrPrivateKey = secretOrPrivateKey;
    this.secretOrPublicKey = secretOrPublicKey;
    this.options = options;
  }

  sign = function(payload, signOptions) {
    const jwtSignOptions = Object.assign({}, signOptions, this.options);
    return jwt.sign(payload, this.secretOrPrivateKey, jwtSignOptions);
  }

  verify = function(token, verifyOptions) {
    return jwt.verify(token, this.secretOrPublicKey, verifyOptions);
  }

  refresh = function(token, refreshOptions) {
    let payload = jwt.verify(token, this.secretOrPublicKey, refreshOptions.verify);
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti;
    const jwtSignOptions = Object.assign({}, this.options, { ...((refreshOptions.jwtid) && { jwtid: refreshOptions.jwtid }) });
    payload = Object.assign({}, payload, refreshOptions.mergePayload);
    return (refreshOptions.refreshPayload)
      ? refreshOptions.refreshPayload(payload, jwtSignOptions)
      : new Promise((resolve, reject) => {
        jwt.sign(payload, this.secretOrPrivateKey, jwtSignOptions, (err, token) => {
          if (err) return reject(err)
          resolve(token)
        })
      })
  }
}

module.exports = new TokenGenerator(
    process.env.JWT_SECRET_KEY,
    process.env.JWT_SECRET_KEY,
  {
    algorithm: 'HS256',
    expiresIn: '2 days',
  })
