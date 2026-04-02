function isValidGitUrl(url) {
  const gitUrlPattern =
    /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/[\w.-]+)*\/?(\/)?(\.git)?$/i;

  return gitUrlPattern.test(url);
}

function isValidDomain(url) {
  const allowedDomains = ['github.com', 'gitlab.com', 'bitbucket.org'];

  try {
    const { hostname } = new URL(url);
    return allowedDomains.some((domain) => hostname.endsWith(domain));
  } catch (error) {
    return false;
  }
}

function isSafeUrl(url) {
  try {
    const { hostname } = new URL(url);
    const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(
      hostname
    );
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    return !isPrivateIP && !isLocalhost;
  } catch (error) {
    return false;
  }
}

async function validateRepositoryUrl(repoUrl) {
  if (!isValidGitUrl(repoUrl)) {
    return false;
  }

  if (!isValidDomain(repoUrl)) {
    return false;
  }

  if (!isSafeUrl(repoUrl)) {
    return false;
  }

  return true;
}

module.exports = {
  validateRepositoryUrl,
};
