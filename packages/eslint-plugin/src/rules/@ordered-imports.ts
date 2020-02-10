/**
 * Modifications copyright 2020 Chengdu Mufan Technology Co., Ltd.
 *
 * Copyright 2018 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {TSESLint, TSESTree} from '@typescript-eslint/experimental-utils';
import {
  isExternalModuleReference,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isModuleDeclaration,
  isNamedImports,
  isStringLiteral,
} from 'tsutils';
import * as ts from 'typescript';

import {createRule, getParserServices} from './@utils';

const messages = {
  importSourcesNotGroupedPrefix:
    'Imports from this module are not allowed in this group.  The expected groups (in order) are: {{groupsMsg}}',
  importSourcesUnordered: 'Import sources within a group must be alphabetized.',
  namedImportsUnordered: 'Named imports must be alphabetized.',
};

interface JsonGroupOption {
  name?: string;
  match: string;
  order: number;
}

interface JSONOptions {
  'grouped-imports'?: boolean;
  'import-sources-order'?:
    | 'case-insensitive'
    | 'lowercase-first'
    | 'lowercase-last'
    | 'any';
  'named-imports-order'?:
    | 'case-insensitive'
    | 'lowercase-first'
    | 'lowercase-last'
    | 'any';
  'module-source-path'?: 'full' | 'basename';
  groups?: Array<JsonGroupOption | string>;
}

type Options = [JSONOptions];

type MessageId = keyof typeof messages;

export const orderedImportsRule = createRule<Options, MessageId>({
  name: 'ordered-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Requires that import statements be alphabetized and grouped.',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          'grouped-imports': {
            type: 'boolean',
            default: false,
          },
          groups: {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    match: {
                      type: 'string',
                    },
                    order: {
                      type: 'number',
                    },
                  },
                  required: ['match', 'order'],
                },
              ],
            },
          },
          'import-sources-order': {
            type: 'string',
            enum: [
              'case-insensitive',
              'lowercase-first',
              'lowercase-last',
              'any',
            ],
          },
          'named-imports-order': {
            type: 'string',
            enum: [
              'case-insensitive',
              'lowercase-first',
              'lowercase-last',
              'any',
            ],
          },
          'module-source-path': {
            type: 'string',
            enum: ['full', 'basename'],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      'grouped-imports': false,
      'import-sources-order': 'case-insensitive',
      'named-imports-order': 'case-insensitive',
      'module-source-path': 'full',
    },
  ],

  create(context, [options]) {
    type FixFunction = (fixer: TSESLint.RuleFixer) => TSESLint.RuleFix;

    let reportDescriptors: {
      node?: TSESTree.Node;
      loc?: TSESTree.SourceLocation | TSESTree.LineAndColumnData;
      messageId: MessageId;
      lastFix: FixFunction[];
    }[] = [];

    // Transformations to apply to produce the desired ordering of imports.
    // The imports must be lexicographically sorted after applying the transform.
    type Transform = (x: string) => string;
    const TRANSFORMS = new Map<string, Transform>([
      ['any', () => ''],
      ['case-insensitive', x => x.toUpperCase()],
      ['case-insensitive-legacy', x => x.toLowerCase()],
      ['lowercase-first', flipCase],
      ['lowercase-last', x => x],
      ['full', x => x],
      [
        'basename',
        x => {
          if (!ts.isExternalModuleNameRelative(x)) {
            return x;
          }

          const splitIndex = x.lastIndexOf('/');
          if (splitIndex === -1) {
            return x;
          }
          return x.substr(splitIndex + 1);
        },
      ],
    ]);

    interface ConvertedOptions {
      /** Transform to use when sorting import source names. */
      importSourcesOrderTransform: Transform;

      /** Transform to use to determine the part of the module path to use for ordering. */
      moduleSourceTransform: Transform;

      /** Transform to use when sorting import names. */
      namedImportsOrderTransform: Transform;

      /** If true the rule will check import grouping. */
      groupedImports: boolean;

      /** Groups used for group import ordering. */
      groups: GroupOption[];
    }

    interface GroupOption {
      /** Name of the group for display in lint messages. */
      name: string;

      /** If import names match this regex, they belong to this group. */
      match: RegExp;

      /** numerical ordering to use. Ordered sequentially. */
      order: number;
    }

    interface JsonOptions {
      'grouped-imports'?: boolean;
      'import-sources-order'?: string;
      'named-imports-order'?: string;
      'module-source-path'?: string;
      groups?: Array<JsonGroupOption | string>;
    }

    interface JsonGroupOption {
      name?: string;
      match: string;
      order: number;
    }

    function parseOptions(ruleArgument: JsonOptions): ConvertedOptions {
      const optionSet = ruleArgument;

      // Use default groups to order by third-party, parent, local
      const defaultGroups: JsonGroupOption[] = [
        {name: 'parent directories', match: '^\\.\\.', order: 20},
        {name: 'current directory', match: '^\\.', order: 30},
        {name: 'libraries', match: '.*', order: 10},
      ];

      const {
        'grouped-imports': isGrouped = false,
        'import-sources-order': sources = 'case-insensitive',
        'named-imports-order': named = 'case-insensitive',
        'module-source-path': path = 'full',
        groups = defaultGroups,
      } = optionSet === undefined ? {} : optionSet;

      // build up list of compiled groups
      // - handle case where "group" is just a string pattern
      //   vs a full group object
      const compiledGroups = groups.map((g, idx) => {
        if (typeof g === 'string') {
          return {name: `/${g}/`, match: new RegExp(g), order: idx};
        } else {
          return {
            match: new RegExp(g.match),
            name: g.name !== undefined ? g.name : `/${g.match}/`,
            order: g.order,
          };
        }
      });

      return {
        groupedImports: isGrouped,
        groups: compiledGroups,
        importSourcesOrderTransform: TRANSFORMS.get(sources)!,
        moduleSourceTransform: TRANSFORMS.get(path)!,
        namedImportsOrderTransform: TRANSFORMS.get(named)!,
      };
    }

    class Walker {
      private readonly importsBlocks = [new ImportsBlock()];
      // keep a reference to the last Fix object so when the entire
      // block is replaced, the replacement can be added
      private lastFix: FixFunction[] | undefined;

      // group to use when no other group matches
      private readonly defaultGroup: GroupOption = {
        match: /.*/,
        name: 'unmatched',
        order: Number.MAX_SAFE_INTEGER,
      };

      constructor(
        readonly sourceFile: ts.SourceFile,
        readonly options: ConvertedOptions,
      ) {}

      private get currentImportsBlock(): ImportsBlock {
        return this.importsBlocks[this.importsBlocks.length - 1];
      }

      public walk(sourceFile: ts.SourceFile): void {
        // Walk through all statements checking import statements
        // and building up ImportsBlocks along the way (with replacements)
        for (const statement of sourceFile.statements) {
          this.checkStatement(statement);
        }
        this.endBlock();

        // Optionally check the ImportsBlocks for grouping
        if (this.options.groupedImports) {
          this.checkBlocksGrouping();
        }
      }

      private checkStatement(statement: ts.Statement): void {
        if (
          !(
            isImportDeclaration(statement) ||
            isImportEqualsDeclaration(statement)
          ) ||
          /\r?\n\r?\n/.test(
            this.sourceFile.text.slice(
              statement.getFullStart(),
              statement.getStart(this.sourceFile),
            ),
          )
        ) {
          this.endBlock();
        }

        if (isImportDeclaration(statement)) {
          this.checkImportDeclaration(statement);
        } else if (isImportEqualsDeclaration(statement)) {
          this.checkImportEqualsDeclaration(statement);
        } else if (isModuleDeclaration(statement)) {
          const body = moduleDeclarationBody(statement);
          if (body !== undefined) {
            for (const subStatement of body.statements) {
              this.checkStatement(subStatement);
            }
            this.endBlock();
          }
        }
      }

      private checkImportDeclaration(node: ts.ImportDeclaration) {
        // ex:  import {name1, name2 } from 'import/path';
        if (!isStringLiteral(node.moduleSpecifier)) {
          // Ignore grammar error
          return;
        }

        const importPath = removeQuotes(node.moduleSpecifier.text);
        this.checkImport(importPath, node);

        // check the names in the import are ordered correctly
        const {importClause} = node;
        if (
          importClause !== undefined &&
          importClause.namedBindings !== undefined &&
          isNamedImports(importClause.namedBindings)
        ) {
          this.checkNamedImports(importClause.namedBindings);
        }
      }

      private checkImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        // only allowed `import x = require('y');`

        const {moduleReference} = node;

        if (!isExternalModuleReference(moduleReference)) {
          return;
        }

        const {expression} = moduleReference;

        if (expression === undefined || !isStringLiteral(expression)) {
          return;
        }

        const importPath = removeQuotes(expression.text);
        this.checkImport(importPath, node);
      }

      /**
       * Check the given import to see if we have valid import ordering.
       */
      private checkImport(
        fullImportPath: string,
        node: ImportDeclaration['node'],
      ) {
        // from this point forward we use the transformed import paths
        // - group lookup is based upon the full import path with no transform
        const matchingGroup = this.getMatchingGroup(fullImportPath);

        // determine the module name to use for sorting after the required transforms
        const importPath = this.options.importSourcesOrderTransform(
          this.options.moduleSourceTransform(fullImportPath),
        );

        const prevImportPath = this.currentImportsBlock.getLastImportSource();

        this.currentImportsBlock.addImportDeclaration(
          this.sourceFile,
          node,
          importPath,
          matchingGroup,
        );

        if (
          prevImportPath !== null &&
          compare(importPath, prevImportPath) === -1
        ) {
          this.lastFix = [];

          reportDescriptors.push({
            node: parserServices.tsNodeToESTreeNodeMap.get(node),
            messageId: 'importSourcesUnordered',
            lastFix: this.lastFix,
          });
        }
      }

      private endBlock(): void {
        if (this.lastFix !== undefined) {
          const replacement = this.currentImportsBlock.getReplacement();
          if (replacement !== undefined) {
            this.lastFix.push(replacement);
          }
          this.lastFix = undefined;
        }
        this.importsBlocks.push(new ImportsBlock());
      }

      /**
       * Check that names within the given import are ordered correctly as required.
       * If not, adds a failure and updates import blocks with correct order
       * for replacement.
       */
      private checkNamedImports(node: ts.NamedImports): void {
        const imports = node.elements;

        const pair = findUnsortedPair(
          imports,
          this.options.namedImportsOrderTransform,
        );
        if (pair !== undefined) {
          const [a, b] = pair;
          const sortedDeclarations = sortByKey(imports, x =>
            this.options.namedImportsOrderTransform(x.getText()),
          ).map(x => x.getText());
          // replace in reverse order to preserve earlier offsets
          for (let i = imports.length - 1; i >= 0; i--) {
            const start = imports[i].getStart();
            const length = imports[i].getText().length;

            // replace the named imports one at a time to preserve whitespace
            this.currentImportsBlock.replaceNamedImports(
              start,
              length,
              sortedDeclarations[i],
            );
          }

          this.lastFix = [];

          const sourceCode = context.getSourceCode();

          reportDescriptors.push({
            loc: {
              start: sourceCode.getLocFromIndex(a.getStart()),
              end: sourceCode.getLocFromIndex(b.getEnd()),
            },
            messageId: 'namedImportsUnordered',
            lastFix: this.lastFix,
          });
        }
      }

      /**
       * Check all import blocks stopping at the first failure.
       */
      private checkBlocksGrouping(): void {
        let prevBlockOrder = Number.MIN_SAFE_INTEGER;

        const addFailingImportDecl = (decl: ImportDeclaration) => {
          const groupsMsg = [...this.options.groups]
            .sort((a, b) => a.order - b.order)
            .map(g => g.name)
            .join(', ');

          context.report({
            node: parserServices.tsNodeToESTreeNodeMap.get(decl.node),
            messageId: 'importSourcesNotGroupedPrefix',
            data: {
              groupsMsg,
            },
            fix: (fixer: TSESLint.RuleFixer) =>
              this.getGroupOrderReplacements().map(fixFunction =>
                fixFunction(fixer),
              ),
          });
        };

        const blocksWithContent = this.importsBlocks.filter(
          b => b.getImportDeclarations().length > 0,
        );

        // Check if each block is out of order
        for (const block of blocksWithContent) {
          const importDeclarations = block.getImportDeclarations();
          const blockOrder = importDeclarations[0].group.order;

          // check if group is out of order
          if (blockOrder <= prevBlockOrder) {
            addFailingImportDecl(importDeclarations[0]);
            return;
          }

          // check if all declarations have the same order value
          // and mark the first one that is out of order
          for (const decl of importDeclarations) {
            if (decl.group.order !== blockOrder) {
              addFailingImportDecl(decl);
              return;
            }
          }

          prevBlockOrder = blockOrder;
        }
      }

      /**
       * Return the first import group pattern matching the given import path.
       */
      private getMatchingGroup(importPath: string): GroupOption {
        // find the first matching group.
        for (const group of this.options.groups) {
          if (group.match.test(importPath)) {
            return group;
          }
        }
        return this.defaultGroup;
      }

      /**
       * Build up replaces to remove all imports and replace with grouped and sorted imports.
       */
      private getGroupOrderReplacements(): FixFunction[] {
        // Get all import declarations for all ImportBlocks groups that are not empty
        const groupedDeclarations = this.importsBlocks
          .map(block => block.getImportDeclarations())
          .filter(imports => imports.length > 0);

        const replacements = this.getGroupRemovalReplacements(
          groupedDeclarations,
        );

        const allImportDeclarations = ([] as ImportDeclaration[]).concat(
          ...groupedDeclarations,
        );
        const startOffset =
          allImportDeclarations.length === 0
            ? 0
            : allImportDeclarations[0].nodeStartOffset;
        replacements.push((fixer: TSESLint.RuleFixer) =>
          fixer.replaceTextRange(
            [startOffset, startOffset],
            this.getGroupedImports(allImportDeclarations),
          ),
        );
        return replacements;
      }

      /**
       * Get set of replacements that delete all existing imports.
       */
      private getGroupRemovalReplacements(
        groupedDeclarations: ImportDeclaration[][],
      ): FixFunction[] {
        return groupedDeclarations.map((items, index) => {
          let start = items[0].nodeStartOffset;
          if (index > 0) {
            const prevItems = groupedDeclarations[index - 1];
            const last = prevItems[prevItems.length - 1];

            const textFragment = this.sourceFile.text.slice(
              last.nodeEndOffset,
              start,
            );
            if (!/\S/.test(textFragment)) {
              // remove whitespace between blocks
              start = last.nodeEndOffset;
            }
          }
          return fixer =>
            fixer.replaceTextRange(
              [start, items[items.length - 1].nodeEndOffset],
              '',
            );
        });
      }

      /**
       * Get text of new set of grouped and sorted imports as text.
       */
      private getGroupedImports(
        importDeclarations: ImportDeclaration[],
      ): string {
        // list of all unique order values in sorted order
        const orderValues = importDeclarations
          .map(decl => decl.group.order)
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort((a, b) => a - b);

        return orderValues
          .map(curOrder => {
            const imports = importDeclarations.filter(
              i => i.group.order === curOrder,
            );
            return getSortedImportDeclarationsAsText(imports);
          })
          .filter(text => text.length > 0)
          .join(this.getEolChar());
      }

      /**
       * Return the type of newline that should be used in the codebase.
       */
      private getEolChar(): string {
        const lineEnd = this.sourceFile.getLineEndOfPosition(0);
        let newLine;
        if (lineEnd > 0) {
          if (lineEnd > 1 && this.sourceFile.text[lineEnd - 1] === '\r') {
            newLine = '\r\n';
          } else if (this.sourceFile.text[lineEnd] === '\n') {
            newLine = '\n';
          }
        }
        return newLine === undefined ? ts.sys.newLine : newLine;
      }
    }

    interface ImportDeclaration {
      /** node with details of the import */
      node: ts.ImportDeclaration | ts.ImportEqualsDeclaration;
      /** end position of node within source file */
      nodeEndOffset: number;
      /** start position of node within source file */
      nodeStartOffset: number;
      /** initialized with original import text; modified if the named imports are reordered */
      text: string;
      /** the importPath path in transformed format for sorting */
      importPath: string;
      /** details for the group that we match */
      group: GroupOption;
    }

    /**
     * Wrapper around a set of imports grouped together in a sequence (block)
     * in the source code.
     */
    class ImportsBlock {
      private importDeclarations: ImportDeclaration[] = [];

      /**
       * Add a new import declaration to the block
       */
      public addImportDeclaration(
        sourceFile: ts.SourceFile,
        node: ImportDeclaration['node'],
        importPath: string,
        group: GroupOption,
      ) {
        const start = this.getStartOffset(node);
        const end = this.getEndOffset(sourceFile, node);
        const text = sourceFile.text.substring(start, end);

        if (start > node.getStart() || end === 0) {
          // skip block if any statements don't end with a newline to simplify implementation
          this.importDeclarations = [];
          return;
        }

        this.importDeclarations.push({
          group,
          importPath,
          node,
          nodeEndOffset: end,
          nodeStartOffset: start,
          text,
        });
      }

      public getImportDeclarations(): ImportDeclaration[] {
        return this.importDeclarations;
      }

      /**
       * Replaces the named imports on the most recent import declaration.
       * Updates the imports in place so the getReplacement method below can
       * return full fixes for the entire import block.
       */
      public replaceNamedImports(
        fileOffset: number,
        length: number,
        replacement: string,
      ) {
        const importDeclaration = this.getLastImportDeclaration();
        if (importDeclaration === undefined) {
          // nothing to replace. This can happen if the block is skipped
          return;
        }

        const start = fileOffset - importDeclaration.nodeStartOffset;
        if (start < 0 || start + length > importDeclaration.node.getEnd()) {
          throw new Error('Unexpected named import position');
        }

        const initialText = importDeclaration.text;
        importDeclaration.text =
          initialText.substring(0, start) +
          replacement +
          initialText.substring(start + length);
      }

      /**
       * Return the source path of the most recently added import.
       */
      public getLastImportSource() {
        if (this.importDeclarations.length === 0) {
          return null;
        }
        return this.getLastImportDeclaration()!.importPath;
      }

      /**
       * Return a Lint.Replacement object with ordering fixes for the entire block.
       */
      public getReplacement(): FixFunction | undefined {
        if (this.importDeclarations.length === 0) {
          return undefined;
        }
        const fixedText = getSortedImportDeclarationsAsText(
          this.importDeclarations,
        );
        const start = this.importDeclarations[0].nodeStartOffset;
        const end = this.getLastImportDeclaration()!.nodeEndOffset;
        return fixer => fixer.replaceTextRange([start, end], fixedText);
      }

      // gets the offset immediately after the end of the previous declaration to include comment above
      private getStartOffset(node: ImportDeclaration['node']) {
        if (this.importDeclarations.length === 0) {
          return node.getStart();
        }
        return this.getLastImportDeclaration()!.nodeEndOffset;
      }

      // gets the offset of the end of the import's line, including newline, to include comment to the right
      private getEndOffset(
        sourceFile: ts.SourceFile,
        node: ImportDeclaration['node'],
      ) {
        return sourceFile.text.indexOf('\n', node.end) + 1;
      }

      private getLastImportDeclaration(): ImportDeclaration | undefined {
        return this.importDeclarations[this.importDeclarations.length - 1];
      }
    }

    // Convert aBcD --> AbCd
    function flipCase(str: string): string {
      return Array.from(str)
        .map(char => {
          if (char >= 'a' && char <= 'z') {
            return char.toUpperCase();
          } else if (char >= 'A' && char <= 'Z') {
            return char.toLowerCase();
          }
          return char;
        })
        .join('');
    }

    // After applying a transformation, are the nodes sorted according to the text they contain?
    // If not, return the pair of nodes which are out of order.
    function findUnsortedPair(
      xs: ReadonlyArray<ts.Node>,
      transform: (x: string) => string,
    ): [ts.Node, ts.Node] | undefined {
      for (let i = 1; i < xs.length; i++) {
        if (transform(xs[i].getText()) < transform(xs[i - 1].getText())) {
          return [xs[i - 1], xs[i]];
        }
      }
      return undefined;
    }

    function compare(a: string, b: string): 0 | 1 | -1 {
      function isLow(value: string) {
        return value[0] === '.' || value[0] === '/';
      }
      if (isLow(a) && !isLow(b)) {
        return 1;
      } else if (!isLow(a) && isLow(b)) {
        return -1;
      } else if (a > b) {
        return 1;
      } else if (a < b) {
        return -1;
      }
      return 0;
    }

    function removeQuotes(value: string): string {
      // strip out quotes
      if (value.length > 1 && (value[0] === "'" || value[0] === '"')) {
        value = value.substr(1, value.length - 2);
      }
      return value;
    }

    function getSortedImportDeclarationsAsText(
      importDeclarations: ImportDeclaration[],
    ): string {
      const sortedDeclarations = sortByKey(
        importDeclarations.slice(),
        x => x.importPath,
      );
      return sortedDeclarations.map(x => x.text).join('');
    }

    function sortByKey<T>(
      xs: ReadonlyArray<T>,
      getSortKey: (x: T) => string,
    ): T[] {
      return xs.slice().sort((a, b) => compare(getSortKey(a), getSortKey(b)));
    }

    function moduleDeclarationBody(
      node: ts.ModuleDeclaration,
    ): ts.ModuleBlock | undefined {
      let body = node.body;
      while (
        body !== undefined &&
        body.kind === ts.SyntaxKind.ModuleDeclaration
      ) {
        body = body.body;
      }
      return body !== undefined && body.kind === ts.SyntaxKind.ModuleBlock
        ? body
        : undefined;
    }

    const parserServices = getParserServices(context);

    let sourceFile = parserServices.esTreeNodeToTSNodeMap.get(
      context.getSourceCode().ast,
    );

    new Walker(sourceFile as ts.SourceFile, parseOptions(options)).walk(
      sourceFile as ts.SourceFile,
    );

    for (let reportDescriptor of reportDescriptors) {
      if (reportDescriptor.node) {
        context.report({
          node: reportDescriptor.node,
          messageId: reportDescriptor.messageId,
          fix: fixer =>
            reportDescriptor.lastFix.map(fixFunction => fixFunction(fixer)),
        });
      } else if (reportDescriptor.loc) {
        context.report({
          loc: reportDescriptor.loc,
          messageId: reportDescriptor.messageId,
          fix: fixer =>
            reportDescriptor.lastFix.map(fixFunction => fixFunction(fixer)),
        });
      }
    }

    return {};
  },
});
