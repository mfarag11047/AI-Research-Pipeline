// Fix: Replaced placeholder content with a complete implementation of the Gemini service.
import { GoogleGenAI, Type } from '@google/genai';
import { ProductSchema } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const discoverySchema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      description: 'A list of potential product categories based on the user query.',
      items: { type: Type.STRING },
    },
  },
  required: ['categories'],
};

const identificationSchema = {
    type: Type.OBJECT,
    properties: {
        products: {
            type: Type.ARRAY,
            description: 'A list of specific, popular, and researchable product names within the given category.',
            items: { type: Type.STRING },
        },
    },
    required: ['products'],
};

export const discoverProductCategories = async (query: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Based on the following user query, identify a list of relevant and specific product categories that could be researched. Focus on tangible products. Query: "${query}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: discoverySchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.categories || [];
  } catch (error) {
    console.error('Error discovering product categories:', error);
    throw new Error('Failed to discover product categories. Please check the console for details.');
  }
};

export const identifyProducts = async (category: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `List 5-10 specific, popular, and researchable product models/names for the category: "${category}". Provide only the names.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: identificationSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.products || [];
    } catch (error) {
        console.error('Error identifying products:', error);
        throw new Error('Failed to identify products. Please check the console for details.');
    }
};

export const researchProduct = async (productName: string, category: string): Promise<ProductSchema> => {
    try {
        const prompt = `
        Conduct comprehensive research on the product "${productName}" in the category "${category}".
        Use Google Search to gather up-to-date information.
        Your goal is to populate a detailed JSON object about the product.
        
        The JSON object must conform to this structure:
        {
          "product_id": "A unique slug-style ID (e.g., 'sony-wh1000xm5').",
          "product_name": "The full, official product name.",
          "category": "The provided category.",
          "price_usd": "The approximate current retail price in USD as a number. If a range, use the average. If unknown, use null.",
          "summary": {
            "description": "A concise, neutral, one-paragraph overview of the product.",
            "pros": ["An array of 3-5 key advantages or strengths."],
            "cons": ["An array of 3-5 key disadvantages or weaknesses."]
          },
          "specifications": {
            "comment": "An object of key technical specs. Include specs relevant to the category (e.g., for headphones: 'connectivity', 'battery_life', 'driver_size', 'weight_grams')."
          },
          "source_info": {
            "review_urls": ["An array of 2-3 URLs for detailed reviews from reputable tech sites."],
            "retail_urls": ["An array of 2-3 URLs for major online retailers selling the product."],
            "research_date": "The current date in ISO 8601 format (YYYY-MM-DD)."
          }
        }

        Strictly return ONLY the JSON object and nothing else. Do not wrap it in markdown backticks.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let jsonText = response.text.trim();
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonRegex);
        if (match && match[1]) {
            jsonText = match[1];
        }
        
        // FIX: Remove trailing commas from arrays and objects before parsing
        // This regex finds commas that are followed by zero or more whitespace characters
        // and then a closing brace '}' or a closing bracket ']'.
        const cleanedJsonText = jsonText.replace(/,(?=\s*[}\]])/g, '');

        const result: ProductSchema = JSON.parse(cleanedJsonText);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const researchUrls = groundingChunks
                .map((chunk: any) => chunk.web?.uri)
                .filter((uri: string | undefined): uri is string => !!uri);
            
            if (!result.source_info.review_urls) {
                result.source_info.review_urls = [];
            }
            if (!result.source_info.retail_urls) {
                result.source_info.retail_urls = [];
            }

            researchUrls.forEach((url: string) => {
                if (!result.source_info.review_urls.includes(url) && !result.source_info.retail_urls.includes(url)) {
                    result.source_info.review_urls.push(url);
                }
            });
        }

        return result;
    } catch (error) {
        console.error(`Error researching product "${productName}":`, error);
        if (error instanceof SyntaxError) {
             throw new Error(`Failed to parse JSON response for "${productName}". The model may have returned an invalid format.`);
        }
        throw new Error(`Failed to research product "${productName}". Please check the console for details.`);
    }
};