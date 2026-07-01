# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in Azure OpenAI credentials
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Commands

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint via Next.js

# Database
npx prisma migrate dev    # Apply migrations + regenerate client
npx prisma db seed        # Seed with sample data (ts-node)
npx prisma studio         # Browse the SQLite DB in a GUI
```

## Architecture

This is a **Next.js 15 + LangGraph** customer support chatbot — Workshop 1 of an agentic AI series demonstrating the "naive" single-agent pattern.

### Data flow

```
Browser (ChatWindow) → POST /api/chat → LangGraph graph → Azure OpenAI (streaming)
                                              ↓
                                    SQLite via Prisma
```

### Key design decision (intentional limitation)

`agent/graph.ts` implements a **single-node LangGraph graph**: `START → customerSupportAgent → END`. On every user message it:
1. Fetches the **entire database** (all customers, orders, products, refunds, tickets) via `buildDatabaseContext()`
2. Dumps it all into the LLM system prompt alongside conversation history

This is the naive approach — no tool calls, no planners, no retrieval. Workshop 2 refactors this into a planner + specialised tool-calling agents.

### File map

| Path | Purpose |
|---|---|
| `agent/graph.ts` | LangGraph workflow definition + DB context builder |
| `agent/llm.ts` | Azure OpenAI (`AzureChatOpenAI`) singleton |
| `agent/prompts.ts` | System prompt (prefixed to full DB dump) |
| `app/api/chat/route.ts` | POST handler — streams LangGraph `streamEvents` token-by-token |
| `lib/prisma.ts` | Prisma singleton (safe for Next.js hot reload) |
| `prisma/schema.prisma` | SQLite schema: Customer, Product, Order, Refund, SupportTicket |
| `prisma/seed.ts` | Sample data seeder |
| `types/chat.ts` | Shared `Message` / `ChatRequest` types |
| `components/` | React chat UI (ChatWindow, ChatInput, ChatMessage) |

### Schema status strings (not enums — SQLite limitation)

- **Order.status**: `Pending | Packed | Shipped | OutForDelivery | Delivered | Cancelled`
- **Refund.status**: `Requested | Approved | Rejected | Completed`
- **SupportTicket.priority**: `Low | Medium | High`
- **SupportTicket.status**: `Open | InProgress | Closed`
