---
name: better-auth
description: Implementation guide and best practices for Better Auth
---

# Better Auth Skill

Better Auth is a comprehensive authentication library for TypeScript. It's framework-agnostic and heavily plugin-based.

## Quick Start

1. **Install**:
   ```bash
   npm install better-auth
   npx @better-auth/cli init
   ```

2. **Database Setup**:
   Define your schema (Drizzle/Prisma) according to the docs. Better Auth needs specific tables (`user`, `session`, `account`, `verification`).

3. **Server Configuration (`lib/auth.ts`)**:
   ```typescript
   import { betterAuth } from "better-auth";
   import { drizzleAdapter } from "better-auth/adapters/drizzle";
   import { db } from "./db"; // your drizzle instance

   export const auth = betterAuth({
     database: drizzleAdapter(db, {
       provider: "pg", // or "mysql", "sqlite"
     }),
     emailAndPassword: {
       enabled: true,
     },
     // Add plugins here
   });
   ```

4. **Client Configuration (`lib/auth-client.ts`)**:
   ```typescript
   import { createAuthClient } from "better-auth/client";
   
   export const authClient = createAuthClient({
     baseURL: process.env.NEXT_PUBLIC_APP_URL,
   });
   ```

## AI Integration

To enable deep integration with Cursor or other AI tools via MCP (Model Context Protocol):

```bash
npx @better-auth/cli mcp --cursor
```

This installs the context server that helps AI understand your specific auth configuration dynamically.

## Resources

- **Documentation**: [https://www.better-auth.com/docs](https://www.better-auth.com/docs)
- **AI Instructions**: [https://better-auth.com/llms.txt](https://better-auth.com/llms.txt)
