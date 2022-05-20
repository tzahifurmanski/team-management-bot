import { BotAction } from '../base_action';
import {botConfig, TEAM_NAME} from "../../consts";
import {BOT_ID} from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

const { sendSlackMessage } = require('../../integrations/slack/messages');

export class Status implements BotAction {
  getHelpText(): string {
    return "Returns the current status and version of the bot.";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (sanitizeCommandInput(event.text).toLowerCase() === 'status');
  }

  async performAction(event: any): Promise<void> {
    await sendSlackMessage(
      `${BOT_ID} version ${process.env.npm_package_version} is up and running.`,
      event.channel,
      event.thread_ts
    );
  }
}