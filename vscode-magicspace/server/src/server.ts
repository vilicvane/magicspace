import {
  ProposedFeatures,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver';

let connection = createConnection(ProposedFeatures.all);

let textDocuments = new TextDocuments();

connection.onInitialize(_params => {
  return {
    capabilities: {
      textDocumentSync: textDocuments.syncKind,
    },
  };
});

textDocuments.listen(connection);

connection.listen();
