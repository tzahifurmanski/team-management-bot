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
import { TEAMS_LIST } from "../../../src/settings/team_consts";
import { sendSlackMessage } from "../../../src/integrations/slack/messages";
import { TeamService } from "../../../src/services/TeamService";

// Define mock types
type MockedAdminAuthService = {
  isAuthorized: jest.MockedFunction<
    (userId: string, command: string) => boolean
  >;
  requestConfirmation: jest.MockedFunction<
    (userId: string, teamId: string, action: string) => Promise<void>
  >;
  confirmAction: jest.MockedFunction<
    (userId: string, teamId: string, action: string) => Promise<boolean>
  >;
};

type MockedSendSlackMessage = jest.MockedFunction<
  (
    client: any,
    message: string,
    channel: string,
    thread_ts?: string,
  ) => Promise<{ ok: boolean; ts: string }>
>;

// Create mock instances with proper types
const mockAdminAuthService = {
  isAuthorized: jest
    .fn<(userId: string, command: string) => boolean>()
    .mockReturnValue(true),
  requestConfirmation: jest
    .fn<(userId: string, teamId: string, action: string) => Promise<void>>()
    .mockResolvedValue(undefined),
  confirmAction: jest
    .fn<(userId: string, teamId: string, action: string) => Promise<boolean>>()
    .mockResolvedValue(true),
};

const mockSendSlackMessage = jest
  .fn<
    (
      client: any,
      message: string,
      channel: string,
      thread_ts?: string,
    ) => Promise<{ ok: boolean; ts: string }>
  >()
  .mockResolvedValue({ ok: true, ts: "123" });

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

jest.unstable_mockModule("../../../src/integrations/slack/utils", () => ({
  sanitizeCommandInput: jest.fn((input: string) => input.trim().toLowerCase()),
  isBotMessage: jest.fn().mockReturnValue(false),
}));

jest.unstable_mockModule("../../../src/actions/utils", () => ({
  extractIDFromChannelString: jest.fn().mockImplementation((input: any) => {
    const match = input.match(/<#([A-Z0-9]+)(?:\|.*)?>/);
    return match ? match[1] : null;
  }),
  extractNameFromChannelString: jest.fn().mockImplementation((input: any) => {
    const match = input.match(/<#[A-Z0-9]+\|(.+)>/);
    return match ? match[1] : null;
  }),
}));

jest.unstable_mockModule("../../../src/services/TeamService", () => ({
  TeamService: {
    createTeam: jest
      .fn<(teamId: string, teamData: any) => Promise<boolean>>()
      .mockResolvedValue(true),
    updateTeam: jest
      .fn<(teamId: string, teamData: any) => Promise<boolean>>()
      .mockResolvedValue(true),
    deleteTeam: jest
      .fn<(teamId: string) => Promise<boolean>>()
      .mockResolvedValue(true),
  },
}));

describe("TeamAdmin", () => {
  let teamAdmin: TeamAdmin;
  let mockSlackClient: WebClient;
  let mockEvent: any;
  let TEAMS_LIST: Map<string, any>;
  let adminAuthService: any;
  let TeamService: any;
  let sendSlackMessage: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Import modules after mocking
    const { TeamAdmin } = await import("../../../src/actions/asks/team_admin");
    const { adminAuthService: authService } = await import(
      "../../../src/services/AdminAuthorizationService"
    );
    const { TeamService: teamSvc } = await import(
      "../../../src/services/TeamService"
    );
    const { sendSlackMessage: sendMsg } = await import(
      "../../../src/integrations/slack/messages"
    );
    const { TEAMS_LIST: teams } = await import(
      "../../../src/settings/team_consts"
    );

    teamAdmin = new TeamAdmin();
    adminAuthService = authService;
    TeamService = teamSvc;
    sendSlackMessage = sendMsg;
    TEAMS_LIST = teams;

    // Reset mock implementations
    adminAuthService.isAuthorized.mockReset();
    adminAuthService.isAuthorized.mockReturnValue(false);
    sendSlackMessage.mockImplementation(async () => ({
      ok: true,
      ts: "1234567890.123456",
    }));

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
      team: "T12345",
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
    const event = {
      text: "team list",
      user: "U12345",
      team: "T12345",
      channel: "C12345",
      thread_ts: "1234567890.123456",
    };
    expect(teamAdmin.doesMatch(event)).toBe(true);

    event.text = "team add";
    expect(teamAdmin.doesMatch(event)).toBe(true);

    event.text = "team remove";
    expect(teamAdmin.doesMatch(event)).toBe(true);

    event.text = "teams list";
    expect(teamAdmin.doesMatch(event)).toBe(false);

    event.text = "help";
    expect(teamAdmin.doesMatch(event)).toBe(false);
  });

  test("should deny access to unauthorized users", async () => {
    // Mock authorization check to fail
    adminAuthService.isAuthorized.mockReturnValue(false);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient as WebClient);

    // Check authorization was called
    expect(adminAuthService.isAuthorized).toHaveBeenCalledWith(
      "U12345",
      "team list",
    );

    // Check that unauthorized message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("not authorized"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  test("should allow access to authorized users", async () => {
    // Mock authorization check to succeed
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Set event text
    mockEvent.text = "team help";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check help message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Team Administration Commands"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  test("should list teams in the new format", async () => {
    // Mock authorization check to succeed
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Add test teams (adding 6 to test chunking)
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
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Team Configuration Summary"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );

    // Check that summary contains the table header
    const summaryCall = sendSlackMessage.mock.calls[0][1];
    expect(summaryCall).toContain("| # | Team Name | Ask Channel |");

    // Check that detail messages were sent - should be 2 chunks of 5 teams
    expect(sendSlackMessage).toHaveBeenCalledTimes(3); // Summary + 2 detail messages

    // Check first detail message
    const firstDetailCall = sendSlackMessage.mock.calls[1][1];
    expect(firstDetailCall).toContain("Detailed Team Information (1-5)");
    expect(firstDetailCall).toContain("*Team #1: test-ask-channel-1*");

    // Check second detail message
    const secondDetailCall = sendSlackMessage.mock.calls[2][1];
    expect(secondDetailCall).toContain("Detailed Team Information (6-6)");
    expect(secondDetailCall).toContain("*Team #6: test-ask-channel-6*");
  });

  test("no teams to list", async () => {
    // Mock authorization check to succeed
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient as WebClient);

    // Check that summary message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
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

  test("should show help information when 'team help' is used", async () => {
    // Set event text
    mockEvent.text = "team help";

    // Mock authorization check to succeed
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check help message was sent
    expect(sendSlackMessage).toHaveBeenCalledTimes(1);
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.any(String),
      mockEvent.channel,
      mockEvent.thread_ts,
    );

    // Get the help message content
    const helpMessage = sendSlackMessage.mock.calls[0][1];

    // Verify help content includes essential sections
    expect(helpMessage).toContain("Team Administration Commands");
    expect(helpMessage).toContain("team list");
  });

  describe("addTeam", () => {
    test("should add a new team successfully", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.createTeam.mockResolvedValue(true);

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel> 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check that TeamService.createTeam was called
      expect(TeamService.createTeam).toHaveBeenCalled();

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully added team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should add a new team successfully when channel name is not provided in channel string", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.createTeam.mockResolvedValue(true);

      // Mock the conversations.info response
      const mockConversationsInfo = jest.fn().mockImplementation(async () => ({
        ok: true,
        channel: {
          id: "C07PNPKGL64",
          name: "retrieved-channel-name",
        },
      })) as jest.MockedFunction<typeof mockSlackClient.conversations.info>;

      mockSlackClient.conversations.info = mockConversationsInfo;

      // Set event text with a channel string that doesn't include a name
      mockEvent.text = "team add <#C07PNPKGL64|> 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify conversations.info was called to get the channel name
      expect(mockConversationsInfo).toHaveBeenCalledWith({
        channel: "C07PNPKGL64",
      });

      // Check that TeamService.createTeam was called with the retrieved name
      expect(TeamService.createTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          ask_channel_id: "C07PNPKGL64",
          ask_channel_name: "retrieved-channel-name",
        }),
      );

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully added team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle invalid channel format", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team add invalid-channel";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle existing team", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Add a team to TEAMS_LIST
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
        zendesk_channel_id: "",
        zendesk_channel_name: "",
        zendesk_monitored_view_id: "",
        zendesk_aggregated_field_id: "",
        zendesk_field_id: "",
        zendesk_field_values: [],
        zendesk_channel_cron: "",
        code_review_channel_id: "",
        code_review_channel_name: "",
      });

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("already exists"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle TeamService failure", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.createTeam.mockResolvedValue(false);

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Failed to add team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle missing channel information", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team add";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide channel information"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle general error", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.createTeam.mockRejectedValue(new Error("Some error"));

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while adding the team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });
  });

  describe("editTeam", () => {
    beforeEach(() => {
      // Add a team to TEAMS_LIST for testing
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: new Date(),
        allowed_bots: [],
        zendesk_channel_id: "",
        zendesk_channel_name: "",
        zendesk_monitored_view_id: "",
        zendesk_aggregated_field_id: "",
        zendesk_field_id: "",
        zendesk_field_values: [],
        zendesk_channel_cron: "",
        code_review_channel_id: "",
        code_review_channel_name: "",
      });

      // Reset mocks
      jest.clearAllMocks();
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);
    });

    test("should edit a team successfully", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Set event text
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check that TeamService.updateTeam was called
      expect(TeamService.updateTeam).toHaveBeenCalled();

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully updated team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle invalid channel format", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team edit invalid-channel ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle non-existing team", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text =
        "team edit <#C99999|non-existing-channel> ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("No team found for channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle invalid property", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text =
        "team edit <#C12345|test-channel> invalid_property some_value";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Invalid property"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle TeamService failure", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockResolvedValue(false);

      // Set event text
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Failed to update team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle missing arguments", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team edit <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining(
          "Please provide: `team edit #channel-name property value`",
        ),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle general error", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockRejectedValue(new Error("Some error"));

      // Set event text
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while updating the team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle array properties", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Set event text
      mockEvent.text =
        "team edit <#C12345|test-channel> allowed_bots Bot1,Bot2";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check that TeamService.updateTeam was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        allowed_bots: ["Bot1", "Bot2"],
      });

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully updated team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle channel ID update with valid new channel", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Set event text to update channel ID
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_id <#C67890|new-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_id: "C67890",
        ask_channel_name: "new-channel",
      });

      // Verify TEAMS_LIST was updated
      expect(TEAMS_LIST.has("C12345")).toBe(false);
      expect(TEAMS_LIST.has("C67890")).toBe(true);
      const updatedTeam = TEAMS_LIST.get("C67890");
      expect(updatedTeam?.ask_channel_id).toBe("C67890");
      expect(updatedTeam?.ask_channel_name).toBe("new-channel");
    });

    test("should handle channel name update with valid new channel", async () => {
      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
      });

      const event = {
        text: "team edit <#C12345|test-channel> ask_channel_name new-name",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Mock authorization
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_name: "new-name",
      });
    });

    test("should handle array properties with empty values", async () => {
      // Clear all mocks before test
      jest.clearAllMocks();

      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: ["bot1", "bot2"],
      });

      // Mock authorization and confirmation
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Create event with empty array value
      const event = {
        text: "team edit <#C12345|test-channel> allowed_bots EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify authorization flow
      expect(adminAuthService.isAuthorized).toHaveBeenCalled();
      expect(adminAuthService.requestConfirmation).toHaveBeenCalled();
      expect(adminAuthService.confirmAction).toHaveBeenCalled();

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        allowed_bots: [],
      });
    });

    test("should handle EMPTY value for channel ID", async () => {
      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
      });

      // Mock authorization and confirmation
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Create event with EMPTY value
      const event = {
        text: "team edit <#C12345|test-channel> ask_channel_id EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_id: "",
        ask_channel_name: "",
      });
    });

    test("should handle EMPTY value for zendesk channel ID", async () => {
      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
        zendesk_channel_id: "Z12345",
        zendesk_channel_name: "zendesk-channel",
      });

      // Mock authorization and confirmation
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Create event with EMPTY value
      const event = {
        text: "team edit <#C12345|test-channel> zendesk_channel_id EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        zendesk_channel_id: "",
        zendesk_channel_name: "",
      });
    });

    test("should handle EMPTY value for zendesk field values", async () => {
      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
        zendesk_field_values: ["value1", "value2"],
      });

      // Mock authorization and confirmation
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Create event with EMPTY value
      const event = {
        text: "team edit <#C12345|test-channel> zendesk_field_values EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        zendesk_field_values: [],
      });
    });

    test("should handle cron schedule update", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Set event text to update cron schedule
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_cron: "0 9 * * 1-5",
      });

      // Verify TEAMS_LIST was updated
      const updatedTeam = TEAMS_LIST.get("C12345");
      expect(updatedTeam?.ask_channel_cron).toBe("0 9 * * 1-5");
    });

    test("should handle zendesk channel update", async () => {
      // Setup initial state
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
        zendesk_channel_id: "",
        zendesk_channel_name: "",
      });

      const event = {
        text: "team edit <#C12345|test-channel> zendesk_channel_id <#Z12345|zendesk-channel>",
        user: "U12345",
        team: "T12345",
        channel: "C12345",
        thread_ts: "1234567890.123456",
      };

      // Mock authorization
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Verify TeamService was called with correct data
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        zendesk_channel_id: "Z12345",
        zendesk_channel_name: "zendesk-channel",
      });
    });

    test("should handle invalid channel format when updating channel ID", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text with invalid channel format
      mockEvent.text =
        "team edit <#C12345|test-channel> ask_channel_id invalid-channel";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify error message was sent
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );

      // Verify TEAMS_LIST was not modified
      expect(TEAMS_LIST.has("C12345")).toBe(true);
      const team = TEAMS_LIST.get("C12345");
      expect(team?.ask_channel_id).toBe("C12345");
    });

    test("should validate valid cron schedule for ask_channel_cron", async () => {
      // Set event text with valid cron
      const event = {
        text: "team edit <#C12345|test-channel> ask_channel_cron 0 9 * * 1-5",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Check that TeamService.updateTeam was called with the valid cron
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_cron: "0 9 * * 1-5",
      });

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully updated team"),
        event.channel,
        event.thread_ts,
      );
    });

    test("should reject invalid cron schedule for ask_channel_cron", async () => {
      // Set event text with invalid cron
      const event = {
        text: "team edit <#C12345|test-channel> ask_channel_cron invalid-cron",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Check that TeamService.updateTeam was not called
      expect(TeamService.updateTeam).not.toHaveBeenCalled();

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Invalid cron schedule format"),
        event.channel,
        event.thread_ts,
      );
    });

    test("should validate valid cron schedule for zendesk_channel_cron", async () => {
      // Set event text with valid cron
      const event = {
        text: "team edit <#C12345|test-channel> zendesk_channel_cron 0 9 * * 1-5",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Check that TeamService.updateTeam was called with the valid cron
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        zendesk_channel_cron: "0 9 * * 1-5",
      });

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully updated team"),
        event.channel,
        event.thread_ts,
      );
    });

    test("should reject invalid cron schedule for zendesk_channel_cron", async () => {
      // Set event text with invalid cron
      const event = {
        text: "team edit <#C12345|test-channel> zendesk_channel_cron invalid-cron",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      // Call performAction
      await teamAdmin.performAction(event, mockSlackClient);

      // Check that TeamService.updateTeam was not called
      expect(TeamService.updateTeam).not.toHaveBeenCalled();

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Invalid cron schedule format"),
        event.channel,
        event.thread_ts,
      );
    });

    test("should allow empty value for cron schedules", async () => {
      // Test ask_channel_cron
      const event1 = {
        text: "team edit <#C12345|test-channel> ask_channel_cron EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      await teamAdmin.performAction(event1, mockSlackClient);
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        ask_channel_cron: "",
      });

      // Reset mocks
      jest.clearAllMocks();
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TeamService.updateTeam.mockResolvedValue(true);

      // Test zendesk_channel_cron
      const event2 = {
        text: "team edit <#C12345|test-channel> zendesk_channel_cron EMPTY",
        user: "U12345",
        team: "T12345",
        channel: "C67890",
        thread_ts: "1234567890.123456",
      };

      await teamAdmin.performAction(event2, mockSlackClient);
      expect(TeamService.updateTeam).toHaveBeenCalledWith("C12345", {
        zendesk_channel_cron: "",
      });
    });
  });

  describe("deleteTeam", () => {
    beforeEach(() => {
      // Add a team to TEAMS_LIST for testing
      TEAMS_LIST.set("C12345", {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: new Date(),
        allowed_bots: [],
        zendesk_channel_id: "",
        zendesk_channel_name: "",
        zendesk_monitored_view_id: "",
        zendesk_aggregated_field_id: "",
        zendesk_field_id: "",
        zendesk_field_values: [],
        zendesk_channel_cron: "",
        code_review_channel_id: "",
        code_review_channel_name: "",
      });
    });

    test("should delete a team successfully", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.deleteTeam.mockResolvedValue(true);

      // Set event text
      mockEvent.text = "team delete <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check that TeamService.deleteTeam was called
      expect(TeamService.deleteTeam).toHaveBeenCalled();

      // Check success message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Successfully deleted team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );

      // Check that the team was removed from TEAMS_LIST
      expect(TEAMS_LIST.has("C12345")).toBe(false);
    });

    test("should handle invalid channel format", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete invalid-channel";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle non-existing team", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete <#C99999|non-existing-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("No team found for channel"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle TeamService failure", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.deleteTeam.mockResolvedValue(false);

      // Set event text
      mockEvent.text = "team delete <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Failed to delete team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle missing arguments", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining(
          "Please provide a channel: `team delete #channel-name`",
        ),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle general error", async () => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      TeamService.deleteTeam.mockRejectedValue(new Error("Some error"));

      // Set event text
      mockEvent.text = "team delete <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while deleting the team"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });
  });

  it("should handle unauthorized user", async () => {
    // Mock isAuthorized to return false
    adminAuthService.isAuthorized.mockReturnValue(false);

    // Set event text
    mockEvent.text = "team admin";

    await teamAdmin.performAction(mockEvent, mockSlackClient);

    expect(adminAuthService.isAuthorized).toHaveBeenCalledWith(
      "U12345",
      "team admin",
    );
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining(
        "Sorry, you're not authorized to perform admin commands",
      ),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  it("should handle confirmation request failure", async () => {
    // Set up mocks
    adminAuthService.isAuthorized.mockReturnValue(true);
    adminAuthService.requestConfirmation.mockRejectedValue(
      new Error("Confirmation failed"),
    );

    // Set event text
    mockEvent.text = "team admin";

    await teamAdmin.performAction(mockEvent, mockSlackClient);

    expect(adminAuthService.requestConfirmation).toHaveBeenCalledWith(
      "U12345",
      "T12345",
      "team admin",
    );
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Failed to process your request"),
      mockEvent.channel,
      mockEvent.thread_ts,
    );
  });

  it("should handle successful confirmation", async () => {
    // Set up mocks
    adminAuthService.isAuthorized.mockReturnValue(true);
    adminAuthService.requestConfirmation.mockResolvedValue(undefined);
    adminAuthService.confirmAction.mockResolvedValue(true);

    // Set event text
    mockEvent.text = "team admin";

    await teamAdmin.performAction(mockEvent, mockSlackClient);

    expect(adminAuthService.isAuthorized).toHaveBeenCalledWith(
      "U12345",
      "team admin",
    );
    expect(adminAuthService.requestConfirmation).toHaveBeenCalledWith(
      "U12345",
      "T12345",
      "team admin",
    );
    expect(adminAuthService.confirmAction).toHaveBeenCalledWith(
      "U12345",
      "T12345",
      "team admin",
    );
  });

  test("should handle error in listTeams", async () => {
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Add a team to TEAMS_LIST so we can test the error case
    TEAMS_LIST.set("C12345", {
      ask_channel_id: "C12345",
      ask_channel_name: "test-channel",
      ask_channel_cron: "",
      ask_channel_cron_last_sent: null,
      allowed_bots: [],
      zendesk_channel_id: "",
      zendesk_channel_name: "",
      zendesk_monitored_view_id: "",
      zendesk_aggregated_field_id: "",
      zendesk_field_id: "",
      zendesk_field_values: [],
      zendesk_channel_cron: "",
      code_review_channel_id: "",
      code_review_channel_name: "",
    });

    // Mock the error by making TEAMS_LIST.entries throw
    const originalEntries = TEAMS_LIST.entries;
    const mockEntries = jest.fn(() => {
      throw new Error("Database error");
    });
    TEAMS_LIST.entries = mockEntries;

    // Set event text
    mockEvent.text = "team list";

    try {
      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while listing teams"),
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    } finally {
      // Restore original entries method
      TEAMS_LIST.entries = originalEntries;
      // Clear test data
      TEAMS_LIST.clear();
    }
  });

  test("should handle teams with different configurations in list", async () => {
    adminAuthService.isAuthorized.mockReturnValue(true);

    // Clear any existing teams
    TEAMS_LIST.clear();

    // Add test teams with various configurations
    const testTeam = {
      ask_channel_id: "C12345",
      ask_channel_name: "test-channel-1",
      ask_channel_cron: "0 9 * * 1-5",
      ask_channel_cron_last_sent: new Date().toISOString(),
      allowed_bots: ["bot1"],
      zendesk_channel_id: "Z12345",
      zendesk_channel_name: "zendesk-channel",
      zendesk_monitored_view_id: "123",
      zendesk_field_id: "456",
      zendesk_field_values: ["val1", "val2"],
      zendesk_channel_cron: "0 10 * * 1-5",
      code_review_channel_id: "CR12345",
      code_review_channel_name: "code-review",
    };

    // Add the team to the map
    TEAMS_LIST.set(testTeam.ask_channel_id, testTeam);

    try {
      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify the summary includes all configurations
      const summaryCall = sendSlackMessage.mock.calls[0][1];
      expect(summaryCall).toContain("With Zendesk: *1*");
      expect(summaryCall).toContain("With Cron Schedule: *1*");
      expect(summaryCall).toContain("With Code Review: *1*");

      // Verify detailed information
      const detailCall = sendSlackMessage.mock.calls[1][1];
      expect(detailCall).toContain(
        "Zendesk Channel: <#Z12345|zendesk-channel>",
      );
      expect(detailCall).toContain("Ask Schedule: `0 9 * * 1-5`");
      expect(detailCall).toContain("Zendesk Schedule: `0 10 * * 1-5`");
    } finally {
      // Clear test data
      TEAMS_LIST.clear();
    }
  });

  describe("confirmation flow", () => {
    beforeEach(() => {
      adminAuthService.isAuthorized.mockReturnValue(true);
    });

    test("should handle confirmation timeout", async () => {
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(false);

      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      expect(adminAuthService.requestConfirmation).toHaveBeenCalledWith(
        "U12345",
        "T12345",
        "team admin",
      );
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        "Action was not confirmed.",
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });

    test("should handle confirmation request network error", async () => {
      adminAuthService.requestConfirmation.mockRejectedValue(
        new Error("Network error"),
      );

      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      expect(adminAuthService.requestConfirmation).toHaveBeenCalledWith(
        "U12345",
        "T12345",
        "team admin",
      );
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        "Failed to process your request",
        mockEvent.channel,
        mockEvent.thread_ts,
      );
    });
  });

  describe("complex team configurations", () => {
    beforeEach(() => {
      adminAuthService.isAuthorized.mockReturnValue(true);
      adminAuthService.requestConfirmation.mockResolvedValue(undefined);
      adminAuthService.confirmAction.mockResolvedValue(true);
      TEAMS_LIST.clear();
    });

    test("should handle teams with special characters in names", async () => {
      const specialTeam = {
        ask_channel_id: "C12345",
        ask_channel_name: "test-channel-with-special-chars-!@#$%",
        ask_channel_cron: "0 9 * * 1-5",
        ask_channel_cron_last_sent: new Date().toISOString(),
        allowed_bots: ["bot1", "bot2"],
        zendesk_channel_id: "Z12345",
        zendesk_channel_name: "zendesk-special-!@#$%",
        zendesk_monitored_view_id: "123",
        zendesk_field_id: "456",
        zendesk_field_values: ["val1", "val2"],
        zendesk_channel_cron: "0 10 * * 1-5",
        code_review_channel_id: "CR12345",
        code_review_channel_name: "code-review-special-!@#$%",
      };

      TEAMS_LIST.set(specialTeam.ask_channel_id, specialTeam);

      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify the output contains the special characters properly escaped
      const summaryCall = sendSlackMessage.mock.calls[0][1];
      expect(summaryCall).toContain("test-channel-with-special-chars-!@#$%");
      expect(summaryCall).toContain("With Zendesk: *1*");
      expect(summaryCall).toContain("With Code Review: *1*");
    });

    test("should handle teams with empty optional fields", async () => {
      const minimalTeam = {
        ask_channel_id: "C12345",
        ask_channel_name: "minimal-team",
        ask_channel_cron: "",
        ask_channel_cron_last_sent: null,
        allowed_bots: [],
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

      TEAMS_LIST.set(minimalTeam.ask_channel_id, minimalTeam);

      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify the output handles empty fields correctly
      const summaryCall = sendSlackMessage.mock.calls[0][1];
      expect(summaryCall).toContain("With Zendesk: *0*");
      expect(summaryCall).toContain("With Cron Schedule: *0*");
      expect(summaryCall).toContain("With Code Review: *0*");

      const detailCall = sendSlackMessage.mock.calls[1][1];
      expect(detailCall).toContain("Allowed Bots: None");
      expect(detailCall).not.toContain("Zendesk Channel:");
      expect(detailCall).not.toContain("Ask Schedule:");
    });

    test("should handle maximum number of teams", async () => {
      // Add 20 teams to test pagination
      for (let i = 1; i <= 20; i++) {
        TEAMS_LIST.set(`C${i}`, {
          ask_channel_id: `C${i}`,
          ask_channel_name: `team-${i}`,
          ask_channel_cron: i % 2 === 0 ? "0 9 * * 1-5" : "",
          ask_channel_cron_last_sent: new Date().toISOString(),
          allowed_bots: i % 3 === 0 ? ["bot1", "bot2"] : [],
          zendesk_channel_id: i % 4 === 0 ? `Z${i}` : "",
          zendesk_channel_name: i % 4 === 0 ? `zendesk-${i}` : "",
          zendesk_monitored_view_id: i % 4 === 0 ? "123" : "",
          zendesk_field_id: i % 4 === 0 ? "456" : "",
          zendesk_field_values: i % 4 === 0 ? ["val1", "val2"] : [],
          zendesk_channel_cron: i % 4 === 0 ? "0 10 * * 1-5" : "",
          code_review_channel_id: i % 5 === 0 ? `CR${i}` : "",
          code_review_channel_name: i % 5 === 0 ? `code-review-${i}` : "",
        });
      }

      // Set event text
      mockEvent.text = "team list";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Verify summary shows correct counts
      const summaryCall = sendSlackMessage.mock.calls[0][1];
      expect(summaryCall).toContain("Total Teams: *20*");
      expect(summaryCall).toContain("With Zendesk: *5*"); // Every 4th team
      expect(summaryCall).toContain("With Cron Schedule: *10*"); // Every 2nd team
      expect(summaryCall).toContain("With Code Review: *4*"); // Every 5th team

      // Verify pagination
      expect(sendSlackMessage).toHaveBeenCalledTimes(5); // Summary + 4 detail messages (5 teams per page)

      // Check first and last detail messages
      const firstDetailCall = sendSlackMessage.mock.calls[1][1];
      expect(firstDetailCall).toContain("Detailed Team Information (1-5)");

      const lastDetailCall = sendSlackMessage.mock.calls[4][1];
      expect(lastDetailCall).toContain("Detailed Team Information (16-20)");
    });
  });
});
