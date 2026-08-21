/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura-compat';

export const toastTokens = {
  root: {
    blur: 'light-dark(3px, 20px)'
  },
  info: {
    background: 'light-dark(color-mix(in srgb, {blue.50}, transparent 4%), color-mix(in srgb, {blue.500}, transparent 55%))',
    borderColor: 'light-dark({blue.200}, color-mix(in srgb, {blue.700}, transparent 40%))'
  },
  success: {
    background: 'light-dark(color-mix(in srgb, {green.50}, transparent 4%), color-mix(in srgb, {green.500}, transparent 55%))',
    borderColor: 'light-dark({green.200}, color-mix(in srgb, {green.700}, transparent 40%))'
  },
  warn: {
    background: 'light-dark(color-mix(in srgb, {yellow.50}, transparent 4%), color-mix(in srgb, {yellow.500}, transparent 55%))',
    borderColor: 'light-dark({yellow.200}, color-mix(in srgb, {yellow.700}, transparent 40%))'
  },
  error: {
    background: 'light-dark(color-mix(in srgb, {red.50}, transparent 4%), color-mix(in srgb, {red.500}, transparent 55%))',
    borderColor: 'light-dark({red.200}, color-mix(in srgb, {red.700}, transparent 40%))'
  }
};

const Noir = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{surface.50}',
      100: '{surface.100}',
      200: '{surface.200}',
      300: '{surface.300}',
      400: '{surface.400}',
      500: '{surface.500}',
      600: '{surface.600}',
      700: '{surface.700}',
      800: '{surface.800}',
      900: '{surface.900}',
      950: '{surface.950}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.950}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.700}'
        },
        highlight: {
          background: '{primary.950}',
          focusBackground: '{primary.700}',
          color: '#ffffff',
          focusColor: '#ffffff'
        }
      },
      dark: {
        primary: {
          color: '{primary.50}',
          contrastColor: '{primary.950}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.300}'
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.300}',
          color: '{primary.950}',
          focusColor: '{primary.950}'
        }
      }
    }
  },
  components: {
    toast: toastTokens
  }
});

export default {
  preset: Noir,
  options: {
    darkModeSelector: '.p-dark'
  }
};
