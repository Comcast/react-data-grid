import { fixupPluginRules } from '@eslint/compat';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  {
    ignores: ['coverage', 'dist', 'lib']
  },
  {
    name: 'common',
    files: ['**/*.{js,ts,tsx}'],

    plugins: {
      react,
      'react-hooks': fixupPluginRules(reactHooks),
      jest,
      'jest-dom': jestDom,
      sonarjs,
      '@typescript-eslint': typescriptEslint,
      'testing-library': fixupPluginRules(testingLibrary)
    },

    languageOptions: {
      parser: tsParser,

      parserOptions: {
        ecmaVersion: 'latest',
        jsxPragma: null,
        project: './tsconfig.json',
        warnOnUnsupportedTypeScriptVersion: false
      }
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    rules: {
      // Possible Problems
      // https://eslint.org/docs/latest/rules/#possible-problems
      'array-callback-return': [1, { checkForEach: true }],
      'constructor-super': 0, // covered by TS
      'for-direction': 1,
      'getter-return': 1,
      'no-async-promise-executor': 1,
      'no-await-in-loop': 0,
      'no-class-assign': 0,
      'no-compare-neg-zero': 1,
      'no-cond-assign': 1,
      'no-const-assign': 0,
      'no-constant-binary-expression': 1,
      'no-constant-condition': 1,
      'no-constructor-return': 1,
      'no-control-regex': 1,
      'no-debugger': 1,
      'no-dupe-args': 1,
      'no-dupe-class-members': 0, // replaced by @typescript-eslint/no-dupe-class-members
      'no-dupe-else-if': 1,
      'no-dupe-keys': 1,
      'no-duplicate-case': 1,
      'no-duplicate-imports': 0,
      'no-empty-character-class': 1,
      'no-empty-pattern': 1,
      'no-ex-assign': 1,
      'no-fallthrough': [1, { reportUnusedFallthroughComment: true }],
      'no-func-assign': 1,
      'no-import-assign': 1,
      'no-inner-declarations': 0,
      'no-invalid-regexp': 1,
      'no-irregular-whitespace': 1,
      'no-loss-of-precision': 0, // replaced by @typescript-eslint/no-loss-of-precision
      'no-misleading-character-class': 1,
      'no-new-native-nonconstructor': 1,
      'no-obj-calls': 1,
      'no-promise-executor-return': 1,
      'no-prototype-builtins': 1,
      'no-self-assign': [1, { props: true }],
      'no-self-compare': 1,
      'no-setter-return': 1,
      'no-sparse-arrays': 1,
      'no-template-curly-in-string': 1,
      'no-this-before-super': 0,
      'no-undef': 0,
      'no-unexpected-multiline': 0,
      'no-unmodified-loop-condition': 1,
      'no-unreachable': 1,
      'no-unreachable-loop': 1,
      'no-unsafe-finally': 1,
      'no-unsafe-negation': [1, { enforceForOrderingRelations: true }],
      'no-unsafe-optional-chaining': [1, { disallowArithmeticOperators: true }],
      'no-unused-private-class-members': 0,
      'no-unused-vars': 0, // replaced by @typescript-eslint/no-unused-vars
      'no-use-before-define': 0, // replaced by @typescript-eslint/no-use-before-define
      'no-useless-backreference': 1,
      'require-atomic-updates': 1,
      'use-isnan': [1, { enforceForIndexOf: true }],
      'valid-typeof': [1, { requireStringLiterals: true }],

      // Suggestions
      // https://eslint.org/docs/latest/rules/#suggestions
      'accessor-pairs': 1,
      'arrow-body-style': 0,
      'block-scoped-var': 1,
      camelcase: 0,
      'capitalized-comments': 0,
      'class-methods-use-this': 0,
      complexity: 0,
      'consistent-return': 0,
      'consistent-this': 0,
      curly: 0,
      'default-case': 1,
      'default-case-last': 1,
      'default-param-last': 0, // replaced by @typescript-eslint/default-param-last
      'dot-notation': 0, // replaced by @typescript-eslint/dot-notation
      eqeqeq: [1, 'always', { null: 'ignore' }],
      'func-name-matching': 0,
      'func-names': 0,
      'func-style': 0,
      'grouped-accessor-pairs': [1, 'getBeforeSet'],
      'guard-for-in': 0,
      'id-denylist': 0,
      'id-length': 0,
      'id-match': 0,
      'init-declarations': 0, // replaced by @typescript-eslint/init-declarations
      'logical-assignment-operators': [1, 'always', { enforceForIfStatements: true }],
      'max-classes-per-file': 0,
      'max-depth': 0,
      'max-lines': 0,
      'max-lines-per-function': 0,
      'max-nested-callbacks': 0,
      'max-params': 0,
      'max-statements': 0,
      'multiline-comment-style': 0,
      'new-cap': 0,
      'no-alert': 0,
      'no-array-constructor': 0, // replaced by @typescript-eslint/no-array-constructor
      'no-bitwise': 0,
      'no-caller': 1,
      'no-case-declarations': 1,
      'no-console': 1,
      'no-continue': 0,
      'no-delete-var': 1,
      'no-div-regex': 0,
      'no-else-return': [1, { allowElseIf: false }],
      'no-empty': [1, { allowEmptyCatch: true }],
      'no-empty-function': 0, // replaced by @typescript-eslint/no-empty-function
      'no-empty-static-block': 1,
      'no-eq-null': 0,
      'no-eval': 1,
      'no-extend-native': 1,
      'no-extra-bind': 1,
      'no-extra-boolean-cast': [1, { enforceForLogicalOperands: true }],
      'no-extra-label': 1,
      'no-global-assign': 1,
      'no-implicit-coercion': 0,
      'no-implicit-globals': 0,
      'no-implied-eval': 0, // replaced by @typescript-eslint/no-implied-eval
      'no-inline-comments': 0,
      'no-invalid-this': 0, // replaced by @typescript-eslint/no-invalid-this
      'no-iterator': 1,
      'no-label-var': 1,
      'no-labels': 1,
      'no-lone-blocks': 1,
      'no-lonely-if': 1,
      'no-loop-func': 0, // replaced by @typescript-eslint/no-loop-func
      'no-magic-numbers': 0, // replaced by @typescript-eslint/no-magic-numbers
      'no-multi-assign': 0,
      'no-multi-str': 1,
      'no-negated-condition': 0,
      'no-nested-ternary': 0,
      'no-new': 1,
      'no-new-func': 1,
      'no-new-wrappers': 1,
      'no-nonoctal-decimal-escape': 1,
      'no-object-constructor': 1,
      'no-octal': 1,
      'no-octal-escape': 1,
      'no-param-reassign': 0,
      'no-plusplus': 0,
      'no-proto': 1,
      'no-redeclare': 0, // replaced by @typescript-eslint/no-redeclare
      'no-regex-spaces': 1,
      'no-restricted-exports': 0,
      'no-restricted-globals': [
        1,
        {
          name: 'Omit',
          message: 'Use Omit from types instead.'
        }
      ],
      'no-restricted-imports': 0, // replaced by @typescript-eslint/no-restricted-imports
      'no-restricted-properties': 0,
      'no-restricted-syntax': 0,
      'no-return-assign': 0,
      'no-return-await': 0, // replaced by @typescript-eslint/return-await
      'no-script-url': 1,
      'no-sequences': [1, { allowInParentheses: false }],
      'no-shadow': 0, // replaced by @typescript-eslint/no-shadow
      'no-shadow-restricted-names': 1,
      'no-ternary': 0,
      'no-undef-init': 1,
      'no-undefined': 0,
      'no-underscore-dangle': 0,
      'no-unneeded-ternary': [1, { defaultAssignment: false }],
      'no-unused-expressions': 0, // replaced by @typescript-eslint/no-unused-expressions
      'no-unused-labels': 1,
      'no-useless-call': 1,
      'no-useless-catch': 1,
      'no-useless-computed-key': 1,
      'no-useless-concat': 1,
      'no-useless-constructor': 0, // replaced by @typescript-eslint/no-useless-constructor
      'no-useless-escape': 1,
      'no-useless-rename': 1,
      'no-useless-return': 1,
      'no-var': 1,
      'no-void': 1,
      'no-warning-comments': 0,
      'no-with': 1,
      'object-shorthand': [1, 'always', { avoidExplicitReturnArrows: true }],
      'one-var': [1, 'never'],
      'operator-assignment': 1,
      'prefer-arrow-callback': [1, { allowNamedFunctions: true }],
      'prefer-const': [1, { destructuring: 'all' }],
      'prefer-destructuring': [1, { array: false }],
      'prefer-exponentiation-operator': 1,
      'prefer-named-capture-group': 0,
      'prefer-numeric-literals': 1,
      'prefer-object-has-own': 1,
      'prefer-object-spread': 1,
      'prefer-promise-reject-errors': 0, // replaced by @typescript-eslint/prefer-promise-reject-errors
      'prefer-regex-literals': [1, { disallowRedundantWrapping: true }],
      'prefer-rest-params': 1,
      'prefer-spread': 1,
      'prefer-template': 1,
      radix: 1,
      'require-await': 0, // replaced by @typescript-eslint/require-await
      'require-unicode-regexp': 0,
      'require-yield': 1,
      'sort-imports': 0,
      'sort-keys': 0,
      'sort-vars': 0,
      strict: 1,
      'symbol-description': 1,
      'vars-on-top': 0,
      yoda: 0,

      // Layout & Formatting
      // https://eslint.org/docs/latest/rules/#layout--formatting
      'unicode-bom': 1,

      // React rules
      // https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
      'react/boolean-prop-naming': 0,
      'react/button-has-type': 0,
      'react/checked-requires-onchange-or-readonly': 1,
      'react/default-props-match-prop-types': 0,
      'react/destructuring-assignment': 0,
      'react/display-name': 0,
      'react/forbid-component-props': 0,
      'react/forbid-dom-props': 0,
      'react/forbid-elements': 0,
      'react/forbid-foreign-prop-types': 0,
      'react/forbid-prop-types': 0,
      'react/function-component-definition': [
        1,
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'function-expression'
        }
      ],
      'react/hook-use-state': 0,
      'react/iframe-missing-sandbox': 1,
      'react/jsx-boolean-value': 1,
      'react/jsx-child-element-spacing': 0,
      'react/jsx-closing-bracket-location': 0,
      'react/jsx-closing-tag-location': 0,
      'react/jsx-curly-brace-presence': 1,
      'react/jsx-curly-newline': 0,
      'react/jsx-curly-spacing': 0,
      'react/jsx-equals-spacing': 0,
      'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
      'react/jsx-first-prop-new-line': 0,
      'react/jsx-fragments': 1,
      'react/jsx-handler-names': 0,
      'react/jsx-indent': 0,
      'react/jsx-indent-props': 0,
      'react/jsx-key': [
        1,
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true
        }
      ],
      'react/jsx-max-depth': 0,
      'react/jsx-max-props-per-line': 0,
      'react/jsx-newline': 0,
      'react/jsx-no-bind': 0,
      'react/jsx-no-comment-textnodes': 1,
      'react/jsx-no-constructed-context-values': 1,
      'react/jsx-no-duplicate-props': 0,
      'react/jsx-no-leaked-render': 0,
      'react/jsx-no-literals': 0,
      'react/jsx-no-script-url': 1,
      'react/jsx-no-target-blank': 1,
      'react/jsx-no-undef': 0,
      'react/jsx-no-useless-fragment': 1,
      'react/jsx-one-expression-per-line': 0,
      'react/jsx-pascal-case': 1,
      'react/jsx-props-no-multi-spaces': 0,
      'react/jsx-props-no-spread-multi': 1,
      'react/jsx-props-no-spreading': 0,
      'react/jsx-sort-props': 0,
      'react/jsx-tag-spacing': 0,
      'react/jsx-uses-react': 0,
      'react/jsx-uses-vars': 1,
      'react/jsx-wrap-multilines': 0,
      'react/no-access-state-in-setstate': 1,
      'react/no-adjacent-inline-elements': 0,
      'react/no-array-index-key': 0,
      'react/no-arrow-function-lifecycle': 0,
      'react/no-children-prop': 0,
      'react/no-danger': 1,
      'react/no-danger-with-children': 1,
      'react/no-deprecated': 1,
      'react/no-did-mount-set-state': 1,
      'react/no-did-update-set-state': 1,
      'react/no-direct-mutation-state': 1,
      'react/no-find-dom-node': 0,
      'react/no-invalid-html-attribute': 1,
      'react/no-is-mounted': 1,
      'react/no-multi-comp': 0,
      'react/no-namespace': 0,
      'react/no-object-type-as-default-prop': 1,
      'react/no-redundant-should-component-update': 1,
      'react/no-render-return-value': 0,
      'react/no-set-state': 0,
      'react/no-string-refs': [1, { noTemplateLiterals: true }],
      'react/no-this-in-sfc': 0,
      'react/no-typos': 1,
      'react/no-unescaped-entities': 0,
      'react/no-unknown-property': 0,
      'react/no-unsafe': 1,
      'react/no-unstable-nested-components': [1, { allowAsProps: true }],
      'react/no-unused-class-component-methods': 0,
      'react/no-unused-prop-types': 0,
      'react/no-unused-state': 0,
      'react/no-will-update-set-state': 1,
      'react/prefer-es6-class': 1,
      'react/prefer-exact-props': 0,
      'react/prefer-read-only-props': 0,
      'react/prefer-stateless-function': 0,
      'react/prop-types': 0,
      'react/react-in-jsx-scope': 0,
      'react/require-default-props': 0,
      'react/require-optimization': 0,
      'react/require-render-return': 1,
      'react/self-closing-comp': 1,
      'react/sort-comp': 0,
      'react/sort-default-props': 0,
      'react/sort-prop-types': 0,
      'react/state-in-constructor': 0,
      'react/static-property-placement': 1,
      'react/style-prop-object': 0,
      'react/void-dom-elements-no-children': 1,

      // React Hooks
      // https://www.npmjs.com/package/eslint-plugin-react-hooks
      'react-hooks/rules-of-hooks': 1,
      'react-hooks/exhaustive-deps': 1,

      // https://github.com/jest-community/eslint-plugin-jest#rules
      'jest/consistent-test-it': 1,
      'jest/expect-expect': 0,
      'jest/max-expects': 0,
      'jest/max-nested-describe': 0,
      'jest/no-alias-methods': 1,
      'jest/no-commented-out-tests': 1,
      'jest/no-conditional-expect': 1,
      'jest/no-conditional-in-test': 0,
      'jest/no-confusing-set-timeout': 0,
      'jest/no-deprecated-functions': 0,
      'jest/no-disabled-tests': 0,
      'jest/no-done-callback': 0,
      'jest/no-duplicate-hooks': 1,
      'jest/no-export': 1,
      'jest/no-focused-tests': 1,
      'jest/no-hooks': 1,
      'jest/no-identical-title': 1,
      'jest/no-interpolation-in-snapshots': 0,
      'jest/no-jasmine-globals': 1,
      'jest/no-large-snapshots': 0,
      'jest/no-mocks-import': 1,
      'jest/no-restricted-jest-methods': 0,
      'jest/no-restricted-matchers': [
        1,
        {
          toBeTruthy: 'Use toBe(true) instead.',
          'not.toBeTruthy': null,
          toBeFalsy: 'Use toBe(false) instead.',
          'not.toBeFalsy': null
        }
      ],
      'jest/no-standalone-expect': 1,
      'jest/no-test-prefixes': 0,
      'jest/no-test-return-statement': 0,
      'jest/no-untyped-mock-factory': 0,
      'jest/prefer-called-with': 0,
      'jest/prefer-comparison-matcher': 1,
      'jest/prefer-each': 1,
      'jest/prefer-equality-matcher': 1,
      'jest/prefer-expect-assertions': 0,
      'jest/prefer-expect-resolves': 1,
      'jest/prefer-hooks-in-order': 1,
      'jest/prefer-hooks-on-top': 1,
      'jest/prefer-importing-jest-globals': 0,
      'jest/prefer-jest-mocked': 0,
      'jest/prefer-lowercase-title': 0,
      'jest/prefer-mock-promise-shorthand': 1,
      'jest/prefer-snapshot-hint': 0,
      'jest/prefer-spy-on': 1,
      'jest/prefer-strict-equal': 1,
      'jest/prefer-to-be': 1,
      'jest/prefer-to-contain': 1,
      'jest/prefer-to-have-length': 1,
      'jest/prefer-todo': 1,
      'jest/require-hook': 0,
      'jest/require-to-throw-message': 0,
      'jest/require-top-level-describe': 0,
      'jest/valid-describe-callback': 1,
      'jest/valid-expect': [1, { alwaysAwait: true }],
      'jest/valid-expect-in-promise': 1,
      'jest/valid-title': 1,

      // https://github.com/testing-library/eslint-plugin-jest-dom#supported-rules
      'jest-dom/prefer-checked': 1,
      'jest-dom/prefer-empty': 1,
      'jest-dom/prefer-enabled-disabled': 1,
      'jest-dom/prefer-focus': 1,
      'jest-dom/prefer-in-document': 1,
      'jest-dom/prefer-required': 1,
      'jest-dom/prefer-to-have-attribute': 1,
      'jest-dom/prefer-to-have-class': 1,
      'jest-dom/prefer-to-have-style': 1,
      'jest-dom/prefer-to-have-text-content': 1,
      'jest-dom/prefer-to-have-value': 1,

      // SonarJS rules
      // https://github.com/SonarSource/eslint-plugin-sonarjs#rules
      'sonarjs/no-all-duplicated-branches': 1,
      'sonarjs/no-element-overwrite': 1,
      'sonarjs/no-empty-collection': 1,
      'sonarjs/no-extra-arguments': 0,
      'sonarjs/no-identical-conditions': 1,
      'sonarjs/no-identical-expressions': 1,
      'sonarjs/no-ignored-return': 1,
      'sonarjs/no-one-iteration-loop': 1,
      'sonarjs/no-use-of-empty-return-value': 1,
      'sonarjs/non-existent-operator': 1,
      'sonarjs/cognitive-complexity': 0,
      'sonarjs/elseif-without-else': 0,
      'sonarjs/max-switch-cases': 0,
      'sonarjs/no-collapsible-if': 1,
      'sonarjs/no-collection-size-mischeck': 1,
      'sonarjs/no-duplicate-string': 0,
      'sonarjs/no-duplicated-branches': 1,
      'sonarjs/no-gratuitous-expressions': 1,
      'sonarjs/no-identical-functions': 1,
      'sonarjs/no-inverted-boolean-check': 1,
      'sonarjs/no-nested-switch': 1,
      'sonarjs/no-nested-template-literals': 1,
      'sonarjs/no-redundant-boolean': 1,
      'sonarjs/no-redundant-jump': 1,
      'sonarjs/no-same-line-conditional': 1,
      'sonarjs/no-small-switch': 1,
      'sonarjs/no-unused-collection': 1,
      'sonarjs/no-useless-catch': 1,
      'sonarjs/prefer-immediate-return': 1,
      'sonarjs/prefer-object-literal': 1,
      'sonarjs/prefer-single-boolean-return': 1,
      'sonarjs/prefer-while': 1,

      // @typescript-eslint/eslint-plugin rules
      // https://typescript-eslint.io/rules/#supported-rules
      '@typescript-eslint/adjacent-overload-signatures': 1,
      '@typescript-eslint/array-type': 0,
      '@typescript-eslint/await-thenable': 1,
      '@typescript-eslint/ban-ts-comment': [1, { 'ts-expect-error': false }],
      '@typescript-eslint/ban-tslint-comment': 0,
      '@typescript-eslint/ban-types': 1,
      '@typescript-eslint/class-literal-property-style': 0,
      '@typescript-eslint/consistent-generic-constructors': 1,
      '@typescript-eslint/consistent-indexed-object-style': 1,
      '@typescript-eslint/consistent-type-assertions': [
        1,
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' }
      ],
      '@typescript-eslint/consistent-type-definitions': 1,
      '@typescript-eslint/consistent-type-exports': 0,
      '@typescript-eslint/consistent-type-imports': [1, { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/explicit-member-accessibility': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/member-ordering': 0,
      '@typescript-eslint/method-signature-style': 1,
      '@typescript-eslint/naming-convention': 0,
      '@typescript-eslint/no-array-delete': 1,
      '@typescript-eslint/no-base-to-string': 0,
      '@typescript-eslint/no-confusing-non-null-assertion': 0,
      '@typescript-eslint/no-confusing-void-expression': [1, { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-duplicate-enum-values': 1,
      '@typescript-eslint/no-duplicate-type-constituents': 1,
      '@typescript-eslint/no-dynamic-delete': 0,
      '@typescript-eslint/no-empty-interface': 1,
      '@typescript-eslint/no-empty-object-type': 1,
      '@typescript-eslint/no-explicit-any': [1, { fixToUnknown: true }],
      '@typescript-eslint/no-extra-non-null-assertion': 1,
      '@typescript-eslint/no-extraneous-class': 1,
      '@typescript-eslint/no-floating-promises': 0,
      '@typescript-eslint/no-for-in-array': 1,
      '@typescript-eslint/no-import-type-side-effects': 0,
      '@typescript-eslint/no-inferrable-types': 1,
      '@typescript-eslint/no-invalid-void-type': 1,
      '@typescript-eslint/no-meaningless-void-operator': 0,
      '@typescript-eslint/no-misused-new': 1,
      '@typescript-eslint/no-misused-promises': 0,
      '@typescript-eslint/no-mixed-enums': 1,
      '@typescript-eslint/no-namespace': 1,
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 1,
      '@typescript-eslint/no-non-null-asserted-optional-chain': 1,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-redundant-type-constituents': 1,
      '@typescript-eslint/no-require-imports': 1,
      '@typescript-eslint/no-this-alias': 0,
      '@typescript-eslint/no-type-alias': 0,
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 1,
      '@typescript-eslint/no-unnecessary-condition': 1,
      '@typescript-eslint/no-unnecessary-parameter-property-assignment': 1,
      '@typescript-eslint/no-unnecessary-qualifier': 0,
      '@typescript-eslint/no-unnecessary-template-expression': 1,
      '@typescript-eslint/no-unnecessary-type-arguments': 1,
      '@typescript-eslint/no-unnecessary-type-assertion': 1,
      '@typescript-eslint/no-unnecessary-type-constraint': 1,
      '@typescript-eslint/no-unsafe-argument': 0,
      '@typescript-eslint/no-unsafe-assignment': 0,
      '@typescript-eslint/no-unsafe-call': 0,
      '@typescript-eslint/no-unsafe-declaration-merging': 1,
      '@typescript-eslint/no-unsafe-enum-comparison': 1,
      '@typescript-eslint/no-unsafe-member-access': 0,
      '@typescript-eslint/no-unsafe-return': 1,
      '@typescript-eslint/no-useless-empty-export': 1,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/non-nullable-type-assertion-style': 1,
      '@typescript-eslint/parameter-properties': 1,
      '@typescript-eslint/prefer-as-const': 1,
      '@typescript-eslint/prefer-enum-initializers': 0,
      '@typescript-eslint/prefer-find': 1,
      '@typescript-eslint/prefer-for-of': 1,
      '@typescript-eslint/prefer-function-type': 1,
      '@typescript-eslint/prefer-includes': 1,
      '@typescript-eslint/prefer-literal-enum-member': 1,
      '@typescript-eslint/prefer-namespace-keyword': 0,
      '@typescript-eslint/prefer-nullish-coalescing': [
        1,
        { ignorePrimitives: { boolean: true, string: true } }
      ],
      '@typescript-eslint/prefer-optional-chain': 1,
      '@typescript-eslint/prefer-promise-reject-errors': [1, { allowEmptyReject: true }],
      '@typescript-eslint/prefer-readonly': 1,
      '@typescript-eslint/prefer-readonly-parameter-types': 0,
      '@typescript-eslint/prefer-reduce-type-parameter': 1,
      '@typescript-eslint/prefer-regexp-exec': 1,
      '@typescript-eslint/prefer-return-this-type': 0,
      '@typescript-eslint/prefer-string-starts-ends-with': 1,
      '@typescript-eslint/promise-function-async': 0,
      '@typescript-eslint/require-array-sort-compare': 1,
      '@typescript-eslint/restrict-plus-operands': 0,
      '@typescript-eslint/restrict-template-expressions': 0,
      '@typescript-eslint/sort-type-constituents': 0,
      '@typescript-eslint/strict-boolean-expressions': 0,
      '@typescript-eslint/switch-exhaustiveness-check': 1,
      '@typescript-eslint/triple-slash-reference': [
        1,
        { path: 'never', types: 'never', lib: 'never' }
      ],
      '@typescript-eslint/typedef': 0,
      '@typescript-eslint/unbound-method': 0,
      '@typescript-eslint/unified-signatures': 0,

      // @typescript-eslint/eslint-plugin Extension Rules
      // https://typescript-eslint.io/rules/#extension-rules
      '@typescript-eslint/default-param-last': 0,
      '@typescript-eslint/dot-notation': 1,
      '@typescript-eslint/init-declarations': 0,
      '@typescript-eslint/no-array-constructor': 1,
      '@typescript-eslint/no-dupe-class-members': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-implied-eval': 1,
      '@typescript-eslint/no-invalid-this': 0,
      '@typescript-eslint/no-loop-func': 0,
      '@typescript-eslint/no-loss-of-precision': 1,
      '@typescript-eslint/no-magic-numbers': 0,
      '@typescript-eslint/no-redeclare': 1,
      '@typescript-eslint/no-restricted-imports': [
        1,
        {
          name: 'react',
          importNames: ['default'],
          message: 'Use named imports instead.'
        },
        {
          name: 'react',
          importNames: ['useLayoutEffect'],
          message: 'Use the override from src/hooks instead.'
        },
        {
          name: 'react-dom',
          importNames: ['default'],
          message: 'Use named imports instead.'
        },
        {
          name: '@testing-library/dom',
          message: 'Import @testing-library/react instead.'
        },
        {
          name: 'lodash',
          message: 'Import lodash-es instead.'
        }
      ],
      '@typescript-eslint/no-shadow': 0,
      '@typescript-eslint/no-unused-expressions': [
        1,
        { allowTaggedTemplates: true, enforceForJSX: true }
      ],
      '@typescript-eslint/no-unused-vars': [1, { ignoreRestSiblings: true }],
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/no-useless-constructor': 1,
      '@typescript-eslint/only-throw-error': 1,
      // TODO: deprecated
      '@typescript-eslint/padding-line-between-statements': [
        1,
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'interface']
        },
        {
          blankLine: 'always',
          prev: ['function', 'interface'],
          next: '*'
        }
      ],
      '@typescript-eslint/require-await': 1,
      '@typescript-eslint/return-await': 1,
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 1,

      // eslint-plugin-testing-library Rules
      // https://github.com/testing-library/eslint-plugin-testing-library#supported-rules
      'testing-library/await-async-events': 0,
      'testing-library/await-async-queries': 0,
      'testing-library/await-async-utils': 0,
      'testing-library/consistent-data-testid': 0,
      'testing-library/no-await-sync-events': 0,
      'testing-library/no-await-sync-queries': 0,
      'testing-library/no-container': 1,
      'testing-library/no-debugging-utils': 1,
      'testing-library/no-dom-import': 1,
      'testing-library/no-global-regexp-flag-in-query': 1,
      'testing-library/no-manual-cleanup': 0,
      'testing-library/no-node-access': 0,
      'testing-library/no-promise-in-fire-event': 0,
      'testing-library/no-render-in-lifecycle': 0,
      'testing-library/no-unnecessary-act': 1,
      'testing-library/no-wait-for-multiple-assertions': 1,
      'testing-library/no-wait-for-side-effects': 1,
      'testing-library/no-wait-for-snapshot': 0,
      'testing-library/prefer-explicit-assert': 1,
      'testing-library/prefer-find-by': 1,
      'testing-library/prefer-implicit-assert': 0,
      'testing-library/prefer-presence-queries': 1,
      'testing-library/prefer-query-by-disappearance': 1,
      'testing-library/prefer-query-matchers': 0,
      'testing-library/prefer-screen-queries': 1,
      'testing-library/prefer-user-event': 1,
      'testing-library/render-result-naming-convention': 0
    }
  },

  {
    name: 'test',

    files: ['test/**/*'],

    rules: {
      '@typescript-eslint/no-floating-promises': 1
    }
  },

  {
    name: 'node',

    files: ['**/*.js'],

    rules: {
      // Best Practices
      'default-param-last': 1,
      // Possible Errors
      'no-console': 0,
      'no-undef': 1,
      'no-use-before-define': [1, { functions: false, classes: false, variables: false }]
    }
  }
];
