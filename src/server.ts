// Always load consts first
import { getBoltLogLevel, logger, PORT } from "./consts";
import {
  loadSlackConfig,
  SLACK_SIGNING_SECRET,
} from "./integrations/slack/consts";

import { App, ExpressReceiver } from "@slack/bolt";

const { version } = require("../package.json");

const { registerListeners } = require("./listeners");

const receiver = new ExpressReceiver({ signingSecret: SLACK_SIGNING_SECRET });

const boltApp = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
  logLevel: getBoltLogLevel(process.env.BOLT_LOG_LEVEL),
  receiver: receiver,
});

registerListeners(boltApp, receiver);

(async () => {
  // Print server time
  logger.info(
    `Server starting at ${new Date().toUTCString()}, version ${version}`,
  );

  const loadResult = await loadSlackConfig(boltApp.client);
  if (!loadResult) {
    logger.error("Loading failed!");
    process.exit(0);
  }

  // Start the app
  await boltApp.start(PORT);

  logger.info("⚡️ Bolt app is running!");
})();
