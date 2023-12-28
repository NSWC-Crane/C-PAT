/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { NbThemeService, NbWindowService, NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { forkJoin } from 'rxjs';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ngx-poam-approve',
  templateUrl: './poam-approve.component.html',
})
export class PoamApproveComponent implements OnInit {




  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  poamApprovers: any[] =[];
  poamApprover: any;
  comments: string = "";
  poamId: any;
  poam: any;
  users: any;
  user: any;
  payload: any;

  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private  datepipe: DatePipe
  ) { }

  @ViewChild('approveTemplate') approveTemplate!: TemplateRef<any>;

  public async ngOnInit() {

    this.route.params.subscribe(async params => {
      // console.log("params: ", params)
      this.poamId = params['poamId'];

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
        this.setPayload();
      } 

    });
  }

  setPayload() {
    this.users = []
    this.user = null;
    this.payload = null;

    this.subs.sink = forkJoin(
      this.userService.getUsers(),
    ).subscribe(([users]: any) => {
      console.log('users: ',users)
      this.users = users.users.users
      // console.log('this.users: ',this.users)
      this.user = this.users.find((e: { userName: string; }) => e.userName === this.userProfile?.username)
      //console.log('this.user: ',this.user)
      this.payload = Object.assign(this.user, {
        collections: []
      });

      this.subs.sink = forkJoin(
        this.userService.getUserPermissions(this.user.userId)
      ).subscribe(([permissions]: any) => {
        console.log("permissions: ", permissions)

        permissions.permissions.permissions.forEach((element: any) => {
          // console.log("element: ",element)
          let assigendCollections = {
            collectionId: element.collectionId,
            canOwn: element.canOwn,
            canMaintain: element.canMaintain,
            canApprove: element.canApprove,
          }
          // console.log("assignedCollections: ", assigendCollections)
          this.payload.collections.push(assigendCollections);
        });

        console.log("payload: ",this.payload)

        this.getData();
      })

      
    })
  }

  getData() {
    
    this.subs.sink = forkJoin(
      this.poamService.getPoam(this.poamId),
      this.poamService.getPoamApprovers(this.poamId)
    )
      .subscribe(async ([poam, poamApprovers]: any) => {
        this.poam = { ...poam };
        this.poamApprovers = poamApprovers.poamApprovers;
        console.log('this.user: ',this.user)
        console.log('this.poamApprovers: ',this.poamApprovers)
        this.poamApprover = await this.poamApprovers.find((x: any) => x.poamId == this.poam.poamId && x.userId ==  this.user.userId)
        console.log("poamApprover: ",this.poamApprover)
        if (!this.poamApprover || this.poamApprover == undefined) {
          await alert("Unfortunatly, user: " + this.user.fullName +" is not an approver on this poam.")
          this.router.navigateByUrl("/poam-details/" + +this.poamId);
          this.modalWindow.close();
        }
      })
  }

  async ngAfterViewInit() {

    this.modalWindow = this.dialogService.open(this.approveTemplate)

  }

  async approveOk() {
    //Let's approve and add comments for this user.
    this.poamApprover.approved = 'Approved';
    this.poamApprover.approvedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    this.poamApprover.comments = this.comments;

    await this.poamService.updatePoamApprover(this.poamApprover).subscribe((res: any) => {
      this.router.navigateByUrl("/poam-details/" + +this.poamId);
    });    
  }

  async approveReject() {
    //Let's approve and add comments for this user.
    this.poamApprover.approved = 'Rejected';
    this.poamApprover.approvedDate = this.datepipe.transform(new Date(), 'yyyy-MM-dd');
    this.poamApprover.comments = this.comments;

    await this.poamService.updatePoamApprover(this.poamApprover).subscribe((res: any) => {
      this.router.navigateByUrl("/poam-details/" + +this.poamId);
    });    
  }
}
