import { ENABLE_ASK_SUMMARY, logger } from "../../../settings/server_consts.js";
import { messageCallback } from "./message.js";
import { appMentionCallback } from "./app_mention.js";
import { reactionAddedCallback } from "./reaction_added.js";

export const register = (app: any) => {
  logger.info("Setting up events...");

  app.event("message", messageCallback);
  app.event("app_mention", appMentionCallback);

  if (ENABLE_ASK_SUMMARY) {
    app.event("reaction_added", reactionAddedCallback);

    // TODO: Handle a reaction removed, in case a task marked as DONE is not longer done
  }

  // All errors in listeners are caught here. If this weren't caught, the program would terminate.
  app.error((error: any) => {
    // TODO: Add better error handling
    logger.error(error);
  });

  logger.info("Done setting up events.");
};
