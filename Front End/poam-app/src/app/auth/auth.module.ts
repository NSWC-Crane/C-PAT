import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import {
  NbAlertModule,
  NbInputModule,
  NbButtonModule,
  NbCheckboxModule,
  NbCardModule,
  NbStepperModule,
  NbSpinnerModule,
} from "@nebular/theme";
import { AuthRoutingModule } from "./auth.routing";
import { NbAuthModule } from "@nebular/auth";
import { RegisterComponent } from "./register/register.component";
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [RegisterComponent, LoginComponent, ResetPasswordComponent],
  
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbCardModule,
    NbStepperModule,
    AuthRoutingModule,
    NbAuthModule,
    NbSpinnerModule,
    Ng2SmartTableModule,
  ]
})
export class AuthModule {}
