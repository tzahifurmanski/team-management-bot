import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = [
  "https://media.giphy.com/media/3o7WTQ41Zz7v6WmRrO/giphy.gif",
  "https://media.giphy.com/media/xThuVZxBOqyDxJkm3u/giphy.gif",
];

// TODO: Add a chaos element (only show gif at X % of the cases)

export class HelpResponse implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.toLowerCase().includes("help");
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
