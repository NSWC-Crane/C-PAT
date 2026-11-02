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

const TLS_DIR = path.join(__dirname, '..', 'tls');

function readTlsFile(fileName) {
    return fileName ? fs.readFileSync(path.join(TLS_DIR, fileName)) : undefined;
}

/**
 * Loads the optional client certificate, key and CA bundle for an upstream
 * integration from api/tls. File names come from the integration's tls config.
 */
function loadClientTls(tls = {}) {
    return {
        cert: readTlsFile(tls.cert_file),
        key: readTlsFile(tls.key_file),
        ca: readTlsFile(tls.ca_file),
    };
}

module.exports = { loadClientTls };
