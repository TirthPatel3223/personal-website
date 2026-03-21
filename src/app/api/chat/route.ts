// @ts-nocheck
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import contextDataRaw from '../../../../context.json';
const contextData = JSON.stringify(contextDataRaw);

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 2. Setup System Prompt Guardrails
    const systemPrompt = `You are the AI assistant for Tirth's portfolio website. 
Use the following JSON context to truthfully answer the user's questions about Tirth's experience, skills, and projects.
Context: ${contextData}

Rules:
1. If the user asks something completely unrelated to Tirth's professional background, decline politely and instruct them to ask questions related to Tirth's experience or projects.
2. Do not fabricate or invent information not present in the context.
3. Keep responses concise, friendly, and formatted in markdown.`;

    // 3. Configure Multi-LLM
    const primaryModel = openai('gpt-4o-mini');
    const fallback1Model = anthropic('claude-3-haiku-20240307');
    const fallback2Model = google('gemini-1.5-flash');

    // 4. Generate the stream with manual robust fallback
    try {
      const result = await streamText({
        model: primaryModel,
        system: systemPrompt,
        messages,
      });
      return result.toDataStreamResponse();
    } catch (e1) {
      console.warn("Primary model failed, trying fallback 1");
      try {
        const result2 = await streamText({
          model: fallback1Model,
          system: systemPrompt,
          messages,
        });
        return result2.toDataStreamResponse();
      } catch (e2) {
        console.warn("Fallback 1 failed, trying fallback 2");
        const result3 = await streamText({
          model: fallback2Model,
          system: systemPrompt,
          messages,
        });
        return result3.toDataStreamResponse();
      }
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
    });
  }
}
