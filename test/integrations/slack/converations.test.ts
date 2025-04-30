import { jest } from "@jest/globals";
import {
  isBotAllowed,
  shouldMessageBeSkipped,
  getConversationName,
} from "../../../src/integrations/slack/conversations";
import { ConversationsInfoResponse, WebClient } from "@slack/web-api";
import { setBotSlackId } from "../../../src/settings/server_consts";

describe("isBotAllowed", () => {
  test("Empty list - disallowed", () => {
    const ALLOWED_BOTS_LIST: string[] = [];
    const botName = "Zigi The Bot";
    const message = { bot_id: "zigi", username: botName };

    expect(isBotAllowed(message, ALLOWED_BOTS_LIST)).toBeFalsy();
  });
  test("One name in list - allowed", () => {
    const ALLOWED_BOTS_LIST: string[] = ["Zigi The Bot"];
    const botName = "Zigi The Bot";
    const message = { bot_id: "zigi", username: botName };

    expect(isBotAllowed(message, ALLOWED_BOTS_LIST)).toBeTruthy();
  });

  test("Multiple names in list - allowed", () => {
    const ALLOWED_BOTS_LIST: string[] = ["Zorg", "Zigi The Bot"];
    const botName = "Zigi The Bot";
    const message = { bot_id: "zigi", username: botName };

    expect(isBotAllowed(message, ALLOWED_BOTS_LIST)).toBeTruthy();
  });

  test("One name in list - disallowed", () => {
    const ALLOWED_BOTS_LIST: string[] = ["Zorg"];
    const botName = "Zigi The Bot";
    const message = { bot_id: "zigi", username: botName };

    expect(isBotAllowed(message, ALLOWED_BOTS_LIST)).toBeFalsy();
  });

  test("Multiple name in list - disallowed", async () => {
    const ALLOWED_BOTS_LIST: string[] = ["Zorg", "Zeke The Magnificent"];

    const botName = "Zigi The Bot";
    const message = { bot_id: "zigi", username: botName };
    expect(isBotAllowed(message, ALLOWED_BOTS_LIST)).toBeFalsy();
  });
});

describe("shouldMessageBeSkipped", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  test("Allowed", () => {
    setBotSlackId("B02B6HYMEMU");

    const ALLOWED_BOTS_LIST: string[] = [
      "Zorg",
      "Zeke The Magnificent",
      "zigiBot",
    ];

    const message = {
      bot_id: "BOT_ID",
      type: "message",
      text: "Handover to OOO",
      user: "USER_ID",
      ts: "1702675238.305599",
      app_id: "APP_ID",
      blocks: [
        {
          type: "rich_text",
          block_id: "H3O",
          elements: [
            {
              type: "rich_text_section",
              elements: [{ type: "text", text: "Handover to OOO" }],
            },
          ],
        },
      ],
      team: "TEAM_ID",
      bot_profile: {
        id: "BOT_ID",
        app_id: "APP_ID",
        name: "zigiBot",
        icons: {
          image_36:
            "https://avatars.slack-edge.com/2021-05-19/2090618498164_72adc1b36522bcaf0734_36.png",
          image_48:
            "https://avatars.slack-edge.com/2021-05-19/2090618498164_72adc1b36522bcaf0734_48.png",
          image_72:
            "https://avatars.slack-edge.com/2021-05-19/2090618498164_72adc1b36522bcaf0734_72.png",
        },
        deleted: false,
        updated: 1629168655,
        team_id: "TEAM_ID",
      },
    };

    expect(shouldMessageBeSkipped(message, ALLOWED_BOTS_LIST)).toBeFalsy();
  });
});

describe("getConversationName", () => {
  test("returns empty string for empty channel ID", async () => {
    const mockSlackClient = {
      conversations: {
        info: jest
          .fn()
          .mockImplementation(async () => ({}) as ConversationsInfoResponse),
      },
    };

    const result = await getConversationName(
      mockSlackClient as unknown as WebClient,
      "",
    );
    expect(result).toBe("");
    expect(mockSlackClient.conversations.info).not.toHaveBeenCalled();
  });

  test("returns channel name for valid channel ID", async () => {
    const mockSlackClient = {
      conversations: {
        info: jest.fn().mockImplementation(
          async () =>
            ({
              ok: true,
              channel: {
                id: "C1234567890",
                name: "test-channel",
              },
            }) as ConversationsInfoResponse,
        ),
      },
    };

    const result = await getConversationName(
      mockSlackClient as unknown as WebClient,
      "C1234567890",
    );
    expect(result).toBe("test-channel");
    expect(mockSlackClient.conversations.info).toHaveBeenCalledWith({
      channel: "C1234567890",
    });
  });

  test("returns empty string when API call fails", async () => {
    const mockSlackClient = {
      conversations: {
        info: jest.fn().mockImplementation(async () => {
          throw new Error("API Error");
        }),
      },
    };

    const result = await getConversationName(
      mockSlackClient as unknown as WebClient,
      "C1234567890",
    );
    expect(result).toBe("");
    expect(mockSlackClient.conversations.info).toHaveBeenCalledWith({
      channel: "C1234567890",
    });
  });

  test("returns empty string when channel not found", async () => {
    const mockSlackClient = {
      conversations: {
        info: jest.fn().mockImplementation(
          async () =>
            ({
              ok: true,
              channel: undefined,
            }) as ConversationsInfoResponse,
        ),
      },
    };

    const result = await getConversationName(
      mockSlackClient as unknown as WebClient,
      "C1234567890",
    );
    expect(result).toBe("");
    expect(mockSlackClient.conversations.info).toHaveBeenCalledWith({
      channel: "C1234567890",
    });
  });

  test("returns empty string when channel info response is malformed", async () => {
    const mockSlackClient = {
      conversations: {
        info: jest.fn().mockImplementation(
          async () =>
            ({
              ok: true,
              channel: {
                id: "C1234567890",
                // name is missing
              },
            }) as ConversationsInfoResponse,
        ),
      },
    };

    const result = await getConversationName(
      mockSlackClient as unknown as WebClient,
      "C1234567890",
    );
    expect(result).toBe("");
    expect(mockSlackClient.conversations.info).toHaveBeenCalledWith({
      channel: "C1234567890",
    });
  });
});
