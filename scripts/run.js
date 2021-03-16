const spawn = require("child_process").spawn;

(function run() {
  spawn("node", ["built/backend/app.js"], { stdio: "inherit" })
    .on("close", run);
})();
