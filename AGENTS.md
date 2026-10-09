# Agent Guidelines

Go read [CLAUDE.md](file://./CLAUDE.md) to get context on the project and repo before doing any other exploratory work.

## Antigravity MCP Calling

All Dungeonmaster MCP tools (`get-project-map`, `discover`, `get-architecture`, `signal-back`, etc.) are available via `call_mcp_tool` under server `dungeonmaster_dungeonmaster`.

## Specimen Test Execution Concurrency

Never run multiple instances of `npm run test:generated` or smoke-repo specimen test suites concurrently across processes or subagents. Each run spawns nested Jest runners and TypeScript compilers across worker pools; running multiple instances in parallel exhausts system memory and crashes the environment. Run specimen test suites sequentially in a single process.

An automated file-based concurrency lock (`concurrency-lock.js`) guards `smoke-repo` specimen test runs via Jest `globalSetup`. If another specimen test run is already active, subsequent attempts are automatically refused and fail fast before spawning worker processes.


