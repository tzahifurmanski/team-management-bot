// Remove the name of the bot, in case it was mentioned
import {botConfig} from "../../consts";
import {
    BOT_ID,
} from "./consts";
import {sendSlackMessage} from "./messages";

export const sanitizeCommandInput = (text: string): string => {
    return text
        .replace(`<@${BOT_ID}> `, "")
        .trim();
}

export const isBotMessage = (event: any): boolean => {
    return (
        event.user === BOT_ID ||
        event.username === botConfig.BOT_NAME ||
        event.message?.username === botConfig.BOT_NAME
    );
};

// Limit values from the profile to 3 words
const WORDS_LIMIT = 3;


export const getValueFromProfile = (profile: any, fieldId: string) : string => {
    const value = profile?.fields?.[fieldId]?.value ? profile.fields[fieldId].value : "";
    return value ? value.split(" ").splice(0,WORDS_LIMIT).join(" ") : "Unknown";
}

export const sendGenericError = async (event : any ) => {
    await sendSlackMessage(
        `Sorry, didn't quite catch that.. :(`,
        event.channel,
        event.thread_ts ? event.thread_ts : event.ts
    );
}
