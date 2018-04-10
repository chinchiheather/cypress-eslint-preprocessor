import sinon from 'sinon';
import mockery from 'mockery';

describe('cypress-eslint', () => {
  const cypressEslint = (file, preprocessor) => {
    const linter = require('../index');
    return linter(preprocessor)(file);
  };

  const filePath = '~/Desktop/Projects/my-project/my-tests.e2e-spec.js';
  const outputPath = '/tmp/user/Desktop/Projects/my-project/my-tests.e2e-spec.js';
  const relativeFilePath = '/my-tests.e2e-spec.js';

  let browserifySpy;
  let browserifyFileSpy;
  let executeOnFilesSpy;
  let relativeSpy;
  let chalkSpy;
  let colourSpies;
  let logSpy;
  let file;
  let lintingReport;

  before(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });

    mockBrowserifyPreprocessor();
    mockEsLintCliEngine();
    mockLogger();
    mockChalk();
    relativeSpy = sinon.spy(() => relativeFilePath);
    mockery.registerMock('path', { relative: relativeSpy });
  });

  function mockBrowserifyPreprocessor() {
    browserifyFileSpy = sinon.spy(() => 'preprocessed file!');
    browserifySpy = sinon.spy(() => browserifyFileSpy);
    browserifySpy.defaultOptions = {};
    mockery.registerMock('@cypress/browserify-preprocessor', browserifySpy);
  }

  function mockEsLintCliEngine() {
    function mockCliEngine() {
      this.executeOnFiles = executeOnFilesSpy;
    }
    lintingReport = {
      errorCount: 0,
      warningCount: 0
    };
    executeOnFilesSpy = sinon.spy(() => lintingReport);
    mockery.registerMock('eslint', { CLIEngine: mockCliEngine });
  }

  function mockLogger() {
    logSpy = sinon.spy();
    function mockLogger() {
      this.log = logSpy;
    }
    mockery.registerMock('./logger', mockLogger);
  }

  function mockChalk() {
    colourSpies = {
      red: sinon.spy(string => string),
      yellow: sinon.spy(string => string),
      gray: sinon.spy(string => string),
      white: sinon.spy(string => string),
    };
    chalkSpy = { ...colourSpies, bold: { ...colourSpies } };
    mockery.registerMock('chalk', chalkSpy);
  }

  beforeEach(() => {
    file = { filePath, outputPath };
    browserifyFileSpy.resetHistory();
    browserifySpy.resetHistory();
    executeOnFilesSpy.resetHistory();
    relativeSpy.resetHistory();
    for (const colour in colourSpies) {
      colourSpies[colour].resetHistory();
    }
    logSpy.resetHistory();
  });

  after(() => {
    mockery.deregisterMock('@cypress/browserify-preprocessor');
    mockery.deregisterMock('eslint');
    mockery.deregisterMock('path');
    mockery.deregisterMock('chalk');
    mockery.disable();
  });

  function assertMessageLogged(message, type) {
    let expected = `${message.line}:${message.column}${type}${message.message}${message.ruleId}`;
    expected = expected.replace(/\s/g, '');
    sinon.assert.calledWithMatch(logSpy, value => value.replace(/\s/g, '') === expected);
  }

  it('runs linting on file', () => {
    cypressEslint(file);
    sinon.assert.calledWith(executeOnFilesSpy, [filePath]);
  });

  it('uses default preprocessor if none provided', () => {
    const preprocessed = cypressEslint(file);
    sinon.assert.calledWith(browserifySpy, browserifySpy.defaultOptions);
    sinon.assert.calledWith(browserifyFileSpy, file);
    sinon.assert.match(preprocessed, 'preprocessed file!');
  });

  it('uses passed in preprocessor when provided', () => {
    const customPreprocessorFileSpy = sinon.spy(() => 'custom preprocessed file!');
    const customPreprocessor = sinon.spy(() => customPreprocessorFileSpy);
    const preprocessed = cypressEslint(file, customPreprocessor());

    sinon.assert.notCalled(browserifySpy);
    sinon.assert.calledWith(customPreprocessorFileSpy, file);
    sinon.assert.match(preprocessed, 'custom preprocessed file!');
  });

  context('Linting errors', () => {
    beforeEach(() => {
      lintingReport = {
        errorCount: 1,
        results: [{
          messages: [{
            line: 24,
            column: 17,
            severity: 2,
            message: 'Expected indentation of 2 spaces but found 4',
            ruleId: 'indent'
          }]
        }]
      };
    });

    it('logs title "ERROR in ..." with full file path to console', () => {
      cypressEslint(file);
      sinon.assert.calledWith(logSpy, `\nERROR in ${filePath}`);
    });

    it('logs more readable relative path to console', () => {
      cypressEslint(file);
      sinon.assert.calledWith(logSpy, `\n${relativeFilePath}`);
    });

    it('uses red logging colour', () => {
      cypressEslint(file);
      sinon.assert.called(colourSpies.red);
    });

    it('logs each linting error', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 51,
              column: 12,
              severity: 2,
              message: 'Strings must use singlequote',
              ruleId: 'quotes'
            }
          ]
        }]
      };
      cypressEslint(file);

      assertMessageLogged(lintingReport.results[0].messages[0], 'error');
      assertMessageLogged(lintingReport.results[0].messages[1], 'error');
    });

    it('doesn\'t log linting warnings', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 54,
              column: 9,
              severity: 1,
              message: '"a" is not defined',
              ruleId: 'no-undef'
            }
          ]
        }]
      };
      cypressEslint(file);

      logSpy.getCalls().forEach((call) => {
        const notCalledWithWarningMessage = call.notCalledWithMatch(value => value.indexOf('"a" is not defined') !== -1);
        sinon.assert.match(notCalledWithWarningMessage, true);
      });
    });

    it('neatly aligns sections of log messages', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 551,
              column: 12,
              severity: 2,
              message: 'Strings must use singlequote',
              ruleId: 'quotes'
            },
            {
              line: 1,
              column: 1,
              severity: 2,
              message: 'Strings must use singlequote',
              ruleId: 'quotes'
            }
          ]
        }]
      };
      cypressEslint(file);

      const typeIdxs = [];
      const ruleIdxs = [];
      logSpy.getCalls().forEach((call) => {
        const message = call.args[0];
        if (message.indexOf('error') !== -1) {
          typeIdxs.push(message.indexOf('error'));
          ruleIdxs.push(message.lastIndexOf(' ') + 1);
        }
      });

      sinon.assert.match(typeIdxs, sinon.match.every(sinon.match(typeIdxs[0])));
      sinon.assert.match(ruleIdxs, sinon.match.every(sinon.match(ruleIdxs[0])));
    });
  });

  context('Linting warnings', () => {
    beforeEach(() => {
      lintingReport = {
        warningCount: 1,
        results: [{
          messages: [{
            line: 24,
            column: 17,
            severity: 1,
            message: '"a" is not defined',
            ruleId: 'no-undef'
          }]
        }]
      };
    });

    it('logs title "WARNING in ..." with full file path to console', () => {
      cypressEslint(file);
      sinon.assert.calledWith(logSpy, `\nWARNING in ${filePath}`);
    });

    it('logs more readable relative path to console', () => {
      cypressEslint(file);
      sinon.assert.calledWith(logSpy, `\n${relativeFilePath}`);
    });

    it('uses yellow logging colour', () => {
      cypressEslint(file);
      sinon.assert.called(colourSpies.yellow);
    });

    it('logs each linting warning', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 51,
              column: 12,
              severity: 1,
              message: 'Unexpected unnamed function',
              ruleId: 'func-names'
            }
          ]
        }]
      };
      cypressEslint(file);

      assertMessageLogged(lintingReport.results[0].messages[0], 'warning');
      assertMessageLogged(lintingReport.results[0].messages[1], 'warning');
    });

    it('doesn\'t log linting errors', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 54,
              column: 9,
              severity: 2,
              message: 'Expected indentation of 2 spaces but found 4',
              ruleId: 'indent'
            }
          ]
        }]
      };
      cypressEslint(file);

      logSpy.getCalls().forEach((call) => {
        const notCalledWithErrorMessage = call.notCalledWithMatch(value => value.indexOf('Expected indentation of 2 spaces but found 4') !== -1);
        sinon.assert.match(notCalledWithErrorMessage, true);
      });
    });

    it('neatly aligns sections of log messages', () => {
      lintingReport = {
        ...lintingReport,
        results: [{
          messages: [
            ...lintingReport.results[0].messages,
            {
              line: 551,
              column: 12,
              severity: 1,
              message: 'Unexpected unnamed function',
              ruleId: 'func-names'
            },
            {
              line: 1,
              column: 1,
              severity: 1,
              message: 'Unexpected unnamed function',
              ruleId: 'func-names'
            }
          ]
        }]
      };
      cypressEslint(file);

      const typeIdxs = [];
      const ruleIdxs = [];
      logSpy.getCalls().forEach((call) => {
        const message = call.args[0];
        if (message.indexOf('warning') !== -1) {
          typeIdxs.push(message.indexOf('warning'));
          ruleIdxs.push(message.lastIndexOf(' ') + 1);
        }
      });

      sinon.assert.match(typeIdxs, sinon.match.every(sinon.match(typeIdxs[0])));
      sinon.assert.match(ruleIdxs, sinon.match.every(sinon.match(ruleIdxs[0])));
    });
  });
});
