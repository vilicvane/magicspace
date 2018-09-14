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

// textDocuments.onDidChangeContent(change => {
//   let document: TextDocument = change.document;

//   let text = document.getText();

//   let diagnostic: Diagnostic = {
//     severity: DiagnosticSeverity.Error,
//     range: {
//       start: document.positionAt(0),
//       end: document.positionAt(text.length),
//     },
//     message: text,
//   };

//   connection.sendDiagnostics({
//     uri: document.uri,
//     diagnostics: [diagnostic],
//   });
// });

textDocuments.listen(connection);

connection.listen();
