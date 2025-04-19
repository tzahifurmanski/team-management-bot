import { BotAction } from "../base_action.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import { getRandomFromArray } from "../utils.js";
import { botConfig } from "../../settings/server_consts.js";

const GIFS: string[] = botConfig.RESPONSE_FOLKS_POOL;

export class FolksResponse implements BotAction {
  getHelpText(): string {
    return "Post a funny gif when someone says 'folks'";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return event.text.toLowerCase().startsWith("folks");
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    const gif = getRandomFromArray(GIFS);

    await sendSlackMessage(
      slackClient,
      gif,
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts,
    );
  }
}
