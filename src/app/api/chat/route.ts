import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import contextDataRaw from '../../../../context.json';
const contextData = JSON.stringify(contextDataRaw);

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // ai@6: the client sends UIMessage[], convert to CoreMessage[] for streamText
    const { messages }: { messages: UIMessage[] } = await req.json();
    const coreMessages = await convertToModelMessages(messages);

    const systemPrompt = `You are the AI assistant for Tirth's portfolio website. 
Use the following JSON context to truthfully answer the user's questions about Tirth's experience, skills, and projects.
Context: ${contextData}

Rules:
1. If the user asks something completely unrelated to Tirth's professional background, decline politely and instruct them to ask questions related to Tirth's experience or projects.
2. Do not fabricate or invent information not present in the context.
3. Keep responses concise, friendly, and formatted in markdown.`;

    const primaryModel = anthropic('claude-haiku-4-5');
    const fallback1Model = google('gemini-2.0-flash');
    const fallback2Model = openai('gpt-4o-mini');

    // ai@6: use toUIMessageStreamResponse() instead of toDataStreamResponse()
    try {
      const result = await streamText({
        model: primaryModel,
        system: systemPrompt,
        messages: coreMessages,
      });
      return result.toUIMessageStreamResponse();
    } catch (e1) {
      console.warn('Primary model failed, trying fallback 1', e1);
      try {
        const result2 = await streamText({
          model: fallback1Model,
          system: systemPrompt,
          messages: coreMessages,
        });
        return result2.toUIMessageStreamResponse();
      } catch (e2) {
        console.warn('Fallback 1 failed, trying fallback 2', e2);
        const result3 = await streamText({
          model: fallback2Model,
          system: systemPrompt,
          messages: coreMessages,
        });
        return result3.toUIMessageStreamResponse();
      }
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
    });
  }
}
