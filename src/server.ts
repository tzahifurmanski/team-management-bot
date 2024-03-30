// Always load consts first
import { logger, PORT } from "./settings/server_consts";
import { loadConfig } from "./settings/team_consts";

import { App, ExpressReceiver } from "@slack/bolt";
import { getBoltLogLevel } from "./utils";
import { SLACK_SIGNING_SECRET } from "./integrations/consts";

const { version } = require("../package.json");


const receiver = new ExpressReceiver({ signingSecret: SLACK_SIGNING_SECRET });

const boltApp = new App({
  signingSecret: SLACK_SIGNING_SECRET,
  token: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
  logLevel: getBoltLogLevel(process.env.BOLT_LOG_LEVEL),
  receiver: receiver,
});


(async () => {
  // Print server time
  logger.info(
    `Server starting at ${new Date().toUTCString()}, version ${version}`,
  );

  const loadResult = await loadConfig(boltApp.client);
  if (!loadResult) {
    logger.error("Loading failed!");
    process.exit(0);
  }

  // Initiatlize the actions after teams loading, as some are enabled based on teams configurations
  //  This is because some actions (like AskChannelStatusForYesterday) are initialized during construction,
  //  so they don't wait for the RegisterListeners function
  const { registerListeners } = require("./listeners");
  registerListeners(boltApp, receiver);

  // Start the app
  await boltApp.start(PORT);

  logger.info("⚡️ Bolt app is running!");
})();
