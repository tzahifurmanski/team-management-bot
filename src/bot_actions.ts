import { BotAction } from "./actions/base_action";
import { ASKS_ACTIONS } from "./actions/asks";
import { RESPONSE_ACTIONS } from "./actions/responses";
import {
  TEAM_CODE_REVIEW_CHANNEL_ID,
} from "./integrations/slack/consts";
import { sendSlackMessage } from "./integrations/slack/messages";
import {sendGenericError} from "./integrations/slack/utils";

// This method handles events that are posted directly inside a channel
export const handle_channel_event = async (event: any) => {
  // Limit this functionality to specific channels (otherwise we'll spam tons of channels)
  if (
    event.channel !== TEAM_CODE_REVIEW_CHANNEL_ID
  ) {
    // console.log("We only want to reply in the chatter or code review channels");
    return;
  }

  // console.log("Got new channel event", event);

  if (!(await runActions(event, RESPONSE_ACTIONS))) {
    // console.log("Unsupported event", event);
    // TODO: Save the unsupported event for later debrief
  }

  // TODO: Reply to good morning / great day / good weekend things
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is mentioned)
export const handle_direct_event = async (event: any) => {
  // console.log("Got new direct event", event.type, event);

  if (!(await runActions(event, ASKS_ACTIONS))) {
    await sendGenericError(event);

    console.log("Unsupported event", JSON.stringify(event));
    console.log(`Unsupported text \"${event.text}\"`);

    // TODO: Save the unsupported event for later debrief
    // TODO: Reply to unsupported events with a quote
  }
};

async function runActions(event: any, actions: BotAction[]) {
  const result = actions.find((action : BotAction) => action.doesMatch(event));
  if (result) {
    try {
      console.log(
        `Got a '${result.constructor.name}' event in channel ${event.channel}!`
      );
      await result.performAction(event);
    } catch (E) {
      console.error(
        `Had an error while executing ${result.constructor.name} action - ${E}!`
      );
      await sendSlackMessage(
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
