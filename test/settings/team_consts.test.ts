import {
  describe,
  expect,
  jest,
  beforeEach,
  afterEach,
  it,
} from "@jest/globals";

jest.unstable_mockModule("../../src/integrations/slack/conversations", () => ({
  getBotId: jest.fn(),
  getConversationId: jest.fn(),
}));

const mockLoadAllTeams = jest.fn<() => Promise<Map<string, Team>>>();
const mockCreateTeam = jest.fn<(team: Team) => Promise<boolean>>();

jest.unstable_mockModule("../../src/services/TeamService", () => ({
  TeamService: {
    loadAllTeams: mockLoadAllTeams,
    createTeam: mockCreateTeam,
  },
}));

import { Team } from "../../src/settings/team_consts";

jest.unstable_mockModule("../../src/settings/server_consts", () => ({
  setBotSlackId: jest.fn(),
  BOT_SLACK_ID: "",
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    warning: jest.fn(),
  },
}));

// Declare variables to hold the imported modules/functions
let loadConfig: typeof import("../../src/settings/team_consts").loadConfig;
let getTeamsList: typeof import("../../src/settings/team_consts").getTeamsList;
let getBotIdMock: jest.Mock;
let getConversationIdMock: jest.Mock;
let setBotSlackIdMock: jest.Mock;

describe("loadConfig", () => {
  console.log(JSON.stringify(process.env));
  let originalEnv: NodeJS.ProcessEnv;
  let slackClient: any;

  beforeEach(async () => {
    // Store the original process.env
    originalEnv = { ...process.env };

    slackClient = {}; // Mock the slackClient object

    // Get the mock references
    const mockedConversations = await import(
      "../../src/integrations/slack/conversations"
    );
    getBotIdMock = mockedConversations.getBotId as jest.Mock;
    getConversationIdMock = mockedConversations.getConversationId as jest.Mock;
    getBotIdMock.mockClear();
    getConversationIdMock.mockClear();

    // Get the server_consts mock reference
    const serverConsts = await import("../../src/settings/server_consts");
    setBotSlackIdMock = serverConsts.setBotSlackId as jest.Mock;
    setBotSlackIdMock.mockClear();

    // Dynamically import the module under test
    const teamConstsModule = await import("../../src/settings/team_consts");
    loadConfig = teamConstsModule.loadConfig;
    getTeamsList = teamConstsModule.getTeamsList;

    // Clear all mocks
    mockLoadAllTeams.mockClear();
    mockCreateTeam.mockClear();

    // Mock the DB calls to do nothing
    const result = new Map<string, Team>();
    mockLoadAllTeams.mockResolvedValue(result);
    mockCreateTeam.mockResolvedValue(true);
  });

  afterEach(() => {
    // Restore the original process.env after each test
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it("should load the Slack config successfully", async () => {
    // Mock the necessary functions and variables
    getBotIdMock.mockReturnValue("botSlackID");
    getConversationIdMock.mockImplementation((client, name) => {
      // Return a mock channel ID based on the channel name
      if (name === "channel1") return "channelid1";
      if (name === "channel2") return "channelid2";
      if (name === "codeReviewChannel") return "crchannel_id";
      if (name === "zendesk1") return "zdchannelid1";
      if (name === "zendesk2") return "zdchannelid2";
      return "";
    });

    // Mock the necessary variables
    process.env.ENABLE_ENV_TEAMS = "true";
    process.env.TEAM_ASK_CHANNEL_ID = "channelid1,channelid2";
    process.env.TEAM_ASK_CHANNEL_NAME = "channel1,channel2";
    process.env.ASK_CHANNEL_STATS_CRON = "";
    process.env.ALLOWED_BOTS = "bot1,bot2|bot1,bot2";
    process.env.TEAM_CODE_REVIEW_CHANNEL_ID = "crchannel_id,";
    process.env.TEAM_CODE_REVIEW_CHANNEL_NAME = "codeReviewChannel,";
    process.env.GROUP_ASK_CHANNELS = "";
    process.env.ZENDESK_TICKETS_CHANNEL_ID = "zdchannelid1,zdchannelid2";
    process.env.ZENDESK_TICKETS_CHANNEL_NAME = "zendesk1,zendesk2";
    process.env.ZENDESK_MONITORED_VIEW = "view1,view2";
    process.env.ZENDESK_VIEW_AGGREGATED_FIELD_ID = "field1,field2";
    process.env.MONITORED_ZENDESK_FILTER_FIELD_ID = "fieldId1,fieldId2";
    process.env.MONITORED_ZENDESK_FILTER_FIELD_VALUES =
      "value1,value2|value3,value4";
    process.env.ZENDESK_TICKETS_STATS_CRON = "";

    // Call the function
    const result = await loadConfig(slackClient);

    // Assertions
    expect(result).toBe(true);
    expect(getBotIdMock).toHaveBeenCalledWith(slackClient);
    expect(setBotSlackIdMock).toHaveBeenCalledWith("botSlackID");

    expect(getTeamsList().size).toBe(2);
    const team_to_compare = getTeamsList().get("channelid1");
    expect(team_to_compare).toEqual({
      ask_channel_id: "channelid1",
      ask_channel_name: "channel1",
      ask_channel_cron: "",
      code_review_channel_id: "crchannel_id",
      code_review_channel_name: "codeReviewChannel",
      allowed_bots: ["bot1", "bot2"],
      zendesk_channel_id: "zdchannelid1",
      zendesk_channel_name: "zendesk1",
      zendesk_monitored_view_id: "view1",
      zendesk_aggregated_field_id: "field1",
      zendesk_field_id: "fieldId1",
      zendesk_field_values: ["value1", "value2"],
      zendesk_channel_cron: "",
      ask_channel_cron_last_sent: expect.any(Date),
    });
  });
});
