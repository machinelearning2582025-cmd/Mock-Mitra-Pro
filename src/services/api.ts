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
  language: string = "English",
  milestones?: { title: string; completed: boolean }[]
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

  const completedMilestones = milestones
    ?.filter(m => m.completed)
    .map(m => m.title)
    .join(", ") || "";
  const remainingMilestones = milestones
    ?.filter(m => !m.completed)
    .map(m => m.title)
    .join(", ") || "";

  const milestonesContext = completedMilestones || remainingMilestones
    ? `STUDY ROADMAP PROGRESSIVE DETAILS (IMPORTANT CUSTOM TARGETS):
       - Recently mastered / studied chapter ticks (generate 1-2 recall/application questions here to hone active recall): ${completedMilestones || "None yet"}
       - Active/remaining focus milestones to test and build deep knowledge: ${remainingMilestones || "None yet"}`
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
        ${milestonesContext}
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

export async function generateLearningStrategyAPI(
  profile: any,
  language: string = "Hinglish"
) {
  if (!apiKey) return null;

  const weakTopics = profile.performance.weakTopics.join(", ");
  const strongTopics = profile.performance.strongTopics.join(", ");
  const notes = profile.customStudyNotes || "None provided yet.";
  const exam = profile.exam;

  const prompt = `
    Analyze the progress of student ${profile.name} who is preparing for ${exam}.
    Weak topics: ${weakTopics || "None tracked yet"}.
    Strong topics: ${strongTopics || "None tracked yet"}.
    Personal study notes & focus areas saved by user: "${notes}".
    Language preference: ${language}.

    Using this, formulate a customized personalized learning strategy and 3-5 specific study milestones/goals (checkpoints).
    Provide supportive, precise study directions in ${language}.
  `;

  const generate = async (modelName: string) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING }
                },
                required: ["title"]
              }
            }
          },
          required: ["summary", "suggestedAction", "milestones"]
        }
      }
    });
  };

  try {
    let response;
    try {
      response = await generate(MODEL_FLASH);
    } catch (e) {
      console.warn(`Primary model failed, falling back`);
      response = await generate(MODEL_LITE);
    }
    const data = JSON.parse(response.text || "{}");
    return {
      summary: data.summary,
      suggestedAction: data.suggestedAction,
      milestones: (data.milestones || []).map((m: any) => ({
        title: m.title,
        completed: false
      }))
    };
  } catch (err) {
    console.error("Error generating strategy:", err);
    return null;
  }
}

export async function updatePersonalisedProfileBackgroundAPI(
  profile: any,
  language: string = "Hinglish"
) {
  if (!apiKey) return null;

  const weakTopics = profile.performance.weakTopics.join(", ");
  const strongTopics = profile.performance.strongTopics.join(", ");
  const notes = profile.customStudyNotes || "None provided yet.";
  const exam = profile.exam;
  const milestones = profile.aiMentorPlan?.milestones || [];

  const prompt = `
    Analyze student ${profile.name} who is preparing for ${exam}.
    Weak topics: ${weakTopics || "None tracked yet"}.
    Strong topics: ${strongTopics || "None tracked yet"}.
    Personal study notes & focus areas: "${notes}".
    Current checklist/milestones: ${JSON.stringify(milestones)}.
    Language preference: ${language}.

    Task: Run lightweight fast background distillation of the learning roadmap and status.
    1. Keep any milestones marked as "completed: true" completely INTACT in your output list. Do not delete them.
    2. Review the remaining unchecked milestones. Revise / update these remaining milestones to generate a total list of 4-6 specific visual study checklist tasks (atomic, highly concrete chapters/concepts/formulas) relevant to their current strengths and weak focus areas.
    3. Formulate a 2-sentence extremely encouraging AI mentor plan recommendation.
    Provide output ONLY as JSON matching the requested schema. Ensure titles and recommendation are in ${profile.language || language}. If Hinglish, use a mixed Hindi/English style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_LITE, // Run lightning-fast on flash lite in background
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN }
                },
                required: ["title", "completed"]
              }
            }
          },
          required: ["summary", "suggestedAction", "milestones"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      summary: data.summary,
      suggestedAction: data.suggestedAction,
      milestones: data.milestones || []
    };
  } catch (err) {
    console.error("Background personalization analysis failed:", err);
    return null;
  }
}

export async function chatWithMitraAPI(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  profile: any,
  language: string = "Hinglish"
) {
  if (!apiKey) return "Aapka API Key configure nahi hai settings me. Kripya use settings profile me provide karein.";

  const systemInstruction = `
    You are 'Mitra AI', a smart friendly exam coach and study mentor for ${profile.name} who is preparing for ${profile.exam}.
    Keep their personal study notes and progress in mind:
    - User's Custom Study Notes: "${profile.customStudyNotes || "None set yet"}"
    - User's Weak Topics: ${profile.performance.weakTopics.join(", ") || "None tracked yet"}
    - User's Strong Topics: ${profile.performance.strongTopics.join(", ") || "None tracked yet"}
    
    Current Goal/Focus: ${profile.aiMentorPlan?.suggestedAction || "General Practice"}
    
    Aapko student ko motivate karna hai, unke questions and doubts clarify karne hain, and direct action items provide karne hain.
    Always reply in a friendly, supportive tone in ${profile.language || language}. If Hinglish, use a mixed Hindi/English style.
    
    If the user asks you to save a specific target, concept, or update their custom notes/goals, remind them that they can type/update it in the 'My Saved Study Context' desk or mention: "Done! Aap apne study notes space me save kar sakte hain so I always remember."
    Keep responses clear, concise, and beautifully formatted using Markdown. Ensure you use bullet points and bold headers.
  `;

  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents,
      config: {
        systemInstruction
      }
    });
    return response.text || "Sorry, I couldn't formulate a response. Support system is offline.";
  } catch (err) {
    console.error("Mitra AI Chat Error:", err);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: MODEL_LITE,
        contents,
        config: {
          systemInstruction
        }
      });
      return fallbackResponse.text || "Support system busy.";
    } catch (innerErr) {
      return "Mitra AI abhi study breaks par hai (Network Error). Kripya thodi der baad try karein!";
    }
  }
}



