/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../../Shared/shared.service';
import { CollectionsService } from './collections.service';
import { forkJoin, Observable } from 'rxjs';
import { NbSortDirection, NbSortRequest, NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service'
import { environment } from '../../../environments/environment';

interface Permission {
  userId: number;
  collectionId: number;
  canOwn: number;
  canMaintain: number;
  canApprove: number;
}
interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  billet?: string;
  laborcategory?: string;
  ftehours?: string;
  task?: string;
  company?: string;

}

@Component({
  selector: 'ngx-collection-processing',
  templateUrl: './collection-processing.component.html',
  styleUrls: ['./collection-processing.component.scss']
})
export class CollectionProcessingComponent implements OnInit {

  customColumn = 'collection';
  defaultColumns = ['Name', 'Description', 'Grant Count', 'Asset Count', 'POAM Count'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  users: any;
  user: any;

  availableAssets: any[] = [];
  stigmanCollections: any;
  stigmanCollection: any = {};
  selectedStigmanCollection: string = "";

  collections: any;
  collection: any = {};
  data: any = [];
  poams: any = [];
  collectionApprovers: any = [];
  possibleCollectionApprovers: any = [];
  allowSelectCollections = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideCollectionEntry() {
    return (this.collection.collectionId && this.collection.collectionId != "COLLECTION")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private http: HttpClient,
    private sharedService: SharedService,
    private collectionService: CollectionsService,
    private dialogService: NbDialogService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {

}

  onSubmit() {
    //console.log("Attempting to onSubmit()...");
    this.resetData();
  }

  async ngOnInit() {
    this.fetchCollections();
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      //console.log("userProfile.email: ",this.userProfile.email,", userProfile.username: ",this.userProfile.username)
      this.setPayload();
    }
  }

  fetchCollections() {
    this.keycloak.getToken().then(token => {
      this.sharedService.getCollectionsFromSTIGMAN(token).subscribe(data => {
        this.stigmanCollections = data;
      });
    });
  }

  onStigmanCollectionSelect(collectionId: string) {
    this.selectedStigmanCollection = collectionId;
  }

  importCollection() {
    if (this.selectedStigmanCollection) {
      this.keycloak.getToken().then(token => {
        forkJoin({
          collectionData: this.sharedService.selectedCollectionFromSTIGMAN(this.selectedStigmanCollection, token),
          assetsData: this.sharedService.getAssetsFromSTIGMAN(this.selectedStigmanCollection, token)
        }).subscribe({
          next: (results) => {
            const payload = {
              collection: results.collectionData,
              assets: results.assetsData
            };
            this.sendImportRequest(payload);
          },
          error: (error) => {
            console.error('Error fetching collection or assets data:', error);
          }
        });
      });
    } else {
      console.error('No collection selected');
    }
  }

  private sendImportRequest(data: any) {
    this.keycloak.getToken().then(token => {
      const headers = { Authorization: `Bearer ${token}` };
      this.http.post(environment.stigmanCollectionImportEndpoint, data, { headers })
        .subscribe({
          next: (response) => console.log('Import successful', response),
          error: (error) => console.error('Error during import', error)
        });
    });
  }

  resetSTIGMANData() {
    this.stigmanCollection = [];
  }

  setPayload() {
    this.user = null;
    this.payload = null;

    this.subs.sink = this.userService.getCurrentUser().subscribe(
      (response: any) => {
        if (response && response.userId) {
          this.user = response;
          console.log('Current user: ', this.user);

          if (this.user.accountStatus === 'ACTIVE') {
            this.payload = {
              ...this.user,
              collections: this.user.permissions.map((permission: Permission) => ({
                collectionId: permission.collectionId,
                canOwn: permission.canOwn,
                canMaintain: permission.canMaintain,
                canApprove: permission.canApprove
              }))
            };

            console.log("payload: ", this.payload);
            this.getCollectionData(); // Adjusted function name
          }
        } else {
          console.error('User data is not available or user is not active');
        }
      },
      (error) => {
        console.error('An error occurred:', error);
      }
    );
  }

  getCollectionData() {
    this.isLoading = true;
    this.collections = null;
    this.collectionService.getCollections(this.payload.userName).subscribe((result: any) => {

      this.data = result.collections;
      this.collections = this.data;
      //console.log("Collections: ",this.data)
      this.getCollectionsGrid("");
      this.isLoading = false;
    });

  }

  getCollectionsGrid(filter: string) {
    let collectionData = this.data;

    //if (filter) { collectionData = this.data.filter((collection: { collectionId: string; }) => collection.collectionId === filter); }

    var treeViewData: TreeNode<FSEntry>[] = collectionData.map((collection: {
      collectionId: number | any[]; collectionName: any;
      description: any; grantCount: any; assetCount: any; poamCount: any;
    }) => {
      let myChildren: never[] = [];

      return {

        data: {
          collection: collection.collectionId, 'Name': collection.collectionName, 'Description': collection.description,
          'Grant Count': collection.grantCount, 'Asset Count': collection.assetCount, 'POAM Count': collection.poamCount
        },
        children: myChildren
      };
    })
    this.dataSource = this.dataSourceBuilder.create(treeViewData);
  }

  setCollection(collectionId: any) {
    this.collection = null;
    this.collectionApprovers = [];
    this.possibleCollectionApprovers = [];
    this.poams = [];
    let selectedData = this.data.filter((collection: { collectionId: any; }) => collection.collectionId === collectionId)

    this.collection = selectedData[0];
    // console.log("this.collection: ",this.collection)
    this.subs.sink = forkJoin(
      this.collectionService.getUsersForCollection(this.collection.collectionId),
      this.collectionService.getCollectionApprovers(this.collection.collectionId),
      this.collectionService.getPoamsByCollection(this.collection.collectionId)
    )
      .subscribe(([users, approvers, poams]: any) => {

        // console.log("POAMS: ", poams)
        this.poams = poams.poams;

        this.collectionApprovers = approvers.collectionApprovers;
        // console.log("coection-processing collectionApprovers: ", this.collectionApprovers)
        let permissions = users.permissions.permissions;
        // console.log("coection-processing permissions: ",permissions)

        if (this.collectionApprovers == undefined || this.collectionApprovers.length == 0) {
          this.collectionApprovers = [];
          if (permissions) {
            permissions.forEach((permission: any) => {
              if (permission.canOwn || permission.canApprove) {
                this.possibleCollectionApprovers.push(permission);
              }
            })
          }

          if (this.possibleCollectionApprovers.length > 0) {
            // *** Here's where we auto add approvers to collection if non exist, they come from the possibleCollectionApprovers list
            // console.log("Auto adding colectionApprovers...")
            this.possibleCollectionApprovers.forEach(async (user: any) => {
              // console.log("PossibleApprovers user: ", user)
              let approver: any = {}
              approver = {
                collectionId: this.collection.collectionId,
                userId: user.userId,
                status: 'Active'
              }
              await this.collectionService.addCollectionAprover(approver).subscribe((res: any) => {
                //console.log("add resut: ",res.collectionApprover[0])
                approver.fullName = user.fullName;
                approver.firstName = user.firstName;
                approver.lastName = user.lastName;
                approver.phoneNumber = user.phoneNumber;
                approver.userEmail = user.userEmail;

                if (approver) {
                  // console.log("add approver to collectionApprovers: ", approver)
                  this.collectionApprovers.push(approver);
                }
              })
            })
            // console.log("After push collectionApprovers: ", this.collectionApprovers)
          }

        } else {
          if (permissions) {
            permissions.forEach((permission: any) => {
              if (permission.canOwn || permission.canApprove) {
                this.possibleCollectionApprovers.push(permission);
              }
            })
          }
        }
      });

    this.allowSelectCollections = false;
  }

  resetData() {
    this.collection = [];
    this.getCollectionData();
    this.collection.collectionId = "COLLECTION";
    this.allowSelectCollections = true;
  }

  addCollection() {
    this.collection.collectionId = "ADDCOLLECTION";
    this.collection.collectionName = "";
    this.collection.description = ""
    this.collection.created = new Date().toISOString();
    this.collection.grantCount = 0;
    this.collection.assetCount = 0;
    this.collection.poamCount = 0;
    this.allowSelectCollections = false;
  }

  ngOnDestroy() {
    this.subs.unsubscribe()
  }

  confirm = (dialogOptions: ConfirmationDialogOptions): Observable<boolean> =>
    this.dialogService.open(ConfirmationDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      context: {
        options: dialogOptions,
      },
    }).onClose;
}
