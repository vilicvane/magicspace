const Path = require('path');
const FS = require('fs');

const resolve = require('resolve');

module.exports = {
  defaultSeverity: 'error',
  // https://github.com/palantir/tslint/blob/5.8.0/src/configs/all.ts
  rules: {
    'adjacent-overload-signatures': true,
    align: {
      options: [
        'parameters',
        // 'arguments',
        'statements',
        'elements',
        'members',
      ],
    },
    'array-type': {
      options: ['array'],
    },
    'arrow-parens': {
      options: ['ban-single-arg-parens'],
    },
    'arrow-return-shorthand': true,
    'await-promise': false,
    ban: false,
    'ban-comma-operator': true,
    'ban-types': {
      options: [
        ['Object', 'Avoid using the `Object` type. Did you mean `object`?'],
        ['Boolean', 'Avoid using the `Boolean` type. Did you mean `boolean`?'],
        ['Number', 'Avoid using the `Number` type. Did you mean `number`?'],
        ['String', 'Avoid using the `String` type. Did you mean `string`?'],
        // ['Symbol', 'Avoid using the `Symbol` type. Did you mean `symbol`?'],
      ],
    },
    'binary-expression-operand-order': false,
    'callable-types': true,
    'class-name': true,
    'comment-format': {
      options: ['check-space'],
    },
    'completed-docs': false,
    curly: true,
    'cyclomatic-complexity': false,
    deprecation: true,
    encoding: true,
    eofline: true,
    'file-header': false,
    forin: false,
    'import-blacklist': false,
    'import-spacing': true,
    indent: {
      options: ['spaces'],
    },
    'interface-name': false,
    'interface-over-type-literal': true,
    'jsdoc-format': true,
    'label-position': true,
    'linebreak-style': {
      options: ['LF'],
    },
    'match-default-export-name': false,
    'max-classes-per-file': false,
    'max-file-line-count': false,
    'max-line-length': {
      options: [120],
    },
    'member-access': {
      options: ['no-public'],
    },
    'member-ordering': {
      options: [
        {
          order: [
            'instance-field',
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
            'static-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',
          ],
        },
      ],
    },
    'newline-before-return': false,
    'new-parens': true,
    'no-angle-bracket-type-assertion': true,
    'no-any': false,
    'no-arg': true,
    'no-bitwise': true,
    'no-boolean-literal-compare': true,
    'no-conditional-assignment': true,
    'no-consecutive-blank-lines': true,
    'no-console': [true, 'log'],
    'no-construct': true,
    'no-debugger': true,
    'no-default-export': false,
    'no-duplicate-imports': true,
    'no-duplicate-super': true,
    'no-duplicate-switch-case': true,
    'no-duplicate-variable': true,
    'no-empty': false,
    'no-empty-interface': false,
    'no-eval': false,
    'no-floating-promises': true,
    'no-for-in-array': true,
    'no-implicit-dependencies': true,
    'no-import-side-effect': false,
    'no-inferrable-types': false,
    'no-inferred-empty-object-type': true,
    'no-internal-module': true,
    'no-invalid-template-strings': true,
    'no-invalid-this': false,
    'no-irregular-whitespace': true,
    'no-magic-numbers': false,
    'no-mergeable-namespace': true,
    'no-misused-new': true,
    'no-namespace': false,
    'no-non-null-assertion': false,
    'no-null-keyword': true,
    'no-object-literal-type-assertion': false,
    'no-parameter-properties': false,
    'no-parameter-reassignment': false,
    'no-redundant-jsdoc': true,
    'no-reference': true,
    'no-reference-import': true,
    'no-require-imports': true,
    'no-return-await': true,
    'no-shadowed-variable': false,
    'no-sparse-arrays': true,
    'no-string-literal': false,
    'no-string-throw': true,
    'no-submodule-imports': false,
    'no-switch-case-fall-through': true,
    'no-this-assignment': false,
    'no-trailing-whitespace': true,
    'no-unbound-method': false,
    'no-unnecessary-callback-wrapper': false,
    'no-unnecessary-class': false,
    'no-unnecessary-initializer': true,
    'no-unnecessary-qualifier': true,
    'no-unnecessary-type-assertion': true,
    'no-unsafe-any': false,
    'no-unsafe-finally': true,
    'no-unused-expression': true,
    'no-unused-variable': false,
    'no-use-before-declare': false,
    'no-var-keyword': true,
    'no-var-requires': true,
    'no-void-expression': {
      options: ['ignore-arrow-function-shorthand'],
    },
    'number-literal-format': true,
    'object-literal-key-quotes': {
      options: ['as-needed'],
    },
    'object-literal-shorthand': true,
    'object-literal-sort-keys': false,
    'one-line': {
      options: [
        'check-catch',
        'check-else',
        'check-finally',
        'check-open-brace',
        'check-whitespace',
      ],
    },
    'one-variable-per-declaration': {
      options: ['ignore-for-loop'],
    },
    'only-arrow-functions': {
      options: ['allow-declarations', 'allow-named-functions'],
    },
    'ordered-imports': {
      options: [
        {
          'import-sources-order': 'case-insensitive',
          'named-imports-order': 'lowercase-last',
          'module-source-path': 'full',
        },
      ],
    },
    'prefer-conditional-expression': false,
    'prefer-const': false,
    'prefer-for-of': true,
    'prefer-function-over-method': false,
    'prefer-method-signature': true,
    'prefer-object-spread': false,
    'prefer-switch': false,
    'prefer-template': true,
    // TODO:
    'promise-function-async': false,
    quotemark: {
      options: ['single', 'avoid-template'],
    },
    radix: false,
    'restrict-plus-operands': false,
    'return-undefined': true,
    semicolon: {
      options: ['always'],
    },
    'space-before-function-paren': {
      options: [
        {
          anonymous: 'always',
          asyncArrow: 'always',
          constructor: 'never',
          method: 'never',
          named: 'never',
        },
      ],
    },
    'space-within-parens': [true, 0],
    'strict-boolean-expressions': false,
    // TODO:
    'strict-type-predicates': false,
    'switch-default': false,
    'switch-final-break': {
      options: ['always'],
    },
    'trailing-comma': {
      options: [
        {
          multiline: 'always',
          singleline: 'never',
        },
      ],
    },
    'triple-equals': {
      options: ['allow-null-check'],
    },
    // TODO:
    'type-literal-delimiter': false,
    typedef: false,
    'typedef-whitespace': {
      options: [
        {
          'call-signature': 'nospace',
          'index-signature': 'nospace',
          parameter: 'nospace',
          'property-declaration': 'nospace',
          'variable-declaration': 'nospace',
        },
        {
          'call-signature': 'onespace',
          'index-signature': 'onespace',
          parameter: 'onespace',
          'property-declaration': 'onespace',
          'variable-declaration': 'onespace',
        },
      ],
    },
    'unified-signatures': true,
    'use-default-type-parameter': true,
    'use-isnan': true,
    'variable-name': {
      options: [
        'ban-keywords',
        'check-format',
        'allow-leading-underscore',
        'allow-pascal-case',
      ],
    },
    whitespace: {
      options: [
        'check-branch',
        'check-decl',
        'check-operator',
        'check-module',
        'check-separator',
        'check-type',
        'check-typecast',
        'check-preblock',
        'check-type-operator',
        'check-rest-spread',
      ],
    },
    'import-groups': {
      options: [
        {
          groups: [
            {name: 'node-core', test: '$node-core'},
            {name: 'node-modules', test: '$node-modules', sideEffect: true},
            {name: 'node-modules', test: '$node-modules'},
            {name: 'project-base', test: '^[@\\w]'},
            {name: 'upper-directory', test: '^\\.\\./'},
          ],
          ordered: true,
        },
      ],
    },
    'scoped-modules': true,
    'explicit-return-type': true,
    'import-path-base-url': false,
    'import-path-no-parent': true,
    'empty-line-around-blocks': true,
    'import-path-shallowest': false,
    'import-path-be-smart': true,
    'disallow-empty-constructor': true,
  },
  rulesDirectory: [getRulesDir()],
};

function getRulesDir() {
  let fakeIndexFilePath = resolve.sync('@magicspace/tslint-rules/bld/rules', {
    basedir: __dirname,
    isFile(fileName) {
      if (Path.basename(fileName) === 'index.js') {
        let dirName = Path.dirname(fileName);

        try {
          return FS.statSync(dirName).isDirectory();
        } catch (error) {
          return false;
        }
      }

      try {
        return FS.statSync(fileName).isFile();
      } catch (error) {
        return false;
      }
    },
  });

  return Path.dirname(fakeIndexFilePath);
}
