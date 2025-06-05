import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;
    const message = body.message;
    let language = body.language || 'en';
    
    // Detect language from the message if not provided
    if (!body.language && message) {
      const languageDetectionPrompt = `Detect the language of this message and respond with only the language code (en, es, pt, fr, de, it, nl, ru, zh, ja, ko). Return only the language code, nothing else: "${message}"`;
      const detectionResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: languageDetectionPrompt }],
        temperature: 0.1,
        max_tokens: 5
      });
      
      const detectedLanguage = detectionResponse.choices[0].message.content?.trim().toLowerCase();
      if (detectedLanguage && ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko'].includes(detectedLanguage)) {
        language = detectedLanguage;
        console.log('Detected language:', language);
      }
    }

    // Debug log
    console.log('API /chatgpt using language:', language);

    // Read instructions and knowledge from public directory
    const instructions = await fs.readFile(path.join(process.cwd(), 'public', 'AI_INSTRUCTIONS.md'), 'utf-8');
    const knowledge = await fs.readFile(path.join(process.cwd(), 'public', 'AI_KNOWLEDGE.md'), 'utf-8');

    // System message that instructs the model to respond in the same language as the user
    const systemMessage = `You are a social media content assistant. Your job is to help users create engaging posts for Instagram, LinkedIn, and Facebook. Be friendly, creative, and context-aware. IMPORTANT: Always respond in the same language that the user writes in. If the user writes in multiple languages, respond in their primary language.\n\n[INSTRUCTIONS]\n${instructions}`;

    let openaiMessages;
    if (Array.isArray(messages)) {
      // Insert our system message at the start if not already present
      if (!messages[0] || messages[0].role !== 'system') {
        openaiMessages = [
          { role: 'system', content: systemMessage },
          ...messages
        ];
      } else {
        // Replace the system message with our own
        openaiMessages = [
          { role: 'system', content: systemMessage },
          ...messages.slice(1)
        ];
      }
    } else {
      openaiMessages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: openaiMessages,
      temperature: 0.8,
      max_tokens: 1000,
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content,
      detectedLanguage: language
    });

  } catch (error) {
    console.error('Error in ChatGPT API:', error);
    return NextResponse.json(
      { error: 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
} 