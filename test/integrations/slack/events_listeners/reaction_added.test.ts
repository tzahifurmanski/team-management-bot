import { jest } from "@jest/globals";

// Mock dependencies before importing the module under test
const mockConvertSecondsToTimeString = jest.fn();
const mockCountReactions = jest.fn();
const mockIsBotMessage = jest.fn();
const mockGetUserProfile = jest.fn();
const mockGetConversationHistory = jest.fn();
const mockFindTeamByValue = jest.fn();
const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule("../../../../src/integrations/slack/utils.js", () => ({
  convertSecondsToTimeString: mockConvertSecondsToTimeString,
  countReactions: mockCountReactions,
  isBotMessage: mockIsBotMessage,
}));

jest.unstable_mockModule("../../../../src/integrations/slack/users.js", () => ({
  getUserProfile: mockGetUserProfile,
}));

jest.unstable_mockModule(
  "../../../../src/integrations/slack/conversations.js",
  () => ({
    getConversationHistory: mockGetConversationHistory,
  }),
);

jest.unstable_mockModule("../../../../src/settings/server_consts.js", () => ({
  logger: mockLogger,
  REACTIONS_HANDLED: ["white_check_mark", "heavy_check_mark"],
}));

jest.unstable_mockModule("../../../../src/settings/team_utils.js", () => ({
  findTeamByValue: mockFindTeamByValue,
}));

// Import after mocking
const { reactionAddedCallback } = await import(
  "../../../../src/integrations/slack/events_listeners/reaction_added.js"
);

describe("reactionAddedCallback", () => {
  const mockPostMessage = jest.fn();
  const mockClient = {
    chat: {
      postMessage: mockPostMessage,
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBotMessage.mockReturnValue(false);
    mockCountReactions.mockReturnValue(1);
    mockConvertSecondsToTimeString.mockReturnValue("5 minutes");
  });

  test("should ignore irrelevant reactions", async () => {
    const event: any = {
      type: "reaction_added",
      reaction: "thumbsup", // Not in REACTIONS_HANDLED
      user: "U123",
      item: { channel: "C123", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockLogger.trace).toHaveBeenCalledWith(
      "Irrelevant reaction, skipping.",
    );
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  test("should return early when team is not found", async () => {
    mockFindTeamByValue.mockReturnValue(null);

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C_UNKNOWN", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Unable to find team"),
    );
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  test("should correctly calculate duration from string timestamps", async () => {
    const mockTeam = {
      ask_channel_id: "C123",
      allowed_bots: [],
    };
    mockFindTeamByValue.mockReturnValue(mockTeam);
    mockGetConversationHistory.mockResolvedValue([{ text: "test message" }]);
    mockGetUserProfile.mockResolvedValue({ display_name: "Test User" });
    mockPostMessage.mockResolvedValue({});

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C123", ts: "1704063600.000000" }, // String timestamp
      event_ts: "1704067200.000000", // 1 hour later (string)
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    // Verify parseFloat was used correctly (3600 seconds = 1 hour)
    expect(mockConvertSecondsToTimeString).toHaveBeenCalledWith(3600);
  });

  test("should use user ID as fallback when display_name is not available", async () => {
    const mockTeam = {
      ask_channel_id: "C123",
      allowed_bots: [],
    };
    mockFindTeamByValue.mockReturnValue(mockTeam);
    mockGetConversationHistory.mockResolvedValue([{ text: "test message" }]);
    mockGetUserProfile.mockResolvedValue({}); // No display_name
    mockPostMessage.mockResolvedValue({});

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C123", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("U123"),
      }),
    );
  });

  test("should skip when more than 1 handled reaction exists", async () => {
    const mockTeam = {
      ask_channel_id: "C123",
      allowed_bots: [],
    };
    mockFindTeamByValue.mockReturnValue(mockTeam);
    mockGetConversationHistory.mockResolvedValue([{ text: "test message" }]);
    mockCountReactions.mockReturnValue(2); // More than 1

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C123", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "More then 1 COMPLETED emoji, skipping",
    );
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  test("should skip when original message is not found", async () => {
    const mockTeam = {
      ask_channel_id: "C123",
      allowed_bots: [],
    };
    mockFindTeamByValue.mockReturnValue(mockTeam);
    mockGetConversationHistory.mockResolvedValue([]); // No messages found

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C123", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Reaction was added on a skipped message, skipping.",
    );
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  test("should post resolution message on successful handling", async () => {
    const mockTeam = {
      ask_channel_id: "C123",
      allowed_bots: [],
    };
    mockFindTeamByValue.mockReturnValue(mockTeam);
    mockGetConversationHistory.mockResolvedValue([{ text: "test message" }]);
    mockGetUserProfile.mockResolvedValue({ display_name: "Test User" });
    mockPostMessage.mockResolvedValue({});
    mockConvertSecondsToTimeString.mockReturnValue("5 minutes");

    const event: any = {
      type: "reaction_added",
      reaction: "white_check_mark",
      user: "U123",
      item: { channel: "C123", ts: "1234.0000" },
      event_ts: "1234.5000",
    };

    await reactionAddedCallback({ event, client: mockClient } as any);

    expect(mockPostMessage).toHaveBeenCalledWith({
      channel: "C123",
      thread_ts: "1234.0000",
      text: "Test User has resolved this ask after 5 minutes.",
    });
  });
});
