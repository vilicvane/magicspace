import {extendPackageScript} from '../library';

test('`extendPackageScript` should work', () => {
  expect(
    extendPackageScript('yarn build && yarn lint', 'yarn test', {
      before: '*lint*',
    }),
  ).toMatchInlineSnapshot(`"yarn build && yarn test && yarn lint"`);

  expect(
    extendPackageScript('yarn build && yarn lint', 'yarn test', {
      after: '*build*',
    }),
  ).toMatchInlineSnapshot(`"yarn build && yarn test && yarn lint"`);

  expect(
    extendPackageScript('yarn lint-prettier && yarn lint', 'yarn build', {
      after: '*lint-prettier*',
    }),
  ).toMatchInlineSnapshot(`"yarn lint-prettier && yarn build && yarn lint"`);
});
