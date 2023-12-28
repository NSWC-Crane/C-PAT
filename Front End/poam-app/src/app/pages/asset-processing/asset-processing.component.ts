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
import { AssetService } from './assets.service';
import { forkJoin, Observable } from 'rxjs';
import { NbDialogService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { Router } from '@angular/router';
import { AuthService } from '../../auth';
import { NbAuthJWTToken, NbAuthToken } from '@nebular/auth';
import { SubSink } from "subsink";
import { ConfirmationDialogComponent, ConfirmationDialogOptions } from '../../Shared/components/confirmation-dialog/confirmation-dialog.component'
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { UsersService } from '../user-processing/users.service'

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
  selector: 'ngx-asset-processing',
  templateUrl: './asset-processing.component.html',
  styleUrls: ['./asset-processing.component.scss']
})
export class AssetProcessingComponent implements OnInit {


  customColumn = 'asset';
  defaultColumns = ['Asset Name', 'Description', 'Collection', 'IP Address', 'Domain', 'MAC Address', 'Labels'];
  allColumns = [this.customColumn, ...this.defaultColumns];
  dataSource!: NbTreeGridDataSource<any>;

  public isLoggedIn = false;
  public userProfile: KeycloakProfile | null = null;

  users: any;
  user: any;

  assets: any;
  asset: any = {};
  data: any = [];
  labelList: any;
  collectionList: any;

  allowSelectAssets = true;
  isLoading = true;

  selected: any
  selectedRole: string = 'admin';
  payload: any;

  get hideUserEntry() {
    return (this.asset.assetId && this.asset.assetId != "ASSET")
      ? { display: 'block' }
      : { display: 'none' }
  }

  private subs = new SubSink()

  constructor(
    private assetService: AssetService,
    private dialogService: NbDialogService,
    private router: Router,
    private authService: AuthService,
    private readonly keycloak: KeycloakService,
    private userService: UsersService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>) {
  }

  onSubmit() {
    // console.log("Attempting to onSubmit()...");
    this.resetData();
  }

  async ngOnInit() {
    // this.subs.sink = this.authService.onTokenChange()
    //   .subscribe((token: NbAuthJWTToken) => {
    //     //if (token.isValid() && this.router.url === '/pages/collection-processing') {
    //     if (token.isValid()) {
    //       this.isLoading = true;
    //       this.payload = token.getPayload();

    //       this.selectedRole = 'admin';
    //       this.data = [];
    //       this.getAssetData();

    //     }
    //   })
    this.isLoggedIn = await this.keycloak.isLoggedIn();
    if (this.isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
      //console.log("userProfile.email: ", this.userProfile.email, ", userProfile.username: ", this.userProfile.username)
      this.setPayload();
    }

  }

  setPayload() {
    this.users = []
    this.user = null;
    this.payload = null;
    // console.log("setPayload()...");
    this.subs.sink = forkJoin(
      this.userService.getUsers(),
    ).subscribe(([users]: any) => {
      // console.log('users: ', users)
      this.users = users.users.users
      // console.log('this.users: ', this.users)
      this.user = this.users.find((e: { userName: string; }) => e.userName === this.userProfile?.username)
      // console.log('this.user: ', this.user)
      this.payload = Object.assign(this.user, {
        collections: []
      });

      this.subs.sink = forkJoin(
        this.userService.getUserPermissions(this.user.userId)
      ).subscribe(([permissions]: any) => {
        // console.log("permissions: ", permissions)

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

        // console.log("payload: ", this.payload)

        this.getAssetData();
      })


    })
  }

  getAssetData() {
    this.isLoading = true;
    this.assets = [];
    // this.assetService.getAssets().subscribe((rData: any) => {
    //   this.data = rData.assets;
    //   this.assets = this.data;
    //   console.log("this.assets: ",this.data)
    //   this.getAssetsGrid("");
    //   this.isLoading = false;
    // });
    // console.log("payload: ", this.payload)
    if (this.payload == undefined) return;
    //console.log("HIGH  within user.getData() user: ", this.user)

    let userName = (this.payload.userName) ? this.payload.userName : "NONE";
    this.subs.sink = forkJoin(
      this.assetService.getAssets(),
      this.assetService.getLabels(),
      this.assetService.getCollections(userName),
    )
      .subscribe(([assetData, labels, collections]: any) => {


        this.data = assetData.assets;
        this.assets = this.data;
        this.labelList = labels.labels;
        this.collectionList = collections.collections;
        //console.log("labelList: ", this.labelList)
        // console.log("collectionList: ", this.collectionList)

        this.getAssetsGrid("");
        this.isLoading = false;
      });

  }

  async getAssetsGrid(filter: string) {
    let assetData = this.data;
    // Sconsole.log("assetData: ", assetData)
    let mydata: any = [];
    for (let i = 0; i < assetData.length; i++) {
      await this.assetService.getAssetLabels(+assetData[i].assetId).subscribe((assetLabels: any) => {
        let myChild: any = [];
        // console.log("assetLabels: ", assetLabels.assetLabels)
        // console.log("assetLabels: ", assetLabels.assetLabels.length)
        let labels = assetLabels.assetLabels;
        // console.log("labels: ", labels)
        if (labels.length > 0) {
          labels.forEach((label: any) => {
            // console.log("label: ", label)
            myChild.push({
              data: {
                asset: '', 'Asset Name': '', 'Description': '', 'Collection': '', 'IP Address': '',
                'Domain': '', 'MAC Address': '',
                'Labels': label.labelName
              }
            })
          });
        }  // ['Asset Name', 'Description', 'Collection', 'IP Address', 'Domain', 'MAC Address', 'Labels']

        //console.log("myChild: ", myChild)
        let myCollection = this.collectionList.find((tl: any) => tl.collectionId === +assetData[i].collectionId)

        // console.log("myCollection: ",myCollection)
        // console.log("collectionList: ",this.collectionList)
        // console.log("assetData[i].collectionId: ",assetData[i].collectionId)
        mydata.push({
          data: {
            asset: assetData[i].assetId, 'Asset Name': assetData[i].assetName, 'Description': assetData[i].description,
            'Collection': (myCollection && myCollection.collectionName) ? myCollection.collectionName : '', 'IP Address': assetData[i].ipAddress,
            'Domain': assetData[i].fullyQualifiedDomainName, 'MAC Address': assetData[i].macAddress
          }, children: myChild
        });

        // console.log("treeViewData: ", mydata)
        this.dataSource = this.dataSourceBuilder.create(mydata);

      });

    }
    //if (filter) { collectionData = this.data.filter((collection: { collectionId: string; }) => collection.collectionId === filter); }


  }

  setAsset(assetId: any) {
    this.asset = null;

    let selectedData = this.data.filter((asset: { assetId: any; }) => asset.assetId === assetId)

    this.asset = selectedData[0];
    // console.log("asset: ", this.asset);
    // console.log("assetss: ", this.assets);
    this.allowSelectAssets = false;
  }

  addAsset() {
    this.asset.assetId = "ADDASSET";
    this.asset.assetName = "";
    this.asset.description = ""
    this.asset.fullyQualifiedDomainName = "";
    this.asset.collectionId = 0;
    this.asset.ipAddress = "";
    this.asset.macAddress = "";
    this.allowSelectAssets = false;
  }

  resetData() {
    this.asset = [];
    this.getAssetData();
    this.asset.assetId = "ASSET";
    this.allowSelectAssets = true;
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
