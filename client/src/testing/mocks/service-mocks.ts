/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Subject, of } from 'rxjs';
import { vi } from 'vitest';

/**
 * Create a mock PayloadService
 */
export function createMockPayloadService() {
  return {
    user$: new Subject(),
    setPayload: vi.fn()
  };
}

/**
 * Create a mock SharedService
 */
export function createMockSharedService() {
  return {
    selectedCollection: new Subject(),
    getSTIGMANAffectedAssetsByPoam: vi.fn().mockReturnValue(of([])),
    getCollectionApprovers: vi.fn().mockReturnValue(of([]))
  };
}

/**
 * Create a mock Router
 */
export function createMockRouter() {
  return {
    navigateByUrl: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
    events: of(),
    url: '/'
  };
}

/**
 * Create a mock ActivatedRoute
 */
export function createMockActivatedRoute(params: Record<string, string> = {}) {
  return {
    params: of(params),
    queryParams: of({}),
    snapshot: {
      params,
      queryParams: {},
      data: {}
    }
  };
}

/**
 * Create a mock MessageService (PrimeNG)
 */
export function createMockMessageService() {
  return {
    add: vi.fn(),
    addAll: vi.fn(),
    clear: vi.fn(),
    messageObserver: of(),
    clearObserver: of()
  };
}

/**
 * Create a mock ConfirmationService (PrimeNG)
 */
export function createMockConfirmationService() {
  return {
    confirm: vi.fn(),
    close: vi.fn(),
    requireConfirmation$: of()
  };
}

/**
 * Create a mock DialogService (PrimeNG)
 */
export function createMockDialogService() {
  const mockDialogRef = {
    close: vi.fn(),
    onClose: new Subject(),
    onChildComponentLoaded: new Subject(),
    onDestroy: new Subject()
  };

  return {
    open: vi.fn().mockReturnValue(mockDialogRef),
    dialogComponentRefMap: new Map(),
    dialogRef: mockDialogRef
  };
}

/**
 * Create a mock DynamicDialogRef (PrimeNG)
 */
export function createMockDynamicDialogRef() {
  return {
    close: vi.fn(),
    onClose: new Subject(),
    onChildComponentLoaded: new Subject(),
    onDestroy: new Subject()
  };
}

/**
 * Create a mock DynamicDialogConfig (PrimeNG)
 */
export function createMockDynamicDialogConfig(data: any = {}) {
  return {
    data,
    header: '',
    footer: '',
    width: '',
    height: '',
    closeOnEscape: true,
    dismissableMask: false,
    rtl: false,
    closable: true,
    responsive: true,
    appendTo: '',
    styleClass: '',
    maskStyleClass: '',
    contentStyle: {},
    showHeader: true,
    baseZIndex: 0,
    autoZIndex: true,
    ariaCloseIconLabel: '',
    maximizable: false,
    keepInViewport: true,
    minX: 0,
    minY: 0,
    focusOnShow: true,
    focusTrap: true,
    modal: true,
    breakpoints: null,
    position: 'center'
  };
}

/**
 * Create a mock OidcSecurityService (angular-auth-oidc-client)
 */
export function createMockOidcSecurityService() {
  return {
    checkAuth: vi.fn().mockReturnValue(of({ isAuthenticated: true, userData: {}, accessToken: 'mock-token', idToken: 'mock-id-token' })),
    isAuthenticated$: of(true),
    userData$: of({}),
    getAccessToken: vi.fn().mockReturnValue(of('mock-token')),
    authorize: vi.fn(),
    logoff: vi.fn(),
    logoffLocal: vi.fn()
  };
}
