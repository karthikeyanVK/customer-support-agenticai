// POST /api/chat
// Receives conversation history, invokes the LangGraph agent, streams the response.

import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { graph } from "@/agent/graph";
import { ChatRequest } from "@/types/chat";

export async function POST(req: NextRequest) {
  const { messages }: ChatRequest = await req.json();

  // Convert our simple Message[] into LangChain message objects
  const langchainMessages = messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  // Stream the response token-by-token
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // streamEvents lets us tap into the LLM token stream from the graph
        const eventStream = graph.streamEvents(
          { messages: langchainMessages },
          { version: "v2" }
        );

        for await (const event of eventStream) {
          // on_chat_model_stream fires for each token from the LLM
          if (
            event.event === "on_chat_model_stream" &&
            event.data?.chunk?.content
          ) {
            controller.enqueue(encoder.encode(event.data.chunk.content));
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
