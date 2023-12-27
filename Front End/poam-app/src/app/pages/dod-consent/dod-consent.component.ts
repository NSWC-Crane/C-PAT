import { Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { SubSink } from 'subsink';
import { NbThemeService, NbWindowService, NbDialogService } from "@nebular/theme";
import { AuthService } from '../../auth';
import { KeycloakService } from 'keycloak-angular'
import { Router } from '@angular/router';
import { UsersService } from '../user-processing/users.service';

@Component({
  selector: 'ngx-consent',
  templateUrl: './dod-consent.component.html',
})
export class DoDConsentComponent implements OnInit {




  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;


  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private login: UsersService,
  ) {}

  @ViewChild('consentTemplate') consentTemplate!: TemplateRef<any>;

  public async ngOnInit() {
  }

  async ngAfterViewInit() {
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    //console.log("isLoggedIn: ",this.isLoggedIn)
    if (this.isLoggedIn) {
      this.modalWindow = this.dialogService.open(this.consentTemplate)
    } else {
      this.router.navigateByUrl("/poam-processing");
    } 
  }

  consentOk() {
    
    this.login.loginOut("logIn").subscribe(data =>{
      this.router.navigateByUrl("/poam-processing");
    })
    
  }
}
