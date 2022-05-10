import {BotAction} from "../base_action";
import {sendSlackMessage} from "../../integrations/slack/messages";
import {botConfig} from "../../consts";
import {ASKS_ACTIONS} from "./index";

export class Help implements BotAction {
    getHelpText(): string {
        return "Return information about currently available commands (`help`, `what can you do`)";
    }

    isEnabled(): boolean {
        // This action should always be available
        return true;
    }

    doesMatch(event: any): boolean {
        return (
            event.text.includes('help') || event.text.includes('what can you do')
        );
    }

    async performAction(event: any): Promise<void> {
        let message = 'botConfig.ACTION_WHAT_CAN_YOU_DO_TEXT\n'
        // TODO: This currently says what is enabled. Maybe also say what actions are disabled (and what they can do).
        ASKS_ACTIONS.forEach((action) => {
            message += `• ${action.getHelpText()}\n`;
        });

        await sendSlackMessage(
            message, event.channel,
            event.thread_ts
        );
    }
}