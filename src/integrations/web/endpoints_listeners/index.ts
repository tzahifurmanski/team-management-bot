import healthcheck from "./healthcheck";
import { logger } from "../../../consts";

// Solution based off of: https://github.com/slackapi/bolt-js/issues/212
module.exports.register = (receiver: any) => {
  logger.debug("Setting up routes...");

  // Other web requests are methods on receiver.router
  receiver.router.get("/healthcheck", healthcheck);

  logger.debug("Done setting up routes.");
};
