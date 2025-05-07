# Message Processing Pipeline

```mermaid
flowchart TD
    A[Slack Message Received] --> B{Message Type?}

    B -->|Channel Message| C{Is bot message?}
    B -->|Direct Message| D{Is bot message?}
    B -->|App Mention| E{Is bot message?}

    C -->|Yes| F[Ignore]
    C -->|No| G{In monitored channel?}

    D -->|Yes| F
    D -->|No| H[Handle Direct Event]

    E -->|Yes| F
    E -->|No| H

    G -->|Yes| I[Get Response Actions]
    G -->|No| F

    H --> J[Get Bot Actions]

    I --> K{Find matching action?}
    J --> K

    K -->|Yes| L[Execute Action]
    K -->|No| M[Log unsupported event]

    L --> N[Send Response]

    style H fill:#6f9
    style I fill:#69f
    style L fill:#9f6
```

## Description

This diagram shows the message processing pipeline:

- Message type classification
- Bot message filtering
- Event routing to appropriate handlers
- Action matching and execution
- Response generation and delivery
