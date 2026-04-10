import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, pageNumber } = body;

    if (!imageBase64 || !pageNumber) {
      return Response.json(
        { error: "Missing imageBase64 or pageNumber" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    // Strip the data URL prefix to get raw base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      config: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data,
              },
            },
            {
              text: `Convert this PDF page image to well-formatted Markdown. 

CRITICAL RULES:
- ABSOLUTELY DO NOT CUT, SUMMARIZE, OR TRUNCATE THE OUTPUT. You MUST output the FULL, unedited content of the entire page exactly as it appears. 
- Every single word, sentence, and paragraph must be fully transcribed regardless of length.
- Preserve proper Markdown headings (# ## ### etc.) for titles and section headers  
- Use proper Markdown for lists (- or 1.), bold (**text**), italic (*text*)
- Reproduce tables using Markdown table syntax
- Preserve code blocks with proper fencing (\`\`\`)
- Do NOT describe the image or add commentary
- Do NOT wrap the output in a code block
- Output ONLY the converted Markdown content`,
            },
          ],
        },
      ],
    });

    const markdown = response.text || "";

    return Response.json({ pageNumber, markdown });
  } catch (error) {
    console.error("Gemini API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return Response.json(
      { error: `AI conversion failed: ${message}` },
      { status: 500 }
    );
  }
}
