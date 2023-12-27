import { NbAclOptions } from "@nebular/security";

export const ACCESS_CONTROL_LIST: any = { //}: NbAclOptions = {
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
      create: ['poam','asset','label','collection'],
      // delete: ['*'],
    },
    maintainer: {
      view: ['*'],
      create: ['poam'],
      // delete: ['*'],
    },
    approver: {
      view: ['poam'],
      approve: ['poam'],
    },
    admin: {
      view: ['*'],
      create: ['*'],
      // delete: ['*'],
    },
    dev: {
      view: ['*'],
      create: ['*'],
      // delete: ['*'],
    }
  }
}
