import { BotAction } from "../base_action.js";
import { sendSlackMessage } from "../../integrations/slack/messages.js";
import { botConfig } from "../../settings/server_consts.js";
import { sanitizeCommandInput } from "../../integrations/slack/utils.js";

export class Help implements BotAction {
  actionsList: BotAction[] = [];

  // To avoid dependencies deadlock, actions list will be set externally
  setActionsList(list: BotAction[]) {
    this.actionsList = list;
  }

  getHelpText(): string {
    return "`help`/`what can you do` - Return information about currently available commands";
  }

  isEnabled(): boolean {
    // This action should always be available
    return true;
  }

  doesMatch(event: any): boolean {
    return (
      sanitizeCommandInput(event.text).startsWith("help") ||
      sanitizeCommandInput(event.text).startsWith("what can you do")
    );
  }

  // TODO: This currently says what is enabled. Maybe also say what actions are disabled (and what they can do).
  async performAction(event: any, slackClient: any): Promise<void> {
    let message = `${botConfig.ACTION_WHAT_CAN_YOU_DO_TEXT}\n`;
    this.actionsList.forEach((action) => {
      message += `• ${action.getHelpText()}\n`;
    });

    await sendSlackMessage(
      slackClient,
      message,
      event.channel,
      event.thread_ts,
    );
  }
}
