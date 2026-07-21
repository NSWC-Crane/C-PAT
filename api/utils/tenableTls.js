/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

'use strict';
const path = require('node:path');
const fs = require('node:fs');
const config = require('./config');

let clientCert;
let clientKey;

if (config.tenable.tls.cert_file) {
    clientCert = fs.readFileSync(path.join(__dirname, '..', 'tls', config.tenable.tls.cert_file));
}
if (config.tenable.tls.key_file) {
    clientKey = fs.readFileSync(path.join(__dirname, '..', 'tls', config.tenable.tls.key_file));
}

module.exports.clientCert = clientCert;
module.exports.clientKey = clientKey;
