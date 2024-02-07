import { BotAction } from "./actions/base_action";
import { ASKS_ACTIONS } from "./actions/asks";
import { RESPONSE_ACTIONS } from "./actions/responses";
import { sendSlackMessage } from "./integrations/slack/messages";
import { BOT_RESPONSES_CHANNELS, logger } from "./consts";
import { BOT_ID } from "./integrations/slack/consts";

// This method handles events that are posted directly inside a channel
export const handleChannelEvent = async (event: any, client: any) => {
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
export const handleDirectEvent = async (event: any, client: any) => {
  logger.trace("Got new direct event", event.type, event);

  // Remove the bot mention from the text
  event.text = event.text = event.text.replace(`<@${BOT_ID}>`, "").trim();

  if (!(await runActions(event, client, ASKS_ACTIONS))) {
    logger.info("Unsupported text/event", event.text, JSON.stringify(event));

    // TODO: Save the unsupported event for later debrief
    // TODO: Reply to unsupported events with a quote
  }
};

async function runActions(event: any, client: any, actions: BotAction[]) {
  const result = actions.find((action: BotAction) => action.doesMatch(event));
  if (result) {
    try {
      logger.info(
        `Got a '${result.constructor.name}' event in channel ${event.channel}!`,
      );

      await result.performAction(event, client);
    } catch (E: any) {
      logger.error(
        `Had an error while executing ${result.constructor.name} action - ${E}!`,
      );

      // Handle a specific case where an operation is not allowed due to the bot not being part of the channel
      if (E.message === "An API error occurred: not_in_channel") {
        await sendSlackMessage(
          client,
          `I'm unable to perform this action, as I'm not part of the channel :sad:\nMaybe add me to the channel?`,
          event.channel,
          event.thread_ts ? event.thread_ts : event.ts,
        );
      } else {
        await sendSlackMessage(
          client,
          `Sorry, had an error while performing the action.. :sad:\nMaybe check my logs?`,
          event.channel,
          event.thread_ts ? event.thread_ts : event.ts,
        );
      }
    }

    // Return true even if there was an error
    return true;
  }

  return false;
}
