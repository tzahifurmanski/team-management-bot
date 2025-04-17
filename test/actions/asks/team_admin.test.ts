// test/actions/asks/team_admin.test.ts
import { TeamAdmin } from "../../../src/actions/asks/team_admin";
import { adminAuthService } from "../../../src/services/AdminAuthorizationService";
import { TEAMS_LIST } from "../../../src/settings/team_consts";
import { sendSlackMessage } from "../../../src/integrations/slack/messages";
import { TeamService } from "../../../src/services/TeamService";

// Mock dependencies
jest.mock("../../../src/services/AdminAuthorizationService", () => ({
  adminAuthService: {
    isAuthorized: jest.fn(),
    requestConfirmation: jest.fn(),
    confirmAction: jest.fn(),
  },
}));

jest.mock("../../../src/integrations/slack/messages", () => ({
  sendSlackMessage: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../src/settings/team_consts", () => ({
  TEAMS_LIST: new Map(),
}));

jest.mock("../../../src/utils", () => ({
  handleListParameter: jest
    .fn()
    .mockImplementation((input) => (input ? input.split(",") : [])),
}));

jest.mock("../../../src/actions/utils", () => ({
  extractIDFromChannelString: jest.fn().mockImplementation((input) => {
    const match = input.match(/<#([A-Z0-9]+)\|.+>/);
    return match ? match[1] : null;
  }),
  extractNameFromChannelString: jest.fn().mockImplementation((input) => {
    const match = input.match(/<#[A-Z0-9]+\|(.+)>/);
    return match ? match[1] : null;
  }),
}));

jest.mock("../../../src/services/TeamService", () => ({
  TeamService: {
    createTeam: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
  },
}));

describe("TeamAdmin", () => {
  let teamAdmin: TeamAdmin;
  let mockSlackClient: any;
  let mockEvent: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create instance
    teamAdmin = new TeamAdmin();

    // Create mock Slack client
    mockSlackClient = {
      conversations: {
        info: jest
          .fn()
          .mockResolvedValue({ channel: { name: "test-channel" } }),
      },
    };

    // Create mock event
    mockEvent = {
      user: "U12345",
      channel: "C67890",
      thread_ts: "1234567890.123456",
    };

    // Reset TEAMS_LIST
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
    (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(false);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check authorization was called
    expect(adminAuthService.isAuthorized).toHaveBeenCalledWith(
      "U12345",
      "team list"
    );

    // Check error message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("not authorized"),
      mockEvent.channel,
      mockEvent.thread_ts
    );
  });

  test("should show help for authorized users", async () => {
    // Mock authorization check to succeed
    (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

    // Set event text
    mockEvent.text = "team help";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check help message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Team Administration Commands"),
      mockEvent.channel,
      mockEvent.thread_ts
    );
  });

  test("should list teams in the new format", async () => {
    // Mock authorization check to succeed
    (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

    // Add test teams (adding 6 to test chunking)
    for (let i = 1; i <= 6; i++) {
      TEAMS_LIST.set(`C1234${i}`, {
        ask_channel_id: `C1234${i}`,
        ask_channel_name: `test-ask-${i}`,
        ask_channel_cron: i % 2 === 0 ? "0 9 * * 1-5" : "",
        ask_channel_cron_last_sent: new Date(),
        allowed_bots: i % 3 === 0 ? ["TestBot"] : [],
        zendesk_channel_id: i % 2 === 0 ? `C6789${i}` : "",
        zendesk_channel_name: i % 2 === 0 ? `test-zendesk-${i}` : "",
        zendesk_monitored_view_id: i % 2 === 0 ? "123456" : "",
        zendesk_aggregated_field_id: "",
        zendesk_field_id: "",
        zendesk_field_values: [],
        zendesk_channel_cron: "",
        code_review_channel_id: "",
        code_review_channel_name: "",
      });
    }

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check that summary message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Team Configuration Summary"),
      mockEvent.channel,
      mockEvent.thread_ts
    );

    // Check that summary contains the table header
    const summaryCall = (sendSlackMessage as jest.Mock).mock.calls[0][1];
    expect(summaryCall).toContain("| # | Team Name | Ask Channel |");

    // Check that detail messages were sent - should be 2 chunks of 5 teams
    expect(sendSlackMessage).toHaveBeenCalledTimes(3); // Summary + 2 detail messages

    // Check first detail message
    const firstDetailCall = (sendSlackMessage as jest.Mock).mock.calls[1][1];
    expect(firstDetailCall).toContain("Detailed Team Information (1-5)");
    expect(firstDetailCall).toContain("*Team #1: test-ask-1*");

    // Check second detail message
    const secondDetailCall = (sendSlackMessage as jest.Mock).mock.calls[2][1];
    expect(secondDetailCall).toContain("Detailed Team Information (6-6)");
    expect(secondDetailCall).toContain("*Team #6: test-ask-6*");
  });

  test("no teams to list", async () => {
    // Mock authorization check to succeed
    (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check that summary message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("No teams are currently configured."),
      mockEvent.channel,
      mockEvent.thread_ts
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

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check help message was sent
    expect(sendSlackMessage).toHaveBeenCalledTimes(1);
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.any(String),
      mockEvent.channel,
      mockEvent.thread_ts
    );

    // Get the help message content
    const helpMessage = (sendSlackMessage as jest.Mock).mock.calls[0][1];

    // Verify help content includes essential sections
    expect(helpMessage).toContain("Team Administration Commands");
    expect(helpMessage).toContain("team list");
  });

  describe("addTeam", () => {
    test("should add a new team successfully", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.createTeam as jest.Mock).mockResolvedValue(true);

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
        mockEvent.thread_ts
      );
    });

    test("should handle invalid channel format", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team add invalid-channel";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle existing team", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

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
        mockEvent.thread_ts
      );
    });

    test("should handle TeamService failure", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.createTeam as jest.Mock).mockResolvedValue(false);

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Failed to add team"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle missing channel information", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team add";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide channel information"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle general error", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.createTeam as jest.Mock).mockRejectedValue(
        new Error("Some error")
      );

      // Set event text
      mockEvent.text = "team add <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while adding the team"),
        mockEvent.channel,
        mockEvent.thread_ts
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
    });

    test("should edit a team successfully", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.updateTeam as jest.Mock).mockResolvedValue(true);

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
        mockEvent.thread_ts
      );
    });

    test("should handle invalid channel format", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team edit invalid-channel ask_channel_cron 0 9 * * 1-5";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle non-existing team", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

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
        mockEvent.thread_ts
      );
    });

    test("should handle invalid property", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

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
        mockEvent.thread_ts
      );
    });

    test("should handle TeamService failure", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.updateTeam as jest.Mock).mockResolvedValue(false);

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
        mockEvent.thread_ts
      );
    });

    test("should handle missing arguments", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team edit <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining(
          "Please provide: `team edit #channel-name property value`"
        ),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle general error", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.updateTeam as jest.Mock).mockRejectedValue(
        new Error("Some error")
      );

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
        mockEvent.thread_ts
      );
    });

    test("should handle array properties", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.updateTeam as jest.Mock).mockResolvedValue(true);

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
        mockEvent.thread_ts
      );
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
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.deleteTeam as jest.Mock).mockResolvedValue(true);

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
        mockEvent.thread_ts
      );

      // Check that the team was removed from TEAMS_LIST
      expect(TEAMS_LIST.has("C12345")).toBe(false);
    });

    test("should handle invalid channel format", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete invalid-channel";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Please provide a valid Slack channel"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle non-existing team", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete <#C99999|non-existing-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("No team found for channel"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle TeamService failure", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.deleteTeam as jest.Mock).mockResolvedValue(false);

      // Set event text
      mockEvent.text = "team delete <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("Failed to delete team"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle missing arguments", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

      // Set event text
      mockEvent.text = "team delete";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining(
          "Please provide a channel: `team delete #channel-name`"
        ),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });

    test("should handle general error", async () => {
      // Mock authorization check to succeed
      (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);
      (TeamService.deleteTeam as jest.Mock).mockRejectedValue(
        new Error("Some error")
      );

      // Set event text
      mockEvent.text = "team delete <#C12345|test-channel>";

      // Call performAction
      await teamAdmin.performAction(mockEvent, mockSlackClient);

      // Check error message
      expect(sendSlackMessage).toHaveBeenCalledWith(
        mockSlackClient,
        expect.stringContaining("An error occurred while deleting the team"),
        mockEvent.channel,
        mockEvent.thread_ts
      );
    });
  });
});
