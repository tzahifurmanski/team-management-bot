import {
  Button,
  ChatGetPermalinkArguments,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  SectionBlock,
} from "@slack/web-api";

import { Block, DividerBlock, KnownBlock, MrkdwnElement } from "@slack/types";
import { BOT_SLACK_ID } from "../../settings/team_consts";
import { botConfig, logger } from "../../settings/server_consts";
import { ImageBlock } from "@slack/bolt";
import { SLACK_USER_FORMAT } from "./consts";

// Post a message to the channel, and await the result.
// Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
export const sendSlackMessage = async (
  slackClient: any,
  text: string,
  channel: string,
  threadTS = "",
  blocks: (KnownBlock | Block)[] = [],
  disableUnfurl = false,
): Promise<ChatPostMessageResponse> => {
  const options: ChatPostMessageArguments = {
    text,
    channel,
    username: botConfig.BOT_NAME,
    icon_url: botConfig.BOT_IMAGE_URL,
  };

  // If we've been asked to disable unfurling
  if (disableUnfurl) {
    options.unfurl_links = false;
    options.unfurl_media = false;
  }

  // If we're in a thread, reply in the thread
  if (threadTS) {
    options.thread_ts = threadTS;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let result: ChatPostMessageResponse;

  // If there are blocks, send only 50 at each message
  if (blocks && blocks.length > 0) {
    const chunk = 50; // Max number of blocks Slack allows to send in 1 message
    for (let i = 0, j = blocks.length; i < j; i += chunk) {
      // Get blocks batch up to the size of a chunk
      options.blocks = blocks.slice(i, i + chunk);
      result = await slackClient.chat.postMessage(options);
      logger.info(
        `Successfully send message ${result.ts} in conversation ${channel}`,
      );
    }
  }
  // If there are no blocks, just send the message
  else {
    result = await slackClient.chat.postMessage(options);
    logger.info(
      `Successfully send message ${result.ts} in conversation ${channel}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return result;
};

export const createSectionBlock = (
  text?: string,
  fields?: any[],
  accessory?: Button,
): SectionBlock => {
  // TODO: This currently only supports SectionBlock. Make it more dynamic?
  const section: SectionBlock = {
    type: "section",
  };

  if (text) {
    section.text = createText(text);
  }

  if (fields) {
    section.fields = fields;
  }

  if (accessory) {
    section.accessory = accessory;
  }

  return section;
};

export const createText = (text: string): MrkdwnElement => ({
  type: "mrkdwn",
  text,
});

export const createDivider = (): DividerBlock => ({
  type: "divider",
});

export const createImageBlock = (
  alt_text: string,
  image_url: string,
  title?: string,
): ImageBlock => {
  const section: ImageBlock = {
    type: "image",
    image_url,
    alt_text,
  };

  if (title) {
    section.title = {
      type: "plain_text",
      text: title,
    };
  }

  return section;
};

export const getUserIDInText = (text: string) => {
  // Remove the bot id and look for other slack users
  // TODO: This currently has a 'bug' where we can grab multiple users and compliment multiple users in one go
  //       it can create a corrupted output for 'compliment @Yossi and also say hi to @Zigi
  const slackUsers = text
    .replace(`<@${BOT_SLACK_ID}>`, "")
    .match(SLACK_USER_FORMAT);

  // TODO: This will return the first user_id that is not the bot. If there's more than 1 user, we'll return the first one
  // TODO: Verify that this is an actual user

  return slackUsers ? slackUsers[0] : "";
};

export const getMessagePermalink = async (
  slackClient: any,
  channelId: string,
  messageTS: string,
): Promise<string> => {
  const options: ChatGetPermalinkArguments = {
    channel: channelId,
    message_ts: messageTS,
  };
  try {
    const response = await slackClient.chat.getPermalink(options);
    if (response.ok) {
      return response.permalink;
    } else {
      logger.info("getMessagePermalink got bad response", response);
      return "";
    }
  } catch (error) {
    logger.error("Error in message", messageTS, error);
    return "";
  }
};
