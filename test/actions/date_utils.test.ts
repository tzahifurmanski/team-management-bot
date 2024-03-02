import {
    getStartingDate,
    removeTimeInfoFromDate,
    setDateToSunday,
    toDateTime,
  } from "../../src/actions/date_utils";
import { AskChannelParams } from "../../src/actions/utils";
import * as MockDate from "mockdate";


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

  
describe("getStartingDate", () => {
    afterEach(() => {
      MockDate.reset();
    });
  
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
  
    test("one week", async () => {
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
  
    test("multiple weeks", async () => {
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
  
    test("multiple weeks - more than a month", async () => {
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
  