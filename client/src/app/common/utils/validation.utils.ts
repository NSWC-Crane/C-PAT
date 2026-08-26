/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export const CVSS_V2_BASE_METRIC_COUNT = 6;
export const CVSS_V2_SCHEMA = Object.freeze([/^AV:[LAN]$/, /^AC:[LMH]$/, /^Au:[MSN]$/, /^C:[NPC]$/, /^I:[NPC]$/, /^A:[NPC]$/] as const);

export const CVSS_V3_BASE_METRIC_COUNT = 8;
export const CVSS_V3_SCHEMA = Object.freeze([
  /^AV:[NALP]$/,
  /^AC:[LH]$/,
  /^PR:[NLH]$/,
  /^UI:[NR]$/,
  /^S:[UC]$/,
  /^C:[NLH]$/,
  /^I:[NLH]$/,
  /^A:[NLH]$/,
  /^E:[XUPFH]$/,
  /^RL:[XOTWU]$/,
  /^RC:[XURC]$/,
  /^CR:[XLH]$/,
  /^IR:[XLH]$/,
  /^AR:[XLH]$/,
  /^MAV:[XNALP]$/,
  /^MAC:[XLH]$/,
  /^MPR:[XNLH]$/,
  /^MUI:[XNR]$/,
  /^MS:[XUC]$/,
  /^MC:[XNLH]$/,
  /^MI:[XNLH]$/,
  /^MA:[XNLH]$/
] as const);

export const CVSS_V4_BASE_METRIC_COUNT = 11;
export const CVSS_V4_SCHEMA = Object.freeze([
  /^AV:[NALP]$/,
  /^AC:[LH]$/,
  /^AT:[NP]$/,
  /^PR:[NLH]$/,
  /^UI:[NPA]$/,
  /^VC:[HLN]$/,
  /^VI:[HLN]$/,
  /^VA:[HLN]$/,
  /^SC:[HLN]$/,
  /^SI:[HLN]$/,
  /^SA:[HLN]$/,
  /^E:[XAPU]$/,
  /^CR:[XHML]$/,
  /^IR:[XHML]$/,
  /^AR:[XHML]$/,
  /^MAV:[XNALP]$/,
  /^MAC:[XLH]$/,
  /^MAT:[XNP]$/,
  /^MPR:[XNLH]$/,
  /^MUI:[XNPA]$/,
  /^MVC:[XNLH]$/,
  /^MVI:[XNLH]$/,
  /^MVA:[XNLH]$/,
  /^MSC:[XNLH]$/,
  /^MSI:[XNLHS]$/,
  /^MSA:[XNLHS]$/,
  /^S:[XNP]$/,
  /^AU:[XNY]$/,
  /^R:[XAUI]$/,
  /^V:[XDC]$/,
  /^RE:[XLMH]$/,
  /^U:(?:X|Clear|Green|Amber|Red)$/
] as const);

const CVSS_V3_PREFIXES = Object.freeze(['CVSS:3.0/', 'CVSS:3.1/']);
const CVSS_V4_PREFIXES = Object.freeze(['CVSS:4.0/']);

function normalizeInput(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function normalizeVector(vector: unknown): string | null {
  const trimmed = normalizeInput(vector);

  if (trimmed === null) return null;

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function splitVector(vector: string, validPrefixes: readonly string[] | null): string[] | null {
  if (validPrefixes === null) return vector.split('/');

  const matchedPrefix = validPrefixes.find((prefix) => vector.startsWith(prefix));

  if (matchedPrefix === undefined) return null;

  return vector.slice(matchedPrefix.length).split('/');
}

function matchPartToSchema(part: string, schema: readonly RegExp[], matchedIndices: Set<number>): boolean {
  for (let schemaIndex = 0; schemaIndex < schema.length; schemaIndex++) {
    if (schema[schemaIndex].test(part)) {
      if (matchedIndices.has(schemaIndex)) return false;
      matchedIndices.add(schemaIndex);

      return true;
    }
  }

  return false;
}

function validateUnorderedVector(vector: unknown, validPrefixes: readonly string[] | null, baseMetricCount: number, schema: readonly RegExp[]): boolean {
  const normalized = normalizeVector(vector);

  if (normalized === null) return false;

  const parts = splitVector(normalized, validPrefixes);

  if (parts === null || parts.length < baseMetricCount || parts.length > schema.length) {
    return false;
  }

  const matchedIndices = new Set<number>();

  for (const part of parts) {
    if (!matchPartToSchema(part, schema, matchedIndices)) {
      return false;
    }
  }

  for (let i = 0; i < baseMetricCount; i++) {
    if (!matchedIndices.has(i)) return false;
  }

  return true;
}

function validateOrderedVector(vector: unknown, validPrefixes: readonly string[] | null, baseMetricCount: number, schema: readonly RegExp[]): boolean {
  const normalized = normalizeVector(vector);

  if (normalized === null) return false;

  const parts = splitVector(normalized, validPrefixes);

  if (parts === null || parts.length < baseMetricCount || parts.length > schema.length) {
    return false;
  }

  for (let i = 0; i < baseMetricCount; i++) {
    if (!schema[i].test(parts[i])) return false;
  }

  let schemaIndex = baseMetricCount;

  for (let i = baseMetricCount; i < parts.length; i++) {
    while (schemaIndex < schema.length && !schema[schemaIndex].test(parts[i])) {
      schemaIndex++;
    }

    if (schemaIndex >= schema.length) return false;

    schemaIndex++;
  }

  return true;
}

export function validateIP(ip: string): boolean {
  const normalized = normalizeInput(ip);

  if (normalized === null) return false;

  const parts = normalized.split('.');

  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = Number.parseInt(part, 10);

    return num >= 0 && num <= 255;
  });
}

export function validateUUID(uuid: string): boolean {
  const normalized = normalizeInput(uuid);

  if (normalized === null) return false;

  const parts = normalized.split('-');

  if (parts.length !== 5) return false;

  const expectedLengths = [8, 4, 4, 4, 12];

  return parts.every((part, index) => part.length === expectedLengths[index] && /^[0-9a-f]+$/i.test(part));
}

export function validateIAVM(iavmNumber: string): boolean {
  const normalized = normalizeInput(iavmNumber);

  if (normalized === null) return false;

  return /^\d{4}-[A-Za-z]-\d{4}$/.test(normalized);
}

export function splitDelimitedIds(text: string): string[] {
  const normalized = normalizeInput(text);

  if (!normalized) return [];

  const seen = new Set<string>();

  for (const token of normalized.split(/[\s,;]+/)) {
    if (token) seen.add(token);
  }

  return [...seen];
}

export function validateIPv6(ip: string): boolean {
  const normalized = normalizeInput(ip);

  if (normalized === null) return false;

  const [address, prefix, ...rest] = normalized.split('/');

  if (rest.length > 0) return false;
  if (prefix !== undefined && !(/^\d{1,3}$/.test(prefix) && Number(prefix) <= 128)) return false;
  if (!/^[0-9a-f:]+$/i.test(address) || address.includes(':::')) return false;

  const doubleColons = address.split('::').length - 1;

  if (doubleColons > 1) return false;

  const groups = address.split(':').filter((group) => group !== '');

  if (groups.some((group) => group.length > 4)) return false;
  if (doubleColons === 1) return groups.length <= 7;

  return groups.length === 8 && !address.startsWith(':') && !address.endsWith(':');
}

function isIPv4Cidr(token: string): boolean {
  const [address, prefix, ...rest] = token.split('/');

  return rest.length === 0 && prefix !== undefined && /^\d{1,2}$/.test(prefix) && Number(prefix) <= 32 && validateIP(address);
}

function isIPv4Range(token: string): boolean {
  const [start, end, ...rest] = token.split('-');

  return rest.length === 0 && end !== undefined && validateIP(start) && validateIP(end);
}

export function validateAddressList(value: string): boolean {
  const tokens = splitDelimitedIds(value);

  return tokens.length > 0 && tokens.every((token) => validateIP(token) || isIPv4Cidr(token) || isIPv4Range(token) || validateIPv6(token));
}

export function validateIAVMList(value: string): boolean {
  const tokens = splitDelimitedIds(value);

  return tokens.length > 0 && tokens.every(validateIAVM);
}

export const DEFAULT_MAX_ATTACHMENT_BYTES = 5242880;

export interface AttachmentValidationResult {
  valid: boolean;
  reason?: string;
}

export function getAllowedExtension(fileName: string, allowedTypes: readonly string[]): string | null {
  const normalized = normalizeInput(fileName)?.toLowerCase();

  if (!normalized) return null;

  let matched: string | null = null;

  for (const allowedType of allowedTypes) {
    const candidate = allowedType.toLowerCase();

    if (normalized.length > candidate.length && normalized.endsWith(candidate) && (matched === null || candidate.length > matched.length)) {
      matched = candidate;
    }
  }

  return matched;
}

export function validateAttachment(file: File, allowedTypes: readonly string[], maxBytes: number = DEFAULT_MAX_ATTACHMENT_BYTES): AttachmentValidationResult {
  if (!file) {
    return { valid: false, reason: 'No file selected.' };
  }

  if (file.size > maxBytes) {
    return { valid: false, reason: `File size exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit.` };
  }

  if (getAllowedExtension(file.name, allowedTypes) === null) {
    return { valid: false, reason: 'File type not allowed.' };
  }

  return { valid: true };
}

export function isZoneCorDPackage(aaPackage: string): boolean {
  const normalized = normalizeInput(aaPackage);

  if (normalized === null) return false;

  return /Zone:?\s*[CD](?![A-Z])/i.test(normalized);
}

export function validateStigSeverity(severity: string): boolean {
  const normalized = normalizeInput(severity);

  if (normalized === null) return false;

  return /^I{1,3}$/.test(normalized);
}

export function validateCVSSv2Vector(vector: string): boolean {
  return validateUnorderedVector(vector, null, CVSS_V2_BASE_METRIC_COUNT, CVSS_V2_SCHEMA);
}

export function validateCVSSv3Vector(vector: string): boolean {
  return validateUnorderedVector(vector, CVSS_V3_PREFIXES, CVSS_V3_BASE_METRIC_COUNT, CVSS_V3_SCHEMA);
}

export function validateCVSSv4Vector(vector: string): boolean {
  return validateOrderedVector(vector, CVSS_V4_PREFIXES, CVSS_V4_BASE_METRIC_COUNT, CVSS_V4_SCHEMA);
}
