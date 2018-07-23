import {Dict} from '../src/@lang';

// package.json
declare module '*.json' {
  interface PackageData {
    devDependencies: Dict<string>;
    dependencies: Dict<string>;
  }

  const value: PackageData;
  export default value;
}

// tsconfig.json
declare module '*tsconfig.json' {
  interface TSConfig {
    baseUrl: string;
  }

  const value: TSConfig;
  export default value;
}
