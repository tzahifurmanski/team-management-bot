jest.mock("../../src/integrations/slack/conversations");

import {
    getBotId,
    // getConversationId,
  } from "../../src/integrations/slack/conversations";

import { loadConfig, getTeamsList } from '../../src/settings/team_consts';

import * as sconsts from '../../src/settings/server_consts';

import { jest } from '@jest/globals';


describe('loadConfig', () => {
    let originalEnv: NodeJS.ProcessEnv;

    let slackClient: any;

  beforeEach(() => {
        // Store the original process.env
        originalEnv = { ...process.env };

    slackClient = {}; // Mock the slackClient object
  });

  afterEach(() => {
    // Restore the original process.env after each test
    process.env = originalEnv;
  });

it('should load the Slack config successfully', async () => {
    // Mock the necessary functions and variables
    // (logger as jest.Mock);
    // (BOT_SLACK_ID as jest.Mock).mockReturnValue('botSlackID'
    const getBotIdMock = (getBotId as jest.Mock).mockReturnValue('botSlackID');
    
    // const setBotSlackIdMock = (setBotSlackId as jest.Mock);
    const setBotSlackIdMock = jest.spyOn(sconsts, 'setBotSlackId');//.mockReturnValue({ someObjectProperty: 42 });
    // const getConversationIdMock = (getConversationId as jest.Mock).mockReturnValue('channelId');

    // Mock the necessary variables
    process.env.TEAM_ASK_CHANNEL_ID = 'channelid1,channelid2';
    process.env.TEAM_ASK_CHANNEL_NAME = 'channel1,channel2';
    process.env.ASK_CHANNEL_STATS_CRON = '';
    process.env.ALLOWED_BOTS = 'bot1,bot2|bot1,bot2';
    process.env.TEAM_CODE_REVIEW_CHANNEL_ID = 'crchannel_id,';
    process.env.TEAM_CODE_REVIEW_CHANNEL_NAME = 'codeReviewChannel,';
    process.env.GROUP_ASK_CHANNELS = '';
    process.env.ZENDESK_TICKETS_CHANNEL_ID = 'zdchannelid1,zdchannelid2';
    process.env.ZENDESK_TICKETS_CHANNEL_NAME = 'zendesk1,zendesk2';
    process.env.ZENDESK_MONITORED_VIEW = 'view1,view2';
    process.env.ZENDESK_VIEW_AGGREGATED_FIELD_ID = 'field1,field2';
    process.env.MONITORED_ZENDESK_FILTER_FIELD_ID = 'fieldId1,fieldId2';
    process.env.MONITORED_ZENDESK_FILTER_FIELD_VALUES = 'value1,value2|value3,value4';
    process.env.ZENDESK_TICKETS_STATS_CRON = '';
    // process.env.TEAMS_JSON_LIST = '{"ask_channel_id": "channel1"}'; // TODO: Test this? (Is this really needed?)

    // Call the function
    const result = await loadConfig(slackClient);

    // Assertions
    expect(result).toBe(true);
    expect(getBotIdMock).toHaveBeenCalledWith(slackClient);
    expect(setBotSlackIdMock).toHaveBeenCalledWith('botSlackID');

    expect(getTeamsList().size).toBe(2);
    const team_to_compare = getTeamsList().get('channelid1');
    expect(team_to_compare).toEqual({
        ask_channel_id: 'channelid1',
        ask_channel_name: 'channel1',
        ask_channel_cron: '',
        code_review_channel_id: 'crchannel_id',
        code_review_channel_name: 'codeReviewChannel',
        allowed_bots: ['bot1', 'bot2'],
        zendesk_channel_id: 'zdchannelid1',
        zendesk_channel_name: 'zendesk1',
        zendesk_monitored_view_id: 'view1',
        zendesk_aggregated_field_id: 'field1',
        zendesk_field_id: 'fieldId1',
        zendesk_field_values: ['value1','value2'],
        zendesk_channel_cron: '',
        ask_channel_cron_last_sent: expect.any(Date),
    });
});
});
