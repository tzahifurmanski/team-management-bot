import {AsksChannelStatsResult, getStatsForMessages} from "../../src/logic/asks_channel";

describe("getStatsForMessages", () => {

    test("No messages", async () => {
        const messages : any = [];

        const result : AsksChannelStatsResult = getStatsForMessages("FAKE_CHANNEL_ID", messages, "2022-05-01T16:35:13Z", "2022-05-20T16:35:13Z")

        expect(result.totalMessages).toEqual(0);
        expect(result.totalNumInProgress).toEqual(0);
        expect(result.totalNumUnchecked).toEqual(0);
    });

    test("Two messages in progress, one done, one unhandled", async () => {
        const messages : any = [
            getMessageForTest("A", [createReaction("in-progress")]),
            getMessageForTest("B", [createReaction("spinner")]),
            getMessageForTest("C", [createReaction("green_tick")]), getMessageForTest("D")
        ];

        const result : AsksChannelStatsResult = getStatsForMessages("FAKE_CHANNEL_ID", messages, "2022-05-01T16:35:13Z", "2022-05-20T16:35:13Z")

        expect(result.totalMessages).toEqual(4);
        expect(result.totalNumInProgress).toEqual(2);
        expect(result.totalNumUnchecked).toEqual(1);
    });

    test("Two messages in progress, others with unknown reactions", async () => {
        const messages : any = [
            getMessageForTest("A", [createReaction("in-progress")]),
            getMessageForTest("B", [createReaction("spinner")]),
            getMessageForTest("C", [createReaction("zigi")]),
            getMessageForTest("D", [createReaction("zargi")])
        ];

        const result : AsksChannelStatsResult = getStatsForMessages("FAKE_CHANNEL_ID", messages, "2022-05-01T16:35:13Z", "2022-05-20T16:35:13Z")

        expect(result.totalMessages).toEqual(4);
        expect(result.totalNumInProgress).toEqual(2);
        expect(result.totalNumUnchecked).toEqual(2);
    });

});


const getMessageForTest = (userId: string, reactions?: any) : any => {
    const message = {
        type:"message",
        text:"<TEXT>",
        user:userId,
        ts:1652116246.760559,
        team:"<TEAM_NAME>",
        reactions: []
    };

    if(reactions) {
        message.reactions = reactions;
    }

    return message;
}

const createReaction = (name: string) : any => {
    return {
        name
    }
}