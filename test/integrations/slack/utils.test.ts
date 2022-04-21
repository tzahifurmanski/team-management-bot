import {getTeamNameFromProfile} from "../../../src/integrations/slack/utils";

describe("getTeamNameFromProfile", () => {
    test("Profile with a short team name", async () => {
        const profile : any = {
            fields: {
                TEAM_FIELD_ID_FOR_TESTS: {
                    value: "Zigi"
                }
            }
        };

        expect(getTeamNameFromProfile(profile)).toEqual("Zigi");
    });

    test("Profile with a long team name", async () => {
        const profile : any = {
            fields: {
                TEAM_FIELD_ID_FOR_TESTS: {
                    value: "Zigi one two three four (super team!)"
                }
            }
        };

        // Expect only 3 words
        expect(getTeamNameFromProfile(profile)).toEqual("Zigi one two");
    });

    test("Bad input", async () => {
        const profile : any = {
            fields: {
                INVALID_TEAM_FIELD_ID_FOR_TESTS: {
                    value: "Zigi"
                }
            }
        };

        expect(getTeamNameFromProfile(profile)).toEqual("");
    });
});
