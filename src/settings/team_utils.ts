// Return the team that has the given channel ID. If no team has the given channel ID, return the first team in the list. If there are no teams, return an empty object.
import { Team, TEAMS_LIST } from "./team_consts";

export const getTeamByChannelID = (channelID: string): Team => {
  return TEAMS_LIST.get(channelID) || TEAMS_LIST.size > 0
    ? TEAMS_LIST.values().next().value
    : {}; // TODO: Replace this by undefined, so I can check if I got a team?
};
