import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, contextData } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "Google Gemini API key not configured. Please add it to your environment variables." 
      }), { status: 500 });
    }

    const systemPrompt = `You are an expert Academic Tutor for OASIS Academy. 
You are currently helping a student who is learning about: "${contextData.courseTitle}".
They are currently on the lesson titled: "${contextData.lessonTitle}".

Here is the exact content/transcript of the lesson they are looking at right now:
"""
${contextData.lessonContent || "No specific lesson content provided (it might be a video)."}
"""

Your goal is to answer their questions accurately based on this context. 
- Be encouraging and academically rigorous.
- If they ask a question outside the scope of this lesson or course, politely guide them back to the topic.
- Do not give them the direct answers to quiz questions; instead, guide them to figure it out using the Socratic method.
- Format your response in clean Markdown.`;

    const result = streamText({
      model: google('gemini-3.5-flash'),
      system: systemPrompt,
      messages,
      temperature: 0.4, // Lower temperature for more factual, tutoring responses
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Tutor Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
