import { BotAction } from "../base_action.js";
import { BOT_SLACK_ID } from "../../settings/server_consts.js";
import { sanitizeCommandInput } from "../../integrations/slack/utils.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import pkg from "../../../package.json" with { type: "json" };

export class Status implements BotAction {
  getHelpText(): string {
    return "`status` - Returns the current status and version of the bot.";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return sanitizeCommandInput(event.text).toLowerCase() === "status";
  }

  async performAction(event: any, slackClient: any): Promise<void> {
    await sendSlackMessage(
      slackClient,
      `Bot <@${BOT_SLACK_ID}> (ID *${BOT_SLACK_ID}*), version ${pkg.version}.`,
      event.channel,
      event.thread_ts,
    );
  }
}
