import { BotAction } from "./actions/base_action";
import { ASKS_ACTIONS } from "./actions/asks";
import { RESPONSE_ACTIONS } from "./actions/responses";
import { TEAM_ASK_CHANNEL_ID } from "./integrations/slack/consts";

// TODO: Convert events handling to new format: https://api.slack.com/changelog/2020-09-15-events-api-truncate-authed-users

// This method handles events that are posted directly inside a channel
export const handle_channel_event = async function (event: any) {
  // TODO: Limit this functionality to specific channels?
  if (event.channel == TEAM_ASK_CHANNEL_ID) {
    console.log(
      "This is the asks channel, we don't want to respond there just yet..."
    );
    return;
  }

  // console.log("Got new channel event", event);

  if (!(await runActions(event, RESPONSE_ACTIONS))) {
    // console.log("Unsupported event", event);
    // TODO: Save the unsupported event for later debrief
  }

  // TODO: Reply to good morning / great day / good weekend things
};

// This method handles events that are with direct interaction with the bot (like a DM or when the bot is tagged)
export const handle_direct_event = async function (event: any) {
  // console.log("Got new direct event", event.type, event);

  if (!(await runActions(event, ASKS_ACTIONS))) {
    // console.log("Unsupported event", event);
    // TODO: Save the unsupported event for later debrief
    // TODO: Reply to unsupported events with a quote
  }
};

async function runActions(event: any, actions: BotAction[]) {
  const result = actions.find((action) => action.doesMatch(event));
  if (result) {
    console.log(`Got a '${result.constructor.name}' command!`);
    await result.performAction(event);
    return true;
  }

  return false;
}
