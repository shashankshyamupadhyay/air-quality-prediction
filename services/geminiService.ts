import { GoogleGenAI } from "@google/genai";

export const getHealthAdvice = async (
  avgAqi: number,
  pollutant: string,
  peakValue: number
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  // Check if key is missing or default before initializing to prevent crash
  if (!apiKey || apiKey === '' || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    console.warn("Gemini API Key is missing. Skipping AI advice.");
    return "AI Health Advisor is disabled. Please set a valid API_KEY in your .env file to receive personalized health insights.";
  }

  try {
    // Initialize client only when needed and when key is present
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
      The predicted air quality for the next 24 hours shows an average ${pollutant} level of ${avgAqi.toFixed(1)} µg/m³ 
      with a peak of ${peakValue.toFixed(1)} µg/m³.
      
      Based on this data:
      1. Rate the air quality (Good, Moderate, Unhealthy, etc.).
      2. Provide 3 specific, actionable health recommendations for the user.
      3. Keep the tone professional but caring.
      4. Return the response in plain text with bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate health advice at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI service is currently unavailable. Please check your API key.";
  }
};