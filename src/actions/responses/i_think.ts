import { BotAction } from "../base_action";
import { getRandomFromArray } from "../utils";
import { sendSlackMessage } from "../../integrations/slack/messages";
import {botConfig} from "../../consts";

const GIFS = botConfig.RESPONSE_I_THINK_POOL || [];

// TODO: Add a chaos element (only show gif at X % of the cases)

export class IThinkResponse implements BotAction {
  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.toLowerCase().includes("I think") ||
      event.text.toLowerCase().includes("I don't think")
    );
  }

  async performAction(event: any): Promise<void> {
    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    if (gif) await sendSlackMessage(gif, event.channel, event.ts);
  }
}
