import { jest } from "@jest/globals";

// Mock dependencies before importing the module under test
const mockHandleDirectEvent = jest.fn();
const mockIsBotMessage = jest.fn();
const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

jest.unstable_mockModule(
  "../../../../src/integrations/slack/events.js",
  () => ({
    handleDirectEvent: mockHandleDirectEvent,
  }),
);

jest.unstable_mockModule("../../../../src/integrations/slack/utils.js", () => ({
  isBotMessage: mockIsBotMessage,
}));

jest.unstable_mockModule("../../../../src/settings/server_consts.js", () => ({
  logger: mockLogger,
}));

// Import after mocking
const { appMentionCallback } = await import(
  "../../../../src/integrations/slack/events_listeners/app_mention.js"
);

describe("appMentionCallback", () => {
  const mockClient = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBotMessage.mockReturnValue(false);
  });

  test("should ignore bot messages", async () => {
    mockIsBotMessage.mockReturnValue(true);

    const event: any = {
      type: "app_mention",
      channel: "C123",
      user: "UBOT",
      text: "<@BOT123> hello",
      ts: "1234.5678",
    };

    await appMentionCallback({ event, client: mockClient } as any);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Got a message from bot, ignoring...",
    );
    expect(mockHandleDirectEvent).not.toHaveBeenCalled();
  });

  test("should ignore thread replies (thread_ts different from ts)", async () => {
    const event: any = {
      type: "app_mention",
      channel: "C123",
      user: "U123",
      text: "<@BOT123> hello",
      ts: "1234.5678",
      thread_ts: "1234.0000", // Different from ts = thread reply
    };

    await appMentionCallback({ event, client: mockClient } as any);

    expect(mockHandleDirectEvent).not.toHaveBeenCalled();
  });

  test("should process top-level mentions (no thread_ts)", async () => {
    const event: any = {
      type: "app_mention",
      channel: "C123",
      user: "U123",
      text: "<@BOT123> hello",
      ts: "1234.5678",
      // No thread_ts = top-level message
    };

    await appMentionCallback({ event, client: mockClient } as any);

    expect(mockHandleDirectEvent).toHaveBeenCalledWith(event, mockClient);
  });

  test("should process mentions where thread_ts equals ts (parent message)", async () => {
    const event: any = {
      type: "app_mention",
      channel: "C123",
      user: "U123",
      text: "<@BOT123> hello",
      ts: "1234.5678",
      thread_ts: "1234.5678", // Same as ts = this is the parent message
    };

    await appMentionCallback({ event, client: mockClient } as any);

    expect(mockHandleDirectEvent).toHaveBeenCalledWith(event, mockClient);
  });

  test("should catch and log errors from handleDirectEvent", async () => {
    const testError = new Error("Test error");
    mockHandleDirectEvent.mockRejectedValue(testError);

    const event: any = {
      type: "app_mention",
      channel: "C123",
      user: "U123",
      text: "<@BOT123> hello",
      ts: "1234.5678",
    };

    await appMentionCallback({ event, client: mockClient } as any);

    expect(mockLogger.error).toHaveBeenCalledWith(testError);
  });
});
