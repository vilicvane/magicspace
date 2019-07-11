import {__importDefault} from 'tslib';

export function requireDefault<T>(path: string): T {
  return __importDefault(require(path)).default;
}
