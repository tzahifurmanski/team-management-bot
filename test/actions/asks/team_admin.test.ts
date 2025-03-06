// test/actions/asks/team_admin.test.ts
import { TeamAdmin } from "../../../src/actions/asks/team_admin";
import { adminAuthService } from "../../../src/services/AdminAuthorizationService";
import { TEAMS_LIST } from "../../../src/settings/team_consts";
import { sendSlackMessage } from "../../../src/integrations/slack/messages";

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

  test("chunkArray should correctly divide teams", () => {
    // Create test data
    const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Access private method using type assertion
    const chunkedArray = (teamAdmin as any).chunkArray(testArray, 3);

    // Verify chunking
    expect(chunkedArray).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
  });
});
