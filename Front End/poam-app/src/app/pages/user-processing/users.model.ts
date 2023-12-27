export interface Users {
    userId: number;
    userName: string;
    userEmail: string;
    firstName?: string;
    lastName?: string;
    created?: Date;
    lastAccess?: Date;
    lastCollectionAccessedId?: number;
    phoneNumber?: string;
    password?: string;
    accountStatus: string;
    fullName?: string;
    defaultTheme?: string;
  }