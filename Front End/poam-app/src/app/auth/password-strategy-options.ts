/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NbPasswordAuthStrategyOptions, NbPasswordAuthStrategy, NbAuthJWTToken, NbAuthOAuth2JWTToken, NbPasswordStrategyModule } from "@nebular/auth";

class PasswordAuthStrategyOptions extends NbPasswordAuthStrategyOptions {
  changeWorkspace?: boolean | NbPasswordStrategyModule;
}

export const PASSWORD_AUTH_OPTIONS: PasswordAuthStrategyOptions = {
  name: "email",
  baseEndpoint: `http://localhost:8086`,
  changeWorkspace: {
    endpoint: "changeWorkspace",
    method: "post",
    requireValidToken: true,
  },
  refreshToken: {
    endpoint: "refresh-token",
    method: "post",
    redirect: { success: null, failure: '/auth/login' }
  },
  login: {
    endpoint: "/auth/login",
    method: "post",
    redirect: { success: "/", failure: null }
  },
  register: {
    endpoint: "/auth/register",
    method: "post",
    redirect: { success: "/", failure: null }
  },
  logout: {
    endpoint: "logout",
    method: "get"
  },
  requestPass: {
    endpoint: 'request-pass',
    method: 'post',
  },
  resetPass: {
    endpoint: 'reset-pass',
    method: 'put',
  },
  errors: {
    key: "errors",
  },
  messages: {
    key: "messages",
  },
}
