# Team Slack Bot - Database Schema

```mermaid
erDiagram
    teams ||--|| ask_channels : has
    teams ||--o| zendesk_integrations : has
    teams ||--o| code_review_channels : has

    teams {
        uuid id PK
        string name
        string description
        timestamp created_at
        timestamp updated_at
    }

    ask_channels {
        uuid id PK
        string channel_id UK
        string channel_name
        string cron_schedule
        timestamp cron_last_sent
        json allowed_bots
        uuid team_id FK
    }

    zendesk_integrations {
        uuid id PK
        string channel_id
        string channel_name
        string monitored_view_id
        string aggregated_field_id
        string field_id
        json field_values
        string cron_schedule
        uuid team_id FK
    }

    code_review_channels {
        uuid id PK
        string channel_id UK
        string channel_name
        uuid team_id FK
    }
```

## Description

This Entity Relationship Diagram shows:

- Database schema structure
- Relationships between entities
- Primary keys (PK), Foreign keys (FK), and Unique constraints (UK)
- Column types and constraints
- One-to-one and one-to-optional relationships
