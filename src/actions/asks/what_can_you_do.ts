import { BotAction } from '../base_action';
import { botConfig } from '../../bot_config';

const { sendSlackMessage } = require('../../integrations/slack/messages');

export class WhatCanYouDo implements BotAction {
  doesMatch(event: any): boolean {
    return (
      event.text.includes('what can you do') || event.text.includes('help')
    );
  }

  async performAction(event: any): Promise<void> {
    // TODO: Convert this to use the descriptions of actions / responses?
    await sendSlackMessage(
      botConfig.ACTION_WHAT_CAN_YOU_DO_TEXT,
      event.channel,
      event.thread_ts
    );
  }
}
