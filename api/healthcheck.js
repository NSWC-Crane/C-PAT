/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const http = require('http');
const config = require('./utils/config');

const options = {
    host: 'localhost',
    port: config.http.port,
    path: '/api/op/definition?jsonpath=%24.info.version',
    timeout: 2000,
};

const request = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', function (err) {
    console.log('ERROR');
    process.exit(1);
});

request.end();
