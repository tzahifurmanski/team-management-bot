// Always load consts first
import { PORT } from "./consts";
import {
  loadSlackConfig,
  SLACK_SIGNING_SECRET,
} from "./integrations/slack/consts";

import { App, LogLevel } from "@slack/bolt";

const { version } = require("../package.json");

const { registerListeners } = require("./integrations/slack/listeners");

const boltApp = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
  logLevel: LogLevel.INFO,
});

registerListeners(boltApp);

(async () => {
  // Print server time
  console.log(
    `Server starting at ${new Date().toUTCString()}, version ${version}`
  );

  const loadResult = await loadSlackConfig(boltApp.client);
  if (!loadResult) {
    console.log("Loading failed!");
    process.exit(0);
  }

  // Start the app
  await boltApp.start(PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
