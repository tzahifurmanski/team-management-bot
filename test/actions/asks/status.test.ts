import { Status } from "../../../src/actions/asks/status.js";
import { BOT_SLACK_ID } from "../../../src/settings/server_consts.js";

const testedClass: Status = new Status();

describe("doesMatch", () => {
  test("Good input", async () => {
    const event: any = {};

    event.text = "status";
    expect(testedClass.doesMatch(event)).toBeTruthy();
    event.text = "Status";
    expect(testedClass.doesMatch(event)).toBeTruthy();

    event.text = `<@${BOT_SLACK_ID}> status`;
    expect(testedClass.doesMatch(event)).toBeTruthy();
  });

  test("Bad input", async () => {
    const event: any = {};

    event.text = "status please";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "get status";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "stat";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "statusS";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "Sstatus";
    expect(testedClass.doesMatch(event)).toBeFalsy();
  });
});
