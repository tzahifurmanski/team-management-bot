import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = [
  "https://media.giphy.com/media/xThuWcwceLECkXEkKs/giphy.gif",
  "https://media.giphy.com/media/A1RLR7qFez5du/giphy.gif",
  "https://media.giphy.com/media/xThuWoKw5OEcotAY9O/giphy.gif",
  "https://media.giphy.com/media/l2YOgvtL2Fq8McnJu/giphy.gif",
  "https://media.giphy.com/media/3orieT6Hpsj44lo35K/giphy.gif",
];

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
