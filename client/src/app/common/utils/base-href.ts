/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export function getBaseHref(): string {
  return document.querySelector('base')?.getAttribute('href') || '/';
}

function idpBasePath(): string {
  const basePath = CPAT.Env.basePath ?? '';

  if (!basePath) {
    return '';
  }

  return basePath.startsWith('/') ? basePath : `/${basePath}`;
}

export function appRootUrl(): string {
  return globalThis.location.origin + idpBasePath();
}

export function silentRenewUrl(): string {
  return `${globalThis.location.origin}${idpBasePath()}/silent-renew.html`;
}
