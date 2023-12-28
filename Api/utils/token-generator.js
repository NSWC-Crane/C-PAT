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

  /**
   * refreshOptions.verify = options you would use with verify function
   * refreshOptions.jwtid = contains the id for the new token
   * refreshOptions.mergePayload = object with properties to merge into payload
   * refreshOptions.refreshPayload = custom function to retrieve updated payload.  Must return token.
   * @returns {Promise} token
   */
  refresh = function(token, refreshOptions) {
    let payload = jwt.verify(token, this.secretOrPublicKey, refreshOptions.verify);
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti; // We're generating a new token, if you are using jwtid during signing, pass it in refreshOptions
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
  'wpm_token',
  'wpm_token',
  {
    algorithm: 'HS256',
    expiresIn: '2 days',
    // audience: ,
    // issuer: ,
    // subject: ,
  })
