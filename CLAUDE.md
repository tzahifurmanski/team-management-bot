# CLAUDE.md

This file contains guidance for Claude Code when working with this repository.

## Project Overview

Team Management Bot is a Slack bot for engineering teams built with TypeScript, using the @slack/bolt framework and PostgreSQL with TypeORM for data persistence.

## Build and Test Commands

- `npm start` - Run the compiled application
- `npm run dev-start` - Compile and run
- `npm run debug` - Watch mode with auto-reload
- `npm test` - Run tests
- `npm run coverage` - Run tests with coverage
- `npm run format` - Format code with Prettier and ESLint

## Code Style Guidelines

### TypeScript Typing Rules

**Always check library types before creating custom ones.**

When working with external libraries and you need to type an object or function parameter:

1. **First**, check if the library already provides TypeScript types for the object
2. **Search** the library's type definitions (usually in `node_modules/@types/` or bundled with the package)
3. **Use** the library's types if available - they are maintained by the library authors and stay in sync with API changes
4. **Only create** custom types if the library doesn't provide them or if you need to extend them

**Example - Slack Bolt Events:**

```typescript
// GOOD - Use library types
import { SlackEventMiddlewareArgs } from '@slack/bolt';

export const messageCallback = async (
  { event, client }: SlackEventMiddlewareArgs<'message'>
) => { ... };

// BAD - Creating custom types when library provides them
interface MySlackEvent {
  text: string;
  channel: string;
  user: string;
}
export const messageCallback = async ({ event, client }: { event: MySlackEvent, client: any }) => { ... };
```

### General TypeScript Guidelines

- Avoid using `any` type when possible - use proper types from libraries or create interfaces
- Use type narrowing (e.g., checking `event.subtype`) when working with union types
- Prefer `interface` for object shapes, `type` for unions and complex types

## Architecture Notes

- **Actions** (`src/actions/`) - Command handlers implementing `BotAction` interface
- **Services** (`src/services/`) - Business logic (TeamService, AdminAuthorizationService)
- **Entities** (`src/entities/`) - TypeORM database models
- **Integrations** (`src/integrations/`) - External service integrations (Slack, Zendesk)

## Testing

Tests are located in `test/` directory mirroring the `src/` structure. Run with `npm test`.
