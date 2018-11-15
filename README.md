# cypress-eslint-preprocessor
Cypress plugin that will run linting via ESLint on your spec files and display linting errors in the console.

This uses the `file:preprocessor` event which means it will lint files as they are loaded by Cypress. If you are running your full suite of tests, all the spec files will be linted, but if you are only running tests on a specific test suite then only the files that it loads will be linted.

This will use the `.eslintrc` file in your project root combined with the `.eslintrc` file in your Cypress directory (if you have one). This means you can easily set custom rules just for your Cypress spec files.

After linting has been run, it will call the default [Cypress browserify preprocessor](https://github.com/cypress-io/cypress-browserify-preprocessor) on the file, you can override this by passing in another preprocessor.

## Example
![example](https://chinchiheather.github.io/images/cypress-eslint-preprocessor/img/console-example.png)

## Install

```bash
# npm
npm install cypress-eslint-preprocessor --save-dev

# yarn
yarn add cypress-eslint-preprocessor --dev
```

## Usage

If you are not currently using another plugin on the `file:preprocessor` event
```javascript
// cypress/plugins/index.js

const cypressEslint = require('cypress-eslint-preprocessor');

module.exports = (on) => {
    on('file:preprocessor', cypressEslint());
};

```

If you are using another plugin on the `file:preprocessor` event, pass this in as a parameter to cypress eslint
```javascript
// cypress/plugins/index.js

const cypressEslint = require('cypress-eslint-preprocessor');
const cypressBabelEsX = require('cypress-babel-esx-preprocessor');

module.exports = (on) => {
    on('file:preprocessor', cypressEslint(cypressBabelEsX()));
};
```
