interface ConvertedString {
  camelCase: string;
  hyphenated: string;
}

interface TemplateData {
  [index: string]: any;
}

export function evaluatedStringTemplate(
  template: string,
  templateData: TemplateData,
) {
  return template.replace(
    /\$\{(*.?)\}/,
    (_match: string, key: string) => templateData[key.trim()],
  );
}

export function convertString(targetString: string): ConvertedString {
  let camelCase: string = '';
  let hyphenated: string = '';

  targetString = targetString
    .replace(/\s+/g, ' ')
    .replace(/^\s\s*/, '')
    .replace(/\s\s$/, '');

  if (targetString !== '') {
    let targetStringParts = targetString.split(' ');

    camelCase = targetStringParts
      .map(
        (part, index) =>
          index
            ? Array.from(part)
                .map((char, index) => (index ? char : char.toUpperCase()))
                .join('')
            : part,
      )
      .join('');

    hyphenated = targetStringParts.join('-');
  }

  return {camelCase, hyphenated};
}
