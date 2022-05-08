import { BotAction } from '../base_action';
import {botConfig, TEAM_NAME} from "../../consts";

const { sendSlackMessage } = require('../../integrations/slack/messages');

export class IntroduceYourself implements BotAction {
  getHelpText(): string {
    return "Introduce myself (`introduce yourself`)";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      event.text.includes('introduce yourself') || event.text.includes('hello')
    );
  }

  async performAction(event: any): Promise<void> {
    // TODO: Is there a way to get this from the user's description?
    await sendSlackMessage(
      `${botConfig.ACTION_INTRODUCE_YOURSELF_TEXT} I serve at the pleasure of the ${TEAM_NAME} team.`,
      event.channel,
      event.thread_ts
    );
  }
}