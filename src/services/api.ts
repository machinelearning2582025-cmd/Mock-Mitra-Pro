import { GoogleGenAI, Type } from "@google/genai";
import { Question, Topic, UserPerformance, DrillSetup } from "../types";
import { getExamConfig } from "../data/examsConfig";

// The platform injects GEMINI_API_KEY into process.env for the frontend
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features may not work until configured in Settings.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

const MODEL_FLASH = "gemini-3.5-flash";
const MODEL_LITE = "gemini-3.1-flash-lite";

export async function analyzePerformanceAPI(
  score: number,
  total: number,
  topicPerformance: Partial<Record<Topic, { correct: number; total: number }>>,
  examType: string = "SSC CGL",
  language: string = "English"
) {
  if (!apiKey) return null;
  
    const generate = async (modelName: string) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: `
          User score: ${score}/${total}.
          Performance by topic: ${JSON.stringify(topicPerformance)}.
          Analyze this student's performance for the exam: ${examType}.
          LANGUAGE PREFERENCE: ${language}.
          Provide a supportive, motivating analysis in the language: ${language}.
          Identify clearly what to focus on next and a small 'Study Plan' brief based on the exam's typical patterns.
        `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            weakTopicAnalysis: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            predictedBrief: { type: Type.STRING }
          },
          required: ["summary", "weakTopicAnalysis", "suggestions", "predictedBrief"]
        }
      }
    });
  };

  try {
    let response;
    try {
      response = await generate(MODEL_FLASH);
    } catch (e) {
      console.warn(`Primary model ${MODEL_FLASH} failed, using fallback ${MODEL_LITE}`);
      response = await generate(MODEL_LITE);
    }
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Performance Analysis Error:", error);
    return null;
  }
}

export async function generateQuestionsAPI(
  topics: Topic[],
  difficulty: 'Easy' | 'Medium' | 'Hard',
  count: number = 10,
  examType: string = "SSC CGL",
  avoidIds: string[] = [],
  userPerformance?: UserPerformance,
  customSetup?: DrillSetup,
  customExamDetails?: string,
  language: string = "English"
): Promise<Question[]> {
  if (!apiKey) return [];

  const examConfig = getExamConfig(examType);
  let patternInstructions = examConfig?.patternInstructions || "Standard competitive exam pattern.";
  
  // If user provided custom details, use them to override or augment pattern
  if (customExamDetails && customExamDetails.trim() !== "") {
    patternInstructions = `THE USER HAS PROVIDED SPECIFIC EXAM/SUBJECT REQUIREMENTS: ${customExamDetails}. Ignore generic competitive exam personas and focus strictly on these requirements.`;
  }
  
  const weakTopicsContext = userPerformance?.weakTopics.length 
    ? `The user needs improvement in: ${userPerformance.weakTopics.join(", ")}. Focus on clarifying concepts in these areas.`
    : "";
  const strongTopicsContext = userPerformance?.strongTopics.length 
    ? `The user is strong in: ${userPerformance.strongTopics.join(", ")}. Ensure questions are challenging enough.`
    : "";

  const customText = customSetup?.customPrompt ? `USER SPECIFIC DRILL REQUEST: ${customSetup.customPrompt}` : "";
  const videoContext = customSetup?.videoInfo 
    ? `VIDEO CONTEXT:
       Title: ${customSetup.videoInfo.title}
       Description: ${customSetup.videoInfo.description}
       Please generate questions specifically based on the information provided in this video title and description.` 
    : "";

  // Gemini 3.5 Flash is our default main question builder
  const activeModel = MODEL_FLASH;

  const parts: any[] = [
    {
      text: `
        You are an expert exam paper setter for ${examType}.
        Context/Instructions for this exam: ${patternInstructions}
        LANGUAGE PREFERENCE: ${language}.
        
        ${weakTopicsContext}
        ${strongTopicsContext}
        ${customText}
        ${videoContext}

        Generate ${count} high-quality, real-world exam questions or problems for topics: ${topics.join(", ")}.
        Difficulty: ${difficulty}.
        
        CRITICAL: DO NOT repeat any questions with the following IDs: ${avoidIds.slice(0, 20).join(", ")}.
        
        Ensure variety and avoid repeating common textbook examples.
        Questions and explanations must be written in ${language}. 
        If language is English, use simple English. If Hinglish, use a mix of Hindi and English.
        Return the response as a JSON array.
      `
    }
  ];

  // Add files to context if present
  if (customSetup?.files && customSetup.files.length > 0) {
    customSetup.files.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.base64
        }
      });
    });
    parts.push({
      text: `
        CRITICAL DIRECTIVE FOR THE ATTACHED STUDY MATERIAL FILES AND IMAGES:
        The customer has uploaded the above images/documents to custom-tailor this mock exam.
        You MUST analyze these provided files thoroughly.
        The ${count} questions you generate MUST be highly accurate formulations DIRECTLY and strictly based on the content, tables, equations, paragraphs, or diagrams present in these documents/images.
        In the 'explanation' field of each generated question, include a specific note explaining which part/fact of the uploaded files supports this answer, so the user knows exactly that it comes from their provided materials.
      `
    });
  }

  const generate = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["id", "subject", "topic", "question", "options", "correctAnswer", "explanation", "difficulty"]
          }
        }
      }
    });
  };

  try {
    let response;
    try {
      response = await generate(MODEL_FLASH);
    } catch (e) {
      console.warn(`Primary model ${MODEL_FLASH} failed, using fallback ${MODEL_LITE}`);
      response = await generate(MODEL_LITE);
    }
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
}



