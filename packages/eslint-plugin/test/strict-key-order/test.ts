interface RawLocaleBundle {
  'm:keywords': string;
  'm:keywordsOfCategory2': string;
}

export const enAU: RawLocaleBundle = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const zhCN: /* strict-key-order */ RawLocaleBundle = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const zhHans: // strict-key-order
RawLocaleBundle = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

interface RawLocaleBundle2 {
  'm:keywordsOfCategory2': string;
  'm:keywords': string;
}

export const enGB: RawLocaleBundle2 = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const enUS: /* strict-key-order */ RawLocaleBundle2 = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const enUK: // strict-key-order
RawLocaleBundle2 = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

interface A {
  a: number;
  b?: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  i: number;
  j: number;
  k: number;
  l: number;
  m: number;
  n: number;
}

let aa: /* strict-key-order */ A = {
  a: 0,

  d: 0,
  e: 0,
  c: 0,

  f: 0,
  g: 0,

  j: 0,
  h: 0,
  i: 0,

  k: 0,
  l: 0,
  m: 0,
  n: 0,
};
