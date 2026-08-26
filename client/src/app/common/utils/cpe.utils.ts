/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export interface OsCpe {
  part: string;
  vendor: string;
  product: string;
  version: string;
  update: string;
  edition: string;
  language: string;
  swEdition: string;
  targetSw: string;
  targetHw: string;
  other: string;
}

const URI_PREFIX = 'cpe:/';
const FORMATTED_PREFIX = 'cpe:2.3:';
const PACKED_EDITION_FIELDS = ['edition', 'swEdition', 'targetSw', 'targetHw', 'other'] as const;
const ARCHITECTURE_PATTERN = /^(x64|x86|x86_64|amd64|i[3-6]86|ia64|arm|arm64|armv\d+l?|aarch64|ppc64(le)?|s390x|sparc|mips)$/i;
const SERVICE_PACK_PATTERN = /^sp\d+$/i;
const FIRST_PRINTABLE_CODE_POINT = 32;

const VENDOR_NAMES: Record<string, string> = {
  almalinux: 'AlmaLinux',
  amazon: 'Amazon',
  apple: 'Apple',
  arista: 'Arista',
  canonical: 'Canonical',
  centos: 'CentOS',
  cisco: 'Cisco',
  debian: 'Debian',
  dell: 'Dell',
  f5: 'F5',
  fortinet: 'Fortinet',
  freebsd: 'FreeBSD',
  hp: 'HP',
  hpe: 'HPE',
  ibm: 'IBM',
  juniper: 'Juniper',
  linux: 'Linux',
  microsoft: 'Microsoft',
  netapp: 'NetApp',
  openbsd: 'OpenBSD',
  oracle: 'Oracle',
  paloaltonetworks: 'Palo Alto Networks',
  redhat: 'Red Hat',
  rocky: 'Rocky',
  suse: 'SUSE',
  vmware: 'VMware'
};

const PRODUCT_NAMES: Record<string, string> = {
  aix: 'AIX',
  asa: 'ASA',
  enterprise_linux: 'Enterprise Linux',
  esxi: 'ESXi',
  fortios: 'FortiOS',
  'hp-ux': 'HP-UX',
  ios: 'IOS',
  ios_xe: 'IOS XE',
  ios_xr: 'IOS XR',
  iphone_os: 'iOS',
  junos: 'Junos',
  linux_kernel: 'Linux Kernel',
  mac_os_x: 'Mac OS X',
  macos: 'macOS',
  'nx-os': 'NX-OS',
  'pan-os': 'PAN-OS',
  tmos: 'TMOS',
  ubuntu_linux: 'Ubuntu',
  windows_xp: 'Windows XP'
};

function selectCpeUri(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const candidates = raw
    .split(/[\r\n,;|]+/)
    .map((value) => value.trim())
    .filter((value) => value.startsWith(URI_PREFIX) || value.startsWith(FORMATTED_PREFIX));

  if (candidates.length === 0) {
    return null;
  }

  return candidates.find((value) => value.startsWith(`${URI_PREFIX}o:`) || value.startsWith(`${FORMATTED_PREFIX}o:`)) ?? candidates[0];
}

function decodeUriComponentSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeComponent(value: string | undefined, decode: (value: string) => string): string {
  if (value === undefined) {
    return '';
  }

  const decoded = [...decode(value)]
    .filter((character) => character.codePointAt(0)! >= FIRST_PRINTABLE_CODE_POINT)
    .join('')
    .trim();

  return decoded === '-' || decoded === '*' ? '' : decoded;
}

function emptyCpe(part: string): OsCpe {
  return { part, vendor: '', product: '', version: '', update: '', edition: '', language: '', swEdition: '', targetSw: '', targetHw: '', other: '' };
}

function parseUriBinding(uri: string): OsCpe {
  const [part, vendor, product, version, update, edition, language] = uri.slice(URI_PREFIX.length).split(':');
  const cpe = emptyCpe(normalizeComponent(part, decodeUriComponentSafely));

  cpe.vendor = normalizeComponent(vendor, decodeUriComponentSafely);
  cpe.product = normalizeComponent(product, decodeUriComponentSafely);
  cpe.version = normalizeComponent(version, decodeUriComponentSafely);
  cpe.update = normalizeComponent(update, decodeUriComponentSafely);
  cpe.language = normalizeComponent(language, decodeUriComponentSafely);

  if (edition?.startsWith('~')) {
    const packed = edition.split('~').slice(1);

    for (const [index, field] of PACKED_EDITION_FIELDS.entries()) {
      cpe[field] = normalizeComponent(packed[index], decodeUriComponentSafely);
    }
  } else {
    cpe.edition = normalizeComponent(edition, decodeUriComponentSafely);
  }

  return cpe;
}

function unescapeFormattedComponent(value: string): string {
  return value.replaceAll(/\\(.)/g, '$1');
}

function parseFormattedBinding(formatted: string): OsCpe {
  const components = formatted.slice(FORMATTED_PREFIX.length).split(/(?<!\\):/);
  const [part, vendor, product, version, update, edition, language, swEdition, targetSw, targetHw, other] = components;
  const cpe = emptyCpe(normalizeComponent(part, unescapeFormattedComponent));

  cpe.vendor = normalizeComponent(vendor, unescapeFormattedComponent);
  cpe.product = normalizeComponent(product, unescapeFormattedComponent);
  cpe.version = normalizeComponent(version, unescapeFormattedComponent);
  cpe.update = normalizeComponent(update, unescapeFormattedComponent);
  cpe.edition = normalizeComponent(edition, unescapeFormattedComponent);
  cpe.language = normalizeComponent(language, unescapeFormattedComponent);
  cpe.swEdition = normalizeComponent(swEdition, unescapeFormattedComponent);
  cpe.targetSw = normalizeComponent(targetSw, unescapeFormattedComponent);
  cpe.targetHw = normalizeComponent(targetHw, unescapeFormattedComponent);
  cpe.other = normalizeComponent(other, unescapeFormattedComponent);

  return cpe;
}

export function parseOsCpe(raw: unknown): OsCpe | null {
  const uri = selectCpeUri(raw);

  if (!uri) {
    return null;
  }

  return uri.startsWith(FORMATTED_PREFIX) ? parseFormattedBinding(uri) : parseUriBinding(uri);
}

function humanizeWord(word: string): string {
  if (!word) {
    return '';
  }

  if (ARCHITECTURE_PATTERN.test(word)) {
    return word;
  }

  if (SERVICE_PACK_PATTERN.test(word) || word.toLowerCase() === 'lts') {
    return word.toUpperCase();
  }

  if (word !== word.toLowerCase()) {
    return word;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function humanize(token: string): string {
  return token
    .split(/[_\s-]+/)
    .map((word) => humanizeWord(word))
    .filter(Boolean)
    .join(' ');
}

function displayName(token: string, names: Record<string, string>): string {
  if (!token) {
    return '';
  }

  return names[token.toLowerCase()] ?? humanize(token);
}

function composeName(vendorToken: string, productToken: string): string {
  const vendor = displayName(vendorToken, VENDOR_NAMES);
  const product = displayName(productToken, PRODUCT_NAMES);

  if (!product || productToken.toLowerCase() === vendorToken.toLowerCase()) {
    return vendor;
  }

  if (!vendor || product.toLowerCase().startsWith(vendor.toLowerCase())) {
    return product;
  }

  return `${vendor} ${product}`;
}

export function formatOsCpe(raw: unknown): string {
  const cpe = parseOsCpe(raw);

  if (!cpe) {
    return '';
  }

  const name = composeName(cpe.vendor, cpe.product);
  const update = cpe.update.toLowerCase() === 'gold' ? '' : humanize(cpe.update);
  const qualifier = cpe.edition ? humanize(cpe.edition) : [cpe.swEdition, cpe.targetSw, cpe.targetHw].filter(Boolean).join(' ');

  return [name, cpe.version, update, qualifier ? `(${qualifier})` : ''].filter(Boolean).join(' ').replaceAll(/\s+/g, ' ').trim();
}
