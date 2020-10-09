import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");
const config = require("../../../config.json");

const TEAM_NAME = config.TEAM_NAME;
const BOT_NAME = config.BOT_NAME;
const BOT_DESCRIPTION = config.BOT_DESCRIPTION;

export class IntroduceYourself implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.includes("introduce yourself");
  }

  async performAction(event: any): Promise<void> {
    await sendSlackMessage(
      `Hi, I'm ${BOT_NAME}, ${BOT_DESCRIPTION} I serve at the pleasure of ${TEAM_NAME}`,
      event.channel,
      event.thread_ts
    );
  }
}
export const introduce_yourself_action = async function (event: any) {};
