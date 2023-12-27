import { NbAclOptions } from "@nebular/security";

export const ACCESS_CONTROL_LIST: NbAclOptions = {
  accessControl: {
    // user: {
    //   create: ['create-task','timekeeping', 'odcform', 'monthly-report'],
    //   view: ['create-task', 'timekeeping', 'odcform', 'help', 'hierarchy', 'send-reports', 'reporting']
    // },
    // viewer: {
    //   create: ['create-task'],
    //   view: ['dashboard','hierarchy','send-reports','help','reporting']
    // },
    owner: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    maintainer: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    approver: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    admin: {
      view: ['*'],
      create: ['*'],
      delete: ['*'],
    },
    dev: {
      view: ['*'],
      create: ['*'],
      remove: ['*'],
    }
  }
}
