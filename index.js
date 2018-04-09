const browserifyPreprocessor = require('@cypress/browserify-preprocessor');
const fs = require('fs');
const CLIEngine = require('eslint').CLIEngine;
const cli = new CLIEngine();
const path = require('path');

const lint = (preprocessor) => (file) => {
  const report = cli.executeOnFiles([file.filePath]);
  if (report.errorCount > 0) {
    console.log(`\nERROR in ${file.filePath}`);

    const errorResults = report.results.filter(result => result.errorCount > 1);
    errorResults.forEach((result) => {
      console.log(`\n${path.relative(process.cwd(), result.filePath)}`);
      result.messages.forEach((message) => {
        // todo: format with nice colours
        console.log(`${message.line}:${message.column} error ${message.message} ${message.ruleId}`);
      });
    });
  }

  if (!preprocessor) {
    preprocessor = browserifyPreprocessor(browserifyPreprocessor.defaultOptions);
  }
  return preprocessor(file);
};

module.exports = lint;
