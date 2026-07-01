// POST /api/chat
// Receives a single message + sessionId, invokes the LangGraph agent, streams the response.

import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { graph } from "@/agent/graph";
import { ChatRequest } from "@/types/chat";

export async function POST(req: NextRequest) {
  const { message, sessionId }: ChatRequest = await req.json();

  // Stream the response token-by-token
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // streamEvents lets us tap into the LLM token stream from the graph
        const eventStream = graph.streamEvents(
          { messages: [new HumanMessage(message)] },
          { version: "v2", configurable: { thread_id: sessionId } }
        );

        let hasStreamed = false;
        let finalMessages: { content: unknown }[] = [];

        for await (const event of eventStream) {
          if (
            event.event === "on_chat_model_stream" &&
            event.data?.chunk?.content
          ) {
            hasStreamed = true;
            controller.enqueue(encoder.encode(event.data.chunk.content));
          }
          if (event.event === "on_chain_end" && event.name === "LangGraph") {
            finalMessages = event.data?.output?.messages ?? [];
          }
        }

        // Guardrail blocked — no LLM stream fires; send guardrail message directly
        if (!hasStreamed && finalMessages.length > 0) {
          const last = finalMessages[finalMessages.length - 1];
          if (last?.content) {
            controller.enqueue(encoder.encode(String(last.content)));
          }
        }
      } catch (err) {
        console.error("Agent error:", err);
        controller.enqueue(
          encoder.encode("Sorry, something went wrong. Please try again.")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
