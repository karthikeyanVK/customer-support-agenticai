# Workshop 1 — AI Customer Support Agent (Naive)

An educational project demonstrating how many developers initially build AI applications: a single LLM node that performs all reasoning, data fetching, and business decisions with no deterministic logic.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **LangGraph** — single-node graph
- **LangChain Azure OpenAI** (Microsoft AI Foundry)
- **Prisma ORM** + SQLite

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your **Microsoft AI Foundry (Azure OpenAI)** details:

```
AZURE_OPENAI_API_INSTANCE_NAME=your-resource-name
AZURE_OPENAI_API_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_API_VERSION=2024-08-01-preview
DATABASE_URL="file:./prisma/dev.db"
```

Find these in: **Azure Portal → AI Foundry → your project → Deployments**

### 3. Create the database

```bash
npx prisma migrate dev --name init
```

### 4. Generate the Prisma client

```bash
npx prisma generate
```

### 5. Seed sample data

```bash
npx prisma db seed
```

This creates:
- 25 customers
- 15 products (MacBook Pro, Standing Desk, Headphones, etc.)
- 75 orders (realistic status distribution)
- 20 refunds
- 20 support tickets

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Example Questions to Try

```
Show me all orders for sarah.johnson@outlook.com
Can I cancel order 5?
What orders are currently being shipped?
Do I have any refund requests?
Show all open support tickets
My package hasn't arrived — order #12
What is the status of refund #3?
```

---

## Architecture

```
Chat UI (components/)
  ↓
POST /api/chat
  ↓
LangGraph graph (agent/graph.ts)
  ↓
CustomerSupportAgent node
  — fetches ALL data from Prisma
  — builds a text context block
  — calls gpt-4o-mini with full context
  ↓
Streaming response → UI
```

## Intentional Limitations (Workshop Teaching Points)

This design has deliberate flaws that motivate Workshop 2:

| Problem | Impact |
|---|---|
| All data fetched on every request | Slow, expensive, won't scale |
| No deterministic business rules | LLM may make inconsistent decisions |
| Business logic inside LLM prompt | Can't audit or test decisions |
| Context window fills as data grows | Will break with real customer volume |
| No customer authentication | Anyone can ask about any customer |

Workshop 2 refactors this into a proper multi-agent architecture using LangGraph tools, a planner node, and deterministic business rules.

---

## Folder Structure

```
app/
├── page.tsx              # Entry point — renders ChatWindow
├── layout.tsx            # Root layout
└── api/chat/route.ts     # POST /api/chat — streams LangGraph response

agent/
├── graph.ts              # LangGraph: START → CustomerSupportAgent → END
├── llm.ts                # ChatOpenAI instance
└── prompts.ts            # System prompt

components/
├── ChatWindow.tsx         # Manages messages, calls API, streams tokens
├── ChatMessage.tsx        # Renders one message (Markdown for assistant)
└── ChatInput.tsx          # Textarea + send button

lib/
└── prisma.ts              # Prisma singleton

prisma/
├── schema.prisma          # DB schema (Customer, Product, Order, Refund, Ticket)
└── seed.ts                # Realistic seed data

types/
└── chat.ts                # Message / ChatRequest types
```
