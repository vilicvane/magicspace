import {AbstractWalker, Replacement} from 'tslint';
import * as Typescript from 'typescript';

/** 需要添加错误的项目 */
export interface FailureItem {
  message: string;
  node?: Typescript.Node;
  replacement?: Replacement;
}

export class FailureManager<T> {
  constructor(private walker: AbstractWalker<T>) {}

  append({node, message, replacement}: FailureItem): void {
    let walker = this.walker;

    if (node) {
      walker.addFailureAtNode(node, message, replacement);
    } else {
      let sourceFile = walker.getSourceFile();

      walker.addFailure(
        sourceFile.getStart(),
        sourceFile.getEnd(),
        message,
        replacement,
      );
    }
  }
}
