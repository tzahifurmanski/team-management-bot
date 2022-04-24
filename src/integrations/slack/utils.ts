// Remove the name of the bot, in case it was mentioned
import {botConfig} from "../../consts";
import {BOT_ID, USER_PROFILE_FIELD_ID_TEAM} from "./consts";

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

// Limit team name to 3 words
const TEAM_NAME_WORDS_LIMIT = 3;

export const getTeamNameFromProfile = function (
    profile: any
): string {
    const teamName = USER_PROFILE_FIELD_ID_TEAM && profile.fields && profile.fields[USER_PROFILE_FIELD_ID_TEAM]?.value ? profile.fields[USER_PROFILE_FIELD_ID_TEAM].value : "";
    return teamName ? teamName.split(" ").splice(0,TEAM_NAME_WORDS_LIMIT).join(" ") : "";
}