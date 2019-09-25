import { isNodeBuiltIn, resolveWithCategory } from 'module-lens';
import {
  AST_NODE_TYPES,
  TSESTree,
} from '@typescript-eslint/experimental-utils';
import { Dict } from 'tslang';

import {
  ModuleSpecifierHelper,
  ModuleSpecifierHelperOptions,
  getModuleSpecifier,
  isRelativeModuleSpecifier,
} from './@utils';
import { createRule } from "./@utils/ruleCreator";

type Options = [
  {
    groups: {
      name: string,
      test: string,
      sideEffect?: boolean,
      baseUrl?: boolean
    }[],
    ordered?: boolean
  }?,
];

type MessageIds =
  | 'unexpectedEmptyLine'
  | 'expectingEmptyLine'
  | 'wrongModuleGroupOrder'
  | 'notGrouped'
  | 'unexpectedCodeBetweenImports';

export = createRule<Options, MessageIds>({
  name: "import-groups",
  meta: {
    type: "suggestion",
    docs: {
      description: `Validate that module imports are grouped as expected.`,
      category: "Stylistic Issues",
      recommended: "error",
    },
    messages: {
      unexpectedEmptyLine: `Unexpected empty line within the same import group.`,
      expectingEmptyLine: `Expecting an empty line between different import groups.`,
      wrongModuleGroupOrder: `Import groups must be sorted according to given order.`,
      notGrouped: `Imports must be grouped.`,
      unexpectedCodeBetweenImports: `Unexpected code between import statements.`,
    },
    fixable: 'code',
    schema: [
      {
        type: "object",
        required: [
          "groups",
          "ordered"
        ],
        properties: {
          groups: {
            type: "array",
            items: {
              type: "object",
              required: [
                "name",
                "test"
              ],
              properties: {
                name: {
                  type: "string"
                },
                test: {
                  type: "string"
                },
                sideEffect: {
                  type: "boolean",
                  default: false
                },
                // baseUrl: {  // TODO: 默认值为多少？
                //   type: "boolean",
                //   default: false
                // }
              }
            }
          },
          ordered: {
            type: "boolean",
            default: false
          }
        }
      }
    ]
  },
  defaultOptions: [
    {
      groups: [
        { name: 'node-core', test: '$node-core' },
        { name: 'node-modules', test: '$node-modules' },
      ],
      ordered: false,
    }
  ],

  create(context, [options]) {
    const BUILT_IN_MODULE_GROUP_TESTER_DICT: Dict<ModuleGroupTester> = {
      '$node-core': specifier => isNodeBuiltIn(specifier),
      '$node-modules': (specifier, sourceFileName) => {
        let result = resolveWithCategory(specifier, { sourceFileName });
        return result.category === 'node-modules';
      },
    };
    interface ModuleGroupOptions {
      name: string;
      test: string;
      sideEffect?: boolean | undefined;
      baseUrl?: boolean | undefined;
    }

    interface RawOptions extends ModuleSpecifierHelperOptions {
      groups: ModuleGroupOptions[];
      ordered?: boolean;
    }

    interface ParsedOptions extends ModuleSpecifierHelperOptions {
      groups: ModuleGroup[];
      ordered: boolean;
    }

    type ModuleGroupTester = (specifier: string, sourceFileName: string) => boolean;

    class ModuleGroup {
      readonly name: string;

      private tester: ModuleGroupTester;
      private matchSideEffect: boolean | undefined;
      private matchUsingBaseUrl: boolean | undefined;

      constructor({
        name,
        test: testConfig,
        sideEffect,
        baseUrl,
      }: ModuleGroupOptions) {
        this.name = name;
        this.tester = this.buildTester(testConfig);
        this.matchSideEffect = sideEffect;
        this.matchUsingBaseUrl = baseUrl;
      }

      match(
        specifier: string,
        sideEffect: boolean,
        usingBaseUrl: boolean,
        sourceFileName: string,
      ): boolean {
        return (
          (this.matchSideEffect === undefined ||
            this.matchSideEffect === sideEffect) &&
          (this.matchUsingBaseUrl === undefined ||
            this.matchUsingBaseUrl === usingBaseUrl) &&
          this.tester(specifier, sourceFileName)
        );
      }

      private buildTester(config: string): ModuleGroupTester {
        if (config.startsWith('$')) {
          return (
            BUILT_IN_MODULE_GROUP_TESTER_DICT[config] || ((): boolean => false)
          );
        } else {
          let regex = new RegExp(config);
          return (path): boolean => regex.test(path);
        }
      }
    }

    interface ModuleImportInfo {
      node: TSESTree.Node;
      groupIndex: number;
      /** 节点开始行. */
      startLine: number;
      /** 节点结束行. */
      endLine: number;
    }

    class ImportGroupWalker {
      private moduleImportInfos: ModuleImportInfo[] = [];
      private pendingStatements: TSESTree.Statement[] = [];

      private moduleSpecifierHelper = new ModuleSpecifierHelper(
        context.getFilename(),
        options,
      );

      private appendModuleImport(
        expression: TSESTree.LiteralExpression,
        sideEffect: boolean
      ): void {
        let node: TSESTree.Node = expression;

        while (node.parent && node.parent.type !== AST_NODE_TYPES.Program) {
          node = node.parent;
        }

        let specifier = getModuleSpecifier(context.getSourceCode(), expression);

        let sourceFileName = context.getFilename();

        if (options === undefined) {
          return;
        } // TODO
        let groups = options.groups;
        let baseUrl = options['baseUrl'] || undefined;

        let helper = this.moduleSpecifierHelper;

        let usingBaseUrl = false;

        if (typeof baseUrl === 'string' && !isRelativeModuleSpecifier(specifier)) {
          let path = helper.resolve(specifier);

          if (path && helper.isPathWithinBaseUrlDir(path)) {
            usingBaseUrl = true;
          }
        }

        let index = groups.findIndex(group =>
          group.match(specifier, sideEffect, usingBaseUrl, sourceFileName),
        );

        let start = node.range[0];

        let fullStart = node.parent[].range[0];

        let precedingText = node.getFullText().slice(, start - fullStart);

        let emptyLinesBeforeStart = (
          precedingText.replace(/^.*\r?\n/, '').match(/^\s*$/gm) || []
        ).length;

        this.moduleImportInfos.push({
          node,
          // 如果没有找到匹配的分组, 则归到 "其他" 一组, groupIndex 为 groups.length.
          groupIndex: index < 0 ? groups.length : index,
          startLine:
            sourceFile.getLineAndCharacterOfPosition(node.getFullStart()).line +
            emptyLinesBeforeStart,
          endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line,
        });
      }

      walk(): void {
        let pendingCache: TSESTree.Statement[] = [];

        let checkWithAppendModuleImport = (
          expression: TSESTree.Expression,
          sideEffect: boolean,
        ): void => {
          this.pendingStatements.push(...pendingCache);
          pendingCache = [];

          if (expression.type === AST_NODE_TYPES.Literal) {  // TODO: 检验这个判断对不对
            this.appendModuleImport(expression, sideEffect);
          }
        };

        for (let statement of context.getSourceCode().ast.body) {
          if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
            checkWithAppendModuleImport(
              statement.source,
              statement.specifiers.length === 0,
            );
          } else if (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration) {
            if (
              statement.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference
              && statement.moduleReference.expression !== undefined
            ) {
              checkWithAppendModuleImport(
                statement.moduleReference.expression,
                false
              );
            }
          } else {
            pendingCache.push(statement);
          }
        }

        this.validate();
      }

      private validate(): void {
        let infos = this.moduleImportInfos;
        let pendingStatements = this.pendingStatements;

        if (!infos.length) {
          return;
        }

        let { ordered } = options;

        interface FailureItem {
          node: TSESTree.Node;
          messageId: MessageIds;
        }

        let failureItems: FailureItem[] = [];

        let [lastInfo, ...restInfos] = infos;

        let fixerEnabled = !pendingStatements.length;

        let appearedGroupIndexSet = new Set([lastInfo.groupIndex]);

        for (let expression of pendingStatements) {
          failureItems.push({
            node: expression,
            messageId: 'unexpectedCodeBetweenImports'
          });
        }

        for (let info of restInfos) {
          let checkOrdering = ordered;

          if (info.groupIndex === lastInfo.groupIndex) {
            // 只在分组第一项检查分组顺序.
            checkOrdering = false;

            // 如果当前分组和上一份组 groupIndex 相同, 则校验是否多了空行.
            if (info.startLine - lastInfo.endLine > 1) {
              failureItems.push({
                node: info.node,
                messageId: 'unexpectedEmptyLine',
              });
            }
          } else {
            // 检验该组是否已经出现过.
            if (appearedGroupIndexSet.has(info.groupIndex)) {
              checkOrdering = false;

              failureItems.push({
                node: info.node,
                messageId: 'notGrouped',
              });
            }
            // 如果未出现过则校验是否少了空行.
            else if (info.startLine - lastInfo.endLine < 2) {
              failureItems.push({
                node: info.node,
                messageId: 'expectingEmptyLine',
              });
            }
          }

          if (checkOrdering) {
            // 在要求分组顺序的情况下, 如果当前分组的 groupIndex 小于上一个分组的,
            // 则说明顺序错误.
            if (info.groupIndex < lastInfo.groupIndex) {
              failureItems.push({
                node: info.node,
                messageId: 'wrongModuleGroupOrder',
              });
            }
          }

          appearedGroupIndexSet.add(info.groupIndex);

          lastInfo = info;
        }

        if (failureItems.length) {
          let fixer = undefined; //fixerEnabled ? this.buildFixer(infos) : undefined;  // TODO

          for (let { node, messageId } of failureItems) {
            // this.addFailureAtNode(node, message, fixer);  //??
            context.report({
              node,
              messageId,
              // fix(fixer) {
              // }
            })

            if (fixer) {
              fixer = undefined;
            }
          }
        }
      }

      // private buildFixer(infos: ModuleImportInfo[]): Replacement | undefined {
      //   let { ordered } = this.options;

      //   let startNode = infos[0].node;
      //   let endNode = infos[infos.length - 1].node;

      //   let infoGroups = groupModuleImportInfos(infos, ordered);

      //   let text = infoGroups
      //     .map(group =>
      //       group
      //         .map(info => trimLeftEmptyLines(info.node.getFullText()))
      //         .join('\n'),
      //     )
      //     .join('\n\n');

      //   let start = startNode.getFullStart();
      //   let length = endNode.getEnd() - start;

      //   return new Replacement(start, length, text);
      // }
    }

    function groupModuleImportInfos(
      infos: ModuleImportInfo[],
      ordered: boolean,
    ): ModuleImportInfo[][] {
      // 这里利用了 Map 和 Set 枚举顺序和键加入顺序一致的特性. 如果不需要按顺序分
      // 组, 则遵照分组出现顺序.
      let infoGroupMap = new Map<number, ModuleImportInfo[]>();

      for (let info of infos) {
        let infoGroup = infoGroupMap.get(info.groupIndex);

        if (infoGroup) {
          infoGroup.push(info);
        } else {
          infoGroup = [info];
          infoGroupMap.set(info.groupIndex, infoGroup);
        }
      }

      if (ordered) {
        return Array.from(infoGroupMap.entries())
          .sort(([indexX], [indexY]) => indexX - indexY)
          .map(([, infoGroup]) => infoGroup);
      } else {
        return Array.from(infoGroupMap.values());
      }
    }

    // ---------------------------------------------------------------------------------- //

    new ImportGroupWalker().walk();
    console.log(context.getSourceCode().ast)
    return {
    };
  },
});
