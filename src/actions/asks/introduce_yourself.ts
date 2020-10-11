import { BotAction } from "../base_action";

const { sendSlackMessage } = require("../../integrations/slack/messages");

const config = require("../../../config.json");
import { botConfig } from "../../bot_config";

const TEAM_NAME = config.TEAM_NAME;

export class IntroduceYourself implements BotAction {
  doesMatch(event: any): boolean {
    return event.text.includes("introduce yourself");
  }

  async performAction(event: any): Promise<void> {
    await sendSlackMessage(
      `${botConfig.ACTION_INTRODUCE_YOURSELF_TEXT} I serve at the pleasure of the ${TEAM_NAME} team.`,
      event.channel,
      event.thread_ts
    );
  }
}
export const introduce_yourself_action = async function (event: any) {};
