import { GoogleGenAI, Type } from "@google/genai";
import { Question, Topic, UserPerformance, DrillSetup } from "../types";
import { getExamConfig } from "../data/examsConfig";
import { QUESTIONS } from "../data/questions";

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
  if (!apiKey) {
    return generateStaticPerformanceFallback(score, total, topicPerformance, examType, language);
  }
  
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
    const parsed = JSON.parse(response.text || "{}");
    if (parsed && parsed.summary && parsed.weakTopicAnalysis) {
      return parsed;
    }
    throw new Error("Invalid performance analysis JSON response");
  } catch (error) {
    console.error("Gemini Performance Analysis Error, falling back gracefully:", error);
    return generateStaticPerformanceFallback(score, total, topicPerformance, examType, language);
  }
}

function generateStaticPerformanceFallback(
  score: number,
  total: number,
  topicPerformance: Partial<Record<Topic, { correct: number; total: number }>>,
  examType: string,
  language: string
) {
  const pct = Math.round((score / total) * 100);
  const mockWeakTopics = Object.keys(topicPerformance).filter(t => {
    const perf = topicPerformance[t as Topic];
    return perf && perf.correct / perf.total < 0.7;
  });
  const weakList = mockWeakTopics.length > 0 ? mockWeakTopics : ["General Revision"];
  
  const isHinglish = language.toLowerCase() === 'hinglish';
  
  return {
    summary: pct >= 80 
      ? (isHinglish ? "Excellent output! Aapka standard and command clear hai. Continuously practice karte rahein." : "Excellent performance! Your command over the concepts is clear. Keep practice continuous.")
      : pct >= 50 
      ? (isHinglish ? "Aacha performance hai par strong hold banane ke liye concept practice and continuous mocks ki jarurat hai." : "Good effort! Regular practice will strengthen weak topics for consistent high scores.")
      : (isHinglish ? "Foundational level pe work karne ki jarurat hai. No worries, continuous practice se improve hoga!" : "Foundational revision recommended. Keep practicing and clearing doubts to boost your accuracy!"),
    weakTopicAnalysis: isHinglish ? `Aapko in fields/topics pe special focus dena chahiye: **${weakList.join(', ')}**. 
Review the incorrect answers carefully to build conceptual strength. 
    
* **Recommended approach:**
1. Revise weak formulas/theorems.
2. Attend targeted practice drills in weak chapters.
3. Stay consistent and track daily progress.` : `Focus areas for improvement: **${weakList.join(', ')}**. 
Reviewing incorrect responses will build substantial conceptual depth.
    
* **Recommended study steps:**
1. Focus on weak equations and concepts first.
2. Take dedicated micro-practice sessions for these topics.
3. Align daily goals with systematic tracker checklists.`,
    suggestions: isHinglish ? [
      "Go through incorrect questions closely in this report.",
      "Practice dedicated 5-minute medium difficulty drills daily.",
      "Make concrete summary revision card sheets for formula recall."
    ] : [
      "Review the incorrect answers carefully from the review tab.",
      "Solve rapid daily quizzes on your weak subjects.",
      "Maintain active study sheets for quick formula recall."
    ],
    predictedBrief: isHinglish 
      ? `Focus on strengthening ${weakList[0]} with targeted revisions.` 
      : `Strengthen ${weakList[0]} systematically starting today.`
  };
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
    const parsed = JSON.parse(response.text || "[]");
    if (parsed && parsed.length > 0) {
      return parsed;
    }
    throw new Error("Empty questions list returned from Gemini API");
  } catch (error) {
    console.warn("Gemini Generation Error, using static questions fallback:", error);
    
    // Filter local static questions by matching user topics
    const matching = QUESTIONS.filter(q => 
      topics.some(t => q.topic.toLowerCase().includes(t.toLowerCase()) || q.subject.toLowerCase().includes(t.toLowerCase()))
    );
    
    let result = [...matching];
    
    // If not enough questions match, fill with other random questions from QUESTIONS list
    if (result.length < count) {
      const remaining = QUESTIONS.filter(q => !result.some(rq => rq.id === q.id));
      const needed = count - result.length;
      result = [...result, ...remaining.slice(0, needed)];
    }
    
    // Ensure unique IDs to prevent duplicate key rendering issues
    return result.slice(0, count).map((q, idx) => ({
      ...q,
      id: `${q.id}-fallback-${idx}-${Date.now()}`
    }));
  }
}

export async function generateLearningStrategyAPI(
  profile: any,
  language: string = "Hinglish"
) {
  if (!apiKey) {
    return generateStaticLearningStrategyFallback(profile, language);
  }

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
    if (data && data.summary && data.milestones) {
      return {
        summary: data.summary,
        suggestedAction: data.suggestedAction,
        milestones: (data.milestones || []).map((m: any) => ({
          title: m.title,
          completed: false
        }))
      };
    }
    throw new Error("Invalid response format from model");
  } catch (err) {
    console.warn("Error generating learning strategy, using dynamic local fallback:", err);
    return generateStaticLearningStrategyFallback(profile, language);
  }
}

function generateStaticLearningStrategyFallback(profile: any, language: string) {
  const isHinglish = language.toLowerCase() === 'hinglish';
  const examConfig = getExamConfig(profile.exam);
  const topics = profile.performance?.weakTopics?.length 
    ? profile.performance.weakTopics 
    : (examConfig?.defaultTopics || ["General Concept Core"]);
  
  const fallbackMilestones = topics.slice(0, 4).map((topic: string) => ({
    title: isHinglish 
      ? `Solve ${topic} formulas & real-world conceptual questions.`
      : `Master ${topic}: Core formulas, theory, and high-frequency MCQs.`,
    completed: false
  }));
  
  if (fallbackMilestones.length < 3) {
    fallbackMilestones.push({
      title: isHinglish
        ? "Solve high-speed 5-minute custom revision tests."
        : "Attempt high-speed 5-minute revision drills.",
      completed: false
    });
    fallbackMilestones.push({
      title: isHinglish
        ? "Analyze incorrect reviews with Mitra AI Coach."
        : "Review tricky doubts using the 'Ask with AI' companion.",
      completed: false
    });
  }

  return {
    summary: isHinglish 
      ? `Aapka customized study milestones system ${profile.exam} syllabus par structured hai. Continuous learning se marks improve honge!`
      : `Your study plan is tailored for the ${profile.exam} pattern. Dedicate focused revisions to see systematic progress!`,
    suggestedAction: isHinglish 
      ? `Focus on mastering ${topics[0] || 'core areas'} today with a focus mock drill.`
      : `Complete a rapid practice test on ${topics[0] || 'core areas'} to build momentum.`,
    milestones: fallbackMilestones
  };
}

export async function updatePersonalisedProfileBackgroundAPI(
  profile: any,
  language: string = "Hinglish"
) {
  if (!apiKey) {
    return generateStaticBackgroundUpdateFallback(profile, language);
  }

  const weakTopics = profile.performance?.weakTopics?.join(", ") || "";
  const strongTopics = profile.performance?.strongTopics?.join(", ") || "";
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
    if (data && data.summary && data.milestones) {
      return {
        summary: data.summary,
        suggestedAction: data.suggestedAction,
        milestones: data.milestones || []
      };
    }
    throw new Error("Invalid response format from background model");
  } catch (err) {
    console.warn("Background personalization analysis failed, using dynamic local fallback:", err);
    return generateStaticBackgroundUpdateFallback(profile, language);
  }
}

function generateStaticBackgroundUpdateFallback(profile: any, language: string) {
  const isHinglish = language.toLowerCase() === 'hinglish';
  const examConfig = getExamConfig(profile.exam);
  const weakTopics = profile.performance?.weakTopics || [];
  const topics = weakTopics.length ? weakTopics : (examConfig?.defaultTopics || ["Core Subjects"]);
  const milestones = profile.aiMentorPlan?.milestones || [];
  
  // Keep completed milestones intact
  const completedMilestones = milestones.filter((m: any) => m.completed);
  
  // Generate some high-quality fresh milestones
  const newTitles = topics.slice(0, 3).map((topic: string) => 
    isHinglish 
      ? `Review ${topic} formulas and critical cases`
      : `Analyze ${topic} foundational theorems and high-yield problems`
  );
  
  newTitles.push(
    isHinglish 
      ? "Attempt a fresh balanced custom mock drill" 
      : "Take a focused 5-minute customized mock drill"
  );
  newTitles.push(
    isHinglish 
      ? "Clarify 2 tricky questions with Mitra AI button" 
      : "Use the 'Ask with AI' doubt solver on incorrect answers"
  );

  const activeNew = newTitles
    .filter(t => !completedMilestones.some((m: any) => m.title.toLowerCase() === t.toLowerCase()))
    .slice(0, Math.max(2, 5 - completedMilestones.length));

  const finalMilestones = [
    ...completedMilestones,
    ...activeNew.map(t => ({ title: t, completed: false }))
  ];

  return {
    summary: isHinglish 
      ? `Aapka study board active hai! Milestones progress track ho rahi hai: ${completedMilestones.length} completed.`
      : `Your study board is active! Keeping track of completed milestones: ${completedMilestones.length} done.`,
    suggestedAction: isHinglish 
      ? `Revise key sections in ${topics[0] || 'core areas'} to build confidence today.`
      : `Work on ${topics[0] || 'your core subjects'} practice drills today to drive consistency.`,
    milestones: finalMilestones
  };
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
    
    CRITICAL USER PREFERENCE - BREVITY & FLUFF REDUCTION:
    1. Avoid "phaltu ke sabd" (extravagant conversational filler words, over-friendly preambles, redundant details, and boilerplate text). Get straight to the answer.
    2. Respond in as FEW lines as possible (kam lines me output aaye). Be extremely concise, short, and to-the-point (target 2-4 sentences max, unless responding to a detailed custom request like an explanation of a multi-step formula).
    
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



