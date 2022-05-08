import { getRandomFromArray } from "../utils";
import { BotAction } from "../base_action";
import {botConfig} from "../../consts";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const GIFS = botConfig.RESPONSE_HELP_POOL;

// TODO: Add a chaos element (only show gif at X % of the cases)
export class HelpResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when someone asks for help";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

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
