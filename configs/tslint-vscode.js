const Path = require('path');

const TSLint = require('tslint');

const CONFIG_FILE_PATH = Path.join(__dirname, 'tslint-prettier.js');

/**
 * When to add a new rule into this list?
 *
 * 1. It does not require type checker.
 * 2. It has fixer that needs to be applied automatically when saving a file.
 */
const PICKING_RULE_NAMES = [
  'ordered-imports',
  'import-groups',
  'scoped-modules',
  'import-path-base-url',
  'empty-line-around-blocks',
  'import-path-shallowest',
  'import-path-no-parent',
  'import-path-be-smart',
];

const {rules, rulesDirectory} = TSLint.Configuration.loadConfigurationFromPath(
  CONFIG_FILE_PATH,
);

module.exports = {
  rules: pick(rules, PICKING_RULE_NAMES),
  rulesDirectory,
};

function pick(ruleMap, names) {
  return names.reduce((pickedDict, name) => {
    let rule = ruleMap.get(name);

    let {ruleArguments, ruleSeverity} = rule;

    pickedDict[name] = {
      severity: ruleSeverity,
      options: ruleArguments,
    };

    return pickedDict;
  }, {});
}
