/*
!#######################################################################
! C-PATTM SOFTWARE
! CRANE C-PATTM plan of action and milestones software. Use is governed by the Open Source Academic Research License Agreement contained in the file
! crane_C_PAT.1_license.txt, which is part of this software package. BY
! USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!########################################################################
*/

import { PASSWORD_AUTH_OPTIONS } from "./password-strategy-options";
import { NbAuthOptions, NbPasswordAuthStrategy, defaultAuthOptions } from "@nebular/auth";

export const AUTH_OPTIONS: NbAuthOptions = {
  strategies: [
    NbPasswordAuthStrategy.setup(PASSWORD_AUTH_OPTIONS)
  ],
  forms: {
    login: {
      redirectDelay: 0,
      showMessages: {
        success: true
      },
    },
    register: {
      redirectDelay: 0,
      showMessages: {
        success: true
      },
    },
    requestPassword: {
      redirectDelay: 0,
      showMessages: {
        success: true
      }
    },
    resetPassword: {
      redirectDelay: 0,
      showMessages: {
        success: true
      }
    },
    logout: {
      redirectDelay: 0
    },
    validation: {
      username: {
        required: true,
        minLength: 4,
        maxLength: 50
      }
    }
  }
}
