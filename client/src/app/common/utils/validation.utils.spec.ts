/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { describe, expect, it } from 'vitest';
import { getAllowedExtension, isZoneCorDPackage, splitDelimitedIds, validateAttachment, validateCVSSv2Vector, validateCVSSv3Vector, validateCVSSv4Vector, validateIAVM, validateIP, validateStigSeverity, validateUUID } from './validation.utils';

const ALLOWED_TYPES = ['.pdf', '.xlsx', '.json', '.tar.gz', '.gz'];

function fileOfSize(name: string, size: number): File {
  const file = new File(['x'], name);

  Object.defineProperty(file, 'size', { value: size });

  return file;
}

const V2_BASE = 'AV:N/AC:L/Au:N/C:P/I:P/A:P';
const V3_BASE = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
const V3_FULL = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:F/RL:O/RC:C/CR:H/IR:H/AR:H/MAV:N/MAC:L/MPR:N/MUI:N/MS:U/MC:H/MI:H/MA:H';
const V4_BASE = 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N';

const ALL_VALIDATORS: [string, (value: string) => boolean][] = [
  ['validateIP', validateIP],
  ['validateUUID', validateUUID],
  ['validateIAVM', validateIAVM],
  ['validateStigSeverity', validateStigSeverity],
  ['validateCVSSv2Vector', validateCVSSv2Vector],
  ['validateCVSSv3Vector', validateCVSSv3Vector],
  ['validateCVSSv4Vector', validateCVSSv4Vector],
  ['isZoneCorDPackage', isZoneCorDPackage]
];

describe('validation.utils', () => {
  describe('non-string input', () => {
    it.each(ALL_VALIDATORS)('%s returns false for null without throwing', (_name, validator) => {
      expect(validator(null as any)).toBe(false);
    });

    it.each(ALL_VALIDATORS)('%s returns false for undefined without throwing', (_name, validator) => {
      expect(validator(undefined as any)).toBe(false);
    });

    it.each(ALL_VALIDATORS)('%s returns false for an empty string', (_name, validator) => {
      expect(validator('')).toBe(false);
    });

    it.each(ALL_VALIDATORS)('%s returns false for whitespace only', (_name, validator) => {
      expect(validator('   ')).toBe(false);
    });

    it.each(ALL_VALIDATORS)('%s returns false for a non-string value', (_name, validator) => {
      expect(validator(42 as any)).toBe(false);
    });
  });

  describe('validateIP', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(validateIP('192.168.1.1')).toBe(true);
      expect(validateIP('0.0.0.0')).toBe(true);
      expect(validateIP('255.255.255.255')).toBe(true);
    });

    it('should trim surrounding whitespace', () => {
      expect(validateIP('  192.168.1.1  ')).toBe(true);
    });

    it('should reject out-of-range octets', () => {
      expect(validateIP('256.1.1.1')).toBe(false);
      expect(validateIP('1.1.1.256')).toBe(false);
    });

    it('should reject wrong octet counts', () => {
      expect(validateIP('192.168.1')).toBe(false);
      expect(validateIP('192.168.1.1.1')).toBe(false);
    });

    it('should reject non-numeric octets', () => {
      expect(validateIP('192.168.1.a')).toBe(false);
      expect(validateIP('192.168.1.-1')).toBe(false);
      expect(validateIP('not-an-ip')).toBe(false);
    });

    it('should reject embedded whitespace', () => {
      expect(validateIP('192.168. 1.1')).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDs in either case', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should trim surrounding whitespace', () => {
      expect(validateUUID('  123e4567-e89b-12d3-a456-426614174000  ')).toBe(true);
    });

    it('should reject malformed UUIDs', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false);
      expect(validateUUID('123e4567-e89b-12d3-a456-42661417400G')).toBe(false);
      expect(validateUUID('123e4567e89b12d3a456426614174000')).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4')).toBe(false);
    });
  });

  describe('validateIAVM', () => {
    it('should accept valid IAVM numbers', () => {
      expect(validateIAVM('2024-A-0001')).toBe(true);
      expect(validateIAVM('1999-B-9999')).toBe(true);
      expect(validateIAVM('2024-a-0001')).toBe(true);
    });

    it('should trim surrounding whitespace', () => {
      expect(validateIAVM('  2024-A-0001  ')).toBe(true);
    });

    it('should reject malformed IAVM numbers', () => {
      expect(validateIAVM('2024-AB-0001')).toBe(false);
      expect(validateIAVM('202-A-0001')).toBe(false);
      expect(validateIAVM('2024-1-0001')).toBe(false);
      expect(validateIAVM('2024-A-001')).toBe(false);
      expect(validateIAVM('2024A0001')).toBe(false);
    });
  });

  describe('validateStigSeverity', () => {
    it('should accept CAT I through CAT III numerals', () => {
      expect(validateStigSeverity('I')).toBe(true);
      expect(validateStigSeverity('II')).toBe(true);
      expect(validateStigSeverity('III')).toBe(true);
    });

    it('should trim surrounding whitespace', () => {
      expect(validateStigSeverity('  II  ')).toBe(true);
    });

    it('should reject anything else', () => {
      expect(validateStigSeverity('IIII')).toBe(false);
      expect(validateStigSeverity('IV')).toBe(false);
      expect(validateStigSeverity('CAT I')).toBe(false);
      expect(validateStigSeverity('i')).toBe(false);
    });
  });

  describe('splitDelimitedIds', () => {
    it('should split on commas and trim each token', () => {
      expect(splitDelimitedIds('V-233781,V-244781')).toEqual(['V-233781', 'V-244781']);
      expect(splitDelimitedIds('28416, 98271')).toEqual(['28416', '98271']);
    });

    it('should split on newlines, tabs and semicolons', () => {
      expect(splitDelimitedIds('V-1\nV-2\r\nV-3')).toEqual(['V-1', 'V-2', 'V-3']);
      expect(splitDelimitedIds('V-1;V-2')).toEqual(['V-1', 'V-2']);
      expect(splitDelimitedIds('V-1\tV-2')).toEqual(['V-1', 'V-2']);
    });

    it('should drop empty tokens from repeated delimiters', () => {
      expect(splitDelimitedIds('V-1,,V-2,')).toEqual(['V-1', 'V-2']);
    });

    it('should deduplicate while preserving first-seen order', () => {
      expect(splitDelimitedIds('V-2,V-1,V-2')).toEqual(['V-2', 'V-1']);
    });

    it('should return an empty array for blank or non-string input', () => {
      expect(splitDelimitedIds('')).toEqual([]);
      expect(splitDelimitedIds('   ')).toEqual([]);
      expect(splitDelimitedIds(null as any)).toEqual([]);
      expect(splitDelimitedIds(undefined as any)).toEqual([]);
    });
  });

  describe('getAllowedExtension', () => {
    it('should match a simple extension case-insensitively', () => {
      expect(getAllowedExtension('report.pdf', ALLOWED_TYPES)).toBe('.pdf');
      expect(getAllowedExtension('REPORT.PDF', ALLOWED_TYPES)).toBe('.pdf');
    });

    it('should prefer the longest matching extension', () => {
      expect(getAllowedExtension('archive.tar.gz', ALLOWED_TYPES)).toBe('.tar.gz');
    });

    it('should return null for disallowed or absent extensions', () => {
      expect(getAllowedExtension('malware.exe', ALLOWED_TYPES)).toBeNull();
      expect(getAllowedExtension('README', ALLOWED_TYPES)).toBeNull();
      expect(getAllowedExtension('.pdf', ALLOWED_TYPES)).toBeNull();
      expect(getAllowedExtension('', ALLOWED_TYPES)).toBeNull();
      expect(getAllowedExtension(null as any, ALLOWED_TYPES)).toBeNull();
    });
  });

  describe('validateAttachment', () => {
    it('should accept a file within the size limit and of an allowed type', () => {
      expect(validateAttachment(fileOfSize('report.pdf', 1024), ALLOWED_TYPES)).toEqual({ valid: true });
    });

    it('should accept a file exactly at the size limit', () => {
      expect(validateAttachment(fileOfSize('report.pdf', 5242880), ALLOWED_TYPES)).toEqual({ valid: true });
    });

    it('should reject a file over the size limit before checking type', () => {
      expect(validateAttachment(fileOfSize('malware.exe', 5242881), ALLOWED_TYPES)).toEqual({
        valid: false,
        reason: 'File size exceeds 5MB limit.'
      });
    });

    it('should reject a disallowed file type', () => {
      expect(validateAttachment(fileOfSize('malware.exe', 1024), ALLOWED_TYPES)).toEqual({
        valid: false,
        reason: 'File type not allowed.'
      });
    });

    it('should honor a custom size limit in the message', () => {
      expect(validateAttachment(fileOfSize('report.pdf', 2097153), ALLOWED_TYPES, 2097152)).toEqual({
        valid: false,
        reason: 'File size exceeds 2MB limit.'
      });
    });

    it('should reject a missing file', () => {
      expect(validateAttachment(null as any, ALLOWED_TYPES)).toEqual({
        valid: false,
        reason: 'No file selected.'
      });
    });
  });

  describe('isZoneCorDPackage', () => {
    it('should match Zone C and Zone D in any spacing or casing', () => {
      expect(isZoneCorDPackage('Test Package Zone C')).toBe(true);
      expect(isZoneCorDPackage('Test Package Zone: D')).toBe(true);
      expect(isZoneCorDPackage('Test Package Zone:C')).toBe(true);
      expect(isZoneCorDPackage('test package zone d')).toBe(true);
    });

    it('should not match other zones', () => {
      expect(isZoneCorDPackage('Test Package Zone A')).toBe(false);
      expect(isZoneCorDPackage('Test Package Zone B')).toBe(false);
      expect(isZoneCorDPackage('Test Package')).toBe(false);
    });

    it('should not match when the zone letter is part of a longer token', () => {
      expect(isZoneCorDPackage('Test Package Zone CX')).toBe(false);
      expect(isZoneCorDPackage('Test Package Zone DEF')).toBe(false);
    });
  });

  describe('validateCVSSv2Vector', () => {
    it('should accept the canonical base vector', () => {
      expect(validateCVSSv2Vector(V2_BASE)).toBe(true);
    });

    it('should accept out-of-order metrics, matching the v3 engine', () => {
      expect(validateCVSSv2Vector('AC:L/AV:N/Au:N/C:P/I:P/A:P')).toBe(true);
      expect(validateCVSSv2Vector('A:P/I:P/C:P/Au:N/AC:L/AV:N')).toBe(true);
    });

    it('should reject duplicate metrics', () => {
      expect(validateCVSSv2Vector('AV:N/AC:L/AC:H/C:P/I:P/A:P')).toBe(false);
    });

    it('should reject missing base metrics', () => {
      expect(validateCVSSv2Vector('AV:N/AC:L/Au:N/C:P/I:P')).toBe(false);
    });

    it('should reject more parts than the schema defines', () => {
      expect(validateCVSSv2Vector(`${V2_BASE}/E:F`)).toBe(false);
    });

    it('should reject unknown metrics', () => {
      expect(validateCVSSv2Vector('AV:N/AC:L/Au:N/C:P/I:P/ZZ:Q')).toBe(false);
    });

    it('should reject invalid metric values', () => {
      expect(validateCVSSv2Vector('AV:X/AC:L/Au:N/C:P/I:P/A:P')).toBe(false);
    });

    it('should normalize a trailing slash and surrounding whitespace', () => {
      expect(validateCVSSv2Vector(`${V2_BASE}/`)).toBe(true);
      expect(validateCVSSv2Vector(`  ${V2_BASE}  `)).toBe(true);
      expect(validateCVSSv2Vector(`  ${V2_BASE}/  `)).toBe(true);
    });

    it('should reject a doubled trailing slash', () => {
      expect(validateCVSSv2Vector(`${V2_BASE}//`)).toBe(false);
    });

    it('should reject lowercase vectors', () => {
      expect(validateCVSSv2Vector('av:n/ac:l/au:n/c:p/i:p/a:p')).toBe(false);
    });
  });

  describe('validateCVSSv3Vector', () => {
    it('should accept the canonical base vector', () => {
      expect(validateCVSSv3Vector(V3_BASE)).toBe(true);
    });

    it('should accept both the 3.0 and 3.1 prefixes', () => {
      expect(validateCVSSv3Vector('CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBe(true);
      expect(validateCVSSv3Vector(V3_BASE)).toBe(true);
    });

    it('should reject unknown prefixes', () => {
      expect(validateCVSSv3Vector('CVSS:3.2/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBe(false);
      expect(validateCVSSv3Vector('CVSS:4.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBe(false);
      expect(validateCVSSv3Vector('AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBe(false);
    });

    it('should accept all 22 metrics', () => {
      expect(validateCVSSv3Vector(V3_FULL)).toBe(true);
    });

    it('should accept the 8-base plus one optional boundary', () => {
      expect(validateCVSSv3Vector(`${V3_BASE}/E:F`)).toBe(true);
    });

    it('should accept out-of-order metrics per the FIRST specification', () => {
      expect(validateCVSSv3Vector('CVSS:3.1/S:U/AV:N/AC:L/PR:H/UI:N/C:L/I:L/A:N/E:F/RL:O')).toBe(true);
    });

    it('should reject duplicate metrics', () => {
      expect(validateCVSSv3Vector(`${V3_BASE}/E:F/E:P`)).toBe(false);
    });

    it('should reject when base metrics are missing', () => {
      expect(validateCVSSv3Vector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/E:F')).toBe(false);
    });

    it('should reject unknown metrics', () => {
      expect(validateCVSSv3Vector(`${V3_BASE}/ZZ:Q`)).toBe(false);
    });

    it('should reject invalid metric values', () => {
      expect(validateCVSSv3Vector('CVSS:3.1/AV:Z/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).toBe(false);
    });

    it('should normalize a trailing slash and surrounding whitespace', () => {
      expect(validateCVSSv3Vector(`${V3_BASE}/`)).toBe(true);
      expect(validateCVSSv3Vector(`  ${V3_BASE}  `)).toBe(true);
      expect(validateCVSSv3Vector(`${V3_FULL}/`)).toBe(true);
    });

    it('should reject a doubled trailing slash', () => {
      expect(validateCVSSv3Vector(`${V3_BASE}//`)).toBe(false);
    });

    it('should reject lowercase vectors', () => {
      expect(validateCVSSv3Vector('cvss:3.1/av:n/ac:l/pr:n/ui:n/s:u/c:h/i:h/a:h')).toBe(false);
    });

    it('should reject a bare prefix', () => {
      expect(validateCVSSv3Vector('CVSS:3.1/')).toBe(false);
    });
  });

  describe('validateCVSSv4Vector', () => {
    it('should accept the canonical base vector', () => {
      expect(validateCVSSv4Vector(V4_BASE)).toBe(true);
    });

    it('should accept optional metrics in canonical order', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}/E:A/CR:H/MAV:N/U:Red`)).toBe(true);
    });

    it('should reject out-of-order base metrics per the FIRST v4 specification', () => {
      expect(validateCVSSv4Vector('CVSS:4.0/AC:L/AV:N/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBe(false);
    });

    it('should reject out-of-order optional metrics', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}/CR:H/E:A`)).toBe(false);
    });

    it('should reject duplicate base metrics', () => {
      expect(validateCVSSv4Vector('CVSS:4.0/AV:N/AV:L/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBe(false);
    });

    it('should reject duplicate optional metrics', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}/E:A/E:A`)).toBe(false);
    });

    it('should reject missing base metrics', () => {
      expect(validateCVSSv4Vector('CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N')).toBe(false);
    });

    it('should reject unknown prefixes', () => {
      expect(validateCVSSv4Vector('CVSS:4.1/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBe(false);
    });

    it('should reject unknown metrics', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}/ZZ:Q`)).toBe(false);
    });

    it('should reject invalid metric values', () => {
      expect(validateCVSSv4Vector('CVSS:4.0/AV:Z/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBe(false);
    });

    it('should normalize a trailing slash and surrounding whitespace', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}/`)).toBe(true);
      expect(validateCVSSv4Vector(`  ${V4_BASE}  `)).toBe(true);
    });

    it('should reject a doubled trailing slash', () => {
      expect(validateCVSSv4Vector(`${V4_BASE}//`)).toBe(false);
    });

    it('should reject lowercase vectors', () => {
      expect(validateCVSSv4Vector('cvss:4.0/av:n/ac:l/at:n/pr:n/ui:n/vc:h/vi:h/va:h/sc:n/si:n/sa:n')).toBe(false);
    });
  });
});
