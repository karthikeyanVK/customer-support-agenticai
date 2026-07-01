# Workshop 2 — Naive AI to Agentic Architecture

**Goal:** Replace the single-node LangGraph agent with a deterministic, tool-based architecture where the LLM orchestrates instead of performs.

---

## Learning Objectives

1. Explain why LLMs hallucinate when asked to calculate or count from data
2. Build deterministic LangGraph tool functions using Prisma
3. Register tools with LangGraph's `ToolNode`
4. Separate Planner (intent) from Response Generator (formatting)

---

## Pre-Workshop: The Problem

Run the app. Ask these questions and write down the answers:

```
"How many customers do we have?"
"What is today's revenue?"
"How much has James spent in total?"
"What is the average order value?"
"How many support tickets are open?"
```

Clear chat. Ask the same questions again. Numbers change. LLM sounds confident but is wrong.

---

## Current Architecture (Workshop 1)

```
User → POST /api/chat → customerSupportAgent()
  1. buildDatabaseContext() → loads ALL data as text
  2. llm.invoke(giant text wall) → LLM reads, counts, calculates, responds
→ Streamed response
```

| Task | Should be done by |
|---|---|
| Understand user intent | LLM ✓ |
| Choose data to fetch | **Code** |
| Fetch and aggregate data | **Code** |
| Calculate totals, counts, averages | **Code** |
| Format and explain the answer | LLM ✓ |

---

## Target Architecture (Workshop 2)

```
User → POST /api/chat
  → Planner Node        (LLM picks tool)
  → ToolNode            (executes tool, returns JSON)
  → Response Generator  (LLM formats result)
→ Streamed response
```

---

## Folder Structure After Refactoring

Only `agent/` changes:

```
agent/
  graph.ts              ← refactored
  llm.ts                ← unchanged
  planner.ts            ← new
  responseGenerator.ts  ← new
  tools/
    customerTools.ts    ← new
    orderTools.ts       ← new
    supportTools.ts     ← new
    index.ts            ← new
```

---

# Section 1 — Customer Tools

Create `agent/tools/customerTools.ts`:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Prisma query functions ───────────────────────────────────────────────────

async function getCustomerById(id: number) {
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { include: { product: true } },
      supportTickets: true,
    },
  });
}

async function getCustomerByEmail(email: string) {
  return await prisma.customer.findUnique({
    where: { email },
    include: {
      orders: { include: { product: true } },
      supportTickets: true,
    },
  });
}

async function getCustomerCount() {
  return await prisma.customer.count();
}

async function getTopCustomers(limit: number) {
  const customers = await prisma.customer.findMany({
    include: { orders: true },
  });
  return customers
    .sort((a, b) => b.orders.length - a.orders.length)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      orderCount: c.orders.length,
    }));
}

// ─── LangGraph tool definitions ───────────────────────────────────────────────

const customerByIdTool = tool(
  async ({ id }) => JSON.stringify(await getCustomerById(id)),
  {
    name: "get_customer_by_id",
    description:
      "Look up a customer by their numeric ID. Returns their profile, orders, and support tickets.",
    schema: z.object({ id: z.number().describe("The customer's numeric ID") }),
  }
);

const customerByEmailTool = tool(
  async ({ email }) => JSON.stringify(await getCustomerByEmail(email)),
  {
    name: "get_customer_by_email",
    description:
      "Look up a customer by their email address. Returns their profile, orders, and support tickets.",
    schema: z.object({ email: z.string().describe("The customer's email address") }),
  }
);

const customerCountTool = tool(
  async () => JSON.stringify({ count: await getCustomerCount() }),
  {
    name: "get_customer_count",
    description:
      "Returns the exact total number of customers in the database. Use when asked how many customers there are.",
    schema: z.object({}),
  }
);

const topCustomersTool = tool(
  async ({ limit }) => JSON.stringify(await getTopCustomers(limit)),
  {
    name: "get_top_customers",
    description:
      "Returns the customers who have placed the most orders, ranked from highest to lowest.",
    schema: z.object({
      limit: z.number().default(5).describe("How many customers to return"),
    }),
  }
);

export const customerTools = [
  customerByIdTool,
  customerByEmailTool,
  customerCountTool,
  topCustomersTool,
];
```

---

# Section 2 — Order Tools

Create `agent/tools/orderTools.ts`:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Prisma query functions ───────────────────────────────────────────────────

async function getOrderById(id: number) {
  return await prisma.order.findUnique({
    where: { id },
    include: { product: true, customer: true, refunds: true },
  });
}

async function getOrdersByCustomer(customerId: number) {
  return await prisma.order.findMany({
    where: { customerId },
    include: { product: true, refunds: true },
    orderBy: { orderedAt: "desc" },
  });
}

async function getRevenueOnDate(date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const result = await prisma.order.aggregate({
    where: { orderedAt: { gte: start, lte: end } },
    _sum: { totalAmount: true },
    _count: true,
  });

  return {
    date,
    revenue: result._sum.totalAmount ?? 0,
    orderCount: result._count,
  };
}

async function getAverageOrderValue() {
  const result = await prisma.order.aggregate({
    _avg: { totalAmount: true },
    _count: true,
  });
  return {
    averageOrderValue: result._avg.totalAmount ?? 0,
    totalOrders: result._count,
  };
}

async function getHighestValueOrder() {
  return await prisma.order.findFirst({
    orderBy: { totalAmount: "desc" },
    include: { product: true, customer: true },
  });
}

// ─── LangGraph tool definitions ───────────────────────────────────────────────

const orderByIdTool = tool(
  async ({ id }) => JSON.stringify(await getOrderById(id)),
  {
    name: "get_order_by_id",
    description:
      "Look up a specific order by its numeric ID. Returns the product, customer, status, and any refunds.",
    schema: z.object({ id: z.number().describe("The order's numeric ID") }),
  }
);

const ordersByCustomerTool = tool(
  async ({ customerId }) => JSON.stringify(await getOrdersByCustomer(customerId)),
  {
    name: "get_orders_by_customer",
    description:
      "Returns all orders placed by a customer, most recent first. Use when a customer asks about their orders.",
    schema: z.object({
      customerId: z.number().describe("The customer's numeric ID"),
    }),
  }
);

const revenueOnDateTool = tool(
  async ({ date }) => JSON.stringify(await getRevenueOnDate(date)),
  {
    name: "get_revenue_on_date",
    description:
      "Returns the total revenue and order count for a specific date. Use when asked about revenue on a given day. Date must be in YYYY-MM-DD format.",
    schema: z.object({
      date: z.string().describe("The date in YYYY-MM-DD format"),
    }),
  }
);

const averageOrderValueTool = tool(
  async () => JSON.stringify(await getAverageOrderValue()),
  {
    name: "get_average_order_value",
    description:
      "Returns the average order value and total order count across all orders in the database.",
    schema: z.object({}),
  }
);

const highestValueOrderTool = tool(
  async () => JSON.stringify(await getHighestValueOrder()),
  {
    name: "get_highest_value_order",
    description:
      "Returns the single highest-value order ever placed, including customer and product details.",
    schema: z.object({}),
  }
);

export const orderTools = [
  orderByIdTool,
  ordersByCustomerTool,
  revenueOnDateTool,
  averageOrderValueTool,
  highestValueOrderTool,
];
```

---

# Section 3 — Support Tools

Create `agent/tools/supportTools.ts`:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ─── Prisma query functions ───────────────────────────────────────────────────

async function getOpenTickets() {
  return await prisma.supportTicket.findMany({
    where: { status: { in: ["Open", "InProgress"] } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getTicketsForCustomer(customerId: number) {
  return await prisma.supportTicket.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

async function getHighPriorityTickets() {
  return await prisma.supportTicket.findMany({
    where: { priority: "High", status: { not: "Closed" } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

// ─── LangGraph tool definitions ───────────────────────────────────────────────

const openTicketsTool = tool(
  async () => JSON.stringify(await getOpenTickets()),
  {
    name: "get_open_tickets",
    description:
      "Returns all support tickets that are Open or InProgress, most recent first. Use when asked how many tickets are open or unresolved.",
    schema: z.object({}),
  }
);

const ticketsForCustomerTool = tool(
  async ({ customerId }) => JSON.stringify(await getTicketsForCustomer(customerId)),
  {
    name: "get_tickets_for_customer",
    description: "Returns all support tickets submitted by a specific customer.",
    schema: z.object({
      customerId: z.number().describe("The customer's numeric ID"),
    }),
  }
);

const highPriorityTicketsTool = tool(
  async () => JSON.stringify(await getHighPriorityTickets()),
  {
    name: "get_high_priority_tickets",
    description: "Returns all High-priority support tickets that are not yet Closed.",
    schema: z.object({}),
  }
);

export const supportTools = [
  openTicketsTool,
  ticketsForCustomerTool,
  highPriorityTicketsTool,
];
```

Commit:

```
git add agent/tools/
git commit -m "feat: add customerTools, orderTools, supportTools"
```

---

# Section 4 — Combine Tools

Create `agent/tools/index.ts`:

```typescript
import { customerTools } from "./customerTools";
import { orderTools } from "./orderTools";
import { supportTools } from "./supportTools";

export const allTools = [...customerTools, ...orderTools, ...supportTools];
```

---

# Section 5 — Planner Node

Create `agent/planner.ts`:

```typescript
import { MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "@/agent/llm";
import { allTools } from "@/agent/tools/index";

const plannerLlm = llm.bindTools(allTools);

const PLANNER_PROMPT = `You are a routing agent for a customer support system.

When the user asks a question that requires data from the database, call the appropriate tool.
Do NOT guess at numbers, totals, or counts — always use a tool to retrieve them.
Do NOT make up customer names, order IDs, product names, or amounts.

If you need a customer's ID but only have their email, first call get_customer_by_email.
If the question is conversational and requires no data lookup, respond directly without calling a tool.`;

export async function plannerNode(
  state: typeof MessagesAnnotation.State
): Promise<typeof MessagesAnnotation.Update> {
  const response = await plannerLlm.invoke([
    new SystemMessage(PLANNER_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
}
```

---

# Section 6 — Response Generator Node

Create `agent/responseGenerator.ts`:

```typescript
import { MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "@/agent/llm";

const RESPONSE_PROMPT = `You are a customer support assistant for an online tech store.

You have just received structured data from a database query tool.
Use that data to answer the customer's question clearly, helpfully, and in a friendly tone.
Use markdown formatting when it improves readability (tables, bullet points, bold text).

NEVER invent numbers, dates, order IDs, or customer names that are not in the tool result.
If the tool returned null or an empty list, tell the customer honestly that nothing was found.
Be empathetic when the answer is not what the customer hoped for.`;

export async function responseGeneratorNode(
  state: typeof MessagesAnnotation.State
): Promise<typeof MessagesAnnotation.Update> {
  const response = await llm.invoke([
    new SystemMessage(RESPONSE_PROMPT),
    ...state.messages,
  ]);
  return { messages: [response] };
}
```

Commit:

```
git add agent/tools/index.ts agent/planner.ts agent/responseGenerator.ts
git commit -m "feat: add tool index, planner node, and response generator node"
```

---

# Section 7 — Refactor the Graph

Replace `agent/graph.ts` entirely:

```typescript
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { plannerNode } from "@/agent/planner";
import { responseGeneratorNode } from "@/agent/responseGenerator";
import { allTools } from "@/agent/tools/index";

const toolNode = new ToolNode(allTools);

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("planner", plannerNode)
  .addNode("tools", toolNode)
  .addNode("responseGenerator", responseGeneratorNode)
  .addEdge(START, "planner")
  .addConditionalEdges("planner", toolsCondition, {
    tools: "tools",
    __end__: "responseGenerator",
  })
  .addEdge("tools", "responseGenerator")
  .addEdge("responseGenerator", END);

export const graph = workflow.compile();
```

Run `npm run dev`. Watch for TypeScript import path errors.

Test — ask each question twice (clear chat between runs). Answers must be identical:

```
"How many customers do we have?"
"What is the average order value?"
"How many support tickets are open?"
"Who placed the highest value order?"
"What is today's revenue?"
"Show me all orders for sarah.johnson@outlook.com"
"What is the status of order #5?"
"Show me all high-priority open tickets"
```

Commit:

```
git add agent/graph.ts
git commit -m "refactor: replace single-node graph with planner + ToolNode + responseGenerator"
```

---

# Section 8 — Verification

**Consistency test** — run each question twice, record both answers:

| Question | Run 1 | Run 2 | Match? |
|---|---|---|---|
| How many customers? | | | |
| Average order value? | | | |
| Open support tickets? | | | |
| Highest value order? | | | |

All Match column entries must be **Yes**.

**Accuracy test** — verify against DB directly:

```bash
npx prisma studio
```

Or via SQLite:

```sql
SELECT COUNT(*) FROM Customer;
SELECT AVG(totalAmount) FROM "Order";
SELECT COUNT(*) FROM SupportTicket WHERE status != 'Closed';
```

Numbers must match the chatbot's answers exactly.

---

## Summary

| Component | Workshop 1 | Workshop 2 |
|---|---|---|
| `agent/graph.ts` | 1 node, full DB as text | 3 nodes: planner → tools → response |
| Database access | LLM reads text | Prisma tools query directly |
| Number accuracy | LLM estimates | SQL aggregation, exact |
| Consistency | Changes per run | Same every time |
| `agent/tools/` | Did not exist | 3 files, 12 tools |

**Unchanged:** `app/api/chat/route.ts`, `components/`, `lib/prisma.ts`, `prisma/schema.prisma`, `agent/llm.ts`, `types/chat.ts`

---

## Pre-Workshop 3 Checklist

- [ ] 12 tools in three self-contained files
- [ ] `index.ts` exports `allTools`
- [ ] Graph has 3 nodes with correct edges
- [ ] Consistency tests pass (same answer every run)
- [ ] `npm run dev` runs clean
