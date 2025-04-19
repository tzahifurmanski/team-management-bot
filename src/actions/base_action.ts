import { logger } from "../settings/server_consts.js";
import { sendSlackMessage } from "../integrations/slack/messages.js";

export interface BotAction {
  performAction(event: any, slackClient: any): Promise<void>;
  doesMatch(event: any): boolean;
  isEnabled(): boolean;
  getHelpText(): string;
}

// TODO: Can add here the ability to choose to ignore if this is done in a thread and to add a chaos element (only perform x percent of times)

export async function runActions(
  event: any,
  client: any,
  actions: BotAction[],
) {
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
