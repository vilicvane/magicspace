// 字典类型
export interface Dict<T> {
  [key: string]: T;
}

// 分组的类型
export type importGroup =
  | 'innerModule'
  | 'nodeModule'
  | 'baseUrl'
  | 'relativePathModule';

// 配置项Config
export interface ConfigItem {
  name: string;
  test: string;
}
