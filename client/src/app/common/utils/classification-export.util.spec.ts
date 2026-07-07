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
import { applyClassificationBanner, getClassificationColorCode, getClassificationFontColor, getClassificationText } from './classification-export.util';

describe('classification-export.util', () => {
  describe('getClassificationText', () => {
    it('returns the UNCLASSIFIED banner for U', () => {
      expect(getClassificationText('U')).toBe('***** UNCLASSIFIED *****');
    });

    it('returns the CUI banner for CUI and FOUO', () => {
      expect(getClassificationText('CUI')).toBe('***** CONTROLLED UNCLASSIFIED INFORMATION *****');
      expect(getClassificationText('FOUO')).toBe('***** CONTROLLED UNCLASSIFIED INFORMATION *****');
    });

    it('returns the CONFIDENTIAL banner for C', () => {
      expect(getClassificationText('C')).toBe('***** CONFIDENTIAL *****');
    });

    it('returns the SECRET banner for S', () => {
      expect(getClassificationText('S')).toBe('***** SECRET *****');
    });

    it('returns the TOP SECRET banner for TS', () => {
      expect(getClassificationText('TS')).toBe('***** TOP SECRET *****');
    });

    it('returns the TOP SECRET // SCI banner for SCI', () => {
      expect(getClassificationText('SCI')).toBe('***** TOP SECRET // SCI *****');
    });

    it('falls back to UNCLASSIFIED for NONE and unknown values', () => {
      expect(getClassificationText('NONE')).toBe('***** UNCLASSIFIED *****');
      expect(getClassificationText('')).toBe('***** UNCLASSIFIED *****');
      expect(getClassificationText('SOMETHING_ELSE')).toBe('***** UNCLASSIFIED *****');
    });
  });

  describe('getClassificationColorCode', () => {
    it('maps each classification to its argb color', () => {
      expect(getClassificationColorCode('U')).toBe('ff007a33');
      expect(getClassificationColorCode('CUI')).toBe('ff502b85');
      expect(getClassificationColorCode('FOUO')).toBe('ff502b85');
      expect(getClassificationColorCode('C')).toBe('ff0033a0');
      expect(getClassificationColorCode('S')).toBe('ffc8102e');
      expect(getClassificationColorCode('TS')).toBe('ffff8c00');
      expect(getClassificationColorCode('SCI')).toBe('fffce83a');
    });

    it('falls back to the UNCLASSIFIED color for NONE and unknown values', () => {
      expect(getClassificationColorCode('NONE')).toBe('ff007a33');
      expect(getClassificationColorCode('')).toBe('ff007a33');
      expect(getClassificationColorCode('SOMETHING_ELSE')).toBe('ff007a33');
    });
  });

  describe('getClassificationFontColor', () => {
    it('uses dark text for the light-colored TS and SCI banners', () => {
      expect(getClassificationFontColor('TS')).toBe('FF000000');
      expect(getClassificationFontColor('SCI')).toBe('FF000000');
    });

    it('uses white text for all other classifications', () => {
      expect(getClassificationFontColor('U')).toBe('FFFFFFFF');
      expect(getClassificationFontColor('CUI')).toBe('FFFFFFFF');
      expect(getClassificationFontColor('S')).toBe('FFFFFFFF');
      expect(getClassificationFontColor('NONE')).toBe('FFFFFFFF');
    });
  });

  describe('applyClassificationBanner', () => {
    it('sets the cell value, solid fill, and font for the given classification', () => {
      const cell: any = {};

      applyClassificationBanner(cell, 'S');

      expect(cell.value).toBe('***** SECRET *****');
      expect(cell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffc8102e' }
      });
      expect(cell.font).toEqual({
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 14
      });
    });

    it('applies the dark font color for TS/SCI banners', () => {
      const cell: any = {};

      applyClassificationBanner(cell, 'SCI');

      expect(cell.value).toBe('***** TOP SECRET // SCI *****');
      expect(cell.fill.fgColor).toEqual({ argb: 'fffce83a' });
      expect(cell.font.color).toEqual({ argb: 'FF000000' });
    });

    it('falls back to UNCLASSIFIED styling for unknown classifications', () => {
      const cell: any = {};

      applyClassificationBanner(cell, 'NONE');

      expect(cell.value).toBe('***** UNCLASSIFIED *****');
      expect(cell.fill.fgColor).toEqual({ argb: 'ff007a33' });
      expect(cell.font.color).toEqual({ argb: 'FFFFFFFF' });
    });
  });
});
