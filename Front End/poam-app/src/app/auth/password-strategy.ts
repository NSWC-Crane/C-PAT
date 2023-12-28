/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { NbPasswordAuthStrategy, NbAuthResult, NbPasswordAuthStrategyOptions, NbAuthStrategyClass, NbAuthStrategy } from "@nebular/auth";
import { map, catchError } from "rxjs/operators";
import { Observable } from "rxjs";
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

export const changeWorkspace = function(this: any, data: any) {
  //  const http: HttpClient

  // const httpOptions = {
  //   headers: new HttpHeaders({
  //     'Content-Type': 'application/json'
  //   })
  // };
  var uri = environment.apiEndpoint;
  var _this = this;
  var module = 'changeWorkspace';
  var method = 'post'; //this.getOption(module + ".method");
  var url = uri + '/' + module;//'changeWorkspace'; //this.getActionEndpoint(module);
  var requireValidToken = true; //this.getOption(module + ".requireValidToken");
  console.log("HELLO!!!!!!!")
  console.log("this: ",data)

  //    return this.http
  // .get(`${this.uri}/collections/${id}`)
  // .pipe(catchError(this.handleError));
  let tData = {token: data.token.token, user: data.user}
  // return this.http.request(method, url, { body: tData, observe: 'response' })
  //   .pipe(map(function(res) {
  //     if (_this.getOption(module + ".alwaysFail")) {
  //       throw _this.createFailResponse(data);
  //     }
  //     return res;
  //   }), map(function(res) {
  //     console.log("HELLO!!!!!!!")
  //     console.log("this: ",data)
  //     console.log("this: ",res)
  //     return new NbAuthResult(true, res, _this.getOption(module + ".redirect.success"), 
  //     [], _this.getOption('messages.getter')(module, res, _this.options), 
  //     _this.createToken(_this.getOption('token.getter')(module, res, _this.options), requireValidToken));
  //   }), 
  //   catchError(function(res) {
  //     return _this.handleResponseError(res, module);
  //   }));
  // return this.http.request(method, url, { body: tData, observe: 'response' }).subscribe((result: any) =>{
  //   console.log("result: ",result)
  // });
  console.log("url: ",url)
  console.log("tData: ",tData)
  return this.httpClient.request('POST', url, { body: tData, observe: 'response' });
};
