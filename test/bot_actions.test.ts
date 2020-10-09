// TODO: Write the tests, they are just stubs ATM
import { handle_direct_event } from "../src/bot_actions";
import { introduce_yourself_action } from "../src/actions/asks/introduce_yourself";

describe("handle_event", () => {
  test("Command that matches", () => {
    // TODO: Need to implement a mock here
    // jest.mock("../src/actions/introduce_yourself");
    //
    // introduce_yourself_action.mockClear();
    //
    // expect(2).toBe(2);
  });

  test("Command that does not match", () => {
    console.log = jest.fn();

    const event = {
      text: "Super Weird Command that does not match anything :(",
    };

    handle_direct_event(event);
    expect(console.log).toHaveBeenCalledWith("Unsupported event", event);
  });
});
