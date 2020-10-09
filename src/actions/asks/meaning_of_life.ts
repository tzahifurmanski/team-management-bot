import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

export class MeaningOfLife implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.includes("meaning of life");
  }

  async performAction(event: any): Promise<void> {
    await sendSlackMessage(
      `42`,
      event.channel,
      event.thread_ts ? event.thread_ts : event.ts
    );
  }
}
