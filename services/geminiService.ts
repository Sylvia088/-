
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, StockMetrics } from "../types.ts";

export const analyzeStock = async (ticker: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `分析代號為 "${ticker}" 的股票。
  1. 找出前一個交易日的價格數據：開盤價 (Open)、最高價 (High)、最低價 (Low)、收盤價 (Close)。
  2. 找出前一日的買入、賣出最低及最高成交價，以及估算的買入/賣出平均成交價。
  3. 計算技術指標：目前的 RSI (14天) 值，以及 20日移動平均線 (MA20)。
  4. 獲取市場數據：目前市值 (Market Cap) 和 前一交易日的漲跌幅百分比 (Price Change %)。
  5. 提供過去 6 個月的成交量趨勢數據。
  
  請以指定的 JSON 格式回傳數據。內容請使用繁體中文。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ticker: { type: Type.STRING },
          name: { type: Type.STRING },
          currency: { type: Type.STRING },
          marketCap: { type: Type.STRING },
          priceChangePercent: { type: Type.NUMBER },
          rsi: { type: Type.NUMBER },
          ma20: { type: Type.NUMBER },
          previousDay: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              open: { type: Type.NUMBER },
              high: { type: Type.NUMBER },
              low: { type: Type.NUMBER },
              close: { type: Type.NUMBER },
              average: { type: Type.NUMBER },
              bidHigh: { type: Type.NUMBER },
              askLow: { type: Type.NUMBER },
              buyAverage: { type: Type.NUMBER },
              sellAverage: { type: Type.NUMBER },
            },
            required: ["date", "open", "high", "low", "close", "average", "buyAverage", "sellAverage"],
          },
          volumeHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                volume: { type: Type.NUMBER },
              },
              required: ["label", "volume"],
            },
          },
        },
        required: ["ticker", "name", "currency", "marketCap", "priceChangePercent", "rsi", "ma20", "previousDay", "volumeHistory"],
      },
    },
  });

  const rawText = response.text;
  const data: StockMetrics = JSON.parse(rawText);
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources: AnalysisResponse['sources'] = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web!.title || '參考來源',
      uri: chunk.web!.uri || '',
    }));

  return { data, sources };
};
