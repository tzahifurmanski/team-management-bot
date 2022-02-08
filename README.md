[![Known Vulnerabilities](https://snyk.io/test/github/tzahifurmanski/team-slack-bot/badge.svg)](https://snyk.io/test/github/tzahifurmanski/team-slack-bot)

# team-slack-bot

A slack bot for engineering teams to get various stats and perform team related actions.

## Setup / Deployment:

* Set up a Slack app
  * Import a Slack App using a [manifest file](slack-manifest.txt), and enter the relevant details instead of the following placeholders:
    * <BOT_NAME>
    * <BOT_DESCRIPTION>
    * <BOT_URL>
  * Configure the with relevant permissions (TBD, add permissions list)
  * Install the app to workspace
    * (Optional) You can also decide to manually setup the Slack app: 
    * Enable 'App Home > Always Show My Bot as Online' and 'Allow users to send Slash commands and messages from the
      messages tab'
    * Register for event subscriptions
      * Enable events and set request URL to : BOT_URL/events/slack
      * Subscribe to bot events
        * app_mention
        * message.channels
        * message.im
* Setup an Heroku NodeJS app
  * Connect your local git repo to heroku
    * heroku git:remote -a APP_NAME
    * heroku git:remote --remote REMOTE_NAME -a HEROKU_APP_NAME
  * (Optional) if you want to add a new profile to the bot, add it to the assets/personalities folder
  * Set up your config variables - See [config vars list here](config-variables.txt)

To be dynamic, the bot relies on configuration being passed through environment variables. To setup:
* For local testing - Create a '.env' file and pass the environment variables through there.
* For production - Deploy the bot on Heroku (or equivalent service) and pass the environment variables through config
  variables.


### Personalities setup

* The bot supports multiple personalities.
* There is a 'generic' personality, that will be used if a bot personality is not selected.
* Custom personalities you can choose from are 'BoJack Horseman', 'The Rock', 'Unibot', 'Rhinobot', 'Narwhalbot' and 'Designbot'
* Setup the personality with the 'BOT_PERSONALITY' config var. Note: The personality should be exactly as the folder
  name under 'personalities'

### Features setup
## Zendesk Integration
In order to integrate the bot with Zendesk, you need to supply two configurations:
* ZENDESK_TOKEN
* ZENDESK_BASE_URL

## Oncall Tickets Status
Oncall tickets status feature does a daily summary of the current tickets currently active for your oncall team.
In order to enable the feature, you need to:
* Configure Zendesk Integration
* Set up the following configurations:
  * MONITORED_ZENDESK_VIEW
  * ONCALL_CHANNEL_ID
  * ONCALL_CHANNEL_NAME