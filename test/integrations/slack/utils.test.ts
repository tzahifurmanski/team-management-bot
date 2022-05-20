import {getValueFromProfile} from "../../../src/integrations/slack/utils";

describe("getValueFromProfile", () => {
    test("Profile with a short team name", async () => {
        const profile : any = {
            fields: {
                TEAM_FIELD_ID_FOR_TESTS: {
                    value: "Zigi"
                }
            }
        };

        expect(getValueFromProfile(profile, 'TEAM_FIELD_ID_FOR_TESTS')).toEqual("Zigi");
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
        expect(getValueFromProfile(profile, 'TEAM_FIELD_ID_FOR_TESTS')).toEqual("Zigi one two");
    });

    test("Bad input", async () => {
        const profile : any = {
            fields: {
                INVALID_TEAM_FIELD_ID_FOR_TESTS: {
                    value: "Zigi"
                }
            }
        };

        expect(getValueFromProfile(profile, 'TEAM_FIELD_ID_FOR_TESTS')).toEqual("Unknown");
    });
});
