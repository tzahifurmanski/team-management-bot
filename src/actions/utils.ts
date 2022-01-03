import {BOT_ID} from "../integrations/slack/consts";

export const getRandomFromArray = (array: any[]) => {
  const random = Math.floor(Math.random() * array.length);
  return array[random];
};

// TODO Make this prettier
export const toDateTime = (secs: any): Date => {
  const time = new Date(1970, 0, 1); // Epoch
  time.setSeconds(secs);
  return time;
};

// This method takes a date and removes all time information from it
export const removeTimeInfoFromDate = (date: Date): Date => {
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  return date;
};

export const setDateToSunday = (date: Date): Date => {
  const day = date.getDay();
  if (day !== 0) date.setHours(-24 * (day - 1));
  return date;
};

// Remove the name of the bot, in case it was mentioned
export const sanitizeCommandInput = (text: string): string => {
  return text
      .replace(`<@${BOT_ID}> `, "")
      .trim();
}

