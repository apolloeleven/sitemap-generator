const Crawler = require('simplecrawler');
const has = require('lodash/has');

const discoverResources = require('./discoverResources');
const stringifyURL = require('./helpers/stringifyURL');

module.exports = (uri, options = {}) => {
  options.excludeExtensions = options.excludeExtensions || [];
  options.extraExcludeExtensions = options.extraExcludeExtensions || [];

  // excluded filetypes
  const exclude = options.excludeExtensions.concat(options.extraExcludeExtensions).join('|');

  const extRegex = new RegExp(`\\.(${exclude})$`, 'i');

  const crawler = new Crawler(uri.href);

  Object.keys(options).forEach(o => {
    if (has(crawler, o)) {
      crawler[o] = options[o];
    } else if (o === 'crawlerMaxDepth') {
      // eslint-disable-next-line
      console.warn(
        'Option "crawlerMaxDepth" is deprecated. Please use "maxDepth".'
      );
      if (!options.maxDepth) {
        crawler.maxDepth = options.crawlerMaxDepth;
      }
    }
  });

  // use custom discoverResources function
  crawler.discoverResources = discoverResources;

  // set crawler options
  // see https://github.com/cgiffard/node-simplecrawler#configuration
  crawler.initialPath = uri.pathname !== '' ? uri.pathname : '/';
  crawler.initialProtocol = uri.protocol.replace(':', '');

  //Basic Http Authentication. format: user:pass
  if (options.auth) {
    crawler.needsAuth = true;
    crawler.authUser = options.auth.split(':')[0];
    crawler.authPass = options.auth.split(':')[1];
  }
  // restrict to subpages if path is provided
  crawler.addFetchCondition(parsedUrl => {
    const initialURLRegex = new RegExp(`${uri.pathname}.*`);
    return stringifyURL(parsedUrl).match(initialURLRegex);
  });

  // file type exclusion
  crawler.addFetchCondition(parsedUrl => !parsedUrl.path.match(extRegex));

  return crawler;
};
