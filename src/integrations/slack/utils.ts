// Remove the name of the bot, in case it was mentioned
import {BOT_ID} from "./consts";
import {botConfig} from "../../consts";

export const sanitizeCommandInput = (text: string): string => {
    return text
        .replace(`<@${BOT_ID}> `, "")
        .trim();
}

export const isBotMessage = function (event: any): boolean {
    return (
        event.user === BOT_ID ||
        event.username === botConfig.BOT_NAME ||
        event.message?.username === botConfig.BOT_NAME
    );
};