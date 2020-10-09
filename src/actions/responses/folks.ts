import { BotAction } from "../base_action";
import { sendSlackMessage } from "../../integrations/slack/messages";

export class FolksResponse implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.toLowerCase().startsWith("folks");
  }

  async performAction(event: any): Promise<void> {
    await sendSlackMessage(
      "https://media.giphy.com/media/9D7Jr7o9TjKta/giphy.gif",
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts
    );
  }
}
