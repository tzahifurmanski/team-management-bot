import { BotAction } from '../base_action';
import {BOT_ID} from "../../integrations/slack/consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";
const { sendSlackMessage } = require('../../integrations/slack/messages');
const { version } = require('../../../package.json');


export class Status implements BotAction {
  getHelpText(): string {
    return "`status` - Returns the current status and version of the bot.";
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
      `Bot <@${BOT_ID}> (ID *${BOT_ID}*), version ${version}.`,
      event.channel,
      event.thread_ts
    );
  }
}