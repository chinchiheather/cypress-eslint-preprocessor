const path = require('path');
const browserifyPreprocessor = require('@cypress/browserify-preprocessor');
const CLIEngine = require('eslint').CLIEngine;
const chalk = require('chalk');

const cli = new CLIEngine();

const lint = (preprocessor) => (file) => {
  const report = cli.executeOnFiles([file.filePath]);
  if (report.errorCount > 0) {
    console.log(chalk.bold.red(`\nERROR in ${file.filePath}`));

    const errorResults = report.results.filter(result => result.errorCount > 1);
    errorResults.forEach((result) => {
      const relativePath = path.relative(process.cwd(), result.filePath);
      console.log(chalk.bold.red(`\n${relativePath}`));

      result.messages.forEach((message) => {
        // todo: format with nice colours
        const line = chalk.gray(`${message.line}:${message.column}`);
        const type = chalk.red('error');
        const error = chalk.white(message.message);
        const rule = chalk.gray(message.ruleId);
        console.log(`${line} ${type} ${error} ${rule}`);
      });
    });
  }

  // todo: warnings

  if (!preprocessor) {
    preprocessor = browserifyPreprocessor(browserifyPreprocessor.defaultOptions);
  }
  return preprocessor(file);
};

module.exports = lint;
