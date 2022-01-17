// TODO: Write the tests, they are just stubs ATM
//
// const supertest = require("supertest");
// const tested_app = require("../src/server_init");
//
import {IntroduceYourself} from "../../../src/actions/asks/introduce_yourself";

let testedClass: IntroduceYourself = new IntroduceYourself();


describe("doesMatch", () => {
  test("Good input", async () => {
    const event : any = {};

    event['text'] ='introduce yourself';
    expect(testedClass.doesMatch(event)).toBeTruthy();
    event['text'] ='hello';
    expect(testedClass.doesMatch(event)).toBeTruthy();
  });

  test("Bad input", async () => {
    const event : any = {};

    event['text'] ='introduce';
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event['text'] ='heya';
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event['text'] ='';
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event['text'] ='1';
    expect(testedClass.doesMatch(event)).toBeFalsy();
    event['text'] ='ZA';
    expect(testedClass.doesMatch(event)).toBeFalsy();
  });

  // TODO: Add a test that the bot action actually sends the message I expect it to
});
