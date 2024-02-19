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
import { NbDialogService } from "@nebular/theme";
import { KeycloakService } from 'keycloak-angular'
import { ActivatedRoute, Router } from '@angular/router';
import { PoamService } from '../poams.service';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../../user-processing/users.service';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'ngx-poam-extend',
  templateUrl: './poam-extend.component.html',
  styleUrls: ['./poam-extend.component.scss'],
})
export class PoamExtendComponent implements OnInit {

  private subs = new SubSink()
  modalWindow: any;
  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;
  poamId: any;
  poam: any;
  extensionJustification: string = '';
  justifications: string[] = [
    "Security Vulnerability Remediation - More Time Required",
    "Unforeseen Technical/Infrastructure Challenges",
    "Third-Party/Vendor Delays",
    "External Non-Crane Support Requested",
    "Project Scope Changes",
    "Resource Constraints",
    "Procurement Required",
    "Unanticipated Risks",
  ];
  public extensionJustificationPlaceholder: string = "Select from the available options, modify a provided option, or provide a custom justification";

  constructor(
    private router: Router,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private route: ActivatedRoute,
    private poamService: PoamService,
    private userService: UsersService,
    private  datepipe: DatePipe
  ) { }

  @ViewChild('extendTemplate') extendTemplate!: TemplateRef<any>;

  public async ngOnInit() {
    this.route.params.subscribe(async params => {
      console.log("Route params:", params);
      this.poamId = params['poamId'];

      this.isLoggedIn = await this.keycloak.isLoggedIn();
      if (this.isLoggedIn) {
        this.userProfile = await this.keycloak.loadUserProfile();
        this.getData();
      }
    });
  }

  getData() {
    this.subs.sink = this.poamService.getPoamExtension(this.poamId).subscribe(extensionArray => {
      if (extensionArray.length > 0) {
        const extension = extensionArray[0];
        this.poam = {
          extensionTimeAllowed: extension.extensionTimeAllowed,
          extensionJustification: extension.extensionJustification,
          extensionMilestones: extension.extensionMilestones,
          scheduledCompletionDate: extension.scheduledCompletionDate
        };
        this.extensionJustification = this.poam.extensionJustification;
      } else {
        this.poam = {
          extensionTimeAllowed: 0,
          extensionJustification: '',
          extensionMilestones: '',
          scheduledCompletionDate: ''
        };
        this.extensionJustification = '';
      }
    }, error => {
      console.error("Failed to fetch POAM extension:", error);
    });
  }

  ngAfterViewInit() {
    this.modalWindow = this.dialogService.open(this.extendTemplate)
  }

  cancelExtension() {
    if (this.modalWindow) {
      this.modalWindow.close();
    }
    this.router.navigateByUrl(`/poam-details/${this.poamId}`);
  }

  async submitPoamExtension() {
    const extensionData = {
      poamId: parseInt(this.poamId, 10),
      extensionTimeAllowed: this.poam.extensionTimeAllowed,
      extensionJustification: this.extensionJustification,
      extensionMilestones: this.poam.extensionMilestones,
    };

    try {
      const updatedExtension = await this.poamService.putPoamExtension(extensionData).toPromise();
      console.log('POAM extension updated successfully:', updatedExtension);
      if (this.modalWindow) {
        this.modalWindow.close();
      }
      this.router.navigateByUrl(`/poam-details/${this.poamId}`);
    } catch (error) {
      console.error('Failed to update POAM extension:', error);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
