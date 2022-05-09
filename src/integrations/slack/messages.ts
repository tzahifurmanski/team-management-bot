import {
  Button,
  ChatGetPermalinkArguments,
  ChatPostMessageArguments, ContextBlock,
  SectionBlock,
} from "@slack/web-api";

import {
  Block,
  DividerBlock,
  KnownBlock, MrkdwnElement,
} from "@slack/types";
import { BOT_ID, SLACK_USER_FORMAT, SlackWebClient } from "./consts";
import {botConfig} from "../../consts";

// Post a message to the channel, and await the result.
// Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
export const sendSlackMessage = async (
    text: string,
    channel: string,
    threadTS: string = "",
    blocks: (KnownBlock | Block)[] = [],
    disableUnfurl = false
) => {
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

  // If there are blocks, send only 50 at each message
  if (blocks && blocks.length > 0) {
    let i,
      j,
      chunk = 50; // Max number of blocks Slack allows to send in 1 message
    for (i = 0, j = blocks.length; i < j; i += chunk) {
      // Get blocks batch up to the size of a chunk
      options["blocks"] = blocks.slice(i, i + chunk);
      const result = await SlackWebClient.chat.postMessage(options);
      console.log(
        `Successfully send message ${result.ts} in conversation ${channel}`
      );
    }
  }
  // If there are no blocks, just send the message
  else {
    const result = await SlackWebClient.chat.postMessage(options);
    console.log(
      `Successfully send message ${result.ts} in conversation ${channel}`
    );
  }
};

export const createSectionBlock = (
    text?: string,
    fields?: any[],
    accessory?: Button
): SectionBlock => {
  // TODO: This currently only supports SectionBlock. Make it more dynamic?
  const section : SectionBlock = {
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


export const createText = (text : string): MrkdwnElement => ({
  type: "mrkdwn",
  text
})

export const createDivider = (): DividerBlock => ({
  "type": "divider"
})

export const createButton = (text: string, url: string, value?: string): Button => ({
    "type": "button",
    "text": {
      "type": "plain_text",
      "text": text,
      "emoji": true
    },
    "value": value,
    "url": url,
    "action_id": "button-action"
  // }
})

export const createContext = (text: string): ContextBlock => ({
  "type": "context",
  "elements": [
    {
      "type": "plain_text",
      "text": text
    }
  ]
})


export const getUserIDInText = function (text: string) {
  // Remove the bot id and look for other slack users
  // TODO: This currently has a 'bug' where we can grab multiple users and compliment multiple users in one go
  //       it can create a corrupted output for 'compliment @Yossi and also say hi to @Zigi
  const slackUsers = text.replace(`<@${BOT_ID}>`, "").match(SLACK_USER_FORMAT);

  // TODO: This will return the first user_id that is not the bot. If there's more than 1 user, we'll return the first one
  // TODO: Verify that this is an actual user

  return slackUsers ? slackUsers[0] : "";
};

export const getMessagePermalink = async (channelId: string, messageTS: string): Promise<string> => {
  const options: ChatGetPermalinkArguments = {
    channel: channelId,
    message_ts: messageTS,
  };
  try {
    const response = await SlackWebClient.chat.getPermalink(options);
    if (response.ok) {
      return response.permalink;
    } else {
      console.log("getMessagePermalink got bad response", response);
      return "";
    }
  } catch (error) {
    console.log("Error in message", messageTS, error);
    return "";
  }
};
