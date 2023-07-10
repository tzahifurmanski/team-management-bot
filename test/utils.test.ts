import { handleListParameter } from "../src/consts";

describe("handleListParameter", () => {
  test("Empty Param", async () => {
    const input = "";

    const result = handleListParameter(input);

    expect(result.length).toEqual(0);
  });

  test("One entry", async () => {
    const input = "Zigi";

    const result = handleListParameter(input);

    expect(result.length).toEqual(1);
    expect(result[0]).toEqual("Zigi");
  });

  test("One with comma", async () => {
    const input = "Zigi,";

    const result = handleListParameter(input);

    expect(result.length).toEqual(1);
    expect(result[0]).toEqual("Zigi");
  });

  test("Multiple entries", async () => {
    const input = "Zigi,Zag,Zug";

    const result = handleListParameter(input);

    expect(result.length).toEqual(3);
    expect(result[0]).toEqual("Zigi");
    expect(result[1]).toEqual("Zag");
    expect(result[2]).toEqual("Zug");
  });

  test("Multiple entries #2", async () => {
    const input = "30 08 * * 0-5,30 09 * * 0-5";

    const result = handleListParameter(input);

    expect(result.length).toEqual(2);
    expect(result[0]).toEqual("30 08 * * 0-5");
    expect(result[1]).toEqual("30 09 * * 0-5");
  });

  test("Multiple entries #3", async () => {
    const input = "30 08 * * 0-5,,30 09 * * 0-5";

    const result = handleListParameter(input, "", ",", false);

    expect(result.length).toEqual(3);
    expect(result[0]).toEqual("30 08 * * 0-5");
    expect(result[1]).toEqual("");
    expect(result[2]).toEqual("30 09 * * 0-5");
  });

  test("Multiple entries - with comma", async () => {
    const input = "Zigi,Zag,Zug,";

    const result = handleListParameter(input);

    expect(result.length).toEqual(3);
    expect(result[0]).toEqual("Zigi");
    expect(result[1]).toEqual("Zag");
    expect(result[2]).toEqual("Zug");
  });
});

// TODO: Add more tests for the other (param) scenarios
