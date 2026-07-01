// Workshop 1: Single-node LangGraph agent
//
// The entire reasoning process lives in ONE node (CustomerSupportAgent).
// It fetches ALL data from the database and passes it to the LLM as context.
//
// This is the "naive" approach — intentionally simple to show limitations.
// Workshop 2 will refactor this into a planner + specialised tool-calling agents.

import { StateGraph, START, END, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { llm } from "@/agent/llm";
import { SYSTEM_PROMPT } from "@/agent/prompts";

// ─── Database context builder ─────────────────────────────────────────────────
// Fetches everything and formats it as readable text the LLM can parse.
// KEY WORKSHOP POINT: This is the naive approach — dumping all data into context.

async function buildDatabaseContext(): Promise<string> {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        include: {
          product: true,
          refunds: true,
        },
      },
      supportTickets: true,
    },
  });

  const lines: string[] = [];

  lines.push("=== CUSTOMERS & ORDERS ===\n");

  for (const customer of customers) {
    lines.push(
      `Customer #${customer.id}: ${customer.firstName} ${customer.lastName} | Email: ${customer.email} | Phone: ${customer.phone}`
    );

    if (customer.orders.length === 0) {
      lines.push("  No orders.");
    } else {
      for (const order of customer.orders) {
        lines.push(
          `  Order #${order.id}: ${order.product.name} (x${order.quantity}) — $${order.totalAmount.toFixed(2)} | Status: ${order.status} | Ordered: ${order.orderedAt.toDateString()} | Expected: ${order.expectedDelivery.toDateString()}`
        );
        for (const refund of order.refunds) {
          lines.push(
            `    Refund #${refund.id}: $${refund.amount.toFixed(2)} | Status: ${refund.status} | Reason: ${refund.reason}`
          );
        }
      }
    }

    if (customer.supportTickets.length > 0) {
      for (const ticket of customer.supportTickets) {
        lines.push(
          `  Ticket #${ticket.id}: "${ticket.subject}" | Priority: ${ticket.priority} | Status: ${ticket.status} | Created: ${ticket.createdAt.toDateString()}`
        );
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

// ─── Single agent node ────────────────────────────────────────────────────────

async function customerSupportAgent(
  state: typeof MessagesAnnotation.State
): Promise<typeof MessagesAnnotation.Update> {
  // 1. Fetch all data (the naive approach)
  const dbContext = await buildDatabaseContext();

  // 2. Call the LLM with system prompt + full database context + conversation history
  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT + dbContext),
    ...state.messages,
  ]);

  return { messages: [response] };
}

// ─── Graph definition ─────────────────────────────────────────────────────────
// START → CustomerSupportAgent → END
// One node, no branching, no tools, no planners.

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("customerSupportAgent", customerSupportAgent)
  .addEdge(START, "customerSupportAgent")
  .addEdge("customerSupportAgent", END);

export const graph = workflow.compile({ checkpointer: new MemorySaver() });
