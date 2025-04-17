// src/server.ts
import "reflect-metadata"; // Required for TypeORM
import { initializeDatabase } from "./database/connection";
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
    `Server starting at ${new Date().toUTCString()}, version ${version}`
  );

  try {
    // Initialize database connection
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      logger.error("Database initialization failed!");
      process.exit(1);
    }

    // Load team configuration
    const loadResult = await loadConfig(boltApp.client);
    if (!loadResult) {
      logger.error("Loading failed!");
      process.exit(1);
    }

    // Initialize actions
    const { registerListeners } = require("./listeners");
    registerListeners(boltApp, receiver);

    // Start the app
    await boltApp.start(PORT);

    logger.info("⚡️ Bolt app is running!");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
})();
