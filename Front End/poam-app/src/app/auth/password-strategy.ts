/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { environment } from '../../environments/environment';

export const changeWorkspace = function(this: any, data: any) {

  var uri = environment.apiEndpoint;
  var _this = this;
  var module = 'changeWorkspace';
  var method = 'post';
  var url = uri + '/' + module;
  var requireValidToken = true;

  let tData = {token: data.token.token, user: data.user}
  return this.httpClient.request('POST', url, { body: tData, observe: 'response' });
};
