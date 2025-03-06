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
    expect(teamAdmin.doesMatch({ text: "teams" })).toBe(false);
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

  test("should list teams", async () => {
    // Mock authorization check to succeed
    (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

    // Add a test team
    TEAMS_LIST.set("C12345", {
      ask_channel_id: "C12345",
      ask_channel_name: "test-ask",
      ask_channel_cron: "0 9 * * 1-5",
      ask_channel_cron_last_sent: new Date(),
      allowed_bots: ["TestBot"],
      zendesk_channel_id: "C67890",
      zendesk_channel_name: "test-zendesk",
      zendesk_monitored_view_id: "123456",
      zendesk_aggregated_field_id: "",
      zendesk_field_id: "",
      zendesk_field_values: [],
      zendesk_channel_cron: "",
      code_review_channel_id: "",
      code_review_channel_name: "",
    });

    // Set event text
    mockEvent.text = "team list";

    // Call performAction
    await teamAdmin.performAction(mockEvent, mockSlackClient);

    // Check list message was sent
    expect(sendSlackMessage).toHaveBeenCalledWith(
      mockSlackClient,
      expect.stringContaining("Configured Teams"),
      mockEvent.channel,
      mockEvent.thread_ts
    );
  });

//   test("should handle confirmation request for team removal", async () => {
//     // Mock authorization check to succeed
//     (adminAuthService.isAuthorized as jest.Mock).mockReturnValue(true);

//     // Mock confirmation request
//     (adminAuthService.requestConfirmation as jest.Mock).mockReturnValue(
//       "abc123"
//     );

//     // Add a test team
//     TEAMS_LIST.set("C12345", {
//       ask_channel_id: "C12345",
//       ask_channel_name: "test-ask",
//       ask_channel_cron: "0 9 * * 1-5",
//       ask_channel_cron_last_sent: new Date(),
//       allowed_bots: ["TestBot"],
//       zendesk_channel_id: "",
//       zendesk_channel_name: "",
//       zendesk_monitored_view_id: "",
//       zendesk_aggregated_field_id: "",
//       zendesk_field_id: "",
//       zendesk_field_values: [],
//       zendesk_channel_cron: "",
//       code_review_channel_id: "",
//       code_review_channel_name: "",
//     });

//     // Set event text
//     mockEvent.text = "team remove <#C12345|test-ask>";

//     // Call performAction
//     await teamAdmin.performAction(mockEvent, mockSlackClient);

//     // Check confirmation message was sent
//     expect(sendSlackMessage).toHaveBeenCalledWith(
//       mockSlackClient,
//       expect.stringContaining("Are you sure you want to remove"),
//       mockEvent.channel,
//       mockEvent.thread_ts
//     );
//   });

//   // Additional tests for other functionality...
// });
