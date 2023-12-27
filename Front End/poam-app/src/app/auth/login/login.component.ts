import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { NbLoginComponent, NbAuthService, NB_AUTH_OPTIONS, NbAuthResult } from '@nebular/auth';
import { Router, ActivatedRoute, Data } from '@angular/router';
import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';
import { environment } from 'src/environments/environment';
import { LoginService } from './login.service';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends NbLoginComponent implements OnInit {

  permissions: any = {};
  payload: any = {};


  constructor(service: NbAuthService,
    @Inject(NB_AUTH_OPTIONS) options = {},
    cd: ChangeDetectorRef,
    router: Router,
    private route: ActivatedRoute,
    private LoginService: LoginService,
  ) {

    super(service, options, cd, router);
  }

  ngOnChanges() {
    console.log(this.errors)
  }
  ngOnInit() {

    //this.login();
  }

  override login(): void {

    this.errors = [];
    this.messages = [];

    console.log("Environment: ", environment  );
    this.onLogin();
  }

  onLogin() {
    
    this.authenticate();
  }

  authenticate() {
    this.strategy = "email";
    let authUser = {email: this.user.email, password: this.user.password}

    try {
      this.service.authenticate(this.strategy, authUser).subscribe((result: NbAuthResult) => {

  
        if (result.isSuccess()) {
  
          //console.log("authenticated result: ", result);
          this.payload = result.getToken().getPayload();

          const redirect = result.getRedirect();
  
          if (redirect) {
    
            setTimeout(() => {
    
              return this.router.navigateByUrl(redirect);
            }, this.redirectDelay);
          }
    
        } else {
  
          this.errors = result.getErrors();
          console.log("authenticated not successful errors: ", this.errors);
        }
  
      });
      
    } catch (error) {
      console.log("authenticated not successful errors: ", error);
    }
  }

  register(): void {

    this.errors = this.messages = [];
    console.log("Register strategy: ", this.strategy, ", this.user: ", this.user)
    this.service.register(this.strategy, this.user).subscribe((result: NbAuthResult) => {
      console.log("Register result: ", result);
      this.payload = result.getToken().getPayload();
      console.log("Register result payload: ", this.payload);

      if (result.isSuccess()) {

        this.messages = result.getMessages();
      } else {

        this.errors = result.getErrors();
      }

      this.login();

    });
  }
}