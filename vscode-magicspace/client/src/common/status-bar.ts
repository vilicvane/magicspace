import {StatusBarAlignment, StatusBarItem, window} from 'vscode';

export class MagicspaceStatusBar {
  private statusBarItem: StatusBarItem;

  constructor() {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
    this.controlStatusBar();
  }

  controlStatusBar(): void {
    if (window.activeTextEditor) {
      this.statusBarItem.text = 'Magicspace';
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
