import { jest } from "@jest/globals";
import { Team } from "../../src/entities/Team";
import { AskChannel } from "../../src/entities/AskChannel";
import { ZendeskIntegration } from "../../src/entities/ZendeskIntegration";
import { CodeReviewChannel } from "../../src/entities/CodeReviewChannel";

// Mock the database connection
jest.unstable_mockModule("../../src/database/connection", () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Mock the TEAMS_LIST
jest.unstable_mockModule("../../src/settings/team_consts", () => ({
  TEAMS_LIST: new Map(),
}));

describe("TeamService", () => {
  let TeamService: typeof import("../../src/services/TeamService").TeamService;
  let TEAMS_LIST: Map<string, any>;
  let mockTeamRepository: any;
  let mockAskChannelRepository: any;
  let mockZendeskIntegrationRepository: any;
  let mockCodeReviewChannelRepository: any;

  beforeEach(async () => {
    // Import the modules after mocking
    const TeamServiceModule = await import("../../src/services/TeamService");
    const { TEAMS_LIST: TeamsList } = await import(
      "../../src/settings/team_consts"
    );
    TeamService = TeamServiceModule.TeamService;
    TEAMS_LIST = TeamsList;

    // Clear TEAMS_LIST
    TEAMS_LIST.clear();

    // Setup mock repositories
    mockTeamRepository = {
      save: jest.fn(),
      remove: jest.fn(),
      metadata: {
        name: "Team",
        target: Team,
      },
    };

    mockAskChannelRepository = {
      findOne: jest.fn(),
      metadata: {
        name: "AskChannel",
        target: AskChannel,
      },
    };

    mockZendeskIntegrationRepository = {
      remove: jest.fn(),
      metadata: {
        name: "ZendeskIntegration",
        target: ZendeskIntegration,
      },
    };

    mockCodeReviewChannelRepository = {
      remove: jest.fn(),
      metadata: {
        name: "CodeReviewChannel",
        target: CodeReviewChannel,
      },
    };

    // Setup mock repository getter
    const { AppDataSource } = await import("../../src/database/connection");
    (AppDataSource.getRepository as jest.Mock).mockImplementation(
      (entity: any) => {
        if (entity === Team) return mockTeamRepository;
        if (entity === AskChannel) return mockAskChannelRepository;
        if (entity === ZendeskIntegration)
          return mockZendeskIntegrationRepository;
        if (entity === CodeReviewChannel)
          return mockCodeReviewChannelRepository;
        return null;
      },
    );
  });

  describe("updateTeam", () => {
    const existingTeam = new Team();
    const existingAskChannel = new AskChannel();
    existingAskChannel.channel_id = "C12345";
    existingAskChannel.channel_name = "test-channel";
    existingAskChannel.team = existingTeam;
    existingTeam.askChannel = existingAskChannel;

    beforeEach(() => {
      // Setup initial TEAMS_LIST state
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

      // Setup mock repository responses
      mockAskChannelRepository.findOne.mockResolvedValue(existingAskChannel);
      mockTeamRepository.save.mockResolvedValue(existingTeam);
    });

    test("should update ask_channel_id and update TEAMS_LIST", async () => {
      const updates = {
        ask_channel_id: "C67890",
        ask_channel_name: "new-channel",
      };

      const result = await TeamService.updateTeam("C12345", updates);

      expect(result).toBe(true);
      expect(mockAskChannelRepository.findOne).toHaveBeenCalledWith({
        where: { channel_id: "C12345" },
        relations: [
          "team",
          "team.zendeskIntegration",
          "team.codeReviewChannel",
        ],
      });
      expect(mockTeamRepository.save).toHaveBeenCalled();

      // Verify TEAMS_LIST updates
      expect(TEAMS_LIST.has("C12345")).toBe(false);
      expect(TEAMS_LIST.has("C67890")).toBe(true);
      const updatedTeam = TEAMS_LIST.get("C67890");
      expect(updatedTeam?.ask_channel_id).toBe("C67890");
      expect(updatedTeam?.ask_channel_name).toBe("new-channel");
    });

    test("should handle non-existent team", async () => {
      mockAskChannelRepository.findOne.mockResolvedValue(null);

      const updates = {
        ask_channel_id: "C67890",
        ask_channel_name: "new-channel",
      };

      const result = await TeamService.updateTeam("C12345", updates);

      expect(result).toBe(false);
      expect(mockTeamRepository.save).not.toHaveBeenCalled();
      expect(TEAMS_LIST.has("C12345")).toBe(true);
      expect(TEAMS_LIST.has("C67890")).toBe(false);
    });

    test("should handle database save error", async () => {
      // Setup initial state
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

      mockTeamRepository.save.mockRejectedValue(new Error("Save failed"));

      const updates = {
        ask_channel_id: "C67890",
        ask_channel_name: "new-channel",
      };

      const result = await TeamService.updateTeam("C12345", updates);

      expect(result).toBe(false);
      expect(mockTeamRepository.save).toHaveBeenCalled();
      expect(TEAMS_LIST.has("C12345")).toBe(true);
      expect(TEAMS_LIST.has("C67890")).toBe(false);
    });

    test("should update other ask channel properties", async () => {
      // Setup initial state
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

      const updates = {
        ask_channel_cron: "0 9 * * 1-5",
        ask_channel_cron_last_sent: new Date(),
        allowed_bots: ["bot1", "bot2"],
      };

      const result = await TeamService.updateTeam("C12345", updates);

      expect(result).toBe(true);
      expect(mockTeamRepository.save).toHaveBeenCalled();

      // Verify TEAMS_LIST updates
      const updatedTeam = TEAMS_LIST.get("C12345");
      expect(updatedTeam?.ask_channel_cron).toBe("0 9 * * 1-5");
      expect(updatedTeam?.allowed_bots).toEqual(["bot1", "bot2"]);
    });
  });
});
