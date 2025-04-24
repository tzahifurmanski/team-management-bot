import { jest } from "@jest/globals";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import { Team } from "../../../src/settings/team_consts.js";
import { AsksChannelStatsResult } from "../../../src/logic/asks_channel.js";

// Mock all the dependencies
const mockGetChannelIDFromEventText =
  jest.fn<(text: string, index: number) => string | null>();
const mockGetRecurringJobInfo =
  jest.fn<
    (prefix: string, teams: Team[], key: string, cronKey: string) => string
  >();
const mockGetStatsMessage =
  jest.fn<(channelId: string, stats: AsksChannelStatsResult) => string>();
const mockScheduleAskChannelsCrons =
  jest.fn<
    (
      client: any,
      teams: Team[],
      channelIdKey: string,
      channelNameKey: string,
      cronKey: string,
      command: string,
      callback: (team: Team) => Promise<void> | void,
    ) => void
  >();
jest.unstable_mockModule("../../../src/actions/utils.js", () => ({
  getChannelIDFromEventText: mockGetChannelIDFromEventText,
  getRecurringJobInfo: mockGetRecurringJobInfo,
  getStatsMessage: mockGetStatsMessage,
  scheduleAskChannelsCrons: mockScheduleAskChannelsCrons,
}));

const mockGetChannelMessages =
  jest.fn<
    (
      client: any,
      channelId: string,
      allowedBots: string[],
      startDate: Date,
      endDate: Date,
    ) => Promise<any[]>
  >();
const mockGetStatsForMessages =
  jest.fn<
    (
      channelId: string,
      messages: any[],
      startDate: string,
      endDate: string,
    ) => AsksChannelStatsResult
  >();
const mockReportStatsToSlack =
  jest.fn<
    (
      client: any,
      stats: AsksChannelStatsResult,
      channel: string,
      threadTS: string,
      showOpen: boolean,
      showClosed: boolean,
      showTotal: boolean,
    ) => Promise<void>
  >();
jest.unstable_mockModule("../../../src/logic/asks_channel.js", () => ({
  getChannelMessages: mockGetChannelMessages,
  getStatsForMessages: mockGetStatsForMessages,
  reportStatsToSlack: mockReportStatsToSlack,
}));

const mockGetTeamsList = jest.fn<() => Map<string, Team>>();
jest.unstable_mockModule("../../../src/settings/team_consts.js", () => ({
  getTeamsList: mockGetTeamsList,
}));

type SendSlackMessageFn = (
  client: any,
  text: string,
  channel: string,
  threadTS?: string,
  blocks?: any[],
  disableUnfurl?: boolean,
) => Promise<ChatPostMessageResponse>;

const mockSendSlackMessage = jest
  .fn<SendSlackMessageFn>()
  .mockImplementation(
    async (client, text, channel, threadTS, blocks, disableUnfurl) => {
      return {
        ok: true,
        ts: "123.456",
        channel: "C123",
        message: {
          text: "Test message",
          ts: "123.456",
          type: "message",
          user: "U123",
        },
      };
    },
  );

jest.unstable_mockModule("../../../src/integrations/slack/messages.js", () => ({
  sendSlackMessage: mockSendSlackMessage,
}));

const mockSanitizeCommandInput = jest.fn<(text: string) => string>();
jest.unstable_mockModule("../../../src/integrations/slack/utils.js", () => ({
  sanitizeCommandInput: mockSanitizeCommandInput,
}));

const mockLogger = {
  trace: jest.fn<(message: string) => void>(),
  debug: jest.fn<(message: string) => void>(),
  info: jest.fn<(message: string) => void>(),
  error: jest.fn<(message: string, error?: any) => void>(),
};
jest.unstable_mockModule("../../../src/settings/server_consts.js", () => ({
  logger: mockLogger,
}));

const mockRemoveTimeInfoFromDate = jest.fn<(date: Date) => Date>();
jest.unstable_mockModule("../../../src/actions/date_utils.js", () => ({
  removeTimeInfoFromDate: mockRemoveTimeInfoFromDate,
}));

const mockSlackWebClient = {
  chat: {
    postMessage: jest.fn<(options: any) => Promise<ChatPostMessageResponse>>(),
  },
};
jest.unstable_mockModule("../../../src/integrations/consts.js", () => ({
  SlackWebClient: mockSlackWebClient,
}));

const mockIsValueInTeams =
  jest.fn<(value: keyof Team, teams_list?: Map<string, Team>) => boolean>();
const mockFindTeamByValue =
  jest.fn<
    (
      value: string,
      key: keyof Team,
      teams_list?: Map<string, Team>,
    ) => Team | undefined
  >();
jest.unstable_mockModule("../../../src/settings/team_utils.js", () => ({
  findTeamByValue: mockFindTeamByValue,
  isValueInTeams: mockIsValueInTeams,
}));

describe("AskChannelStatusForYesterday", () => {
  let AskChannelStatusForYesterday: any;
  let testedClass: any;

  beforeEach(async () => {
    // Import the class after setting up all mocks
    const module = await import(
      "../../../src/actions/asks/ask_channel_status_for_yesterday.js"
    );
    AskChannelStatusForYesterday = module.AskChannelStatusForYesterday;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockSanitizeCommandInput.mockImplementation((text: string) => text);
    mockIsValueInTeams.mockReturnValue(true);
    mockGetTeamsList.mockReturnValue(new Map());
    mockGetRecurringJobInfo.mockReturnValue("");
    const mockResponse: ChatPostMessageResponse = { ok: true, ts: "123.456" };
    mockSlackWebClient.chat.postMessage.mockResolvedValue(mockResponse);

    testedClass = new AskChannelStatusForYesterday();
  });

  describe("doesMatch", () => {
    test("should match valid command with channel", () => {
      const event = { text: "ask channel status for yesterday #channel" };
      mockSanitizeCommandInput.mockReturnValue(event.text);
      expect(testedClass.doesMatch(event)).toBeTruthy();
    });

    test("should not match command without channel", () => {
      const event = { text: "ask channel status for yesterday" };
      mockSanitizeCommandInput.mockReturnValue(event.text);
      expect(testedClass.doesMatch(event)).toBeFalsy();
    });

    test("should not match invalid command", () => {
      const event = { text: "ask channel status for 30 days" };
      mockSanitizeCommandInput.mockReturnValue(event.text);
      expect(testedClass.doesMatch(event)).toBeFalsy();
    });
  });

  describe("isEnabled", () => {
    test("should be enabled when there are ask channels", () => {
      mockIsValueInTeams.mockReturnValue(true);
      expect(testedClass.isEnabled()).toBeTruthy();
      expect(mockIsValueInTeams).toHaveBeenCalledWith("ask_channel_id");
    });

    test("should be disabled when there are no ask channels", () => {
      mockIsValueInTeams.mockReturnValue(false);
      expect(testedClass.isEnabled()).toBeFalsy();
      expect(mockIsValueInTeams).toHaveBeenCalledWith("ask_channel_id");
    });
  });

  describe("getHelpText", () => {
    test("should return help text with correct days back", () => {
      const helpText = testedClass.getHelpText();
      expect(helpText).toContain(
        AskChannelStatusForYesterday.DAYS_BACK.toString(),
      );
      expect(helpText).toContain(
        "ask channel status for yesterday #CHANNEL_NAME",
      );
    });
  });

  describe("getAskChannelStatsForYesterday", () => {
    const mockEvent = {
      text: "ask channel status for yesterday #channel",
      channel: "C123",
      thread_ts: "123.456",
    };
    const mockSlackClient = {
      chat: {
        postMessage: jest
          .fn<() => Promise<ChatPostMessageResponse>>()
          .mockResolvedValue({
            ok: true,
            ts: "123.456",
            channel: "C123",
            message: {
              text: "Test message",
              ts: "123.456",
              type: "message",
              user: "U123",
            },
          }),
      },
    } as unknown as WebClient;
    const mockTeam: Team = {
      ask_channel_id: "C123",
      ask_channel_name: "channel",
      allowed_bots: ["B123"],
      ask_channel_cron_last_sent: null,
      ask_channel_cron: "0 9 * * *",
      zendesk_channel_id: "",
      zendesk_channel_name: "",
      zendesk_monitored_view_id: "",
      zendesk_aggregated_field_id: "",
      zendesk_field_id: "",
      zendesk_field_values: [],
      zendesk_channel_cron: "",
      code_review_channel_id: "",
      code_review_channel_name: "",
    };
    const mockChannelMessages = [{ text: "message1" }, { text: "message2" }];
    const mockStats: AsksChannelStatsResult = {
      startDateInUTC: new Date().toUTCString(),
      channelId: "C123",
      totalMessages: 2,
      totalNumProcessed: 2,
      totalNumOpen: 1,
      totalNumClosed: 1,
      totalNumUnprocessed: 0,
      totalNumInProgress: 0,
      totalNumBlocked: 0,
      totalNumWaiting: 0,
      totalNumUnchecked: 0,
      messages: [],
      messagesInProgress: [],
      messagesUnchecked: [],
    } as AsksChannelStatsResult;

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();

      // Setup default mock implementations
      mockGetChannelIDFromEventText.mockReturnValue("C123");
      mockFindTeamByValue.mockReturnValue(mockTeam);
      mockGetChannelMessages.mockResolvedValue(mockChannelMessages);
      mockGetStatsForMessages.mockReturnValue(mockStats);
      mockGetStatsMessage.mockReturnValue("2 total messages");
      mockSendSlackMessage.mockResolvedValue({
        ok: true,
        ts: "123.456",
      } as ChatPostMessageResponse);
      mockRemoveTimeInfoFromDate.mockImplementation((date: Date) => date);
    });

    test("should handle successful execution", async () => {
      await testedClass.getAskChannelStatsForYesterday(
        mockEvent,
        mockSlackClient,
      );

      expect(mockGetChannelIDFromEventText).toHaveBeenCalledWith(
        mockEvent.text,
        5,
      );
      expect(mockFindTeamByValue).toHaveBeenCalledWith(
        "C123",
        "ask_channel_id",
      );
      expect(mockGetChannelMessages).toHaveBeenCalledTimes(2);
      expect(mockGetStatsForMessages).toHaveBeenCalledTimes(2);
      expect(mockSendSlackMessage).toHaveBeenCalled();
      expect(mockReportStatsToSlack).toHaveBeenCalled();
    });

    test("should handle missing channel ID", async () => {
      mockGetChannelIDFromEventText.mockReturnValue(null);
      mockFindTeamByValue.mockReturnValue(undefined);

      await testedClass.getAskChannelStatsForYesterday(
        mockEvent,
        mockSlackClient,
      );

      expect(mockSendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide an asks channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle unknown team", async () => {
      mockFindTeamByValue.mockReturnValue(undefined);

      await testedClass.getAskChannelStatsForYesterday(
        mockEvent,
        mockSlackClient,
      );

      expect(mockSendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Channel is not set up for monitoring"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle scheduled event with recent execution", async () => {
      const scheduledEvent = {
        ...mockEvent,
        scheduled: true,
      };
      mockTeam.ask_channel_cron_last_sent = new Date(Date.now() - 30 * 1000); // 30 seconds ago

      await testedClass.getAskChannelStatsForYesterday(
        scheduledEvent,
        mockSlackClient,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Skipping scheduled ask channel status"),
      );
      expect(mockGetChannelMessages).not.toHaveBeenCalled();
    });

    test("should handle errors gracefully", async () => {
      mockGetChannelMessages.mockRejectedValue(new Error("Test error"));

      await testedClass.getAskChannelStatsForYesterday(
        mockEvent,
        mockSlackClient,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
