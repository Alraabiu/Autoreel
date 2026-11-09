import { env } from '../../config/env.js';

const styles = {
  stickman: 'clean expressive stick-figure illustration, bold simple shapes',
  cinematic: 'cinematic dramatic lighting, detailed composition, film still',
  stock_captions: 'realistic editorial stock-photo style, clear focal subject',
  animated_images: 'polished colorful 2D animation frame, expressive characters',
};

export async function generateImages({ script, style, count = 4 }) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

  const words = script.split(/\s+/);
  const size = Math.ceil(words.length / count);
  const beats = Array.from({ length: count }, (_, i) =>
    words.slice(i * size, (i + 1) * size).join(' ')
  );

  const out = [];
  for (let i = 0; i < beats.length; i++) {
    const prompt = `Create a vertical 3:4 image for a faceless YouTube short. Style: ${
      styles[style] || styles.animated_images
    }. Scene ${i + 1} of ${count}; depict this narration beat visually: ${
      beats[i]
    }. Consistent visual world, no text, no watermark.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${encodeURIComponent(
      env.GEMINI_API_KEY
    )}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '3:4' },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini image generation failed');

    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) throw new Error('Gemini returned no image data');

    out.push({
      buffer: Buffer.from(part.inlineData.data, 'base64'),
      mimeType: part.inlineData.mimeType || 'image/png',
    });
  }
  return out;
}

export const estimateImageCost = (n = 4) => n * 0.039;