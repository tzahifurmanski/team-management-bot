import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import type { WebClient } from "@slack/web-api";
import type {
  ChatPostMessageResponse,
  ConversationsInfoResponse,
  ChatDeleteResponse,
  ChatDeleteScheduledMessageResponse,
  ChatGetPermalinkResponse,
  ChatMeMessageResponse,
  ChatPostEphemeralResponse,
  ChatScheduleMessageResponse,
  ChatUnfurlResponse,
  ChatUpdateResponse,
} from "@slack/web-api";
import { TeamAdmin } from "../../../src/actions/asks/team_admin";

// Define mock types
type MockedAdminAuthService = {
  isAuthorized: jest.Mock;
  requestConfirmation: jest.Mock;
  confirmAction: jest.Mock;
};

type MockedSendSlackMessage = jest.Mock;

// Create mock instances
const mockAdminAuthService: MockedAdminAuthService = {
  isAuthorized: jest.fn(),
  requestConfirmation: jest.fn(),
  confirmAction: jest.fn(),
};

const mockSendSlackMessage: MockedSendSlackMessage = jest.fn();

// Mock dependencies
jest.unstable_mockModule(
  "../../../src/services/AdminAuthorizationService",
  () => ({
    adminAuthService: mockAdminAuthService,
  }),
);

jest.unstable_mockModule("../../../src/integrations/slack/messages", () => ({
  sendSlackMessage: mockSendSlackMessage,
}));

jest.unstable_mockModule("../../../src/settings/team_consts", () => ({
  TEAMS_LIST: new Map(),
}));

jest.unstable_mockModule("../../../src/utils.js", () => ({
  handleListParameter: jest.fn(
    (
      param: string | undefined,
      defaultValue = "",
      delimiter: string = ",",
      removeEmpty = true,
    ) => {
      const fieldContent = (param || defaultValue) as string;
      let result = fieldContent.split(delimiter);
      if (removeEmpty) {
        result = result.filter((i) => i);
      }
      return result;
    },
  ),
  sanitizeCommandInput: jest.fn((input: string) => input.trim().toLowerCase()),
}));

jest.unstable_mockModule("../../../src/actions/utils", () => ({
  extractIDFromChannelString: jest.fn().mockImplementation((input: any) => {
    const match = input.match(/<#([A-Z0-9]+)\|.+>/);
    return match ? match[1] : null;
  }),
  extractNameFromChannelString: jest.fn().mockImplementation((input: any) => {
    const match = input.match(/<#[A-Z0-9]+\|(.+)>/);
    return match ? match[1] : null;
  }),
}));

describe("TeamAdmin", () => {
  let teamAdmin: TeamAdmin;
  let mockSlackClient: Partial<WebClient>;
  let mockEvent: any;
  let TEAMS_LIST: Map<string, any>;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset mock implementations
    mockAdminAuthService.isAuthorized.mockReset();
    mockAdminAuthService.isAuthorized.mockReturnValue(false);
    mockSendSlackMessage.mockImplementation(async () => ({
      ok: true,
      ts: "1234567890.123456",
    }));

    // Create instance
    const { TeamAdmin } = await import("../../../src/actions/asks/team_admin");
    teamAdmin = new TeamAdmin();

    // Create mock Slack client with partial implementation
    mockSlackClient = {
      chat: {
        postMessage: jest.fn().mockImplementation(async () => ({
          ok: true,
          ts: "1234567890.123456",
        })) as jest.MockedFunction<() => Promise<ChatPostMessageResponse>>,
        delete: jest.fn().mockImplementation(async () => ({
          ok: true,
        })) as jest.MockedFunction<() => Promise<ChatDeleteResponse>>,
        deleteScheduledMessage: jest.fn().mockImplementation(async () => ({
          ok: true,
        })) as jest.MockedFunction<
          () => Promise<ChatDeleteScheduledMessageResponse>
        >,
        getPermalink: jest.fn().mockImplementation(async () => ({
          ok: true,
          permalink: "https://example.com",
        })) as jest.MockedFunction<() => Promise<ChatGetPermalinkResponse>>,
        meMessage: jest.fn().mockImplementation(async () => ({
          ok: true,
          channel: "C12345",
        })) as jest.MockedFunction<() => Promise<ChatMeMessageResponse>>,
        postEphemeral: jest.fn().mockImplementation(async () => ({
          ok: true,
          message_ts: "1234567890.123456",
        })) as jest.MockedFunction<() => Promise<ChatPostEphemeralResponse>>,
        scheduleMessage: jest.fn().mockImplementation(async () => ({
          ok: true,
          scheduled_message_id: "Q1234",
        })) as jest.MockedFunction<() => Promise<ChatScheduleMessageResponse>>,
        unfurl: jest.fn().mockImplementation(async () => ({
          ok: true,
        })) as jest.MockedFunction<() => Promise<ChatUnfurlResponse>>,
        update: jest.fn().mockImplementation(async () => ({
          ok: true,
          ts: "1234567890.123456",
        })) as jest.MockedFunction<() => Promise<ChatUpdateResponse>>,
      },
      conversations: {
        info: jest.fn().mockImplementation(async () => ({
          ok: true,
          channel: { name: "test-channel" },
        })) as jest.MockedFunction<() => Promise<ConversationsInfoResponse>>,
        acceptSharedInvite: jest.fn(),
        approveSharedInvite: jest.fn(),
        archive: jest.fn(),
        close: jest.fn(),
        create: jest.fn(),
        history: jest.fn(),
        invite: jest.fn(),
        join: jest.fn(),
        kick: jest.fn(),
        leave: jest.fn(),
        list: jest.fn(),
        members: jest.fn(),
        open: jest.fn(),
        rename: jest.fn(),
        replies: jest.fn(),
        setPurpose: jest.fn(),
        setTopic: jest.fn(),
        unarchive: jest.fn(),
      },
    } as unknown as WebClient;

    // Create mock event
    mockEvent = {
      user: "U12345",
      channel: "C67890",
      thread_ts: "1234567890.123456",
      text: "",
    };

    // Get TEAMS_LIST reference and clear it
    const teamConstsModule = await import("../../../src/settings/team_consts");
    TEAMS_LIST = teamConstsModule.TEAMS_LIST;
    TEAMS_LIST.clear();
  });

  test("isEnabled should return true", () => {
    expect(teamAdmin.isEnabled()).toBe(true);
  });

  test("doesMatch should match team commands", () => {
    expect(teamAdmin.doesMatch({ text: "team list" })).toBe(true);
    expect(teamAdmin.doesMatch({ text: "team add" })).toBe(true);
    expect(teamAdmin.doesMatch({ text: "team remove" })).toBe(true);
    expect(teamAdmin.doesMatch({ text: "teams list" })).toBe(false);
    expect(teamAdmin.doesMatch({ text: "help" })).toBe(false);
  });

  test("should deny access to unauthorized users", async () => {
    // Mock authorization check to fail
    mockAdminAuthService.isAuthorized.mockReturnValue(false);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient as WebClient);

    // Check authorization was called
    expect(mockAdminAuthService.isAuthorized).toHaveBeenCalledWith(
      "U12345",
      "team list",
    );

    // Check that unauthorized message was sent
    expect(mockSendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("not authorized"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  test("should allow access to authorized users", async () => {
    // Mock authorization check to succeed
    mockAdminAuthService.isAuthorized.mockReturnValue(true);

    // Add some test teams
    for (let i = 1; i <= 6; i++) {
      TEAMS_LIST.set(`test-ask-${i}`, {
        name: `test-ask-${i}`,
        ask_channel_id: `C${i}`,
        ask_channel_name: `test-ask-channel-${i}`,
        ask_channel_cron_last_sent: new Date().toISOString(),
        allowed_bots: [],
      });
    }

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient as WebClient);

    // Check that summary message was sent
    expect(mockSendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Team Configuration Summary"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );

    // Check that summary contains the table header
    const summaryCall = mockSendSlackMessage.mock.calls[0][1];
    expect(summaryCall).toContain("| # | Team Name | Ask Channel |");

    // Check that detail messages were sent - should be 2 chunks of 5 teams
    expect(mockSendSlackMessage).toHaveBeenCalledTimes(3); // Summary + 2 detail messages

    // Check first detail message
    const firstDetailCall = mockSendSlackMessage.mock.calls[1][1];
    expect(firstDetailCall).toContain("Detailed Team Information (1-5)");
    expect(firstDetailCall).toContain("*Team #1: test-ask-channel-1*");

    // Check second detail message
    const secondDetailCall = mockSendSlackMessage.mock.calls[2][1];
    expect(secondDetailCall).toContain("Detailed Team Information (6-6)");
    expect(secondDetailCall).toContain("*Team #6: test-ask-channel-6*");
  });

  test("no teams to list", async () => {
    // Mock authorization check to succeed
    mockAdminAuthService.isAuthorized.mockReturnValue(true);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient as WebClient);

    // Check that summary message was sent
    expect(mockSendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("No teams are currently configured."),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  test("chunkArray should correctly divide teams", () => {
    // Create test data
    const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Access private method using type assertion
    const chunkedArray = (teamAdmin as any).chunkArray(testArray, 3);

    // Verify chunking
    expect(chunkedArray).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
  });

  test("getHelpText returns expected help description", () => {
    const helpText = teamAdmin.getHelpText();
    expect(helpText).toContain("team admin");
    expect(helpText).toContain("Admin commands");
    expect(helpText).toContain("restricted to authorized admins");
  });
});
