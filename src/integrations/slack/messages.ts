import {
  ChatGetPermalinkArguments,
  ChatPostMessageArguments,
  SectionBlock,
} from "@slack/web-api";

import { Block, KnownBlock } from "@slack/types";
import { BOT_ID, SLACK_USER_FORMAT, SlackWebClient } from "./consts";
import { botConfig } from "../../bot_config";

// Post a message to the channel, and await the result.
// Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
export const sendSlackMessage = async function (
  text: string,
  channel: string,
  thread_ts: string = "",
  blocks: (KnownBlock | Block)[] = []
) {
  const options: ChatPostMessageArguments = {
    text: text,
    channel: channel,
    username: botConfig.BOT_NAME,
    icon_url: botConfig.BOT_IMAGE_URL,
  };

  // If there are blocks, add them
  if (blocks) {
    options["blocks"] = blocks;
  }

  // If we're in a thread, reply in the thread
  if (thread_ts) {
    options["thread_ts"] = thread_ts;
  }
  const result = await SlackWebClient.chat.postMessage(options);
  // console.log(result);
  // The result contains an identifier for the message, `ts`.
  console.log(
    `Successfully send message ${result.ts} in conversation ${channel}`
  );
};

export const createBlock = function (text: string): SectionBlock {
  // TODO: This currently only supports SectionBlock. Make it more dynamic?
  const result: SectionBlock = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: text,
    },
  };

  // console.log("Text is - ", text);
  return result;
};

export const getUserIDInText = function (text: string) {
  // Remove the bot id and look for other slack users
  // TODO: This currently has a 'bug' where we can grab multiple users and compliment multiple users in one go
  //       it can create a corrupted output for 'compliment @Yossi and also say hi to @Zigi
  const slack_users = text.replace(`<@${BOT_ID}>`, "").match(SLACK_USER_FORMAT);

  // TODO: This will return the first user_id that is not the bot. If there's more than 1 user, we'll return the first one
  // TODO: Verify that this is an actual user

  // TODO: Make this pretty
  if (!slack_users) {
    return "";
  }

  return slack_users[0];
};

export const getMessagePermalink = async function (
  channel_id: string,
  message_ts: string
): Promise<string> {
  const options: ChatGetPermalinkArguments = {
    channel: channel_id,
    message_ts: message_ts,
  };

  const response = await SlackWebClient.chat.getPermalink(options);
  if (response.ok) {
    return response.permalink;
  } else {
    console.log("getMessagePermalink got bad response", response);
    return "";
  }
};
