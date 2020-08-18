module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/packages/*/bld/test/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/packages/core/.magicspace'],
};
