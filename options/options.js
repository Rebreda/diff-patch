function ut(id, text) {
  document.getElementById(id).innerText = text;
}

ut("version", browser.runtime.getManifest().version);

function send_options() {
  var patterns = document
    .getElementById("ta-patterns")
    .value.trim()
    .split("\n");
  browser.runtime.sendMessage({
    set_options: {},
    options: {
      patterns: patterns
    }
  });
}

function load() {
  browser.runtime.sendMessage({ get_options: {} }, function(opt) {
    // console.log(JSON.stringify(opt))
    document.getElementById("ta-patterns").value = opt.patterns.join("\n");

    document
      .getElementById("ta-patterns")
      .addEventListener("change", function(e) {
        send_options();
      });
  });
}

load();
