# Team Slack Bot - System Architecture

```mermaid
graph TD
    subgraph "Team Slack Bot"
    A[Server.ts] --> B[Slack Integration]
    A --> C[Database Connection]
    A --> D[Actions System]
    B --> E[Events Listeners]
    B --> F[Messages Handler]
    D --> G[Bot Actions]
    D --> H[Response Actions]
    C --> I[TypeORM]
    I --> J[PostgreSQL]

    subgraph "Bot Actions"
    G --> K[Team Admin]
    G --> L[Channel Status]
    G --> M[Zendesk Integration]
    G --> N[Help System]
    end

    subgraph "Response Actions"
    H --> O[Merge Response]
    H --> P[Bug Response]
    H --> Q[Review Request]
    H --> R[General Responses]
    end
    end
```

## Description

This diagram shows the high-level architecture of the Team Slack Bot, displaying:

- Main application entry point (Server.ts)
- Key architectural components
- Integration points
- Action system organization
- Database infrastructure
