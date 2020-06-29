import {emptyLineAroundBlocksRule} from './@empty-line-around-blocks-rule';
import {explicitReturnTypeRule} from './@explicit-return-type-rule';
import {importGroupsRule} from './@import-groups-rule';
import {importPathBaseUrlRule} from './@import-path-base-url-rule';
import {importPathBeSmartRule} from './@import-path-be-smart-rule';
import {importPathNoParentRule} from './@import-path-no-parent-rule';
import {importPathShallowestRule} from './@import-path-shallowest-rule';
import {importPathStrictHierarchyRule} from './@import-path-strict-hierarchy-rule';
import {noEmptyConstructorRule} from './@no-empty-constructor-rule';
import {noUnnecessaryTypeAssertionRule} from './@no-unnecessary-type-assertion';
import {orderedImportsRule} from './@ordered-imports';
import {scopedModulesRule} from './@scoped-modules-rule';
import {strictKeyOrderRule} from './@strict-key-order';

export const rules = {
  'empty-line-around-blocks': emptyLineAroundBlocksRule,
  'explicit-return-type': explicitReturnTypeRule,
  'import-groups': importGroupsRule,
  'import-path-base-url': importPathBaseUrlRule,
  'import-path-be-smart': importPathBeSmartRule,
  'import-path-no-parent': importPathNoParentRule,
  'import-path-shallowest': importPathShallowestRule,
  'import-path-strict-hierarchy': importPathStrictHierarchyRule,
  'no-empty-constructor': noEmptyConstructorRule,
  'no-unnecessary-type-assertion': noUnnecessaryTypeAssertionRule,
  'ordered-imports': orderedImportsRule,
  'scoped-modules': scopedModulesRule,
  'strict-key-order': strictKeyOrderRule,
};
