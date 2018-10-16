const GitHubApi = require('@octokit/rest'),
  Webhooks = require('@octokit/webhooks'),
  AWS = require('aws-sdk'),
  jwt = require('jsonwebtoken'),
  serverless = require('serverless-http');

const PullRequest = require('./pull-request');

module.exports = (opts = {}, handler) => {
  const { appId, appName, secret, bucket, key } = opts;

  const privateKey = (async () => {
    const file = await new AWS.S3().getObject({
      Bucket: bucket,
      Key: key,
    }).promise();
    return file.Body.toString('utf8');
  })();

  const authenticatedGithub = async (installationId) => {
    const cert = await privateKey;
    const github = new GitHubApi();
    const payload = {
      iat: Math.floor(new Date() / 1000),
      exp: Math.floor(new Date() / 1000) + 30,
      iss: appId
    };

    github.authenticate({
      type: 'app',
      token: jwt.sign(payload, cert, {
        algorithm: 'RS256'
      })
    });

    const installationToken = await github.apps.createInstallationToken({
      installation_id: installationId
    });

    github.authenticate({
      type: 'token',
      token: installationToken.data.token
    });

    return github;
  };

  const webhooks = new Webhooks({ secret });

  webhooks.on(['check_suite', 'check_run', 'pull_request'], async (id, name, event) => {
    const github = await authenticatedGithub(event.installation.id);
    const pr = new PullRequest(github, { name, event });

    const result = await handler(pr);

    if (result === false) {
      return;
    }

    const { annotations = [], conclusion, title, summary } = result;
    const { owner, repo, headSha } = pr;
    const params = {
      owner,
      repo,
      head_sha: headSha,
      status: 'completed',
      name: appName,
      conclusion,
      completed_at: new Date().toISOString(),
      output: {
        title,
        summary
      }
    };

    if (annotations.length) {
      params.output.annotations = annotations;
    }

    return await github.checks.create(params);
  });

  return serverless(webhooks.middleware);
};

