/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

const eslint = require('@eslint/js');
const n = require('eslint-plugin-n');
const prettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/**', 'tls/**', '.sonar/**', 'package-lock.json', 'Services/migrations/lib/**'],
    },
    eslint.configs.recommended,
    n.configs['flat/recommended-script'],
    {
        rules: {
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        files: ['healthcheck.js', 'utils/state.js'],
        rules: {
            'n/no-process-exit': 'off',
        },
    },
    {
        files: ['utils/escape.js'],
        rules: {
            'no-control-regex': 'off',
        },
    },
    prettier,
];
