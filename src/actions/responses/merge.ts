import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = [
  "https://media.giphy.com/media/xT9Igr9F9m1wlE6oqA/giphy.gif",
  "https://media.giphy.com/media/l0D7nT1fosvpdvQnC/giphy.gif",
  "https://media.giphy.com/media/xT0GqH01ZyKwd3aT3G/giphy.gif",
  "https://media.giphy.com/media/3oKIPiW5jADxCcwVXi/giphy.gif",
  "https://media.giphy.com/media/xT5LMuoIXb3jnlqgww/giphy.gif",
  "https://media.giphy.com/media/dtiF6Tyhfl6H15wTEH/giphy.gif",
  "https://media.giphy.com/media/f4OBJD88w2M7MUVSqf/giphy.gif",
];

// TODO: Add a chaos element (only show gif at X % of the cases)

export class MergeResponse implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.startsWith("Pull request merged");
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
