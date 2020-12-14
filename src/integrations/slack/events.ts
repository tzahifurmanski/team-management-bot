import { handle_channel_event, handle_direct_event } from '../../bot_actions';

import { BOT_ID, setSlackIds } from './consts';
import { getBotId, getConversationId } from './conversations';
import { botConfig } from '../../bot_config';

const config = require('../../../config.json');

const { createEventAdapter } = require('@slack/events-api');
const slackSigningSecret = config.SLACK_SIGNING_SECRET;
const slackEventsSetup = createEventAdapter(slackSigningSecret);

// Resolve the slack dynamic variables
export const loadSlackConfig = async function() {
  try {
    const botId = await getBotId();

    const teamAskChannelId = await getConversationId(
      config.TEAM_ASK_CHANNEL_NAME
    );

    setSlackIds(botId, teamAskChannelId);
  } catch (err) {
    console.log("Error while loading Slack Dynamic vars!", err);
    return false;
  }

  return true;
};

slackEventsSetup.on("app_mention", async (event: any) => {
  console.log("GOT AN APP MENTION!");
  await handle_direct_event(event);
});

slackEventsSetup.on("message", async (event: any) => {
  // Ignore messages that the bot post in the conversation
  if (
    event.user === BOT_ID ||
    event.username === botConfig.BOT_NAME ||
    event.message?.username === botConfig.BOT_NAME
  ) {
    console.log('Got a message from bot, ignoring...');
    return;
  }

  // Ignore specific messages types that were changed
  if (
    event.subtype === 'message_changed' ||
    event.subtype === 'message_deleted'
  ) {
    console.log('Got a message change event, ignoring...');
    return;
  }

  if (event.channel_type == "channel") {
    console.log("GOT A channel event!");
    await handle_channel_event(event);
  } else if (event.channel_type == "im") {
    console.log("GOT A MESSAGE!");
    await handle_direct_event(event);
  }
});

// All errors in listeners are caught here. If this weren't caught, the program would terminate.
slackEventsSetup.on("error", (error: any) => {
  // TODO: Add better error handling
  console.log("Had an error!", error.name); // TypeError
});

export const slackEvents = slackEventsSetup;
