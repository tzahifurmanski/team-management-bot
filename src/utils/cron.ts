/**
 * Validates a cron expression.
 * Supports standard cron format with 5 fields: minute hour day-of-month month day-of-week
 * @param cronExpression The cron expression to validate
 * @returns true if the cron expression is valid, false otherwise
 */
export function isValidCronExpression(cronExpression: string): boolean {
  // Handle empty string and EMPTY value
  if (cronExpression === "") {
    return true;
  }
  if (cronExpression.trim().toUpperCase() === "EMPTY") {
    return true;
  }

  // Check for multiple consecutive spaces between fields
  const trimmedExpression = cronExpression.trim();
  if (trimmedExpression === "") {
    return false;
  }
  if (/\s{2,}/.test(trimmedExpression)) {
    return false;
  }

  const fields = trimmedExpression.split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }

  // Regular expressions for each field
  const patterns = {
    minute: /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/,
    hour: /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/,
    dayOfMonth: /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/,
    month: /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/,
    dayOfWeek: /^(\*|\d+(-\d+)?(,\d+(-\d+)?)*|\*\/\d+)$/,
  };

  // Value ranges for each field
  const ranges = {
    minute: { min: 0, max: 59 },
    hour: { min: 0, max: 23 },
    dayOfMonth: { min: 1, max: 31 },
    month: { min: 1, max: 12 },
    dayOfWeek: { min: 0, max: 7 },
  };

  // Check each field against its pattern and range
  try {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;

    // Helper function to validate a field's value range
    const isInRange = (
      value: string,
      range: { min: number; max: number },
    ): boolean => {
      if (value === "*" || value.startsWith("*/")) {
        return true;
      }

      // Split on commas to handle lists
      const parts = value.split(",");
      return parts.every((part) => {
        // Handle ranges (e.g., "1-5")
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          return (
            !isNaN(start) &&
            !isNaN(end) &&
            start >= range.min &&
            start <= range.max &&
            end >= range.min &&
            end <= range.max &&
            start <= end
          );
        }
        // Handle single values
        const num = Number(part);
        return !isNaN(num) && num >= range.min && num <= range.max;
      });
    };

    return (
      patterns.minute.test(minute) &&
      isInRange(minute, ranges.minute) &&
      patterns.hour.test(hour) &&
      isInRange(hour, ranges.hour) &&
      patterns.dayOfMonth.test(dayOfMonth) &&
      isInRange(dayOfMonth, ranges.dayOfMonth) &&
      patterns.month.test(month) &&
      isInRange(month, ranges.month) &&
      patterns.dayOfWeek.test(dayOfWeek) &&
      isInRange(dayOfWeek, ranges.dayOfWeek)
    );
  } catch (_error) {
    return false;
  }
}
