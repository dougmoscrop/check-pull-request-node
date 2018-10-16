module.exports = class PullRequest {
  constructor(github, { name, event }) {
    this.github = github;
    this.owner = event.repository.owner.login;
    this.repo = event.repository.name;

    switch (name) {
      case 'check_suite':
        if (event.action === 'requested' || event.action === 'rerequested') {
          if (event.check_suite.pull_requests.length > 0) {
            this.headSha = event.check_suite.head_sha;
            this.baseRef = event.check_suite.pull_requests[0].base.ref;
            this.pullRequestNumber = event.check_suite.pull_requests[0].number;
          }
        }
      break;
      case 'check_run':
        if (event.action === 'rerequested') {
          if (event.check_run.check_suite.pull_requests.length > 0) {
            this.headSha = event.check_run.head_sha;
            this.baseRef = event.check_run.check_suite.pull_requests[0].base.ref;
            this.pullRequestNumber = event.check_run.check_suite.pull_requests[0].number;
          }
        }
      break;
      case 'pull_request':
        if (event.action === 'opened' || event.action === 'reopened') {
          this.headSha = event.pull_request.head.sha;
          this.baseRef = event.pull_request.base.ref;
          this.pullRequestNumber = event.pull_request.number;
          this.body = event.pull_request.body;
        }
      break;
    }
  }

  async getHeadContent(path) {
    return await this.getContent(path, this.headSha);
  }

  async getBaseContent(path) {
    return await this.getContent(path, this.baseRef)
  }

  async getContent(path, ref) {
    const { owner, repo } = this;
    return this.github.repos.getContent({ owner, repo, path, ref })
  }

  async getBody() {
    //check for comparison type from PR body
    if (this.body === undefined) {
      //need to fetch from PR since body doesn't come with check webhooks
      const pullRequest = await this.github.pullRequests.get({
        owner: this.owner,
        repo: this.repo,
        number: this.pullRequestNumber
      });
      return pullRequest.data.body;
    }

    return this.body;
  }
};
