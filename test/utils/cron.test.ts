import { describe, test, expect } from "@jest/globals";
import { isValidCronExpression } from "../../src/utils/cron";

describe("isValidCronExpression", () => {
  test("should validate valid cron expressions", () => {
    const validCrons = [
      "0 9 * * 1-5",
      "*/15 * * * *",
      "0 0 1 1 *",
      "59 23 31 12 7",
      "* * * * *",
    ];

    validCrons.forEach((cron) => {
      expect(isValidCronExpression(cron)).toBe(true);
    });
  });

  test("should reject invalid cron expressions", () => {
    const invalidCrons = [
      "invalid",
      "60 * * * *", // invalid minute
      "* 24 * * *", // invalid hour
      "* * 32 * *", // invalid day
      "* * * 13 *", // invalid month
      "* * * * 8", // invalid day of week
      "* * * *", // too few fields
      "* * * * * *", // too many fields
    ];

    invalidCrons.forEach((cron) => {
      const result = isValidCronExpression(cron);
      if (result) {
        console.log(`Failed: "${cron}" was incorrectly validated as true`);
      }
      expect(isValidCronExpression(cron)).toBe(false);
    });
  });

  test("should handle special cases", () => {
    // Empty values are allowed
    expect(isValidCronExpression("")).toBe(true);
    expect(isValidCronExpression("EMPTY")).toBe(true);
    expect(isValidCronExpression("empty")).toBe(true);

    // Whitespace handling
    expect(isValidCronExpression("  0 9 * * 1-5  ")).toBe(true);
    expect(isValidCronExpression("0    9 * * 1-5")).toBe(false); // extra spaces between fields
  });
});
