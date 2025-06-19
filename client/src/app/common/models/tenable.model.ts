/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export interface Reference {
    type: string;
    value: string;
}
export interface IdAndName {
    id: string;
    name: string;
}
export interface CustomFilter {
    id: string;
    filterName: string;
    operator: string;
    type: string;
    isPredefined: boolean;
    value: string | string[] | { id: string }[];
}

export interface AssetsFilter {
    filterName: string;
    operator: string;
    value: any;
}
export interface AccordionItem {
    header: string;
    content: string;
    identifier: string;
    options?: any[];
    disabled?: boolean;
    placeholder?: string;
    validator?: (value: string) => boolean;
    value: number;
}
export interface IAVInfo {
    iav: string;
    navyComplyDate: string;
}
export interface TempFilters {
    [key: string]: any;
}
export interface ExportColumn {
    title: string;
    dataKey: string;
}
export interface PoamAssociation {
    poamId: number;
    status: string;
}

export interface PremadeFilterOption {
    label: string;
    value: string;
    filter?: any;
    createdBy?: string;
    items?: any;
}

export interface FilterValue {
    value: any;
    operator?: string;
    isDirty?: boolean;
    isValid?: boolean;
    min?: number;
    max?: number;
}

export interface FilterHandler {
    (filter: any): FilterValue;
}

export interface TenableFilter {
    filterId?: number;
    collectionId?: number;
    filterName: number;
    filter: string;
    createdBy?: string;
}

export interface AssetsFilter {
    filterName: string;
    operator: string;
    value: any;
}

export interface FilterConfig {
    uiName: string;
    handler: string;
}
