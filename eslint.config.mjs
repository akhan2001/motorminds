import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // Indentation: 4-space tabs
            'indent': ['error', 'tab'],
            '@typescript-eslint/indent': ['error', 'tab'],

            // TypeScript rules
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],

            // React rules
            'react/no-unescaped-entities': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',

            // General code quality
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-unused-vars': 'off', // Use TS version instead
            'prefer-const': 'warn',
            'no-var': 'error'
        }
    },
    {
        ignores: [
            '.next/**',
            'out/**',
            'build/**',
            'next-env.d.ts',
            'node_modules/**',
            '.vercel/**'
        ]
    }
])

export default eslintConfig

