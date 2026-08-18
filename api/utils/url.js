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

function stripTrailingSlashes(url) {
    let end = url.length;
    while (end > 0 && url.codePointAt(end - 1) === 47) end--;
    return url.slice(0, end);
}

module.exports = { stripTrailingSlashes };
