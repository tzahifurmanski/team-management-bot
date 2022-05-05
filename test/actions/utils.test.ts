import {AskChannelStatsParams, getAskChannelStatsParameters, getStartingDate} from "../../src/actions/utils";
import * as MockDate from "mockdate";

describe("getAskChannelStatsParameters", () => {
    test("default ask", async () => {
        const ask = "ask channel stats"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        // Check that we got the default - 7 days
        expect(result.timeMetric).toEqual("days");
        expect(result.count).toEqual(7);
        expect(result.error).toEqual("");
    });

    test("one day", async () => {
        const ask = "ask channel stats 1 day"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("days");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("one days", async () => {
        const ask = "ask channel stats 1 days"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("days");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("multiple days", async () => {
        const ask = "ask channel stats 5 days"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("days");
        expect(result.count).toEqual(5);
        expect(result.error).toEqual("");
    });

    test("multiple days, more than a month", async () => {
        const ask = "ask channel stats 45 days"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("days");
        expect(result.count).toEqual(45);
        expect(result.error).toEqual("");
    });

    test("one week", async () => {
        const ask = "ask channel stats 1 week"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("weeks");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("one weeks", async () => {
        const ask = "ask channel stats 1 weeks"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("weeks");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("multiple weeks", async () => {
        const ask = "ask channel stats 5 weeks"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("weeks");
        expect(result.count).toEqual(5);
        expect(result.error).toEqual("");
    });

    test("one month", async () => {
        const ask = "ask channel stats 1 month"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("months");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("one months", async () => {
        const ask = "ask channel stats 1 months"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("months");
        expect(result.count).toEqual(1);
        expect(result.error).toEqual("");
    });

    test("multiple months", async () => {
        const ask = "ask channel stats 2 months"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("months");
        expect(result.count).toEqual(2);
        expect(result.error).toEqual("");
    });

    test("invalid time metric", async () => {
        const ask = "ask channel stats 5 zigis"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("");
        expect(result.count).toEqual(-1);
        expect(result.error).toEqual("Invalid type provided");
    });

    test("missing time metric", async () => {
        const ask = "ask channel stats 8"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("");
        expect(result.count).toEqual(-1);
        expect(result.error).toEqual("Not all params provided");
    });

    test("invalid days", async () => {
        const ask = "ask channel stats -5 days"

        const result : AskChannelStatsParams = getAskChannelStatsParameters(ask);

        expect(result.timeMetric).toEqual("");
        expect(result.count).toEqual(-1);
        expect(result.error).toEqual("Invalid count provided");
    });
});
// the month is 0-indexed
describe("getStartingDate", () => {
    test("one day", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(1, 'days');
        const result : Date = getStartingDate(params);

        // Check that the start date is the beginning of this day
        const expected : Date = new Date(1651708800000); // 05/05/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple days", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(3, 'days');
        const result : Date = getStartingDate(params);

        // Check that the start date is the wanted date
        const expected : Date = new Date(1651536000000); // 03/05/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple days - more than a week", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(8, 'days');
        const result : Date = getStartingDate(params);

        // Check that the start date is the wanted date
        const expected : Date = new Date(1651104000000); // 28/04/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("one week", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(1, 'weeks');
        const result : Date = getStartingDate(params);

        // Check that the start date is the beginning of this week
        const expected : Date = new Date(1651363200000); // 01/05/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple weeks", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(2, 'weeks');
        const result : Date = getStartingDate(params);

        // Check that the start date is the beginning of the previous week
        const expected : Date = new Date(1650758400000); // 24/04/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple weeks - more than a month", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(6, 'weeks');
        const result : Date = getStartingDate(params);

        // Check that the start date is the wanted date
        const expected : Date = new Date(1648339200000); // 27/03/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("one month", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(1, 'month');
        const result : Date = getStartingDate(params);

        // Check that the start date is the beginning of this month
        const expected : Date = new Date(1651363200000); // 01/05/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple months", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(3, 'month');
        const result : Date = getStartingDate(params);

        // Check that the start date is the beginning of the wanted month
        const expected : Date = new Date(1646092800000); // 01/03/2022 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });

    test("multiple months - more than a year", async () => {
        MockDate.set(new Date(1651781800964)); // 05/05/2022 20:16:40 UTC

        const params : AskChannelStatsParams = new AskChannelStatsParams(14, 'month');
        const result : Date = getStartingDate(params);

        // Check that the start date is the wanted date
        const expected : Date = new Date(1617235200000); // 01/04/2021 00:00:00 UTC
        expect(result.getTime()).toEqual(expected.getTime());

        MockDate.reset();
    });
});
