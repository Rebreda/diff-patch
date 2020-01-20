let matchedPatterns = [];

function load() {
  let str = localStorage['url_patterns'];
  if (!str) {
    str = [
      'https://issues[.]apache[.]org/jira/secure/attachment/[^/]*/.*[.]patch',
      'https://issues[.]apache[.]org/jira/secure/attachment/[^/]*/.*[.]txt',
      'https://github.com/[^/]*/[^/]*/commit/[^/]*[.]patch',
      'https://github.com/[^/]*/[^/]*/commit/[^/]*[.]diff',
      'https://gitlab.com/[^/]*/[^/]*/commit/[^/]*[.]patch',
      'https://gitlab.com/[^/]*/[^/]*/commit/[^/]*[.]diff',
      'https://patch-diff.githubusercontent.com/raw/.*[.]patch',
      'https://patch-diff.githubusercontent.com/raw/.*[.]diff',
    ].join('\n');
  }
  matchedPatterns = str.split('\n');
}
load();

function save() {
  localStorage['url_patterns'] = matchedPatterns.join('\n');
}

const shouldInject = function(url) {
  for (let i = 0; i < matchedPatterns.length; i++) {
    if (url.match(matchedPatterns[i])) {
      return true;
    }
  }
  return false;
};

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.set_options) {
    matchedPatterns = msg.options.patterns;
    save();
    return;
  }

  if (msg.get_options) {
    sendResponse({
      patterns: matchedPatterns,
    });
    return;
  }
});

const doRender = function(tabId) {
  chrome.tabs.executeScript(tabId, {
    file: 'cs.js',
  });
  chrome.tabs.insertCSS(tabId, {
    file: 'cs.css',
  });
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    if (!shouldInject(tab.url)) {
      return;
    }

    doRender(tabId);
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(
      tab.id,
      {
        code: 'typeof(g_gpv_rendered) == \'undefined\'',
      },
      function(res) {
        if (res[0]) {
          doRender(tab.id);
        } else {
          chrome.tabs.executeScript(tab.id, {
            code: 'document.body.classList.toggle(\'gvcrendered\')',
          });
        }
      },
  );
});
