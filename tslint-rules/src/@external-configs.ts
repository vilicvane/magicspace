import {Dict} from './@lang';

export interface PackageData {
  devDependencies: Dict<string>;
  dependencies: Dict<string>;
}

export interface TSConfig {
  baseUrl: string;
}
