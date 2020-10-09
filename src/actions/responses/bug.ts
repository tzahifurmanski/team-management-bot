import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = [
  "https://media.giphy.com/media/3o7aCVYdxJUQmWI0z6/giphy.gif",
  "https://media.giphy.com/media/uVz7iwTMSDR5e/giphy.gif",
  "https://media.giphy.com/media/3o7WTwUXv4hsQ5bhEk/giphy.gif",
];

// TODO: Add a chaos element (only show gif at X % of the cases)

export class BugResponse implements BotAction {
  doesMatch(event: any): boolean {
    return (
      event.text.toLowerCase().includes("bug") ||
      event.text.toLowerCase().includes("issue")
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
