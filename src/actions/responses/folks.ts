import { BotAction } from "../base_action";
import { sendSlackMessage } from "../../integrations/slack/messages";
import { getRandomFromArray } from "../utils";
import {botConfig} from "../../consts";

const GIFS: string[] = botConfig.RESPONSE_FOLKS_POOL;

export class FolksResponse implements BotAction {
  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

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
