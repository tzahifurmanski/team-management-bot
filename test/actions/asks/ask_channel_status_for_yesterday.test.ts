import { AskChannelStatusForYesterday } from "../../../src/actions/asks/ask_channel_status_for_yesterday";

const testedClass: AskChannelStatusForYesterday =
  new AskChannelStatusForYesterday();

describe("doesMatch", () => {
  test("Good input", async () => {
    const event: any = {};

    event.text = "ask channel status for yesterday #asdas";
    expect(testedClass.doesMatch(event)).toBeTruthy();
  });

  test("Bad input", async () => {
    const event: any = {};

    event.text = "ask channel status for yesterday";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "ask channel status for 30 days";
    expect(testedClass.doesMatch(event)).toBeFalsy();
  });
});
