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

    if (!image) {
      console.error('No image uploaded');
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Language-specific prompt
    let prompt;
    switch (language) {
      case 'es':
        prompt = 'Describe esta imagen en detalle para inspirar contenido en redes sociales. Responde en español.';
        break;
      case 'pt':
        prompt = 'Descreva esta imagem em detalhes para inspirar conteúdo em redes sociais. Responda em português.';
        break;
      case 'fr':
        prompt = 'Décrivez cette image en détail pour inspirer du contenu sur les réseaux sociaux. Répondez en français.';
        break;
      case 'de':
        prompt = 'Beschreiben Sie dieses Bild ausführlich, um Inhalte für soziale Medien zu inspirieren. Antworten Sie auf Deutsch.';
        break;
      default:
        prompt = 'Describe this image in detail for social media content inspiration. Reply in English.';
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