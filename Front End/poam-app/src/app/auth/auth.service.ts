import { Injectable } from "@angular/core";
import { NbAuthService, NbTokenService, NbAuthResult } from "@nebular/auth";
import { Observable } from "rxjs";
import { changeWorkspace } from "./password-strategy";
import { switchMap } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthService extends NbAuthService {
  /**
   * Difficult to add to the base NbAuthStrategy class,
   * so we're adding on after the fact.
   */
  changeWorkspace =  (strategyName: string, data?: any) => {
    var _this = this;
    //var strategy = this.getStrategy(strategyName);
    console.log("AuthService alling changeWorkspace...")
    return changeWorkspace(data);
  }
}
