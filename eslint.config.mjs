import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**', '**/*.generated.ts'],
  },

  // ---------------------------------------------------------------- TypeScript
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'arg', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'arg', style: 'kebab-case' },
      ],

      // Templates and styles live in their own files. Never inline in the .ts.
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',

      // ngDoCheck and ngOnChanges run on every check and are easy to make
      // expensive. Derive with computed()/linkedSignal() instead.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MethodDefinition[key.name="ngDoCheck"]',
          message:
            'ngDoCheck runs on every change-detection pass. Use a computed() signal instead.',
        },
        {
          selector: 'MethodDefinition[key.name="ngOnChanges"]',
          message:
            'ngOnChanges is superseded by input() signals — derive with computed() or linkedSignal().',
        },
      ],

      // No magic values. A number that means something gets a name in
      // core/config/app.constants.ts (or a local `const`).
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreEnums: true,
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreTypeIndexes: true,
          ignoreReadonlyClassProperties: true,
          enforceConst: true,
        },
      ],

      // Module boundaries. Features are independent; shared code moves up, never sideways.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/*/**'],
              message:
                'Features must not import from each other. Move the shared piece into src/app/shared (UI) or src/app/core (state/services).',
            },
          ],
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  // core must not depend on anything above it
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/layout/**'],
              message: 'core is the bottom layer — it cannot import features or layout.',
            },
          ],
        },
      ],
    },
  },

  // shared must stay presentational and feature-agnostic
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/layout/**'],
              message: 'shared is reusable by every feature, so it cannot depend on one.',
            },
          ],
        },
      ],
    },
  },

  // A *.constants.ts file is where a number gets its name, so the rule is moot there.
  {
    files: ['**/*.constants.ts'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off' },
  },

  // Assertions are literal by nature.
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Scripts run in Bun, outside the app tsconfig.
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // ------------------------------------------------------------------ Templates
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Rule: no native CSS in templates. Tailwind utilities, or a class in src/styles.
      '@angular-eslint/template/no-inline-styles': [
        'error',
        { allowNgStyle: false, allowBindToStyle: false },
      ],
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/button-has-type': 'error',
    },
  },

  prettier,
);
