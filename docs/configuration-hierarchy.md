# Configuration Hierarchy

```mermaid
flowchart TD
    A[Application Start] --> B[Load Environment Variables]
    B --> C[Connect to Database]
    C --> D[Get Bot Slack ID]

    D --> E[Initialize TEAMS_LIST]
    E --> F[Load Teams from Database]
    F --> G{Check ENABLE_ENV_TEAMS}

    G -->|True| H[Load Teams from Environment]
    G -->|False| K[Configuration Complete]

    H --> I[Merge Environment Teams]
    I --> J[Update/Create Database Teams]
    J --> K

    K --> L[Set Slack WebClient]
    L --> M[Register Event Listeners]
    M --> N[Register Web Endpoints]
    N --> O[Start Server]

    subgraph "Configuration Sources"
    P[Environment Variables]
    Q[Database]
    R[JSON Configuration]
    end

    P -.-> H
    Q -.-> F
    R -.-> I

    style E fill:#f9f
    style K fill:#9f9
```

## Description

This diagram shows:

- Application initialization sequence
- Configuration loading priority (Database > Environment)
- Configuration merging and synchronization
- Service initialization flow
- Server startup process
