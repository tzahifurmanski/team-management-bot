import {BotAction} from "../base_action";
import {sendSlackMessage} from "../../integrations/slack/messages";
import {botConfig} from "../../consts";
import {sanitizeCommandInput} from "../../integrations/slack/utils";

export class Help implements BotAction {
    actionsList : BotAction[] = [];

    // To avoid dependencies deadlock, actions list will be set externally
    setActionsList(list : BotAction[]) {
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
        return (sanitizeCommandInput(event.text).startsWith("help") ||
            sanitizeCommandInput(event.text).startsWith("what can you do"));
    }

    // TODO: This currently says what is enabled. Maybe also say what actions are disabled (and what they can do).
    async performAction(event: any): Promise<void> {
        let message = `${botConfig.ACTION_WHAT_CAN_YOU_DO_TEXT}\n`
        this.actionsList.forEach((action) => {
            message += `• ${action.getHelpText()}\n`;
        });

        await sendSlackMessage(
            message, event.channel,
            event.thread_ts
        );
    }
}