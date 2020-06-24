interface RawLocaleBundle {
  'm:keywords': string;
  'm:keywordsOfCategory2': string;
}

export const enAU: RawLocaleBundle = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const zhCN: /* @strict-order */ RawLocaleBundle = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const zhHans: // @strict-order
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

export const enUS: /* @strict-order */ RawLocaleBundle2 = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};

export const enUK: // @strict-order
RawLocaleBundle2 = {
  'm:keywords': 'keyword1,keyword2',
  'm:keywordsOfCategory2': 'keyword3,keyword4',
};
