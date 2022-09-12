import { isBotAllowed } from "../../../src/integrations/slack/conversations";

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
