import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import * as TS from 'typescript';

interface RawOptions {
  groups: ModuleGroupConfigItem[];
  ordered?: boolean;
}

interface ParsedOptions {
  groups: ModuleGroup[];
  ordered: boolean;
}

/** 分组的tester */
type ModuleGroupTester = (path: string) => boolean;

/** 分组的配置项 */
interface ModuleGroupConfigItem {
  name: string;
  test: string;
}

/** 模块组（处理后的配置项） */
interface ModuleGroup {
  name: string;
  test: RegExp | ModuleGroupTester;
}

interface ModuleImportInfo {
  node: TS.Node;
  index: number;
  line: number;
}

export class Rule extends Rules.AbstractRule {
  /** 用户配置项 */
  private parsedOptions: ParsedOptions | undefined;

  constructor(options: IOptions) {
    super(options);

    let {groups: groupConfigItems, ordered} = options
      .ruleArguments[0] as RawOptions;

    this.parsedOptions = {
      groups: groupConfigItems.map(item => {
        return {
          name: item.name,
          test: this.buildTester(item.test),
        };
      }),
      ordered: !!ordered,
    };
  }

  apply(sourceFile: TS.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportGroupWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions!,
      ),
    );
  }

  /**
   * 创建tester
   * @description 通过对module path的初步解析，创建tester
   * @param configString 配置的匹配字符串
   * @return 返回一个tester用于匹配实际路径
   */
  private buildTester(configString: string): RegExp | ModuleGroupTester {
    if (configString.startsWith(ImportGroupWalker.RUNTIME_NPM_MODULE_TAG)) {
      switch (configString) {
        case '$node':
          return (path: string): boolean => require.resolve(path) === path;
        case '$npm':
          return (path: string): boolean =>
            require
              .resolve(path)
              .includes(ImportGroupWalker.NPM_MODULE_POSITION);
        default:
          return (_: string): boolean => false;
      }
    } else {
      return new RegExp(configString);
    }
  }

  static Tag = false;

  /** faiture信息 */
  static readonly SAME_GROUP_FAILURE_STRING = '同组之间不能有空行';
  static readonly DIFF_GROUP_FAILURE_STRING = '异组之间必须有空行';
  static readonly SEQUERENCE_FAILURE_STRING = '顺序错误';

  /** 元数据配置 */
  static metadata: IRuleMetadata = {
    ruleName: 'import-group',
    description: '针对于传入的参数对import的模块进行分组',
    optionsDescription: '',
    options: {
      type: `{group:'array', order:boolean}`,
    },
    optionExamples: [
      [
        true,
        {
          groups: [{name: 'runtime', test: '$node'}],
          order: true,
        },
      ],
    ],
    type: 'style',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportGroupWalker extends AbstractWalker<ParsedOptions> {
  /** 分组容器 */
  private moduleImportInfos: ModuleImportInfo[] = [];

  visitImportDeclaration(node: TS.ImportDeclaration) {}

  walk(sourceFile: TS.SourceFile): void {
    if (this.options.groups.length === 0) {
      return;
    }

    this.moduleImportInfos = [];
    let expressions = findImports(sourceFile, ImportKind.AllStaticImports);

    // 录入 import 语句到分组容器
    for (let expression of expressions) {
      let text = this.removeQuotes(expression.getText());
      let line = TS.getLineAndCharacterOfPosition(
        sourceFile,
        expression.getStart(),
      ).line;

      this.moduleImportInfos = this.pushInModuleImportInfosArr(
        expression.parent!,
        text,
        line,
        this.moduleImportInfos,
      );
    }

    // 检查规则
    this.judgeRule();
  }

  /**
   * 去掉路径两边的引号
   * @param value 原始字符串
   * @returns 返回去掉引号后的字符串
   */
  private removeQuotes(value: string): string {
    let groups = /^(['"])(.*)\1$/.exec(value);
    return groups ? groups[2] : '';
  }

  /**
   * 检测规则, 遍历容器，不符合顺序的抛出failure
   */
  private judgeRule() {
    /** 当前索引 */
    let currentIndex = 0;
    /** 上一个节点 */
    let prev: ModuleImportInfo | undefined;
    // 遍历容器
    for (let moduleImportInfo of this.moduleImportInfos) {
      if (moduleImportInfo.index >= currentIndex) {
        currentIndex = moduleImportInfo.index;
      } else {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.SEQUERENCE_FAILURE_STRING,
        );
      }

      if (
        prev &&
        prev.index !== moduleImportInfo.index &&
        (prev.line === moduleImportInfo.line - 1 ||
          prev.line === moduleImportInfo.line + 1)
      ) {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.DIFF_GROUP_FAILURE_STRING,
        );
      } else if (
        prev &&
        prev.index === moduleImportInfo.index &&
        (prev.line !== moduleImportInfo.line - 1 &&
          prev.line !== moduleImportInfo.line + 1)
      ) {
        this.addFailureAtNode(
          moduleImportInfo.node,
          Rule.SAME_GROUP_FAILURE_STRING,
        );
      }

      prev = moduleImportInfo;
    }
  }

  /**
   * 将模块路径封装成ModuleImportInfo添加到数组里
   * @param node AST中的一个节点
   * @param path 模块路径
   * @return 返回一个新的ModuleImportInfo数组
   */
  private pushInModuleImportInfosArr(
    node: TS.Node,
    path: string,
    line: number,
    moduleImportInfos: ModuleImportInfo[],
  ): ModuleImportInfo[] {
    let tmpArr = moduleImportInfos.concat([]);
    for (let index of Object.keys(this.options.groups)) {
      if (this.matchModulePath(path, this.options.groups[Number(index)].test)) {
        tmpArr.push({node, index: +index, line});
      }
    }
    return tmpArr;
  }

  /**
   * 匹配路径
   * @param path 模块路径
   * @param configString 配置的匹配字符串
   * @returns 返回匹配结果
   */
  private matchModulePath(
    path: string,
    tester: ModuleGroupTester | RegExp,
  ): boolean {
    if (typeof tester === 'function') {
      return tester(path);
    } else {
      return tester.test(path);
    }
  }

  /** runtime模块或者npm模块的标志符 */
  static readonly RUNTIME_NPM_MODULE_TAG = '$';
  /** npm模块的安装位置 */
  static readonly NPM_MODULE_POSITION = 'node_modules';
}
