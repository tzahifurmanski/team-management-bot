// Return the team that has the given channel ID. If no team has the given channel ID, return the first team in the list. If there are no teams, return an empty object.
import { Team, getTeamsList } from "./team_consts.js";

export function isTeam(obj: any): obj is Team {
  return (
    "ask_channel_id" in obj &&
    "ask_channel_name" in obj &&
    "ask_channel_cron" in obj &&
    "allowed_bots" in obj &&
    "zendesk_channel_id" in obj &&
    "zendesk_channel_name" in obj &&
    "zendesk_monitored_view_id" in obj &&
    "zendesk_aggregated_field_id" in obj &&
    "zendesk_field_id" in obj &&
    "zendesk_field_values" in obj &&
    "zendesk_channel_cron" in obj
  );
}

// This receives a key and says if we have at least one team that for this key has a value that is not null
export const isValueInTeams = (
  value: keyof Team,
  teams_list = getTeamsList(),
): boolean => {
  return Array.from(teams_list.values()).some((team) => team[value]);
};

// This receives a value and a key and returns the first team that has this value for this key
// TODO: if there's more than 1 element, only the first returns. Think if that's a problem
export const findTeamByValue = (
  value: string,
  key: keyof Team,
  teams_list = getTeamsList(),
): Team | undefined => {
  return Array.from(teams_list.values()).find((team) => team[key] === value);
};

// TODO: Handle a case of an empty teams array / index out of bounds and add UT
export const getTeamByIndex = (
  teams_list = getTeamsList(),
  index = 0,
): Team => {
  return Array.from(teams_list.values())[index];
};
