import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { ResetPasswordService } from './reset-password.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AUTH_OPTIONS } from '../auth-options';
import { getDeepFromObject } from '../helpers';
//import { UserService } from '../../@core/data/users.service';

@Component({
  selector: 'nb-reset-password-page',
  styleUrls: ['./reset-password.component.scss'],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  resetToken: null | undefined;
  redirectDelay: number = 0;
  showMessages: any = {};
  submitted = false;
  confirmPassword = true;
  currentPassword = '';
  newPassword = '';
  errors: string[] = [];
  messages: string[] = [];
  user: any = {};
  protected options = {};
  CurrentState: string = '';

  constructor(protected authService: AuthService,
    protected cd: ChangeDetectorRef,
    protected router: Router,
    private route: ActivatedRoute,
    private resetPasswordService: ResetPasswordService,
    //private userService: UserService,
    ) {

    this.options = AUTH_OPTIONS;
    this.route.params.subscribe(params => {
      this.resetToken = params['token'];
      //console.log("MyToken: " + this.resetToken);
      this.VerifyToken();
    });
  }

  ngOnInit() {

    if (this.CurrentState != 'Verified') {
      this.submitted = false;
      this.errors.push("Your link has expired, request a new link via forgot password")
      this.showMessages.error = true; 
    }
  }

  VerifyToken() {
    this.resetPasswordService.ValidPasswordToken({ resettoken: this.resetToken }).subscribe(
      data => {
        this.CurrentState = 'Verified';
        this.user = data.body.user;
        this.currentPassword = '';
        this.newPassword = '';

        if (data.body.confirmPassword != "true") { this.confirmPassword = false;}
        this.showMessages.error = false;
        
      },
      err => {
        this.CurrentState = 'NotVerified';
        this.errors = [ err.error.message ];
        this.showMessages.error = true;        
      }
    );
  }

  resetPass(): void {
    console.log("***verifyToken: " + this.CurrentState);
    this.errors = this.messages = [];
    this.showMessages.error = false;

    if (this.CurrentState != 'Verified') {
      this.errors.push("Your link has expired, request a new link via forgot password")
      this.showMessages.error = true;
      return      
    }

    if (this.confirmPassword) {
      console.log("UserID: " + JSON.stringify(this.user._id) + ", currentPass: "+ this .currentPassword);
      this.resetPasswordService.verifyPassword({ userId: this.user._id, currentPassword: this.currentPassword}).subscribe(
        data => {
          console.log("Have data: " + JSON.stringify(data));

          if (data.result) {
            
            this.setNewPassword();

          } else {
            this.errors.push("The current password entered does not match existing password");
            this.showMessages.error = true; 
          }

        },
        err => {
          console.log("Have err: " + JSON.stringify(err));
          if (err.error.message) {
            this.errors = err.error.message;
            this.showMessages.error = true; 
          }
        }
      );
    } else {
      this.setNewPassword();
    }  
  }

  setNewPassword() {
    this.submitted = true;
    this.resetPasswordService.newPassword({ resettoken: this.resetToken, newPassword: this.newPassword }).subscribe(
      data => {
        this.messages = data.message;
        setTimeout(() => {
          this.messages = [];
          this.router.navigate(['login']);
        }, 3000);
      },
      err => {
        if (err.error.message) {
          this.errors = err.error.message;
          this.showMessages.error = true;         }
      }
    );
  }

  getConfigValue(key: string): any {
    return getDeepFromObject(this.options, key, null);
  }
}