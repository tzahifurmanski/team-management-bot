import { IntroduceYourself } from "../../../src/actions/asks/introduce_yourself";
import { Help } from "../../../src/actions/asks/help";

// TODO: Mock Help, it is not really tested here
const testedClass: IntroduceYourself = new IntroduceYourself(new Help());

describe("doesMatch", () => {
  test("Good input", async () => {
    const event: any = {};

    event.text = "introduce yourself";
    expect(testedClass.doesMatch(event)).toBeTruthy();
    event.text = "hello";
    expect(testedClass.doesMatch(event)).toBeTruthy();
  });

  test("Bad input", async () => {
    const event: any = {};

    event.text = "introduce";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "heya";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "1";
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event.text = "ZA";
    expect(testedClass.doesMatch(event)).toBeFalsy();
  });

  // TODO: Add a test that the bot action actually sends the message I expect it to
});
