import {
  AskChannelParams,
  extractNameFromChannelString,
  getAskChannelParameters,
  getChannelIDFromEventText,
  getRandomFromArray,
} from "../../src/actions/utils";

describe("getRandomFromArray", () => {
  test("returns a random element from the array", () => {
    const array = [1, 2, 3, 4, 5];
    const result = getRandomFromArray(array);
    expect(array).toContain(result);
  });

  test("returns undefined if the array is empty", () => {
    const array: number[] = [];
    const result = getRandomFromArray(array);
    expect(result).toBeUndefined();
  });

  test("returns the only element in the array", () => {
    const array = [1];
    const result = getRandomFromArray(array);
    expect(result).toEqual(1);
  });
});

const verifyAskChannelParamsResult = (
  result: AskChannelParams,
  actionType: string,
  timeMetric: string,
  count: number,
  groupBy: string,
  // channel_id_slot: number,
  error: string,
) => {
  expect(result.actionType).toEqual(actionType);
  expect(result.timeMetric).toEqual(timeMetric);
  expect(result.count).toEqual(count);
  expect(result.groupBy).toEqual(groupBy);
  // expect(result.channel_id_slot).toEqual(channel_id_slot); TODO: Add this back
  expect(result.error).toEqual(error);
};

describe("getAskChannelStatsParameters", () => {

  test("default stats ask - Valid, Default", async () => {
    let ask = "ask channel stats <#test-channel>";

    let result: AskChannelParams = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "stats", "days", 7, "", "");

    ask = "ask channel status <#test-channel>";

    result = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "status", "days", 7, "", "");

    ask = "ask channel summary <#test-channel>";

    result = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "summary", "days", 7, "", "");
  });

  test("one days", async () => {
    let ask = "ask channel stats <#test-channel> 1 days";

    let result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 1, "", "");

    ask = "ask channel status <#test-channel> 1 day";

    result = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "days", 1, "", "");

    ask = "ask channel summary <#test-channel> 1 day";

    result = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "days", 1, "", "");
  });

  test("multiple days stats", async () => {
    const ask = "ask channel stats <#test-channel> 5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 5, "", "");
  });

  test("multiple days stats - group by", async () => {
    const ask = "ask channel stats <#test-channel> 5 days by days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 5, "days", "");
  });

  test("multiple days, more than a month stats", async () => {
    const ask = "ask channel stats <#test-channel> 45 days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 45, "", "");
  });

  test("one weeks stats", async () => {
    const ask = "ask channel stats <#test-channel> 1 weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 1, "", "");
  });

  test("one week status", async () => {
    const ask = "ask channel status <#test-channel> 1 week";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "weeks", 1, "", "");
  });

  test("one week summary", async () => {
    const ask = "ask channel summary <#test-channel> 1 week";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "weeks", 1, "", "");
  });

  test("multiple weeks stats", async () => {
    const ask = "ask channel stats <#test-channel> 5 weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 5, "", "");
  });

  test("one month status", async () => {
    const ask = "ask channel status <#test-channel> 1 month";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "months", 1, "", "");
  });

  test("one month summary", async () => {
    const ask = "ask channel summary <#test-channel> 1 month";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "months", 1, "", "");
  });

  test("multiple weeks stats - by weeks", async () => {
    const ask = "ask channel stats <#test-channel> 5 weeks by weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 5, "weeks", "");
  });

  test("one months stats", async () => {
    const ask = "ask channel stats <#test-channel> 1 months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 1, "", "");
  });

  test("multiple months stats", async () => {
    const ask = "ask channel stats <#test-channel> 2 months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 2, "", "");
  });

  test("multiple months stats - group by", async () => {
    const ask = "ask channel stats <#test-channel> 2 months by months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 2, "months", "");
  });
  
  test("invalid action type metric", async () => {
    const ask = "ask channel statszig <#test-channel> 5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid action type provided");
  });

  test("invalid time metric", async () => {
    const ask = "ask channel stats <#test-channel> 5 zigis";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid time metric provided");
  });

  test("missing time metric", async () => {
    const ask = "ask channel stats <#test-channel> 8";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Not all params provided");
  });

  test("invalid days", async () => {
    const ask = "ask channel stats <#test-channel> -5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid count provided");
  });
});


describe("getChannelNameFromSlackChannelString", () => {
  it("should return the channel name from the slack channel string", () => {
    expect(extractNameFromChannelString("<#C0G9QF9GW|general>")).toBe(
      "general",
    );
  });

  it("should return the channel name from the slack channel string", () => {
    expect(extractNameFromChannelString("<#C0G9QF9GW|general-number>")).toBe(
      "general-number",
    );
  });

  it("should return empty string if the slack channel string is not in the correct format", () => {
    expect(extractNameFromChannelString("general")).toBe("");
  });

  it("should return empty string if the slack channel string is empty", () => {
    expect(extractNameFromChannelString("")).toBe("");
  });
});


describe("getChannelIDFromEventText", () => {
  it("should return the user-supplied channel ID from the event text", () => {
    expect(
      getChannelIDFromEventText(
        "ask channel status <#C0422HDF13N|tzahi_bot_test>",
        3,
      ),
    ).toBe("C0422HDF13N");
    expect(
      getChannelIDFromEventText(
        "zendesk tickets status <#C0422HDF13N|tzahi_bot_test>",
        3,
      ),
    ).toBe("C0422HDF13N");
  });
});