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
      const languageDetectionPrompt = `Detect the language of this message and respond with only the language code (en, es, pt, fr, de): "${message}"`;
      const detectionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: languageDetectionPrompt }],
        temperature: 0.3,
        max_tokens: 10
      });
      
      const detectedLanguage = detectionResponse.choices[0].message.content?.trim().toLowerCase();
      if (detectedLanguage && ['en', 'es', 'pt', 'fr', 'de'].includes(detectedLanguage)) {
        language = detectedLanguage;
      }
    }

    // Debug log
    console.log('API /chatgpt detected language:', language);

    // Read instructions and knowledge from public directory
    const instructions = await fs.readFile(path.join(process.cwd(), 'public', 'AI_INSTRUCTIONS.md'), 'utf-8');
    const knowledge = await fs.readFile(path.join(process.cwd(), 'public', 'AI_KNOWLEDGE.md'), 'utf-8');

    // Language-specific system message
    let systemMessage;
    if (language === 'en') {
      systemMessage = `You are a social media content assistant. Your job is to help users create engaging posts for Instagram, LinkedIn, and Facebook. Be friendly, creative, and context-aware. Always reply in English, or if the user speaks another language, reply in that language.\n\n[INSTRUCTIONS]\n${instructions}`;
    } else if (language === 'es') {
      systemMessage = `Eres un asistente de contenido para redes sociales. Tu trabajo es ayudar a los usuarios a crear publicaciones atractivas para Instagram, LinkedIn y Facebook. Sé amigable, creativo y consciente del contexto. Responde siempre en español, o si el usuario habla otro idioma, responde en ese idioma.\n\n[INSTRUCCIONES]\n${instructions}`;
    } else if (language === 'fr') {
      systemMessage = `Vous êtes un assistant de contenu pour les réseaux sociaux. Votre travail consiste à aider les utilisateurs à créer des publications engageantes pour Instagram, LinkedIn et Facebook. Soyez amical, créatif et attentif au contexte. Répondez toujours en français, ou si l'utilisateur parle une autre langue, répondez dans cette langue.\n\n[INSTRUCTIONS]\n${instructions}`;
    } else if (language === 'de') {
      systemMessage = `Sie sind ein Social-Media-Content-Assistent. Ihre Aufgabe ist es, den Nutzern zu helfen, ansprechende Beiträge für Instagram, LinkedIn und Facebook zu erstellen. Seien Sie freundlich, kreativ und kontextbewusst. Antworten Sie immer auf Deutsch, oder wenn der Nutzer eine andere Sprache spricht, antworten Sie in dieser Sprache.\n\n[ANWEISUNGEN]\n${instructions}`;
    } else {
      systemMessage = `Você é um assistente de conteúdo para redes sociais. Seu trabalho é ajudar os usuários a criar postagens envolventes para Instagram, LinkedIn e Facebook. Seja amigável, criativo e atento ao contexto. Responda sempre em português, ou se o usuário falar outro idioma, responda nesse idioma.\n\n[INSTRUÇÕES]\n${instructions}`;
    }

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
      model: "gpt-4o",
      messages: openaiMessages,
      temperature: 0.8,
      max_tokens: 1000,
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('Error in ChatGPT API:', error);
    return NextResponse.json(
      { error: 'Failed to get response from ChatGPT' },
      { status: 500 }
    );
  }
} 