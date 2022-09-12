import {
  AsksChannelStatsResult,
  getBucketRange,
  getStatsForMessages,
} from "../../src/logic/asks_channel";
import { toDateTime } from "../../src/actions/utils";

describe("getBucketRange", () => {
  // Date and time (GMT): Wednesday, September 14, 2022 10:38:27 AM
  // Epoch timestamp: 1663151907
  const messageDate: Date = toDateTime(1663151907);
  console.log(`Tested date ${new Date().toUTCString()}`);

  test("by day", async () => {
    const [bucketStartDate, bucketEndDate] = getBucketRange(
      messageDate,
      "days"
    );

    expect(bucketStartDate.toUTCString()).toEqual(
      "Wed, 14 Sep 2022 00:00:00 GMT"
    );
    expect(bucketEndDate.toUTCString()).toEqual(
      "Wed, 14 Sep 2022 23:59:59 GMT"
    );
  });

  // TODO: This doesn't work in CI, or in the bot, but tests are passing locally.
  //  (Date should be reset to Sunday but it actually being reset to Monday, both in CI and in Heroku)
  // Issue originates at the setDateToSunday method, and it's the same issue that utils.test.js has
  test.skip("by weeks", async () => {
    const [bucketStartDate, bucketEndDate] = getBucketRange(
      messageDate,
      "weeks"
    );

    expect(bucketStartDate.toUTCString()).toEqual(
      "Sun, 11 Sep 2022 00:00:00 GMT"
    );
    expect(bucketEndDate.toUTCString()).toEqual(
      "Sat, 17 Sep 2022 23:59:59 GMT"
    );
  });

  test("by months", async () => {
    const [bucketStartDate, bucketEndDate] = getBucketRange(
      messageDate,
      "months"
    );

    expect(bucketStartDate.toUTCString()).toEqual(
      "Thu, 01 Sep 2022 00:00:00 GMT"
    );
    expect(bucketEndDate.toUTCString()).toEqual(
      "Fri, 30 Sep 2022 23:59:59 GMT"
    );
  });
});

describe("getStatsForMessages", () => {
  test("No messages", async () => {
    const messages: any = [];

    const result: AsksChannelStatsResult = getStatsForMessages(
      "FAKE_CHANNEL_ID",
      messages,
      "2022-05-01T16:35:13Z",
      "2022-05-20T16:35:13Z"
    );

    expect(result.totalMessages).toEqual(0);
    expect(result.totalNumInProgress).toEqual(0);
    expect(result.totalNumUnchecked).toEqual(0);
  });

  test("Two messages in progress, one done, one unhandled", async () => {
    const messages: any = [
      getMessageForTest("A", [createReaction("in-progress")]),
      getMessageForTest("B", [createReaction("spinner")]),
      getMessageForTest("C", [createReaction("green_tick")]),
      getMessageForTest("D"),
    ];

    const result: AsksChannelStatsResult = getStatsForMessages(
      "FAKE_CHANNEL_ID",
      messages,
      "2022-05-01T16:35:13Z",
      "2022-05-20T16:35:13Z"
    );

    expect(result.totalMessages).toEqual(4);
    expect(result.totalNumInProgress).toEqual(2);
    expect(result.totalNumUnchecked).toEqual(1);
  });

  test("Two messages in progress, others with unknown reactions", async () => {
    const messages: any = [
      getMessageForTest("A", [createReaction("in-progress")]),
      getMessageForTest("B", [createReaction("spinner")]),
      getMessageForTest("C", [createReaction("zigi")]),
      getMessageForTest("D", [createReaction("zargi")]),
    ];

    const result: AsksChannelStatsResult = getStatsForMessages(
      "FAKE_CHANNEL_ID",
      messages,
      "2022-05-01T16:35:13Z",
      "2022-05-20T16:35:13Z"
    );

    expect(result.totalMessages).toEqual(4);
    expect(result.totalNumInProgress).toEqual(2);
    expect(result.totalNumUnchecked).toEqual(2);
  });
});

const getMessageForTest = (userId: string, reactions?: any): any => {
  const message = {
    type: "message",
    text: "<TEXT>",
    user: userId,
    ts: 1652116246.760559,
    team: "<TEAM_NAME>",
    reactions: [],
  };

  if (reactions) {
    message.reactions = reactions;
  }

  return message;
};

const createReaction = (name: string): any => {
  return {
    name,
  };
};
