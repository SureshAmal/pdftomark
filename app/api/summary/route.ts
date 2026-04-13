import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentText, prompt, apiKey } = body;

    if (!documentText) {
      return Response.json(
        { error: "Missing document text" },
        { status: 400 }
      );
    }

    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      return Response.json(
        { error: "No Gemini API key provided" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });
    const userPrompt = prompt 
      ? `Summarize the following document. Enhance/focus based on this prompt: "${prompt}".\n\nDocument:\n${documentText}`
      : `Summarize the following document comprehensively in Markdown format.\n\nDocument:\n${documentText}`;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-lite-preview",
      config: {
        maxOutputTokens: 8192,
        temperature: 0.3,
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Summary failed: ${message}` },
      { status: 500 }
    );
  }
}