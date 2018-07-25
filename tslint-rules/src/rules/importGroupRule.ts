import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import * as TS from 'typescript';
import {Dict} from '../@lang';

/** faiture信息 */
const SAME_GROUP_FAILURE_STRING = '同组之间不能有空行';
const DIFF_GROUP_FAILURE_STRING = '异组之间必须有空行';
const SEQUERENCE_FAILURE_STRING = '顺序错误';
/** runtime模块或者npm模块的标志符 */
const RUNTIME_NPM_MODULE_TAG = '$';
/** npm模块的安装位置 */
const NPM_MODULE_POSITION = 'node_modules';

/** 匹配字典 */
const MatchDict: Dict<ModuleGroupTester> = {
  $node: (path: string): boolean => require.resolve(path) === path,
  $npm: (path: string): boolean =>
    require.resolve(path).includes(NPM_MODULE_POSITION),
};

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
    if (configString.startsWith(RUNTIME_NPM_MODULE_TAG)) {
      return MatchDict[configString] || ((_: string) => false);
    } else {
      return new RegExp(configString);
    }
  }

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

  /** 修复对象 */
  private fixer: Replacement | undefined;

  walk(sourceFile: TS.SourceFile): void {
    if (this.options.groups.length === 0) {
      return;
    }

    this.moduleImportInfos = [];
    let expressions = findImports(sourceFile, ImportKind.AllStaticImports);

    // 录入 import 语句到分组容器
    for (let expression of expressions) {
      let text = removeQuotes(expression.getText());
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

    // 初始化fixer
    this.fixer = this.buildFixer(this.moduleImportInfos);

    // 检查规则
    this.validate(this.fixer, this.moduleImportInfos);
  }

  /**
   * 根据容器index特征进行分类
   * @param moduleImportInfos 分组容器
   * @returns 分类完成的分组容器
   */
  private groupBy(moduleImportInfos: ModuleImportInfo[]): ModuleImportInfo[] {
    let tmpArr = [];
    for (let moduleImportInfo of moduleImportInfos) {
      let index = moduleImportInfos.findIndex(
        (ele: ModuleImportInfo) => ele.index === moduleImportInfo.index,
      );
      if (!index) {
        tmpArr.push(moduleImportInfo);
      } else {
        tmpArr.splice(index, 0, moduleImportInfo);
      }
    }
    return tmpArr;
  }

  /**
   * 创建fixer
   * @param moduleImportInfos 分组容器
   * @returns Replacement对象，用于替换错误的行段
   */
  private buildFixer(
    moduleImportInfos: ModuleImportInfo[],
  ): Replacement | undefined {
    moduleImportInfos = [...moduleImportInfos];

    if (moduleImportInfos.length < 2) {
      return undefined;
    }

    let startItem = moduleImportInfos[0];
    let endItem = moduleImportInfos[moduleImportInfos.length - 1];

    // 排序
    if (this.options.ordered) {
      moduleImportInfos = moduleImportInfos.sort(
        (a: ModuleImportInfo, b: ModuleImportInfo) => a.index - b.index,
      );
    } else {
      // 根据容器index特征进行分类
      moduleImportInfos = this.groupBy(moduleImportInfos);
    }

    /** 替代的字符串 */
    let lines: string[] = [];

    for (let index of Object.keys(moduleImportInfos)) {
      let after = moduleImportInfos[Number(index) + 1];
      let current = moduleImportInfos[Number(index)];

      lines.push(current.node.getText());

      if (after && after.index !== current.index) {
        lines.push('\n');
      }

      lines.push('\n');
    }

    lines.push('\n');

    return new Replacement(
      startItem.node.getStart(),
      endItem.node.getEnd(),
      lines.join(''),
    );
  }

  /**
   * 检测规则, 遍历容器，不符合顺序的抛出failure
   */
  private validate(
    fixer: Replacement | undefined,
    moduleImportInfos: ModuleImportInfo[],
  ) {
    /** 当前索引 */
    let currentIndex = 0;

    /** 上一个节点 */
    let prev: ModuleImportInfo | undefined;
    // 遍历容器
    for (let moduleImportInfo of moduleImportInfos) {
      if (moduleImportInfo.index >= currentIndex) {
        currentIndex = moduleImportInfo.index;
        if (!this.options.ordered) {
          currentIndex = -1;
        }
      } else {
        this.addFailureAtNode(
          moduleImportInfo.node,
          SEQUERENCE_FAILURE_STRING,
          fixer,
        );
      }

      if (prev) {
        let prevEnd = prev.node.getEnd();
        let currentStart = moduleImportInfo.node.getStart();

        if (
          prev.index !== moduleImportInfo.index &&
          prevEnd === currentStart - 1
        ) {
          this.addFailureAtNode(
            moduleImportInfo.node,
            DIFF_GROUP_FAILURE_STRING,
            fixer,
          );
        } else if (
          prev.index === moduleImportInfo.index &&
          prevEnd !== currentStart - 1
        ) {
          this.addFailureAtNode(
            moduleImportInfo.node,
            SAME_GROUP_FAILURE_STRING,
            fixer,
          );
        }
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
    let tmpArr = [...moduleImportInfos];
    for (let index of Object.keys(this.options.groups)) {
      if (this.matchModulePath(path, this.options.groups[Number(index)].test)) {
        tmpArr.push({node, index: Number(index), line});
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
}

/**
 * 去掉路径两边的引号
 * @param value 原始字符串
 * @returns 返回去掉引号后的字符串
 */
function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}
