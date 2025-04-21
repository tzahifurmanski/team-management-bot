import { describe, expect, jest, beforeEach } from "@jest/globals";
import { PlainTextElement, SectionBlock } from "@slack/web-api";
import { MrkdwnElement } from "@slack/types";
import { Profile } from "@slack/web-api/dist/types/response/UsersProfileGetResponse.js";
import {
  USER_PROFILE_FIELD_ID_DEPARTMENT,
  USER_PROFILE_FIELD_ID_DIVISION,
  USER_PROFILE_FIELD_ID_TEAM,
} from "../../src/settings/team_consts";

// Mock the users module
jest.unstable_mockModule("../../src/integrations/slack/users", () => ({
  getUserProfile: jest.fn<() => Promise<Profile | undefined>>(),
  getConversationId: jest.fn(),
}));

// Mock the utils module
jest.unstable_mockModule("../../src/integrations/slack/utils", () => ({
  getValueFromProfile: jest.fn((profile: Profile, fieldId: string) => {
    const value = profile?.fields?.[fieldId]?.value || "";
    return value ? value.split(" ").splice(0, 3).join(" ") : "Unknown";
  }),
}));

export interface MockedUser {
  id: string;
  team: string;
  division: string;
  department: string;
}

describe("createReport", () => {
  let getUserProfileMock: jest.Mock<() => Promise<Profile | undefined>>;
  let slackClient: any;
  let createReport: any;

  beforeEach(async () => {
    // Get the mock reference
    const mockedUsers = await import("../../src/integrations/slack/users");
    getUserProfileMock = mockedUsers.getUserProfile as jest.Mock<
      () => Promise<Profile | undefined>
    >;
    getUserProfileMock.mockClear();

    // Create a mock Slack client
    slackClient = {
      users: {
        profile: {
          get: jest.fn(),
        },
      },
    };

    // Import the module under test after mocking
    const askChannelReporting = await import(
      "../../src/logic/ask_channel_reporting"
    );
    createReport = askChannelReporting.createReport;
  });

  it("One user with a long name", async () => {
    // Set expected results
    const mockedUser = {
      id: "<USER_ID>",
      division: "ZIGI Division is the best division",
      department: "ZIGI Department is the best department",
      team: "TEAM ZIGI is the best team",
    } as MockedUser;
    // Name should be shortened to the limit of 3 words
    const expectedTeamName = "TEAM ZIGI is";
    const expectedDivisionName = "ZIGI Division is";
    const expectedDepartmentName = "ZIGI Department is";
    const messages: any[] = [getMessageForTest(mockedUser.id)];
    // Mock returned profile
    const userProfile = getProfileForTest(
      mockedUser.team,
      mockedUser.division,
      mockedUser.department,
    );
    getUserProfileMock.mockResolvedValue(userProfile);
    // Generate the report
    const results = await createReport(slackClient, messages);
    // Verify calls to the userProfile method
    expect(getUserProfileMock).toHaveBeenCalledTimes(1);
    expect(getUserProfileMock).toHaveBeenCalledWith(slackClient, mockedUser.id);
    // Verify results
    expect(results.statsByTeam.size).toEqual(1);
    expect(results.statsByTeam.get(expectedTeamName)).toEqual(1);
    expect(results.statsByDepartment.size).toEqual(1);
    expect(results.statsByDepartment.get(expectedDepartmentName)).toEqual(1);
    expect(results.statsByDivision.size).toEqual(1);
    expect(results.statsByDivision.get(expectedDivisionName)).toEqual(1);
  });

  it("Four users from 2 divisions, 3 departments, 4 teams", async () => {
    // Set expected results:
    // =====================
    // User A - Division A, Department A, Team A
    const mockedUserA = {
      id: "<USER_ID1>",
      division: "A",
      department: "A",
      team: "A",
    } as MockedUser;
    // User B - Division A, Department B, Team B
    const mockedUserB = {
      id: "<USER_ID2>",
      division: "A",
      department: "B",
      team: "B",
    } as MockedUser;
    // User C - Division B, Department C, Team C
    const mockedUserC = {
      id: "<USER_ID3>",
      division: "B",
      department: "C",
      team: "C",
    } as MockedUser;
    // User D - Division B, Department C, Team D
    const mockedUserD = {
      id: "<USER_ID4>",
      division: "B",
      department: "C",
      team: "D",
    } as MockedUser;

    const messages: any[] = [
      getMessageForTest(mockedUserA.id),
      getMessageForTest(mockedUserB.id),
      getMessageForTest(mockedUserC.id),
      getMessageForTest(mockedUserD.id),
    ];

    // Mock returned profiles
    getUserProfileMock
      .mockResolvedValueOnce(
        getProfileForTest(
          mockedUserA.team,
          mockedUserA.division,
          mockedUserA.department,
        ),
      )
      .mockResolvedValueOnce(
        getProfileForTest(
          mockedUserB.team,
          mockedUserB.division,
          mockedUserB.department,
        ),
      )
      .mockResolvedValueOnce(
        getProfileForTest(
          mockedUserC.team,
          mockedUserC.division,
          mockedUserC.department,
        ),
      )
      .mockResolvedValueOnce(
        getProfileForTest(
          mockedUserD.team,
          mockedUserD.division,
          mockedUserD.department,
        ),
      );

    // Generate the report
    const results = await createReport(slackClient, messages);

    // Verify calls to the userProfile method
    expect(getUserProfileMock).toHaveBeenCalledTimes(4);
    expect(getUserProfileMock).toHaveBeenNthCalledWith(
      1,
      slackClient,
      mockedUserA.id,
    );
    expect(getUserProfileMock).toHaveBeenNthCalledWith(
      2,
      slackClient,
      mockedUserB.id,
    );
    expect(getUserProfileMock).toHaveBeenNthCalledWith(
      3,
      slackClient,
      mockedUserC.id,
    );
    expect(getUserProfileMock).toHaveBeenNthCalledWith(
      4,
      slackClient,
      mockedUserD.id,
    );

    // Verify results
    expect(results.statsByTeam.size).toEqual(4);
    expect(results.statsByTeam.get("A")).toEqual(1);
    expect(results.statsByTeam.get("B")).toEqual(1);
    expect(results.statsByTeam.get("C")).toEqual(1);
    expect(results.statsByTeam.get("D")).toEqual(1);

    expect(results.statsByDepartment.size).toEqual(3);
    expect(results.statsByDepartment.get("A")).toEqual(1);
    expect(results.statsByDepartment.get("B")).toEqual(1);
    expect(results.statsByDepartment.get("C")).toEqual(2);

    expect(results.statsByDivision.size).toEqual(2);
    expect(results.statsByDivision.get("A")).toEqual(2);
    expect(results.statsByDivision.get("B")).toEqual(2);
  });
});

const getMessageForTest = (userId: string, reactions?: any): any => {
  const message = {
    type: "message",
    text: "<TEXT>",
    user: userId,
    ts: 1652116246.760559,
    reactions: [],
  };

  if (reactions) {
    message.reactions = reactions;
  }

  return message;
};

const getProfileForTest = (
  team: string,
  division: string,
  department: string,
): Profile => {
  const profile: Profile = {
    first_name: "<NAME>",
    last_name: "<LAST_NAME>",
    fields: {},
  };

  if (!profile.fields) {
    profile.fields = {};
  }

  profile.fields[USER_PROFILE_FIELD_ID_DIVISION] = {
    value: division,
    alt: "",
  };

  profile.fields[USER_PROFILE_FIELD_ID_DEPARTMENT] = {
    value: department,
    alt: "",
  };

  profile.fields[USER_PROFILE_FIELD_ID_TEAM] = {
    value: team,
    alt: "",
  };

  return profile;
};

describe("createReportSection", () => {
  let createReportSection: any;

  beforeEach(async () => {
    // Import the module under test after mocking
    const askChannelReporting = await import(
      "../../src/logic/ask_channel_reporting"
    );
    createReportSection = askChannelReporting.createReportSection;
  });

  it("Empty collection", async () => {
    const statsSection: Map<string, number> = new Map<string, number>();

    const results = createReportSection(statsSection, "test");

    expect(results.length).toEqual(0);
  });

  it("One item", async () => {
    const criteria = "test";
    const headerFields: string[] = [`*${criteria}*`, "*Count*"];

    const statsSection: Map<string, number> = new Map<string, number>();
    statsSection.set("Team Z", 5);

    const results = createReportSection(statsSection, criteria);

    // Verify results
    expect(results.length).toEqual(2);
    validateSection(results[0], `*Asks divided by ${criteria}:*`, headerFields);
    validateSection(results[1], "", ["Team Z", "5"]);
  });

  it("Five items", async () => {
    const criteria = "test";
    const headerFields: string[] = [`*${criteria}*`, "*Count*"];

    const statsSection: Map<string, number> = new Map<string, number>();
    statsSection.set("Team Z", 5);
    statsSection.set("Team X", 2);
    statsSection.set("Team A", 8);
    statsSection.set("Team H", 1);
    statsSection.set("Team O", 10);

    const results = createReportSection(statsSection, criteria);

    // Verify results + check that the sort has worked
    expect(results.length).toEqual(6);
    validateSection(results[0], `*Asks divided by ${criteria}:*`, headerFields);
    validateSection(results[1], "", ["Team O", "10"]);
    validateSection(results[2], "", ["Team A", "8"]);
    validateSection(results[3], "", ["Team Z", "5"]);
    validateSection(results[4], "", ["Team X", "2"]);
    validateSection(results[5], "", ["Team H", "1"]);
  });

  const validateSection = (
    block: SectionBlock,
    text: string,
    fields: string[],
  ) => {
    // Check the text and the fields
    if (text) {
      expect((block.text as any)?.text).toEqual(text);
    }

    block.fields?.forEach((field: MrkdwnElement | PlainTextElement) => {
      expect(fields).toContain(field.text);
    });
  };
});
