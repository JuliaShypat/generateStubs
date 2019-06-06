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

      // Check if constructor is not empty
      const emptyConstructorIndex = text.indexOf('constructor() { }');
      if (emptyConstructorIndex !== -1) {
        return;
      }

      // Slice injects from contructor body
      const startOfConstructor = text.indexOf('constructor(');
      const endOfConstructor = text.indexOf(') {');
      const constructorStr = text.slice(startOfConstructor, endOfConstructor);

      const indexOfFirstInjects = constructorStr.indexOf('(') + 1;
      const injectsStr = constructorStr.slice(indexOfFirstInjects);

      let injects = injectsStr.split(',');
      injects = injects.map(inject => {
        const index = inject.indexOf(':') + 1;
        return inject
          .slice(index)
          .replace(/^\s+|\s+$/gm, '')
          .trim();
      });
      console.log(injects);
      
      // Prepare output
      const classStubs: Array<string> = [];
      const variablesDefinition: Array<string> = [];
      const providersDefinition: Array<string> = [];
      const testBedDefinition: Array<string> = [];

      // TODO: Avoid double mapping
      injects.map(inject => {
        const injectStub = `${inject}Stub`;
        const variableName = `${inject.charAt(0).toLowerCase() + inject.slice(1)}`;

        classStubs.push(`class ${injectStub} {}`);
        variablesDefinition.push(`let ${variableName}: ${inject};`);
        providersDefinition.push(`{ provide: ${inject}, useClass: ${injectStub} },`);
        testBedDefinition.push(`${variableName} = TestBed.get(${inject});`);
      }
      );
      console.log('classStubs', classStubs);
      console.log('variablesDefinition', variablesDefinition);
      console.log('providersDefinition', providersDefinition);
      console.log('testBedDefinition', testBedDefinition);
    });
    // Display a message box to the user
    vscode.window.showInformationMessage('Injects generated');
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
