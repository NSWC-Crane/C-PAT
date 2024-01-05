/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

//import { version } from '/package.json';

export const environment = {
  production: false,
  environment: 'local',
  apiEndpoint: 'http://localhost:8086',
  fileUploadEndpoint: 'http://localhost:8086/api/poamimport',
  authizeEndpoint: 'http://localhost:8080/realms/C-PAT/protocol/openid-connect/auth',
  tokeEndpoint: 'http://localhost:8080/realms/C-PAT/protocol/openid-connect/token',
  redirectUri: 'http://localhost:4200/callback',
  frontEndEndpoint: 'http://localhost:4200',
	// wsEndpoint: 'http://localhost:3000/notifications',
	// apiEndpoint: process && `http://${process.env.API_URL}:3000/api` || 'http://localhost:3000/api',
	// wsEndpoint: process && `http://${process.env.API_URL}:3000/notifications` || 'http://localhost:3000/notifications',
	// publicVapid: 'BEsUpX1fLAmUM6rtiYgdY9zJrr3oJo8eJzSi6nkA1qxvTR2xeMeImyXsrx-QcoFRediJ_-dnWrF7v9QXp_Ux8UU',
	version: '1.0.0',
	//
	// Set classification to on of: 
	//  classification    classificationCode    ClassificatonColorCode
	//  'UNCLASSIFIED'            'U '                '#5cb85c'
	//  'CONFIDENTIAL'            'C'                 '#286090'
	//  'SECRET'                  'S'                 '#d9534f'
	//  'TOP SECRET'              'T'                 '#f0ad4e'
	// 
	classification: 'UNCLASSIFIED',
	classificationCode: 'U',
	classificationColorCode: '#5cb85c'

};
