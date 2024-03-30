import { findTeamByValue, isTeam } from "../../src/settings/team_utils";
import { Team } from "../../src/settings/team_consts";

const team1: Team = {
  ask_channel_id: "1ID",
  ask_channel_name: "Team 1 ASKS",
  ask_channel_cron: "0,30 * * * *",
  ask_channel_cron_last_sent: new Date(),
  allowed_bots: [],
  zendesk_channel_id: "1ZDID",
  zendesk_channel_name: "ZENDESK CHANNEL NAME for First team",
  zendesk_monitored_view_id: "2353254353421",
  zendesk_aggregated_field_id: "23532543534",
  zendesk_field_id: "2352324",
  zendesk_field_values: ["vasdas"],
  zendesk_channel_cron: "ZENDESK_CRON1",

};

const team2: Team = {
  ask_channel_id: "2ID",
  ask_channel_name: "Team 2",
  ask_channel_cron: "0,35 * * * *",
  ask_channel_cron_last_sent: new Date(),
  allowed_bots: [],
  zendesk_channel_id: "2ZDID",
  zendesk_channel_name: "ZENDESK CHANNEL NAME for Second team",
  zendesk_monitored_view_id: "2353254353421",
  zendesk_aggregated_field_id: "23532543534",
  zendesk_field_id: "2352324",
  zendesk_field_values: ["vasdas"],
  zendesk_channel_cron: "ZENDESK_CRON2",
};

const team3: Team = {
  ask_channel_id: "3ID",
  ask_channel_name: "Team 3",
  ask_channel_cron: "0,40 * * * *",
  ask_channel_cron_last_sent: new Date(),
  allowed_bots: [],
  zendesk_channel_id: "3ZDID",
  zendesk_channel_name: "ZENDESK CHANNEL NAME for Third team",
  zendesk_monitored_view_id: "2353254353421",
  zendesk_aggregated_field_id: "23532543534",
  zendesk_field_id: "2352324",
  zendesk_field_values: ["vasdas"],
  zendesk_channel_cron: "ZENDESK_CRON3",
};

const teamsList: Map<string, Team> = new Map([
  [team1.ask_channel_id, team1],
  [team2.ask_channel_id, team2],
  [team3.ask_channel_id, team3],
]);

describe("findTeamByValue", () => {
  test("Should return the team with matching value for key 'ask_channel_id'", () => {
    const result = findTeamByValue("1ID", "ask_channel_id", teamsList);
    expect(result).toEqual(team1);
  });


  test("Should return the team with matching value for key 'ask_channel_cron'", () => {
    const result = findTeamByValue("0,35 * * * *", "ask_channel_cron", teamsList);
    expect(result).toEqual(team2);
  });

  test("Should return the team with matching value for key 'zendesk_channel_cron'", () => {
    const result = findTeamByValue("ZENDESK_CRON1", "zendesk_channel_cron", teamsList);
    expect(result).toEqual(team1);
  });

  test("Should return the team with matching value for key 'ask_channel_name'", () => {
    const result = findTeamByValue("Team 3", "ask_channel_name", teamsList);
    expect(result).toEqual(team3);
  });


  test("Should return the team with matching value for key 'zendesk_channel_name'", () => {
    const result = findTeamByValue("ZENDESK CHANNEL NAME for Third team", "zendesk_channel_name", teamsList);
    expect(result).toEqual(team3);
  });

  test("Should return undefined if no team has the matching value for key 'description'", () => {
    const result = findTeamByValue("4ID", "ask_channel_id", teamsList);
    expect(result).toBeUndefined();
  });
});

describe("isTeam", () => {
  test("Should return true if the object has all the required properties of a Team", () => {
    const obj = {
      ask_channel_id: "1ID",
      ask_channel_name: "Team 1 ASKS",
      ask_channel_cron: "0,30 * * * *",
      allowed_bots: [],
      zendesk_channel_id: "1ZDID",
      zendesk_channel_name: "ZENDESK CHANNEL NAME for First team",
      zendesk_monitored_view_id: "2353254353421",
      zendesk_aggregated_field_id: "23532543534",
      zendesk_field_id: "2352324",
      zendesk_field_values: ["vasdas"],
      zendesk_channel_cron: "ZENDESK_CRON1",
      ask_channel_cron_last_sent: new Date(),
    };
    const result = isTeam(obj);
    expect(result).toBe(true);
  });

  test("Should return false if the object is missing any of the required properties of a Team", () => {
    const obj = {
      ask_channel_id: "1ID",
      ask_channel_name: "Team 1 ASKS",
      ask_channel_cron: "0,30 * * * *",
      allowed_bots: [],
      zendesk_channel_id: "1ZDID",
      zendesk_channel_name: "ZENDESK CHANNEL NAME for First team",
      zendesk_monitored_view_id: "2353254353421",
      zendesk_aggregated_field_id: "23532543534",
      zendesk_field_id: "2352324",
      ask_channel_cron_last_sent: new Date(),
      // Missing zendesk_field_values and zendesk_channel_cron properties
    };
    const result = isTeam(obj);
    expect(result).toBe(false);
  });
});