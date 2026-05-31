# Todoist Integration Design

**Date:** 2026-05-31
**Status:** Approved

## Context

The current task inbox workflow uses `inbox.md` — a markdown file in the repo that Claude reads at session start. Tasks are added by editing the file directly via the GitHub mobile app, which is functional but clunky on a phone.

The goal is to replace this with Todoist, giving the user a natural, phone-friendly way to add and manage tasks. A dedicated Todoist project ("VS Code") becomes the single source of truth. Claude connects to it via a Todoist MCP server, reading tasks at session start and completing them via the API when work is done.

## Todoist Structure

**Project:** VS Code

**Sections:**
- Oxford Wood Works
- CEM Configurator
- T-Shirt Business
- Time Tracker
- General / Admin

Tasks are added to the relevant section from the Todoist app on any device. Completed tasks (whether ticked by the user or completed by Claude via API) disappear from the active list into history — same behavior either way.

## Architecture

```
Todoist (phone/desktop) → VS Code project
        ↕
Todoist MCP Server (local, authenticated with API token)
        ↕
Claude Code (reads at session start, completes tasks inline)
```

- The MCP server runs as a local process, configured once in Claude Code's settings
- The Todoist API token is stored in the Claude Code MCP config on the local machine only
- No automation middleware (no Zapier, no webhooks) — direct API connection

## Session Startup Behavior

Replaces the current `inbox.md` reading instruction in CLAUDE.md:

1. Connect to Todoist via MCP server
2. Fetch all open tasks from the VS Code project, grouped by section
3. Summarize pending work by project area
4. Suggest a work order based on urgency and dependencies
5. Ask which project to start with

When a task is completed during the session, Claude marks it done in Todoist immediately — it disappears from the active list.

## CLAUDE.md Changes

- Session startup instruction updated: read from Todoist VS Code project instead of `inbox.md`
- Note added for future expansion: additional Todoist projects can be added to the session startup read without any new setup

## inbox.md

Retired from active use. The file remains in the repo for historical reference but is no longer part of the workflow.

## Future Expansion

When the user is ready to bring in other Todoist projects (personal tasks, other business areas), only CLAUDE.md needs updating — the MCP server already has access to all projects under the account. No new tooling required.

## Verification

1. Create VS Code project with five sections in Todoist
2. Install and configure Todoist MCP server in Claude Code
3. Start a new Claude Code session — Claude should read and summarize tasks from Todoist at startup without any manual prompt
4. Add a test task in Todoist on mobile — confirm it appears at the next session start
5. Complete a task during a session — confirm it disappears from Todoist active list
