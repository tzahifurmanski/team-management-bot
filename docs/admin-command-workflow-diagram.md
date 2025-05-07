# Team Admin Command Workflow

```mermaid
flowchart TD
    A[User sends admin command] --> B{Is admin user?}
    B -->|No| C[Send access denied message]
    B -->|Yes| D[Request confirmation]
    D --> E{Confirmation received?}
    E -->|No| F[Send cancellation message]
    E -->|Yes| G{Command type?}

    G -->|team list| H[Query all teams]
    G -->|team add| I[Validate channel info]
    G -->|team edit| J[Validate team + params]
    G -->|team delete| K[Find team to delete]

    H --> L[Format team information]
    I --> M[Create team in database]
    J --> N[Update team in database]
    K --> O[Delete team from database]

    L --> P[Update in-memory map]
    M --> P
    N --> P
    O --> P

    P --> Q[Send success message]

    style B fill:#f96
    style E fill:#6f9
    style P fill:#69f
```

## Description

This flowchart shows the complete workflow for admin commands:

- User authorization check
- Confirmation requirement for destructive operations
- Command routing to appropriate handlers
- Database operations and in-memory state updates
- Success/error message handling
