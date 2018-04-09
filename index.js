const path = require('path');
const browserifyPreprocessor = require('@cypress/browserify-preprocessor');
const CLIEngine = require('eslint').CLIEngine;
const chalk = require('chalk');

const cli = new CLIEngine();

/**
 * If string's length is less than longest, appends spaces until it reaches the
 * same length
 */
const padString = (string, longest) => {
  if (string.length < longest) {
    Array(longest - string.length)
    .fill(null)
    .forEach(() => { string += ' '; });
  }
  return string;
};

/**
 * Logs the linting results to the console
 */
const logResults = (filePath, messages, type, colour) => {
  console.log(chalk.bold[colour](`\n${type.toUpperCase()} in ${filePath}`));

  const relativePath = path.relative(process.cwd(), filePath);
  console.log(chalk.bold[colour](`\n${relativePath}`));

  // find the messages with the longest strings for fields so we can nicely align them
  const findLargestReducer = (prev, curr) => {
    return curr > prev ? curr : prev;
  };
  const longestLineChars = messages
  .map(message => `${message.line}:${message.column}`.length)
  .reduce(findLargestReducer, 0);
  const longestMsgChars = messages
  .map(message => message.message.length)
  .reduce(findLargestReducer, 0);

  messages.forEach((message) => {
    const lineText = padString(`${message.line}:${message.column}`, longestLineChars);
    const line = chalk.gray(lineText);
    type = chalk[colour](type);
    const errorTxt = padString(message.message, longestMsgChars);
    const error = chalk.white(errorTxt);
    const rule = chalk.gray(message.ruleId);

    console.log(`  ${line}  ${type}  ${error}  ${rule}`);
  });
};

const lint = preprocessor => (file) => {
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
