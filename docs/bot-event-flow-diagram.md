# Team Slack Bot - Event Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Slack API
    participant B as Bot Server
    participant A as Action System
    participant D as Database
    participant R as Response Handler

    U->>S: Send Message
    S->>B: Event Webhook
    B->>B: Validate Event

    alt Is DM or Mention
        B->>A: Process as Direct Event
    else Is Channel Message
        B->>A: Process as Channel Event
    end

    A->>A: Find Matching Action
    A->>D: Query Team Data
    D-->>A: Return Team Info

    alt Admin Command
        A->>A: Check Authorization
        A->>A: Request Confirmation
        A->>D: Execute Operation
    else Regular Command
        A->>A: Execute Action
    end

    A->>R: Generate Response
    R->>S: Send Message
    S->>U: Deliver Response
```

## Description

This sequence diagram shows the complete flow of events when a user interacts with the bot:

- Message reception and validation
- Event routing based on message type
- Action processing and database interaction
- Authorization and confirmation flow for admin commands
- Response generation and delivery
