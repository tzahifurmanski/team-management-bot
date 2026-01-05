import type { WebClient } from "@slack/web-api";
import type {
  MessageEvent,
  GenericMessageEvent,
  AppMentionEvent,
} from "@slack/types";
import { runActions } from "../../actions/base_action.js";
import { ASKS_ACTIONS } from "../../actions/asks/index.js";
import { RESPONSE_ACTIONS } from "../../actions/responses/index.js";
import {
  BOT_RESPONSES_CHANNELS,
  logger,
  BOT_SLACK_ID,
} from "../../settings/server_consts.js";

// Event type for direct interactions (DM or app mention)
// Uses GenericMessageEvent since callers filter out special message subtypes
export type DirectEvent = GenericMessageEvent | AppMentionEvent;

// This method handles events that are posted directly inside a channel
export const handleChannelEvent = async (
  event: MessageEvent,
  client: WebClient,
) => {
  // Limit this functionality to specific channels (otherwise we'll spam tons of channels)
  if (!BOT_RESPONSES_CHANNELS.includes(event.channel)) {
    logger.trace(
      `Message identified in a none supported channel ${event.channel}.` +
        `We only want to monitor specific channels for reactions.`,
    );
    return;
  }

  logger.debug("Got new channel event", event);

  if (!(await runActions(event, client, RESPONSE_ACTIONS))) {
    logger.trace("Unsupported event", JSON.stringify(event));
  }
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is mentioned)
export const handleDirectEvent = async (
  event: DirectEvent,
  client: WebClient,
) => {
  logger.trace("Got new direct event", event.type, event);

  // Ensure event has text before processing
  if (!event.text) {
    logger.debug("Event has no text, ignoring");
    return;
  }

  // Remove the bot mention from the text
  event.text = event.text.replace(`<@${BOT_SLACK_ID}>`, "").trim();

  if (!(await runActions(event, client, ASKS_ACTIONS))) {
    logger.info("Unsupported text/event", event.text, JSON.stringify(event));

    // TODO: Save the unsupported event for later debrief
    // TODO: Reply to unsupported events with a quote
  }
};
