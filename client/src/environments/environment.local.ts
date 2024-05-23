/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

export const environment = {
  production: false,
  environment: 'local',

  oauth: {
    authority: 'http://localhost:2020/realms/RMFTools',
    clientId: 'c-pat',
    stigmanClientId: 'stig-manager',
    scopePrefix: '',
    extraScopes: '',
    scope: '',
    redirectUri: 'http://localhost:8086',
  },

  CPAT_API_URL: 'http://localhost:8086/api',
  STIGMANAGER_URL: 'http://localhost:54000/api',
  TENNABLE_URL: 'http://0.0.0.0:9000', //placeholder
  tenableAccessKey: 'placeholder',
  tenableSecretKey: 'placeholder',
};
