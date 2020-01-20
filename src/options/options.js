require('./options.scss');
/**
 * Replaces elements innterText by id with text.
 * @param {int} id The first number.
 * @param {string} text The second number.
 */
function replaceText(id, text) {
  document.getElementById(id).innerText = text;
}


/**
 * Passes back local values to background.js.
 */
function sendOptions() {
  const patterns = document
      .getElementById('ta-patterns')
      .value.trim()
      .split('\n');
  browser.runtime.sendMessage({
    set_options: {},
    options: {
      patterns: patterns,
    },
  });
}

/**
 * Loads values from background.js.
 */
function load() {
  replaceText('version', browser.runtime.getManifest().version);
  browser.runtime.sendMessage({get_options: {}}, function(opt) {
    document.getElementById('ta-patterns').value = opt.patterns.join('\n');
    document
        .getElementById('ta-patterns')
        .addEventListener('change', function(e) {
          sendOptions();
        });
  });
}

load();
