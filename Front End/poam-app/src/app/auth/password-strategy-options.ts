import { NbPasswordAuthStrategyOptions, NbPasswordAuthStrategy, NbAuthJWTToken, NbAuthOAuth2JWTToken, NbPasswordStrategyModule } from "@nebular/auth";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { environment } from "../../environments/environment";

class PasswordAuthStrategyOptions extends NbPasswordAuthStrategyOptions {
  changeWorkspace?: boolean | NbPasswordStrategyModule;
}

export const PASSWORD_AUTH_OPTIONS: PasswordAuthStrategyOptions = {
  name: "email",
  //baseEndpoint: `${environment.apiEndpoint}/auth/`,
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
  // token: {
  //   class: NbAuthJWTToken,
  //   key: "token",
  // },
  errors: {
    key: "errors",
  },
  messages: {
    key: "messages",
  },
}
