# check-pull-request

Using AWS Lambda you can make super-simple Pull Request Checks:

## Usage

```js
check(opts, handler);
```

```js
const opts = {
  appName: 'My App',
  appId: // from GitHub,
  secret: // set up with GitHub,
  bucket: // provision an S3 bucket to store a certificate for authenticating,
  key: // and specify the key
};
```

### handler

```js
const handler = async pr =>
/*
pr is an object that has properties such as repo, owner, headSha, baseRef

and helper functions:

getBody() - gets the body of the Pull Request
getHeadContent(path) -- gets the file at HEAD
getBaseContent(path) -- gets the file at the base
*/
```

## Example

```js
'use strict';

const check = require('check-pull-request');

module.exports.handler = check(opts, async pr => {
  return {
    conclusion: 'neutral',
    title: 'No opinion',
    summary: 'I did not check anything because I am an example!',
  };
});
```
