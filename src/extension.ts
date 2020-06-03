import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import transpile from './transpile';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'extension.helloWorld',
    () => {
      const currentlyOpenTabfile = vscode.window.activeTextEditor!.document;
      const baseFileName = path.basename(currentlyOpenTabfile.fileName, '.ts');
      const baseFileNameWithExt = path.basename(currentlyOpenTabfile.fileName);
      const currentFilePath = currentlyOpenTabfile.uri.fsPath;
      // Spec file
      const specFileName = baseFileName + '.spec.ts';
      const specFilePath =
        currentFilePath.substr(
          0,
          currentFilePath.indexOf(baseFileNameWithExt)
        ) + specFileName;

      const currentFileUri = currentlyOpenTabfile.uri;
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

        fs.readFile(specFilePath, (err, data) => {
          if (err) throw err;

          // Prepare output
          const classStubs: Array<string> = [];
          const variablesDefinition: Array<string> = [];
          const providersDefinition: Array<string> = [];
          const testBedDefinition: Array<string> = [];

          injects.map((inj) => {
            const index = inj.indexOf(':') + 1;
            const inject = inj
              .slice(index)
              .replace(/^\s+|\s+$/gm, '')
              .trim();
            const injectStub = `${inject}Stub`;
            const variableName = `${
              inject.charAt(0).toLowerCase() + inject.slice(1)
            }`;
            // Check if exists already in spec file
            if (data.indexOf(`class ${injectStub}`) === -1) {
              classStubs.push(`class ${injectStub} {}\n\r`);
            }
            if (data.indexOf(`let ${variableName}: ${inject}`) === -1) {
              variablesDefinition.push(`\t\tlet ${variableName}: ${inject};\n`);
            }
            if (
              data.indexOf(`provide: ${inject}, useClass: ${injectStub}`) === -1
            ) {
              providersDefinition.push(
                `{ provide: ${inject}, useClass: ${injectStub} },\n`
              );
            }
            if (
              data.indexOf(`${variableName} = TestBed.get(${inject});`) === -1
            ) {
              testBedDefinition.push(
                `${variableName} = TestBed.get(${inject});\n`
              );
            }
          });
          // Get Main indexes in the file
          const indexOfDescribe = data.indexOf('describe(');
          const indexBeforeEach = data.indexOf('beforeEach(async(() => {');
          const indexProviders =
            data.indexOf('providers: [') + 'providers: ['.length;
          // Get index of last test bed with regexp
          const dataStr = data.toString();

          // TODO: Find fallback if no testBed.get
          const testBedMatch = dataStr.match(/TestBed.get.\w*.;/gi);
          const describeMatch = dataStr.match(/describe.*() => {/gi);
          let indexOfDescribeEnd = indexBeforeEach - 1;
          let indexLastTestBed;
          if (testBedMatch && testBedMatch.length > 0) {
            const lastIndex = dataStr.lastIndexOf(
              testBedMatch[testBedMatch.length - 1]
            );
            indexLastTestBed =
              lastIndex + testBedMatch[testBedMatch.length - 1].length;
          }

          if (describeMatch && describeMatch.length > 0) {
            const lastIndex = dataStr.indexOf(describeMatch[0]);
            indexOfDescribeEnd = lastIndex + describeMatch[0].length;
          }

          // Check if already added to file
          const part1 = data.slice(0, indexOfDescribe);
          const part2 = data.slice(indexOfDescribe, indexOfDescribeEnd);
          const part3 = data.slice(indexOfDescribeEnd, indexProviders);
          const part4 = data.slice(indexProviders, indexLastTestBed);
          const part5 = data.slice(indexLastTestBed, data.length);

          // Prepare content for insert
          const missingStubs = classStubs.join('');
          const missingVars = variablesDefinition.join('');
          const missingProviders = providersDefinition.join('');
          const missingTestBeds = testBedDefinition.join('');

          // Create new content
          const bufferWithNewContent =
            part1.toString() +
            '\n' +
            missingStubs +
            part2.toString() +
            '\n\r' +
            missingVars +
            part3.toString() +
            '\n' +
            missingProviders +
            part4.toString() +
            '\n' +
            missingTestBeds +
            part5.toString();
          const newContent = new Uint8Array(Buffer.from(bufferWithNewContent));
          // Write new content to file
          fs.writeFile(specFilePath, newContent, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
          });
        });
      });
      // Display a message box to the user
      vscode.window.showInformationMessage('Injects generated');
    }
  );

  let generateTests = vscode.commands.registerCommand(
    'extension.createTestsForFunction',
    () => {
      const currentlyOpenTabfile = vscode.window.activeTextEditor!.document;
      console.log(currentlyOpenTabfile);
      const baseFileName = path.basename(currentlyOpenTabfile.fileName, '.js');
      console.log(baseFileName);

      const baseFileNameWithExt = path.basename(currentlyOpenTabfile.fileName);
      console.log(baseFileNameWithExt);

      const currentFilePath = currentlyOpenTabfile.uri.fsPath;
      // Spec file
      const specFileName = baseFileName + '.test.js';
      const specFilePath =
        currentFilePath.substr(
          0,
          currentFilePath.indexOf(baseFileNameWithExt)
        ) + specFileName;

      console.log(specFilePath);

      const currentFileUri = currentlyOpenTabfile.uri;
      vscode.workspace.openTextDocument(currentFileUri).then((document) => {
        let text = document.getText();
        console.log(text);
        fs.open(specFilePath, 'a+', (err, data) => {
          if (err) throw err;

          console.log('Opened file');
          const functionFromFile = new Function('a', 'b', 'return a + b');
          console.log('Function expects', functionFromFile.length);
          console.log('Function', functionFromFile(2, 3));
          // Create new content
          const bufferWithNewContent = `
            const sum = require('./${baseFileName}');

            test('adds 1 + 2 to equal 3', () => {
              expect(sum(1, 2)).toBe(3);
            });
          `;
          const newContent = new Uint8Array(Buffer.from(bufferWithNewContent));
          // Write new content to file
          fs.writeFile(specFilePath, newContent, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
          });
        });
        // fs.readFile(specFilePath, (err, data) => {
        //   if (err) throw err;

        //   // Prepare output
        //   const classStubs: Array<string> = [];
        //   const variablesDefinition: Array<string> = [];
        //   const providersDefinition: Array<string> = [];
        //   const testBedDefinition: Array<string> = [];

        //   // injects.map(inj => {
        //   //   const index = inj.indexOf(':') + 1;
        //   //   const inject = inj
        //   //     .slice(index)
        //   //     .replace(/^\s+|\s+$/gm, '')
        //   //     .trim();
        //   //   const injectStub = `${inject}Stub`;
        //   //   const variableName = `${inject.charAt(0).toLowerCase() + inject.slice(1)}`;
        //   //   // Check if exists already in spec file
        //   //   if (data.indexOf(`class ${injectStub}`) === -1) {
        //   //     classStubs.push(`class ${injectStub} {}\n\r`);
        //   //   }
        //   //   if (data.indexOf(`let ${variableName}: ${inject}`) === -1) {
        //   //     variablesDefinition.push(`\t\tlet ${variableName}: ${inject};\n`);
        //   //   }
        //   //   if (data.indexOf(`provide: ${inject}, useClass: ${injectStub}`) === -1) {
        //   //     providersDefinition.push(`{ provide: ${inject}, useClass: ${injectStub} },\n`);
        //   //   }
        //   //   if (data.indexOf(`${variableName} = TestBed.get(${inject});`) === -1) {
        //   //     testBedDefinition.push(`${variableName} = TestBed.get(${inject});\n`);
        //   //   }
        //   // });
        //   // Get Main indexes in the file
        //   const indexOfDescribe = data.indexOf('describe(');
        //   const indexBeforeEach = data.indexOf('beforeEach(async(() => {');
        //   const indexProviders = data.indexOf('providers: [') + 'providers: ['.length;
        //   // Get index of last test bed with regexp
        //   const dataStr = data.toString();

        //   // TODO: Find fallback if no testBed.get
        //   const testBedMatch = dataStr.match(/TestBed.get.\w*.;/gi);
        //   const describeMatch = dataStr.match(/describe.*() => {/gi);
        //   let indexOfDescribeEnd = indexBeforeEach - 1;
        //   let indexLastTestBed;
        //   if (testBedMatch && testBedMatch.length > 0) {
        //     const lastIndex  = dataStr.lastIndexOf(testBedMatch[testBedMatch.length-1]);
        //     indexLastTestBed = lastIndex + testBedMatch[testBedMatch.length-1].length;
        //   }

        //   if (describeMatch && describeMatch.length > 0) {
        //     const lastIndex  = dataStr.indexOf(describeMatch[0]);
        //     indexOfDescribeEnd = lastIndex + describeMatch[0].length;
        //   }

        //   // Check if already added to file
        //   const part1 = data.slice(0, indexOfDescribe);
        //   const part2 = data.slice(indexOfDescribe, indexOfDescribeEnd);
        //   const part3 = data.slice(indexOfDescribeEnd, indexProviders);
        //   const part4 = data.slice(indexProviders, indexLastTestBed);
        //   const part5 = data.slice(indexLastTestBed, data.length);

        //   // Prepare content for insert
        //   const missingStubs = classStubs.join('');
        //   const missingVars = variablesDefinition.join('');
        //   const missingProviders = providersDefinition.join('');
        //   const missingTestBeds = testBedDefinition.join('');

        //   // Create new content
        //   const bufferWithNewContent =
        //       part1.toString()
        //       + '\n'
        //       + missingStubs
        //       + part2.toString()
        //       + '\n\r'
        //       + missingVars
        //       + part3.toString()
        //       + '\n'
        //       + missingProviders
        //       + part4.toString()
        //       + '\n'
        //       + missingTestBeds
        //       + part5.toString();
        //   const newContent = new Uint8Array(Buffer.from(bufferWithNewContent));
        //   // Write new content to file
        //   fs.writeFile(specFilePath, newContent, (err) => {
        //     if (err) throw err;
        //     console.log('The file has been saved!');
        //   });
        // });
      });
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(generateTests);
}

// this method is called when your extension is deactivated
export function deactivate() {}
