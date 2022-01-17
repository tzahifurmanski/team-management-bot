import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";
import {botConfig} from "../../consts";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = botConfig.RESPONSE_MERGE_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)

export class MergeResponse implements BotAction {
  doesMatch(event: any): boolean {
    return (
      event.bot_profile?.name === "GitHub" &&
      event.attachments?.length > 0 &&
      event.attachments[0].pretext.startsWith("Pull request merged")
    );
  }

  async performAction(event: any): Promise<void> {
    if (event.thread_ts) {
      // This is a thread, do nothing. Not sure if I need it
      return;
    }
    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    await sendSlackMessage(gif, event.channel, event.ts);
  }
}
