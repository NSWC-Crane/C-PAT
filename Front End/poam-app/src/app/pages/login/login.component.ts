import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth';
import { Subject, takeUntil } from 'rxjs';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private authService: AuthService,) { }

  ngOnInit(): void {
    //this.testLogin()
  }

  testLogin() {
    /* this.authService.authenticate('redHat')
       .pipe(takeUntil(this.destroy$))
       .subscribe((authResult: any) => {
         console.log("Red Hat AuthResult: ", authResult)
       });

       */
      console.log("Auth Service Calling redHat")
       this.authService
       .authenticate('redHat')
       .pipe(takeUntil(this.destroy$))
       .subscribe((authResult: any) => {console.log("Red Hat AuthResult: ", authResult)});
       
       
  }
  private destroy$ = new Subject<void>();
 

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
