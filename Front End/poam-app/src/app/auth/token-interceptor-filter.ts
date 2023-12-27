import { HttpRequest } from "@angular/common/http";
import { environment } from "../../environments/environment";

export const TOKEN_INTERCEPTOR_FILTER = function(req: HttpRequest<any>) {
  console.log("token intercept req.url:", req.url)
  //`${environment.apiEndpoint}/auth/login`:
  switch (req.url) {
    case `${environment.apiEndpoint}/auth/login`:
      return true;
    case `${environment.apiEndpoint}/auth/refresh-token`:
      console.log('refreshing token..')
      return true;
    default:
      return false;
  }
}
