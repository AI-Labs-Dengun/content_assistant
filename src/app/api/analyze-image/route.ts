import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const language = formData.get('language') as string || 'en';
    const message = formData.get('message') as string;

    if (!image) {
      console.error('No image uploaded');
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Detect language from message if provided
    let detectedLanguage = language;
    if (message && !language) {
      const languageDetectionPrompt = `Detect the language of this message and respond with only the language code (en, es, pt, fr, de, it, nl, ru, zh, ja, ko). Return only the language code, nothing else: "${message}"`;
      const detectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: languageDetectionPrompt }],
          temperature: 0.1,
          max_tokens: 5
        }),
      });

      if (detectionResponse.ok) {
        const detectionData = await detectionResponse.json();
        const detected = detectionData.choices[0].message.content?.trim().toLowerCase();
        if (detected && ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko'].includes(detected)) {
          detectedLanguage = detected;
          console.log('Detected language for image analysis:', detectedLanguage);
        }
      }
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Language-specific prompt
    let prompt;
    switch (detectedLanguage) {
      case 'es':
        prompt = 'Describe esta imagen en detalle para inspirar contenido en redes sociales. IMPORTANTE: Responde SIEMPRE en español, sin importar el idioma en que te escriban.';
        break;
      case 'pt':
        prompt = 'Descreva esta imagem em detalhes para inspirar conteúdo em redes sociais. IMPORTANTE: Responda SEMPRE em português, independentemente do idioma em que o usuário escreva.';
        break;
      case 'fr':
        prompt = 'Décrivez cette image en détail pour inspirer du contenu sur les réseaux sociaux. IMPORTANT: Répondez TOUJOURS en français, quelle que soit la langue dans laquelle on vous écrit.';
        break;
      case 'de':
        prompt = 'Beschreiben Sie dieses Bild ausführlich, um Inhalte für soziale Medien zu inspirieren. WICHTIG: Antworten Sie IMMER auf Deutsch, unabhängig von der Sprache, in der Sie angeschrieben werden.';
        break;
      case 'it':
        prompt = 'Descrivi questa immagine in dettaglio per ispirare contenuti sui social media. IMPORTANTE: Rispondi SEMPRE in italiano, indipendentemente dalla lingua in cui ti scrivono.';
        break;
      case 'nl':
        prompt = 'Beschrijf deze afbeelding in detail om sociale media-inhoud te inspireren. BELANGRIJK: Antwoord ALTIJD in het Nederlands, ongeacht de taal waarin men je schrijft.';
        break;
      case 'ru':
        prompt = 'Подробно опишите это изображение, чтобы вдохновить контент для социальных сетей. ВАЖНО: Всегда отвечайте на русском языке, независимо от языка, на котором вам пишут.';
        break;
      case 'zh':
        prompt = '详细描述这张图片，以激发社交媒体内容灵感。重要：始终用中文回复，无论用户使用什么语言。';
        break;
      case 'ja':
        prompt = 'ソーシャルメディアのコンテンツのインスピレーションを得るために、この画像を詳しく説明してください。重要：常に日本語で返信してください。ユーザーがどの言語で書き込んでも日本語で返信してください。';
        break;
      case 'ko':
        prompt = '소셜 미디어 콘텐츠에 영감을 주기 위해 이 이미지를 자세히 설명해주세요. 중요: 항상 한국어로 응답하세요. 사용자가 어떤 언어로 작성하든 한국어로 응답하세요.';
        break;
      default:
        prompt = 'Describe this image in detail for social media content inspiration. IMPORTANT: Always reply in English, regardless of the language the user writes in.';
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${image.type};base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errorText);
      return NextResponse.json({ error: 'OpenAI Vision API error', details: errorText, status: openaiRes.status }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    if (!openaiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response:', openaiData);
      return NextResponse.json({ error: 'Invalid response from OpenAI API' }, { status: 500 });
    }

    const description = openaiData.choices[0].message.content;
    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('Error in /api/analyze-image:', error);
    return NextResponse.json({ error: 'Error processing image', details: error?.message || 'Unknown error' }, { status: 500 });
  }
} 