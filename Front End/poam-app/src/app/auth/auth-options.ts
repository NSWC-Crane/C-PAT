import { PASSWORD_AUTH_OPTIONS } from "./password-strategy-options";
import { NbAuthOptions, NbPasswordAuthStrategy, defaultAuthOptions } from "@nebular/auth";
import { deepExtend } from "@nebular/auth/helpers";

export const AUTH_OPTIONS: NbAuthOptions = {
  strategies: [
    NbPasswordAuthStrategy.setup(PASSWORD_AUTH_OPTIONS) // try just entering [Strategy, options]
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
