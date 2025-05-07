# Cron Job Scheduling System

```mermaid
flowchart TD
    A[Application Startup] --> B[Load Team Configuration]
    B --> C{Load Teams from Database}
    C --> D[Load Teams from Environment]

    D --> E{For each team}
    E -->|Process| F{Has ask_channel_cron?}
    E -->|End| L[All Jobs Scheduled]

    F -->|Yes| G[Schedule Ask Channel Job]
    F -->|No| H{Has zendesk_channel_cron?}
    G --> H

    H -->|Yes| I[Schedule Zendesk Job]
    H -->|No| J[Next Team]
    I --> J

    J --> E

    subgraph "Cron Job Details"
    K1[Ask Channel Status Job]
    K2[Zendesk Ticket Job]
    K3[Last Run Tracking]
    K4[Duplicate Prevention]
    end

    L --> M[Start Node-Cron Scheduler]
```

## Description

This flowchart illustrates:

- Application startup sequence
- Team configuration loading process
- Cron job scheduling logic for each team
- Conditional scheduling based on team settings
- Prevention of duplicate job execution
