import { healthcheck } from "./healthcheck.js";
import { logger } from "../../../settings/server_consts.js";

// Solution based off of: https://github.com/slackapi/bolt-js/issues/212
export const register = (receiver: any) => {
  logger.debug("Setting up routes...");

  // Other web requests are methods on receiver.router
  receiver.router.get("/healthcheck", healthcheck);

  logger.debug("Done setting up routes.");
};
