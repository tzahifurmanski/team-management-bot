import { BotAction } from "../base_action.js";
import { getRandomFromArray } from "../utils.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import { botConfig } from "../../settings/server_consts.js";

const GIFS = botConfig.RESPONSE_I_THINK_POOL || [];

// TODO: Add a chaos element (only show gif at X % of the cases)

export class IThinkResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when someone says 'I think' or 'I don't think'";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.toLowerCase().includes("i think") ||
      event.text.toLowerCase().includes("i don't think")
    );
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    const gif = getRandomFromArray(GIFS);

    // Reply in a thread
    if (gif) await sendSlackMessage(slackClient, gif, event.channel, event.ts);
  }
}
