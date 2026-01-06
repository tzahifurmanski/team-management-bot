import { jest } from "@jest/globals";

// Mock dependencies before importing the module under test
const mockRunActions = jest.fn();
const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule("../../../src/actions/base_action.js", () => ({
  runActions: mockRunActions,
}));

jest.unstable_mockModule("../../../src/actions/asks/index.js", () => ({
  ASKS_ACTIONS: [],
}));

jest.unstable_mockModule("../../../src/actions/responses/index.js", () => ({
  RESPONSE_ACTIONS: [],
}));

jest.unstable_mockModule("../../../src/settings/server_consts.js", () => ({
  BOT_RESPONSES_CHANNELS: ["C_RESPONSE_CHANNEL"],
  BOT_SLACK_ID: "BOT123",
  logger: mockLogger,
}));

// Import after mocking
const { handleDirectEvent, handleChannelEvent } = await import(
  "../../../src/integrations/slack/events.js"
);

describe("handleDirectEvent", () => {
  const mockClient = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return early when event.text is undefined", async () => {
    const event: any = {
      type: "message",
      channel: "C123",
      user: "U123",
      // text is undefined
    };

    await handleDirectEvent(event, mockClient);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Event has no text, ignoring",
    );
    expect(mockRunActions).not.toHaveBeenCalled();
  });

  test("should return early when event.text is empty string", async () => {
    const event: any = {
      type: "message",
      channel: "C123",
      user: "U123",
      text: "",
    };

    await handleDirectEvent(event, mockClient);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Event has no text, ignoring",
    );
    expect(mockRunActions).not.toHaveBeenCalled();
  });

  test("should remove bot mention from text", async () => {
    const event: any = {
      type: "message",
      channel: "C123",
      user: "U123",
      text: "<@BOT123> help me",
    };

    mockRunActions.mockResolvedValue(true);

    await handleDirectEvent(event, mockClient);

    // Verify bot mention was removed and text was trimmed
    expect(event.text).toBe("help me");
    expect(mockRunActions).toHaveBeenCalled();
  });

  test("should handle text without bot mention", async () => {
    const event: any = {
      type: "message",
      channel: "C123",
      user: "U123",
      text: "help me",
    };

    mockRunActions.mockResolvedValue(true);

    await handleDirectEvent(event, mockClient);

    expect(event.text).toBe("help me");
    expect(mockRunActions).toHaveBeenCalled();
  });

  test("should log unsupported event when no action matches", async () => {
    const event: any = {
      type: "message",
      channel: "C123",
      user: "U123",
      text: "unknown command",
    };

    mockRunActions.mockResolvedValue(false);

    await handleDirectEvent(event, mockClient);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Unsupported text/event",
      "unknown command",
      expect.any(String),
    );
  });
});

describe("handleChannelEvent", () => {
  const mockClient = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return early for non-monitored channel", async () => {
    const event: any = {
      type: "message",
      channel: "C_NOT_MONITORED",
      user: "U123",
      text: "hello",
    };

    await handleChannelEvent(event, mockClient);

    expect(mockLogger.trace).toHaveBeenCalledWith(
      expect.stringContaining("none supported channel"),
    );
    expect(mockRunActions).not.toHaveBeenCalled();
  });

  test("should process events in monitored channel", async () => {
    const event: any = {
      type: "message",
      channel: "C_RESPONSE_CHANNEL",
      user: "U123",
      text: "hello",
    };

    mockRunActions.mockResolvedValue(true);

    await handleChannelEvent(event, mockClient);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Got new channel event",
      event,
    );
    expect(mockRunActions).toHaveBeenCalled();
  });
});
