export interface Label {
    data: any;
    collectionId(collectionId: any): unknown;
    labelId?: number;
    labelName?: string;
    description?: string;
    poamCount?: number;
  }