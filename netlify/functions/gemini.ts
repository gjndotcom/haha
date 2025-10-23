import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, image } = JSON.parse(event.body);

    if (!action || !image || !image.base64 || !image.mimeType) {
        return { statusCode: 400, body: 'Missing action or image data' };
    }

    if (action === 'recognize') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: "Is this image of a person, an animal, or a character (real or animated)? Answer with only 'yes' or 'no'." },
                ],
            },
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ result: response.text.trim().toLowerCase() }),
        };
    }

    if (action === 'generate') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: image.base64, mimeType: image.mimeType } },
                    { text: "Transform the character in this image into a 2D Ghibli-style animation. It's very important to keep the character's original facial features, clothes, and skin color exactly the same. The only change should be the hairstyle: give the character blonde hair in the style of Donald Trump. The background should be a simple, soft-colored Ghibli-style background." },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                return {
                    statusCode: 200,
                    body: JSON.stringify({ imageUrl }),
                };
            }
        }
         return { statusCode: 500, body: 'Image generation failed, no image data found.' };
    }
    
    return { statusCode: 400, body: 'Invalid action.' };

  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};