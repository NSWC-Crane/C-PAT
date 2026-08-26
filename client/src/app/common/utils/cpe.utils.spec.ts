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
import { formatOsCpe, parseOsCpe } from './cpe.utils';

describe('cpe.utils', () => {
  describe('parseOsCpe', () => {
    it('unbinds a CPE 2.3 URI with a packed edition', () => {
      expect(parseOsCpe('cpe:/o:redhat:enterprise_linux:9.6::~~~~x86_64~')).toEqual({
        part: 'o',
        vendor: 'redhat',
        product: 'enterprise_linux',
        version: '9.6',
        update: '',
        edition: '',
        language: '',
        swEdition: '',
        targetSw: '',
        targetHw: 'x86_64',
        other: ''
      });
    });

    it('maps every packed edition segment in order', () => {
      const cpe = parseOsCpe('cpe:/o:vendor:product:1.0:u1:~ed~swed~tsw~thw~oth:en-us');

      expect(cpe).toMatchObject({ update: 'u1', edition: 'ed', swEdition: 'swed', targetSw: 'tsw', targetHw: 'thw', other: 'oth', language: 'en-us' });
    });

    it('keeps a legacy unpacked edition in the edition attribute', () => {
      expect(parseOsCpe('cpe:/o:microsoft:windows_7::gold:x64-ultimate')).toMatchObject({ product: 'windows_7', version: '', update: 'gold', edition: 'x64-ultimate', targetHw: '' });
    });

    it('fills omitted trailing components with empty strings', () => {
      expect(parseOsCpe('cpe:/o:microsoft:windows_server_2016')).toMatchObject({ vendor: 'microsoft', product: 'windows_server_2016', version: '', update: '', edition: '', language: '' });
    });

    it('parses a bare part with nothing else', () => {
      expect(parseOsCpe('cpe:/o')).toMatchObject({ part: 'o', vendor: '', product: '' });
    });

    it('preserves vendor and product case as emitted by Tenable', () => {
      expect(parseOsCpe('cpe:/o:Arista:EOS')).toMatchObject({ vendor: 'Arista', product: 'EOS' });
    });

    it('normalizes NA (-) and ANY (*) components to empty strings', () => {
      expect(parseOsCpe('cpe:/o:canonical:ubuntu_linux:22.04:-:*')).toMatchObject({ version: '22.04', update: '', edition: '' });
    });

    it('percent-decodes components and strips control-character escapes', () => {
      expect(parseOsCpe('cpe:/o:vendor:my%20product:1.0%01:%02')).toMatchObject({ product: 'my product', version: '1.0', update: '' });
    });

    it('splits packed edition segments before percent-decoding so an encoded tilde survives', () => {
      expect(parseOsCpe('cpe:/o:vendor:product:1::~a%7Eb~~~~')).toMatchObject({ edition: 'a~b' });
    });

    it('leaves a malformed percent sequence untouched', () => {
      expect(parseOsCpe('cpe:/o:vendor:prod%ZZ:1')).toMatchObject({ product: 'prod%ZZ' });
    });

    it('parses a CPE 2.3 formatted string', () => {
      expect(parseOsCpe('cpe:2.3:o:redhat:enterprise_linux:9.6:*:*:*:*:*:x86_64:*')).toMatchObject({ part: 'o', vendor: 'redhat', product: 'enterprise_linux', version: '9.6', targetHw: 'x86_64', update: '', edition: '' });
    });

    it('unescapes backslash-escaped characters in a formatted string', () => {
      expect(parseOsCpe('cpe:2.3:o:vendor:a\\:b\\*c:1.0:*:*:*:*:*:*:*')).toMatchObject({ product: 'a:b*c' });
    });

    it('prefers the first operating-system entry when several CPEs are joined', () => {
      const raw = 'cpe:/a:apache:http_server:2.4\ncpe:/o:redhat:enterprise_linux:9.6::~~~~x86_64~\ncpe:/o:redhat:enterprise_linux:9';

      expect(parseOsCpe(raw)).toMatchObject({ part: 'o', product: 'enterprise_linux', version: '9.6' });
    });

    it.each(['\r\n', ',', ';', '|'])('accepts %j as a separator between joined CPEs', (separator) => {
      expect(parseOsCpe(`cpe:/o:microsoft:windows_10${separator}cpe:/o:microsoft:windows_10:::x64-enterprise`)).toMatchObject({ product: 'windows_10', edition: '' });
    });

    it('falls back to the first non-OS CPE when no OS entry exists', () => {
      expect(parseOsCpe('cpe:/h:cisco:catalyst_9300\ncpe:/a:cisco:something')).toMatchObject({ part: 'h', product: 'catalyst_9300' });
    });

    it('trims surrounding whitespace', () => {
      expect(parseOsCpe('  cpe:/o:apple:mac_os_x:10.15.7 \n')).toMatchObject({ product: 'mac_os_x', version: '10.15.7' });
    });

    it.each([undefined, null, '', '   ', 42, {}, [], 'Linux Kernel 3.10 on Red Hat Enterprise Linux 7', 'cpe:o:bad', 'notcpe:/o:x:y'])('returns null for %j', (raw) => {
      expect(parseOsCpe(raw)).toBeNull();
    });
  });

  describe('formatOsCpe', () => {
    it.each([
      ['cpe:/o:redhat:enterprise_linux:9.6::~~~~x86_64~', 'Red Hat Enterprise Linux 9.6 (x86_64)'],
      ['cpe:/o:microsoft:windows_7::gold:x64-ultimate', 'Microsoft Windows 7 (x64 Ultimate)'],
      ['cpe:/o:microsoft:windows_10:::x64-home', 'Microsoft Windows 10 (x64 Home)'],
      ['cpe:/o:microsoft:windows_server_2016', 'Microsoft Windows Server 2016'],
      ['cpe:/o:microsoft:windows_server_2022:::x64', 'Microsoft Windows Server 2022 (x64)'],
      ['cpe:/o:microsoft:windows_xp::sp3:x86', 'Microsoft Windows XP SP3 (x86)'],
      ['cpe:/o:Arista:EOS', 'Arista EOS'],
      ['cpe:/o:canonical:ubuntu_linux:22.04:-:lts', 'Canonical Ubuntu 22.04 (LTS)'],
      ['cpe:/o:apple:mac_os_x:10.15.7', 'Apple Mac OS X 10.15.7'],
      ['cpe:/o:apple:macos:14.5', 'Apple macOS 14.5'],
      ['cpe:/o:cisco:ios_xe:16.9.4', 'Cisco IOS XE 16.9.4'],
      ['cpe:/o:cisco:nx-os:9.3', 'Cisco NX-OS 9.3'],
      ['cpe:/o:linux:linux_kernel:2.6', 'Linux Kernel 2.6'],
      ['cpe:/o:vmware:esxi:7.0:update3', 'VMware ESXi 7.0 Update3'],
      ['cpe:/o:juniper:junos:12.1x46:d10', 'Juniper Junos 12.1x46 D10'],
      ['cpe:/o:paloaltonetworks:pan-os:10.2', 'Palo Alto Networks PAN-OS 10.2'],
      ['cpe:/o:debian:debian_linux:12', 'Debian Linux 12'],
      ['cpe:/o:freebsd:freebsd:13.2', 'FreeBSD 13.2'],
      ['cpe:/o:rocky:rocky_linux:9', 'Rocky Linux 9'],
      ['cpe:/o:suse:linux_enterprise_server:15:sp5', 'SUSE Linux Enterprise Server 15 SP5'],
      ['cpe:/o:hp:hp-ux:11.31', 'HP-UX 11.31'],
      ['cpe:/o:centos:centos:7', 'CentOS 7'],
      ['cpe:/o:someVendor:some_product:1.2', 'someVendor Some Product 1.2'],
      ['cpe:2.3:o:redhat:enterprise_linux:9.6:*:*:*:*:*:x86_64:*', 'Red Hat Enterprise Linux 9.6 (x86_64)'],
      ['cpe:/o:vendor:product:1.0::~~server~linux~x86_64~', 'Vendor Product 1.0 (server linux x86_64)']
    ])('formats %s as %s', (raw, expected) => {
      expect(formatOsCpe(raw)).toBe(expected);
    });

    it('uses the operating-system entry when several CPEs are joined', () => {
      expect(formatOsCpe('cpe:/a:openbsd:openssh:9.3\ncpe:/o:microsoft:windows_11:::x64-enterprise')).toBe('Microsoft Windows 11 (x64 Enterprise)');
    });

    it('formats a vendor-only CPE', () => {
      expect(formatOsCpe('cpe:/o:cisco')).toBe('Cisco');
    });

    it.each([undefined, null, '', '   ', 7, 'Linux Kernel 3.10', 'cpe:o:x'])('returns an empty string for %j', (raw) => {
      expect(formatOsCpe(raw)).toBe('');
    });
  });
});
