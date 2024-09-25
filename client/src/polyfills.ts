/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import '@angular/localize/init';
import 'zone.js';
import 'classlist.js';
import 'web-animations-js';

if (typeof SVGElement.prototype.contains === 'undefined') {
  SVGElement.prototype.contains = HTMLDivElement.prototype.contains;
}
