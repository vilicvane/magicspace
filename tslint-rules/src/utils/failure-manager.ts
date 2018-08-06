import {AbstractWalker, Replacement} from 'tslint';
import * as Typescript from 'typescript';

/** 需要添加错误的项目 */
export interface FailureItem {
  message: string;
  node: Typescript.Node | undefined;
  fixer?: Replacement;
}

export class FailureManager<T> {
  private items: FailureItem[] = [];

  constructor(private walker: AbstractWalker<T>) {}

  append(item: FailureItem) {
    this.items.push(item);
  }

  throw() {
    let items = this.items;

    if (!items.length) {
      return;
    }

    for (let {node, message, fixer} of items) {
      if (node) {
        this.walker.addFailureAtNode(node, message, fixer);
      } else {
        let sourceFile = this.walker.getSourceFile();
        this.walker.addFailure(
          sourceFile.getStart(),
          sourceFile.getEnd(),
          message,
          fixer,
        );
      }
    }
  }
}
