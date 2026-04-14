import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const aiService = {
  async suggestTasks(projectDescription: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dựa trên mô tả dự án sau, hãy đề xuất 5 công việc cụ thể cần thực hiện. Trả về kết quả dưới dạng JSON array các object có 'title' và 'description'.
      Mô tả: ${projectDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  },

  async getAIAdvice(query: string, context: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là trợ lý ảo quản lý công việc Nexus AI. Hãy trả lời câu hỏi của người dùng dựa trên ngữ cảnh công việc hiện tại.
      Ngữ cảnh: ${context}
      Câu hỏi: ${query}`,
      config: {
        systemInstruction: "Bạn là một chuyên gia quản lý dự án chuyên nghiệp, lịch sự và luôn đưa ra các giải pháp thực tế để tăng năng suất."
      }
    });
    return response.text;
  }
};
