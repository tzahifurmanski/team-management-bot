import { BotAction } from "./actions/base_action";
import { ASKS_ACTIONS } from "./actions/asks";
import { RESPONSE_ACTIONS } from "./actions/responses";
import { sendSlackMessage } from "./integrations/slack/messages";
import { BOT_RESPONSES_CHANNELS } from "./consts";

// This method handles events that are posted directly inside a channel
export const handleChannelEvent = async (event: any, client: any) => {
  // Limit this functionality to specific channels (otherwise we'll spam tons of channels)
  if (!BOT_RESPONSES_CHANNELS.includes(event.channel)) {
    // console.log(
    //   `Message identified in a none supported channel ${event.channel}.` +
    //     `We only want to monitor specific channels for reactions.`
    // );
    return;
  }

  // console.log("Got new channel event", event);

  if (!(await runActions(event, client, RESPONSE_ACTIONS))) {
    // console.log("Unsupported event", JSON.stringify(event));
  }
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is mentioned)
export const handleDirectEvent = async (event: any, client: any) => {
  // console.log("Got new direct event", event.type, event);

  if (!(await runActions(event, client, ASKS_ACTIONS))) {
    console.log("Unsupported text/event", event.text, JSON.stringify(event));

    // TODO: Save the unsupported event for later debrief
    // TODO: Reply to unsupported events with a quote
  }
};

async function runActions(event: any, client: any, actions: BotAction[]) {
  const result = actions.find((action: BotAction) => action.doesMatch(event));
  if (result) {
    try {
      console.log(
        `Got a '${result.constructor.name}' event in channel ${event.channel}!`
      );

      await result.performAction(event, client);
    } catch (E) {
      console.error(
        `Had an error while executing ${result.constructor.name} action - ${E}!`
      );
      await sendSlackMessage(
        client,
        `Sorry, had an error while performing the action.. :sad:\nMaybe check my logs?`,
        event.channel,
        event.thread_ts ? event.thread_ts : event.ts
      );
    }

    // Return true even if there was an error
    return true;
  }

  return false;
}
