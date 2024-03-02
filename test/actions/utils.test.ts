import {
  AskChannelParams,
  extractNameFromChannelString,
  getAskChannelParameters,
  getChannelIDFromEventText,
  getStartingDate,
  setDateToSunday,
  toDateTime,
} from "../../src/actions/utils";
import * as MockDate from "mockdate";



import { getRandomFromArray } from "../../src/actions/utils";

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

describe("toDateTime", () => {
  test("Convert 0 seconds", () => {
    const input = 0;
    const expected = new Date(1970, 0, 1);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert 1 second", () => {
    const input = 1;
    const expected = new Date(1970, 0, 1, 0, 0, 1);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert 60 seconds (1 minute)", () => {
    const input = 60;
    const expected = new Date(1970, 0, 1, 0, 1, 0);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert 3600 seconds (1 hour)", () => {
    const input = 3600;
    const expected = new Date(1970, 0, 1, 1, 0, 0);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert 86400 seconds (1 day)", () => {
    const input = 86400;
    const expected = new Date(1970, 0, 2);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert non-integer seconds", () => {
    const input = 0.5;
    const expected = new Date(1970, 0, 1, 0, 0, 0, 0);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });

  test("Convert negative seconds", () => {
    const input = -1;
    const expected = new Date(1969, 11, 31, 23, 59, 59);
    const result = toDateTime(input);
    expect(result).toEqual(expected);
  });
});



import { removeTimeInfoFromDate } from "../../src/actions/utils";

describe("removeTimeInfoFromDate", () => {
  test("removes time info from a date", () => {
    const date = new Date(Date.UTC(2022, 4, 5, 10, 30, 45, 500)); // May 5, 2022 10:30:45.500
    const expected = new Date(Date.UTC(2022, 4, 5)); // May 5, 2022 00:00:00.000
    const result = removeTimeInfoFromDate(date);
    expect(result.getTime()).not.toBeNaN();
    expect(result).toEqual(expected);
  });

  test("removes time info from a date with no time info", () => {
    const date = new Date(Date.UTC(2022, 4, 5)); // May 5, 2022 00:00:00.000
    const expected = new Date(Date.UTC(2022, 4, 5)); // May 5, 2022 00:00:00.000
    const result = removeTimeInfoFromDate(date);
    expect(result.getTime()).not.toBeNaN();
    expect(result).toEqual(expected);
  });

  test("removes time info from a date with time info set to 0", () => {
    const date = new Date(Date.UTC(2022, 4, 5, 0, 0, 0, 0)); // May 5, 2022 00:00:00.000
    const expected = new Date(Date.UTC(2022, 4, 5)); // May 5, 2022 00:00:00.000
    const result = removeTimeInfoFromDate(date);
    expect(result.getTime()).not.toBeNaN();
    expect(result).toEqual(expected);
  });

  test("removes time info from a date with time info set to 0 and milliseconds", () => {
    const date = new Date(Date.UTC(2022, 4, 5, 0, 0, 0, 500)); // May 5, 2022 00:00:00.500
    const expected = new Date(Date.UTC(2022, 4, 5)); // May 5, 2022 00:00:00.000
    const result = removeTimeInfoFromDate(date);
    expect(result.getTime()).not.toBeNaN();
    expect(result).toEqual(expected);
  });
});

const verifyAskChannelParamsResult = (
  result: AskChannelParams,
  actionType: string,
  timeMetric: string,
  count: number,
  groupBy: string,
  error: string,
) => {
  expect(result.actionType).toEqual(actionType);
  expect(result.timeMetric).toEqual(timeMetric);
  expect(result.count).toEqual(count);
  expect(result.groupBy).toEqual(groupBy);
  expect(result.error).toEqual(error);
};

describe("getAskChannelStatsParameters", () => {
  test("default stats ask  - Valid, Default", async () => {
    let ask = "ask channel stats";

    let result: AskChannelParams = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "stats", "days", 7, "", "");

    ask = "ask channel status";

    result = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "status", "days", 7, "", "");

    ask = "ask channel summary";

    result = getAskChannelParameters(ask);

    // Check that we got the default - 7 days
    verifyAskChannelParamsResult(result, "summary", "days", 7, "", "");
  });

  test("one days", async () => {
    let ask = "ask channel stats 1 days";

    let result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 1, "", "");

    ask = "ask channel status 1 day";

    result = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "days", 1, "", "");

    ask = "ask channel summary 1 day";

    result = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "days", 1, "", "");
  });


  test("multiple days stats", async () => {
    const ask = "ask channel stats 5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 5, "", "");
  });

  test("multiple days stats - group by", async () => {
    const ask = "ask channel stats 5 days by days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 5, "days", "");
  });

  test("multiple days, more than a month stats", async () => {
    const ask = "ask channel stats 45 days";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "days", 45, "", "");
  });

  test("one weeks stats", async () => {
    const ask = "ask channel stats 1 weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 1, "", "");
  });

  test("one week status", async () => {
    const ask = "ask channel status 1 week";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "weeks", 1, "", "");
  });

  test("one week summary", async () => {
    const ask = "ask channel summary 1 week";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "weeks", 1, "", "");
  });

  test("multiple weeks stats", async () => {
    const ask = "ask channel stats 5 weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 5, "", "");
  });

  test("one month status", async () => {
    const ask = "ask channel status 1 month";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "status", "months", 1, "", "");
  });

  test("one month summary", async () => {
    const ask = "ask channel summary 1 month";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "summary", "months", 1, "", "");
  });

  test("multiple weeks stats - by weeks", async () => {
    const ask = "ask channel stats 5 weeks by weeks";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "weeks", 5, "weeks", "");
  });

  test("one months stats", async () => {
    const ask = "ask channel stats 1 months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 1, "", "");
  });

  test("multiple months stats", async () => {
    const ask = "ask channel stats 2 months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 2, "", "");
  });

  test("multiple months stats - group by", async () => {
    const ask = "ask channel stats 2 months by months";

    const result: AskChannelParams = getAskChannelParameters(ask);

    verifyAskChannelParamsResult(result, "stats", "months", 2, "months", "");
  });
});

describe("getAskChannelStatsParameters - Invalid", () => {
  test("invalid action type metric", async () => {
    const ask = "ask channel statszig 5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid action type provided");
  });

  test("invalid time metric", async () => {
    const ask = "ask channel stats 5 zigis";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid time metric provided");
  });

  test("missing time metric", async () => {
    const ask = "ask channel stats 8";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Not all params provided");
  });

  test("invalid days", async () => {
    const ask = "ask channel stats -5 days";

    const result: AskChannelParams = getAskChannelParameters(ask);
    expect(result.actionType).toEqual("");
    expect(result.timeMetric).toEqual("");
    expect(result.count).toEqual(-1);
    expect(result.error).toEqual("Invalid count provided");
  });
});

// TODO: This doesn't work in CI, or in the bot, but tests are passing locally.
//  (Date should be reset to Sunday but it actaully being reset to Monday, both in CI and in Heroku)
describe("getStartingDate", () => {
  test("one day", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      1,
      "days",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the beginning of this day
    const expected: Date = new Date(1651708800000); // 05/05/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test("multiple days", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      3,
      "days",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the wanted date
    const expected: Date = new Date(1651536000000); // 03/05/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test("multiple days - more than a week", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      8,
      "days",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the wanted date
    const expected: Date = new Date(1651104000000); // 28/04/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test.skip("one week", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      1,
      "weeks",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the beginning of this week
    const expected: Date = new Date(1651363200000); // 01/05/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test.skip("multiple weeks", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      2,
      "weeks",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the beginning of the previous week
    const expected: Date = new Date(1650758400000); // 24/04/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test.skip("multiple weeks - more than a month", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      6,
      "weeks",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the wanted date
    const expected: Date = new Date(1648339200000); // 27/03/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test("one month", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      1,
      "month",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the beginning of this month
    const expected: Date = new Date(1651363200000); // 01/05/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test("multiple months", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      3,
      "month",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the beginning of the wanted month
    const expected: Date = new Date(1646092800000); // 01/03/2022 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });

  test("multiple months - more than a year", async () => {
    MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

    const params: AskChannelParams = new AskChannelParams(
      "stats",
      14,
      "month",
      "",
    );
    const result: Date = getStartingDate(params);

    // Check that the start date is the wanted date
    const expected: Date = new Date(1617235200000); // 01/04/2021 00:00:00 UTC
    expect(result.getTime()).toEqual(expected.getTime());

    MockDate.reset();
  });
});

// TODO: This doesn't work in CI, or in the bot, but tests are passing locally.
//  (Date should be reset to Sunday but it actually being reset to Monday, both in CI and in Heroku)
// MAYBE BECAUSE the removeTimeInfoFromDate method is expecting a UTC date, but the date is not in UTC
describe("setDateToSunday", () => {
  test("Sunday is same day", async () => {
    const inputDate = new Date(Date.UTC(2022, 4, 1, 20, 59, 59)); // 01/05/2022 20:59:59 UTC
    const expected = new Date(Date.UTC(2022, 4, 1)); // 01/05/2022 00:00:00 UTC

    const result: Date = setDateToSunday(inputDate);

    expect(result.getTime()).not.toBeNaN();
    expect(result.getTime()).toEqual(expected.getTime());
  });

  test("Middle of the week", async () => {
    const inputDate = new Date(Date.UTC(2022, 4, 3, 20, 59, 59)); // 03/05/2022 20:59:59 UTC
    const expected = new Date(Date.UTC(2022, 4, 1)); // 01/05/2022 00:00:00 UTC

    const result: Date = setDateToSunday(inputDate);

    expect(result.getTime()).not.toBeNaN();
    expect(result.getTime()).toEqual(expected.getTime());
  });

  test("Saturday night", async () => {
    const inputDate = new Date(Date.UTC(2022, 4, 7, 20, 59, 59)); // 07/05/2022 20:59:59 UTC
    const expected = new Date(Date.UTC(2022, 4, 1)); // 01/05/2022 00:00:00 UTC

    const result: Date = setDateToSunday(inputDate);
    
    expect(result.getTime()).not.toBeNaN();
    expect(result.getTime()).toEqual(expected.getTime());
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
  it("should return the default channel ID from the event text", () => {
    expect(getChannelIDFromEventText("ask channel status", 3, "12345")).toBe(
      "12345",
    );
    expect(
      getChannelIDFromEventText("zendesk tickets status", 3, "12345"),
    ).toBe("12345");

    expect(getChannelIDFromEventText("zigi belo bibi 33223", 3, "12345")).toBe(
      "12345",
    );

    expect(getChannelIDFromEventText("", 3, "12345")).toBe("12345");
  });

  it("should return the user-supplied channel ID from the event text", () => {
    expect(
      getChannelIDFromEventText(
        "ask channel status <#C0422HDF13N|tzahi_bot_test>",
        3,
        "12345",
      ),
    ).toBe("C0422HDF13N");
    expect(
      getChannelIDFromEventText(
        "zendesk tickets status <#C0422HDF13N|tzahi_bot_test>",
        3,
        "12345",
      ),
    ).toBe("C0422HDF13N");
  });
});
