import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";
import { botConfig } from "../../bot_config";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = botConfig.RESPONSE_REVIEW_REQUEST_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)

export class ReviewRequestResponse implements BotAction {
  doesMatch(event: any): boolean {
    return (
      event.text.toLowerCase().startsWith("can i") ||
      event.text.toLowerCase().includes("please") ||
      event.text.toLowerCase().includes("help") ||
      event.text.toLowerCase().includes("review")
    );
  }

  async performAction(event: any): Promise<void> {
    if (event.thread_ts) {
      // This is a thread, do nothing
      return;
    }

    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    await sendSlackMessage(gif, event.channel, event.ts);
  }
}

export const review_request_action = async function (event: any) {};
