// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "Generete Stubs for Jest Tests" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    var currentlyOpenTabfilePath = vscode.window.activeTextEditor!.document;
    console.log('currentlyOpenTabfilePath', currentlyOpenTabfilePath);
    const currentFileUri = currentlyOpenTabfilePath.uri;
    vscode.workspace.openTextDocument(currentFileUri).then((document) => {
      let text = document.getText();
      // console.log(text);
      const emptyConstructorIndex = text.indexOf('constructor() { }');
      if (emptyConstructorIndex !== -1) {
        return;
      }
      const indexOfConstructor = text.indexOf('constructor(');
      const endOfConstructor = text.indexOf(') {}');
      console.log('empty', emptyConstructorIndex);
      console.log('index', indexOfConstructor);
      console.log('endOfConstructor', endOfConstructor);
      const constructorStr = text.slice(indexOfConstructor, endOfConstructor);
      const indexOfEndOfConstructor = constructorStr.indexOf('(');
      const injectsStr = constructorStr.slice(indexOfEndOfConstructor + 1);
      let injects = injectsStr.split(',');
      injects = injects.map(inject => {
        const index = inject.indexOf(':') + 1;
        return inject
          .slice(index)
          .replace(/^\s+|\s+$/gm, '')
          .trim();
      });
      console.log(injects);
      const classStubs = injects.map(inject => {
        return `class ${inject}Stub{}`;
      }
      );
      console.log('classStubs', classStubs);
    });
    // Display a message box to the user
    vscode.window.showInformationMessage('Injects generated');
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
