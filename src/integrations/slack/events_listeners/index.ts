import { ENABLE_ASK_SUMMARY } from "../../../consts";

const { messageCallback } = require("./message");
const { appMentionCallback } = require("./app_mention");
const { reactionAddedCallback } = require("./reaction_added");

module.exports.register = (app: any) => {
  console.log("Setting up events...");

  app.event("message", messageCallback);
  app.event("app_mention", appMentionCallback);

  if (ENABLE_ASK_SUMMARY) {
    app.event("reaction_added", reactionAddedCallback);

    // TODO: Handle a reaction removed, in case a task marked as DONE is not longer done
  }

  // All errors in listeners are caught here. If this weren't caught, the program would terminate.
  app.error((error: any) => {
    // TODO: Add better error handling
    console.error(error);
  });

  console.log("Done setting up events.");
};
