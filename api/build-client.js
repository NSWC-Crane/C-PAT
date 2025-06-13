/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const { execSync } = require('child_process');
const config = require('./utils/config');

const baseHref = config.client.baseHref || '/';

const command = `cd ../client && ng build --configuration=production --base-href=${baseHref}`;

try {
    execSync(command, { stdio: 'inherit' });
    console.log('Client build completed successfully');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}