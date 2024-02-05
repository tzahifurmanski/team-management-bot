import {
  countReactions,
  getValueFromProfile,
} from "../../../src/integrations/slack/utils";

describe("getValueFromProfile", () => {
  test("Profile with a short team name", async () => {
    const profile: any = {
      fields: {
        TEAM_FIELD_ID_FOR_TESTS: {
          value: "Zigi",
        },
      },
    };

    expect(getValueFromProfile(profile, "TEAM_FIELD_ID_FOR_TESTS")).toEqual(
      "Zigi",
    );
  });

  test("Profile with a long team name", async () => {
    const profile: any = {
      fields: {
        TEAM_FIELD_ID_FOR_TESTS: {
          value: "Zigi one two three four (super team!)",
        },
      },
    };

    // Expect only 3 words
    expect(getValueFromProfile(profile, "TEAM_FIELD_ID_FOR_TESTS")).toEqual(
      "Zigi one two",
    );
  });

  test("Bad input", async () => {
    const profile: any = {
      fields: {
        INVALID_TEAM_FIELD_ID_FOR_TESTS: {
          value: "Zigi",
        },
      },
    };

    expect(getValueFromProfile(profile, "TEAM_FIELD_ID_FOR_TESTS")).toEqual(
      "Unknown",
    );
  });
});

describe("countReactions", () => {
  test("No reactions", () => {
    const reactionsArray = ["A", "B", "C"];

    const message = {
      reactions: [],
    };

    const result = countReactions(message, reactionsArray);

    expect(result).toEqual(0);
  });

  test("Multiple reactions, none of them valid", () => {
    const reactionsArray = ["A", "B", "C"];

    const message = {
      reactions: [
        { name: "D", users: ["USERA"], count: 1 },
        { name: "E", users: ["USERA"], count: 1 },
      ],
    };

    const result = countReactions(message, reactionsArray);

    expect(result).toEqual(0);
  });

  test("Multiple reactions, some valid, some don't", () => {
    const reactionsArray = ["A", "B", "C", "D"];

    const message = {
      reactions: [
        { name: "D", users: ["USERA", "USERB"], count: 2 },
        { name: "E", users: ["USERA"], count: 1 },
        { name: "F", users: ["USERA"], count: 1 },
      ],
    };

    const result = countReactions(message, reactionsArray);

    expect(result).toEqual(2);
  });

  test("Multiple valid reactions, different kinds", () => {
    const reactionsArray = ["A", "rapidly_changing", "white_check_mark"];

    const message = {
      reactions: [
        { name: "rapidly_changing", users: ["USERA", "USERB"], count: 2 },
        {
          name: "white_check_mark",
          users: ["USERA", "USERB", "USERC"],
          count: 3,
        },
      ],
    };

    const result = countReactions(message, reactionsArray);

    expect(result).toEqual(5);
  });

  test("Multiple valid reactions of the same kind", () => {
    const reactionsArray = ["A", "B", "white_check_mark"];

    const message = {
      reactions: [
        { name: "rapidly_changing", users: ["USERA"], count: 1 },
        {
          name: "white_check_mark",
          users: ["USERA", "USERB", "USERC"],
          count: 3,
        },
      ],
    };

    const result = countReactions(message, reactionsArray);

    expect(result).toEqual(3);
  });
});
