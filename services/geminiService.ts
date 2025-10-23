import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: 'AIzaSyD-VdvEJWD6lOzsWtbRKH60rLbhxQ_T9Mo' as string });

interface Base64Image {
    base64: string;
    mimeType: string;
}

export const recognizeCharacter = async (image: Base64Image): Promise<boolean> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.base64,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: "Is this image of a person, an animal, or a character (real or animated)? Answer with only 'yes' or 'no'.",
                    },
                ],
            },
        });

        const text = response.text.trim().toLowerCase();
        return text.includes('yes');
    } catch (error) {
        console.error("Error in recognizeCharacter:", error);
        return false;
    }
};

export const generateGhibliImage = async (image: Base64Image): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: image.base64,
                            mimeType: image.mimeType,
                        },
                    },
                    {
                        text: "Transform the character in this image into a 2D Ghibli-style animation. It's very important to keep the character's original facial features, clothes, and skin color exactly the same. The only change should be the hairstyle: give the character blonde hair in the style of Donald Trump. The background should be a simple, soft-colored Ghibli-style background.",
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;

    } catch (error) {
        console.error("Error in generateGhibliImage:", error);
        return null;
    }
};
