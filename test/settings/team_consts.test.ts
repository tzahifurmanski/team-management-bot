import {
  describe,
  expect,
  jest,
  beforeEach,
  afterEach,
  it,
} from "@jest/globals";
// import { mocked } from "jest-mock"; // Import mocked for type safety

const mockConversationsFactory = () => ({
  getBotId: jest.fn(),
});

// --- Use unstable_mockModule BEFORE any imports that depend on it ---
jest.unstable_mockModule(
  "../../src/integrations/slack/conversations",
  mockConversationsFactory,
);

// --- Now, dynamically import the modules AFTER mocking ---
// Declare variables to hold the imported modules/functions
let loadConfig: typeof import("../../src/settings/team_consts").loadConfig;
let getTeamsList: typeof import("../../src/settings/team_consts").getTeamsList;
let getBotIdMock: jest.Mock; // Variable to hold the mock function reference

// import { getBotId } from "../../src/integrations/slack/conversations";

// jest.mock("../../src/integrations/slack/conversations", () => ({
//   getBotId: jest.fn(),
// }));

// import { loadConfig, getTeamsList } from "../../src/settings/team_consts";

import * as sconsts from "../../src/settings/server_consts";

describe("loadConfig", () => {
  let originalEnv: NodeJS.ProcessEnv;

  let slackClient: any;

  beforeEach(async () => {
    // Store the original process.env
    originalEnv = { ...process.env };

    slackClient = {}; // Mock the slackClient object

    // Reset mocks defined via unstable_mockModule needs dynamic import to get the mock reference again
    // Option 1: Re-import the mocked module to get the fresh mock reference
    const mockedConversations = await import(
      "../../src/integrations/slack/conversations"
    );

    getBotIdMock = mockedConversations.getBotId as jest.Mock; // Cast to jest.Mock
    getBotIdMock.mockClear(); // Clear history/calls

    // Option 2 (Simpler if you only need to clear): Use jest.resetModules() if appropriate
    // jest.resetModules(); // Resets the entire module cache - use with caution

    // Dynamically import the module under test inside beforeEach
    // to ensure it gets the mocked dependency
    const teamConstsModule = await import("../../src/settings/team_consts");
    loadConfig = teamConstsModule.loadConfig;
    getTeamsList = teamConstsModule.getTeamsList;
  });

  afterEach(() => {
    // Restore the original process.env after each test
    process.env = originalEnv;
  });

  it.skip("should load the Slack config successfully", async () => {
    // Mock the necessary functions and variables
    // (logger as jest.Mock);
    // (BOT_SLACK_ID as jest.Mock).mockReturnValue('botSlackID'
    getBotIdMock.mockReturnValue("botSlackID");

    // const setBotSlackIdMock = (setBotSlackId as jest.Mock);
    const setBotSlackIdMock = jest.spyOn(sconsts, "setBotSlackId"); //.mockReturnValue({ someObjectProperty: 42 });
    // const getConversationIdMock = (getConversationId as jest.Mock).mockReturnValue('channelId');

    // Mock the necessary variables
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
    // process.env.TEAMS_JSON_LIST = '{"ask_channel_id": "channel1"}'; // TODO: Test this? (Is this really needed?)

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
