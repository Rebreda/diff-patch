let matchedPatterns = [];

/**
 *
 *
 */
async function loadOptions() {
  return await browser.storage.local.get('urlPatterns');
  // e.preventDefault();
}


// function save() {
//   localStorage['url_patterns'] = matchedPatterns.join('\n');
// }

const shouldInject = function(url) {
  for (let i = 0; i < matchedPatterns.length; i++) {
    if (url.match(matchedPatterns[i])) {
      return true;
    }
  }
  return false;
};

browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.set_options) {
    matchedPatterns = loadOptions();
    save();
    return;
  }

  if (msg.get_options) {
    console.log('sending to options');
    sendResponse({
      patterns: loadOptions,
    });
    return;
  }
});

const doRender = function(tabId) {
  browser.tabs.executeScript(tabId, {
    file: 'cs.js',
  });
  browser.tabs.insertCSS(tabId, {
    file: 'cs.css',
  });
};

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    if (!shouldInject(tab.url)) {
      return;
    }

    doRender(tabId);
  }
});

/**
 *
 *
 */
function handleClick() {
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(function(tab) {
  handleClick();
  // browser.tabs.executeScript(
  //     tab.id,
  //     {
  //       code: 'typeof(renderContent) == \'undefined\'',
  //     },
  //     function(res) {
  //       if (res[0]) {
  //         doRender(tab.id);
  //       } else {
  //         browser.tabs.executeScript(tab.id, {
  //           code: 'document.body.classList.toggle(\'gvcrendered\')',
  //         });
  //       }
  //     },
  // );
});
