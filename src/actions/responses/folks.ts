import { BotAction } from "../base_action";
import { botConfig } from "../../bot_config";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { getRandomFromArray } from "../utils";

const GIFS: string[] = botConfig.RESPONSE_FOLKS_POOL;

export class FolksResponse implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.toLowerCase().startsWith("folks");
  }

  async performAction(event: any): Promise<void> {
    const gif = getRandomFromArray(GIFS);

    await sendSlackMessage(
      gif,
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts
    );
  }
}
