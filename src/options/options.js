// import './options.scss';
// require('./options.scss');


/**
 *
 *
 * @return {Promise}
 */
async function loadOptions() {
  return await browser.storage.local.get('urlPatterns');
}

/**
 *
 *
 * @param {*} initSettings
 */
function updateUI(initSettings) {
  // const stringArray = initSettings.url.value.split('\n');
  const arrayString = initSettings.url.join('\n');
  console.log(initSettings);
  document.querySelector('#ta-patterns').value = arrayString;
}

function onError(e) {
  console.error(e);
}

browser.storage.local.set({'url': ['test.com', 'asd.com']}).then((s) => {
  const initStorage = browser.storage.local.get();
  initStorage.then(updateUI, onError);
});


