# Workshop 1 — Demo Questions & Hallucination Examples

Use these during the live demo to show both what works and where the naive single-agent approach breaks down.

---

## Good Questions (These Should Work)

These questions exercise the agent against real seeded data.

```
Show me all orders for sarah.johnson@outlook.com
What is the status of order #5?
Show me all orders that are currently shipped
Do I have any refund requests?
Show all open support tickets
What products do you sell?
List all orders that are out for delivery
Show me all cancelled orders
What is refund #3 for?
Show me tickets with High priority
```

---

## Hallucination Questions

Each question below targets a specific failure mode of the naive design.
Use these to spark workshop discussion about why the architecture needs to change.

---

### 1. Invented Records

> **"Where is order #9999?"**

**What happens:** The LLM confidently invents a status and delivery date for an order that does not exist in the database, instead of simply saying "I couldn't find that order."

**Teaching point:** No guardrails — the LLM fills gaps with plausible-sounding fiction.

---

### 2. Unknown Customer Identity

> **"Show me my orders"**

**What happens:** There is no login, so the LLM has no idea who "me" is. It may randomly pick a customer, ask for your name, or answer as if it knows you — inconsistently across runs.

**Teaching point:** Without authentication context, the agent cannot scope data to the right person.

---

### 3. Inconsistent Business Decisions

Run this prompt **twice in a row** (use Clear Chat between runs):

> **"Can I cancel order #10?"** *(pick a Shipped order ID)*

**What happens:** The first run might say "Sorry, your order has already shipped and cannot be cancelled." The second run might say "I've gone ahead and cancelled that for you!" — same input, different decision.

**Teaching point:** Business rules belong in code, not in LLM prompts. The LLM is non-deterministic even at low temperature.

---

### 4. Fabricated Policies

> **"What is your return policy?"**

**What happens:** There is no return policy in the database. The LLM invents a convincing policy ("30-day returns, free shipping on returns, refund within 5–7 business days...") despite the system prompt saying never to invent data.

**Teaching point:** The LLM will always try to be helpful — even when being helpful means making things up.

---

### 5. Invented Timelines

> **"When will my refund arrive in my bank account?"**

**What happens:** The LLM fabricates a specific timeline ("typically 3–5 business days after approval") that has no basis in the data model. The database tracks refund *status* but has no payment processing timeline.

**Teaching point:** LLMs produce confident-sounding estimates even when zero relevant data exists.

---

### 6. Arithmetic Errors at Scale

> **"What is the total value of all Delivered orders in the system?"**

**What happens:** With 75 orders serialised as text in the context window, the LLM often miscalculates the sum or silently drops some orders. The answer will be different on each run.

**Teaching point:** Context-window arithmetic is unreliable. This is a job for a SQL `SUM()` query, not an LLM.

---

### 7. Cross-Customer Data Leakage

> **"Show me James's orders"** *(there are two customers with similar names)*

**What happens:** The LLM may merge data from multiple customers named James, or confidently pick one without acknowledging the ambiguity.

**Teaching point:** Without strict ID-based lookups, the LLM pattern-matches on names — which is wrong for customer data.

---

### 8. Hallucinated Escalation

> **"I want to speak to a human agent"**

**What happens:** The LLM will say something like "I've escalated your case and a human agent will contact you within 24 hours" — but nothing actually happens. There is no escalation system.

**Teaching point:** The LLM cannot distinguish between what it *can* do and what it *says* it can do.

---

## Workshop Discussion Prompts

After each hallucination, ask the audience:

- *How would you catch this bug in production?*
- *Could you write a unit test for this behaviour?*
- *What would need to change in the architecture to make this deterministic?*

These questions set up the motivation for **Workshop 2**, where business rules move into code and the LLM is only responsible for language — not decisions.
