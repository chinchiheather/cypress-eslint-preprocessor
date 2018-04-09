const path = require('path');
const browserifyPreprocessor = require('@cypress/browserify-preprocessor');
const CLIEngine = require('eslint').CLIEngine;
const chalk = require('chalk');

const cli = new CLIEngine();

const logResults = (filePath, messages, type, colour) => {
  console.log(chalk.bold[colour](`\n${type.toUpperCase()} in ${filePath}`));

  const relativePath = path.relative(process.cwd(), filePath);
  console.log(chalk.bold[colour](`\n${relativePath}`));

  messages.forEach((message) => {
    const line = chalk.gray(`${message.line}:${message.column}`);
    type = chalk[colour](type);
    const error = chalk.white(message.message);
    const rule = chalk.gray(message.ruleId);
    console.log(`${line} ${type} ${error} ${rule}`);
  });
};

const lint = (preprocessor) => (file) => {
  const report = cli.executeOnFiles([file.filePath]);
  if (report.errorCount > 0) {
    const errorMsgs = report.results[0].messages.filter(result => result.severity === 2);
    logResults(file.filePath, errorMsgs, 'error', 'red');
  }

  if (report.warningCount > 0) {
    const warningMsgs = report.results[0].messages.filter(result => result.severity === 1);
    logResults(file.filePath, warningMsgs, 'warning', 'yellow');
  }

  if (!preprocessor) {
    preprocessor = browserifyPreprocessor(browserifyPreprocessor.defaultOptions);
  }
  return preprocessor(file);
};

module.exports = lint;
