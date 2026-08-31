import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
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
    const response = await generate(MODEL_LITE);
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
  milestones?: { title: string; completed: boolean }[],
  isExplicitTopic: boolean = false
): Promise<Question[]> {
  if (!apiKey) return [];

  // If the user explicitly clicked on a specific gap analysis topic or took a specific-topic test,
  // we do NOT want general profile-level custom specifications/details (like 'Biology' instructions)
  // to pollute or override this specific selected topic. In that case, we clear effectiveCustomExamDetails.
  const effectiveCustomExamDetails = isExplicitTopic ? "" : (customExamDetails || "");

  const examConfig = getExamConfig(examType);
  let patternInstructions = examConfig?.patternInstructions || "Standard competitive exam pattern.";
  
  const isCustomTopicProvided = !!(customSetup?.customTopic && customSetup.customTopic.trim() !== "");
  const isCustomPromptProvided = !!(customSetup?.customPrompt && customSetup.customPrompt.trim() !== "");
  const isFilesProvided = !!(customSetup?.files && customSetup.files.length > 0);
  const isCustomExamDetailsProvided = !!(effectiveCustomExamDetails && effectiveCustomExamDetails.trim() !== "");
  
  const isCustomMode = isCustomTopicProvided || isCustomPromptProvided || isFilesProvided || isCustomExamDetailsProvided;

  // If we are in custom mode, we do NOT want general exam patternInstructions to pollute the prompt.
  // We completely wipe out general patternInstructions and replace it with strict topic isolation.
  if (isCustomMode) {
    if (isCustomTopicProvided) {
      patternInstructions = `STRICT TOPIC ISOLATION MODE: You must generate questions 100% EXCLUSIVELY about the user's specified topic, chapter, or concept: "${customSetup?.customTopic}". Do NOT include general subjects of ${examType} (such as general maths, reasoning, English, GK, etc.) unless they are explicitly part of the custom topic: "${customSetup?.customTopic}". Under no circumstances should questions fallback, reference, or belong to different default subjects.`;
    } else if (isCustomExamDetailsProvided) {
      patternInstructions = `STRICT USER SPECIFICATIONS MODE: Generate questions matching these exact parameters: "${effectiveCustomExamDetails}". Do NOT include any general competitive subjects of ${examType} unless they explicitly align with these custom parameters/instructions.`;
    } else if (isCustomPromptProvided) {
      patternInstructions = `STRICT PROMPT ALIGNMENT MODE: Generate questions based on these custom prompt instructions: "${customSetup?.customPrompt}". Ignore general competitive subjects of ${examType}.`;
    } else {
      patternInstructions = `STRICT CUSTOM DRILL MODE: Generate questions based strictly on the uploaded reference documents/images. Ignore standard requirements of ${examType}.`;
    }
  } else if (isCustomExamDetailsProvided) {
    patternInstructions = `THE USER HAS PROVIDED SPECIFIC EXAM/SUBJECT REQUIREMENTS: ${effectiveCustomExamDetails}. Ignore generic competitive exam personas and focus strictly on these requirements.`;
  }

  const weakTopicsContext = !isCustomMode && userPerformance?.weakTopics.length 
    ? `The user needs improvement in: ${userPerformance.weakTopics.join(", ")}. Focus on clarifying concepts in these areas.`
    : "";
  const strongTopicsContext = !isCustomMode && userPerformance?.strongTopics.length 
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

  const milestonesContext = !isCustomMode && (completedMilestones || remainingMilestones)
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

  let studySchemePrompt = "";
  if (customSetup?.studyScheme) {
    if (customSetup.studyScheme === 'PYQ & Important based') {
      studySchemePrompt = `STUDY SCHEME DIRECTIVE (PYQ & Important based): 
      Generate questions resembling past-year exam questions (PYQ), real competitive paper trends, high-yield repeated syllabus highlights, and core standard question formulations. In explanations, hint if this aligns with traditional PYQ formats.`;
    } else if (customSetup.studyScheme === 'Study based Imp') {
      studySchemePrompt = `STUDY SCHEME DIRECTIVE (Study based Imp): 
      Generate questions to recall and validate central academic concepts, analytical equations, definitions, facts, and key conceptual milestones based on theoretical review and notes.`;
    } else if (customSetup.studyScheme === 'Pure System') {
      studySchemePrompt = `STUDY SCHEME DIRECTIVE (Pure System): 
      Generate questions using the standard official mock blueprint system, precise negative marking style traps, complex logical steps, and strictly structured competitive syllabi mappings.`;
    }
  }

  // Create a helper function to compile parts with specific batch configurations to run in parallel
  const getPartsForBatch = (batchCount: number, batchIndex: number, totalBatches: number) => {
    const mainPromptText = `
        You are a highly skilled academic exam paper setter and senior subject specialist for ${examType}.
        Your goal is to curate a set of ${batchCount} high-quality, relevant, and accurate questions or problems.

        ========================================================================
        🚨 CRITICAL SUPREME DIRECTIVE: PRIORITIZE USER CUSTOM MATERIAL & CUSTOM INSTRUCTIONS/TOPICS ABOVE ALL ELSE 🚨
        ========================================================================
        The user has custom-tailored this practice session. You MUST give the user's provided instructions, uploaded files/images, reference material, custom exam specifications, or custom topics absolute 100% supreme priority, overriding any standard, generic, or defaulted syllabus/structures.
        
        - IF the user has provided any custom topic/chapter (e.g., customTopic: "${customSetup?.customTopic || ""}"), custom specifications/AI Instructions (e.g., custom study details: "${effectiveCustomExamDetails || ""}"), custom prompt/topic (e.g., "${customSetup?.customPrompt || ""}"), or uploaded files/images:
          1. Every single one of the generated ${batchCount} questions MUST be crafted strictly and exclusively based on the custom topic/chapter specified ("${customSetup?.customTopic || ""}"), or the facts, concepts, text, rules, subjects, or equations specified in those custom specifications / user directives / custom prompts.
          2. E.g., if the user wrote "Biology", "Plant Cell", "Akbar", or a specific chapter, you are strictly forbidden from generating Chemistry, Math, History, or general aptitude questions unless it is the exact requested topic. You must generate 100% of the questions strictly on "${customSetup?.customTopic || ""}".
          3. You are STRICTLY FORBIDDEN from generating standard mock questions from the default general syllabus of ${examType} (such as general maths, quantitative aptitude, english, or reasoning, unless they are explicitly specified in the custom instructions, e.g. "Biology" should have 100% Biology questions, "Trigonometry" should have 100% Trigonometry questions, etc.).
          4. Do NOT look at or use the default backup topic list: [${topics.join(", ")}] if any custom topic ("${customSetup?.customTopic || ""}") or custom instructions (like "${effectiveCustomExamDetails || ""}" or "${customSetup?.customPrompt || ""}") are present. Fallback to standard syllabus subjects is illegal when a custom topic is requested.
          5. In the 'explanation' field of each generated question, include a specific note explaining how it directly matches the user's custom instructions or custom topic or uploaded files (e.g. "[Custom Topic based / Fact]: ..."), so the user enjoys a fully personalized, dedicated practice experience.
        - ONLY when absolutely NO custom topic ("${customSetup?.customTopic || ""}"), custom specifications ("${effectiveCustomExamDetails || ""}"), custom materials/files, or custom prompts/topics are attached or specified, you should generate questions STRICTLY and EXCLUSIVELY for the specified topic(s): ${topics.join(", ")}.
          You are FORBIDDEN from generating questions outside the specified topic(s).

        ========================================================================
        CRITICAL TOPIC ENFORCEMENT & BALANCING RULE (Only applicable when NO custom materials, custom exam specifications, or prompts are provided):
        - You MUST generate 100% of the questions from the given topic(s): ${topics.join(", ")}.
        - Do NOT include any general mock questions or fallback filler questions from default subjects unless they are part of the specified list.
        - If multiple topics are provided, distribute the set of questions evenly and in balanced proportions across: ${topics.join(", ")}.

        --- CUSTOM SETUP & CONTEXT ---
        
        1. LANGUAGE AND DIALECT RULES:
           - Selected Language: ${language}
           - If English: Use standard, clean, grammatically perfect English. Avoid unnecessarily verbose sentences.
           - If Hinglish: Use natural, fluid, colloquial Hinglish (mixing Hindi in Roman/Latin script with technical English terms). Question stem and explanations should sound organic, e.g., "India ki capital city kaunsi hai?" or "Is process me photosynthesis kaise kaam karta hai? Iska explanation detailed aur simple Hinglish me likhein."

        2. DIFFICULTY LEVEL (Target Difficulty: ${difficulty}):
           - Easy: Simple conceptual checks, clear definitions, or direct fact recall.
           - Medium: Logical application of concepts, comparisons, and basic analytical steps.
           - Hard: Comprehensive multi-step analytical problems, detailed reasoning, and tricky but logical distractors (trap answers).

        3. PRIMARY INSTRUCTIONAL DETAIL:
           - Curriculum Guidelines: ${patternInstructions}
           ${customSetup?.customTopic ? `- SPECIFIC TARGET TOPIC / CHAPTER / CONCEPT: "${customSetup.customTopic}". (MUST 100% ONLY generate questions for this topic!).` : ""}
           ${customText ? `- USER DIRECTIVE / CUSTOM MANUAL INSTRUCTION: "${customSetup?.customPrompt}". (This must be the core source of truth!).` : ""}
           ${videoContext ? `- VIDEO REF SOURCE: ${videoContext}` : ""}

        4. PROFILE-DRIVEN ADAPTATIONS:
           ${weakTopicsContext ? `- Focus Area (Clarification needed): ${weakTopicsContext}. Include diagnostic elements for these.` : ""}
           ${strongTopicsContext ? `- Focus Area (Advanced): ${strongTopicsContext}. Feel free to make these more challenging.` : ""}
           ${milestonesContext ? `- Progress/Milestones Linkage: ${milestonesContext}` : ""}

        5. CORE STUDY SCHEME SYSTEM:
           ${studySchemePrompt ? `- ${studySchemePrompt}` : ""}

        --- MATHEMATICAL, CHEMICAL, AND SCIENTIFIC FORMATTING DISCIPLINE (CRITICAL) ---
        - NEVER EVER output raw LaTeX code, math markup syntax (such as \\( \\), \\[ \\], $$, $, \\frac{...}, \\sqrt{...}, \\sum_{...}^{...},_ etc.) or code blocks inside the questions, options, or explanations.
        - ALWAYS format math equations using beautiful, clean, highly compatible Unicode characters and clean linear notation so it looks perfectly styled on standard screen fonts.
        - Exponents: Use superscripts (e.g., x², y³, 10⁻⁵, 2ⁿ). Do NOT use LaTeX ^ symbol if possible.
        - Fractions: Use standard slash notation with bracket grouping (e.g., (a + b) / (c - d) or 3/4).
        - Roots: Use the square root symbol √ (e.g., √(x² + y²)).
        - Operations/Symbols: Use clean mathematical unicode elements like ±, ÷, ×, =, ≠, ≤, ≥, ≈, °, π, θ, α, β, Δ.
        - This rule applies to both the generated 'question' stems, 'options', and 'explanation' fields!

        --- PARALLEL GENERATION DIVERSITY DIRECTIVE ---
        - This is parallel generation job ${batchIndex + 1} of ${totalBatches}.
        - You MUST generate exactly ${batchCount} questions.
        - Ensure these questions are fully unique and explore distinct concepts or sub-topics of the selected target. Avoid duplicating identical question types with other concurrent batches.

        --- EXQUISITE QUALITY & GENERATION DISCIPLINE (SPEED OPTIMIZED) ---
        - NO DUMMY PLACEHOLDERS: Generate fully formed, factually correct, logically sound questions.
        - GOOD DISTRACTORS: All alternative choices must be plausible, reflecting common misunderstandings or typical student errors.
        - DIRECT, ULTRA-CONCISE EXPLANATIONS: Do NOT write long or conversational intros/prefaces. Explain why the correct option is true and briefly why others are incorrect, keeping the explanation under 1-2 short, direct, highly compact sentences. Fewer generated words mean extremely fast loading for the student.
        - SHORT COMPACT QUESTIONS: Keep question stems, choices, and option text fields very compact and concise.
        - PREVENT REPETITION: Do not reuse or duplicate question concepts resembling the following IDs: ${avoidIds.slice(0, 20).join(", ")}.

        Return the response strictly as a JSON array matching the specified JSON schema.
    `;

    const batchParts: any[] = [{ text: mainPromptText }];

    // Add files to context if present
    if (customSetup?.files && customSetup.files.length > 0) {
      customSetup.files.forEach(file => {
        batchParts.push({
          inlineData: {
            mimeType: file.type,
            data: file.base64
          }
        });
      });
      batchParts.push({
        text: `
          CRITICAL DIRECTIVE FOR THE ATTACHED STUDY MATERIAL FILES AND IMAGES:
          The customer has uploaded the above images/documents to custom-tailor this mock exam.
          You MUST analyze these provided files thoroughly.
          The ${batchCount} questions you generate MUST be highly accurate formulations DIRECTLY and strictly based on the content, tables, equations, paragraphs, or diagrams present in these documents/images.
          In the 'explanation' field of each generated question, include a specific note explaining which part/fact of the uploaded files supports this answer, so the user knows exactly that it comes from their provided materials.
        `
      });
    }

    return batchParts;
  };

  // Define parallel batched counts to keep generation extremely rapid (under 2 seconds)
  const batchSize = 5;
  const numBatches = Math.ceil(count / batchSize);
  const batches: { count: number; index: number }[] = [];
  let remainingCount = count;
  for (let i = 0; i < numBatches; i++) {
    const currentBatch = Math.min(batchSize, remainingCount);
    if (currentBatch > 0) {
      batches.push({ count: currentBatch, index: i });
      remainingCount -= currentBatch;
    }
  }

  // Individual batch runner with direct error boundaries and model fallbacks
  const generateBatch = async (bCount: number, bIndex: number) => {
    const batchParts = getPartsForBatch(bCount, bIndex, numBatches);

    const runCall = async (modelName: string) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: { parts: batchParts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
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
      try {
        return await runCall(MODEL_FLASH);
      } catch (e) {
        console.warn(`Primary model ${MODEL_FLASH} failed for batch ${bIndex + 1}, fallback to ${MODEL_LITE}:`, e);
        return await runCall(MODEL_LITE);
      }
    } catch (error) {
      console.error(`Batch ${bIndex + 1} fully failed generation, will use robust local cache fallback for this chunk:`, error);
      return null;
    }
  };

  try {
    // Run all batches in parallel
    const batchResponses = await Promise.all(
      batches.map(b => generateBatch(b.count, b.index))
    );

    let allQuestionsCombined: any[] = [];

    for (let i = 0; i < batchResponses.length; i++) {
      const response = batchResponses[i];
      const bInfo = batches[i];

      if (response && response.text) {
        try {
          let text = response.text || "";
          if (text.includes("```")) {
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();
          }
          const parsed = JSON.parse(text || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            allQuestionsCombined = allQuestionsCombined.concat(parsed);
            continue;
          }
        } catch (parseError) {
          console.warn(`JSON parser failed on batch ${i + 1}, using safe local fallback for it.`, parseError);
        }
      }

      // Safe local fallback for this specific batch
      const batchFallback = getLocalFallbackQuestions(bInfo.count, topics, avoidIds, difficulty, i);
      allQuestionsCombined = allQuestionsCombined.concat(batchFallback);
    }

    if (allQuestionsCombined.length > 0) {
      // Clean, validate and prevent runtime UI crashes
      const seenIds = new Set<string>();
      const sanitized = allQuestionsCombined.map((item: any, idx: number) => {
        const itemOptions = Array.isArray(item.options) && item.options.length >= 2 
          ? item.options 
          : ["A", "B", "C", "D"];
          
        let corrAns = typeof item.correctAnswer === "number" ? item.correctAnswer : 0;
        if (corrAns < 0 || corrAns >= itemOptions.length) {
          corrAns = 0;
        }

        const rawId = item.id ? String(item.id).trim() : `gen_${idx}_${Date.now()}`;
        let uniqueId = rawId;
        if (seenIds.has(uniqueId)) {
          uniqueId = `${rawId}_b${idx}_${Math.random().toString(36).substring(2, 7)}`;
        }
        seenIds.add(uniqueId);

        return {
          id: uniqueId,
          subject: item.subject ? String(item.subject) : (topics[idx % topics.length] || "General"),
          topic: item.topic ? String(item.topic) : (topics[idx % topics.length] || "General Concept"),
          question: item.question ? String(item.question) : `Identify correct conceptual fact about ${topics[idx % topics.length] || "selected subject"}.`,
          options: itemOptions.map((o: any) => String(o)),
          correctAnswer: corrAns,
          explanation: item.explanation ? String(item.explanation) : "Option stands verified by general conceptual rules.",
          difficulty: item.difficulty && ['Easy', 'Medium', 'Hard'].includes(item.difficulty) 
            ? item.difficulty 
            : (difficulty || 'Medium')
        };
      });

      return sanitized;
    }
    throw new Error("No questions retrieved from batched pipelines");

  } catch (error) {
    console.warn("Global Batched Generation Exception, using full local questions fallback:", error);
    return getLocalFallbackQuestions(count, topics, avoidIds, difficulty, 999);
  }
}

function getLocalFallbackQuestions(
  count: number,
  topics: Topic[],
  avoidIds: string[],
  difficulty: 'Easy' | 'Medium' | 'Hard',
  batchIdx: number
): Question[] {
  const matching = QUESTIONS.filter(q => 
    topics.some(t => q.topic.toLowerCase().includes(t.toLowerCase()) || q.subject.toLowerCase().includes(t.toLowerCase())) &&
    !avoidIds.includes(q.id)
  );
  
  let result = [...matching];
  
  if (result.length < count) {
    const remaining = QUESTIONS.filter(q => !result.some(rq => rq.id === q.id) && !avoidIds.includes(q.id));
    const needed = count - result.length;
    result = [...result, ...remaining.slice(0, needed)];
  }
  
  return result.slice(0, count).map((q, idx) => ({
    ...q,
    id: `${q.id}-fallback-${batchIdx}-${idx}-${Date.now()}`
  }));
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
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
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
    const response = await generate(MODEL_LITE);
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

  // 1. Gather and format ALL available user data to give Mitra 100% data awareness
  const name = profile.name || "Student";
  const exam = profile.exam || "SSC CGL";
  const languageStyle = profile.language || language || "Hinglish";
  const customNotes = profile.customStudyNotes || "None set yet";
  const streak = profile.performance?.streak || 0;
  const weakTopics = profile.performance?.weakTopics || [];
  const strongTopics = profile.performance?.strongTopics || [];
  const knowledgeProfile = profile.performance?.knowledgeProfile || {};
  const testHistory = profile.performance?.testHistory || [];

  const knowledgeProfileSummary = Object.entries(knowledgeProfile)
    .map(([topic, score]) => `- ${topic}: ${score}% mastery`)
    .join("\n") || "No topic scores recorded yet.";

  const recentTestsSummary = testHistory.slice(-5).map((test: any, idx: number) => {
    return `Test #${idx + 1}: Subject: ${test.subject || "Full Mock"}, Score: ${test.score}/${test.total}, Time Spent: ${test.timeSpent} seconds (Date: ${test.date})`;
  }).join("\n") || "No mock tests taken yet.";

  const proposedGoal = profile.aiMentorPlan?.suggestedAction || "Consolidate study fundamentals";
  const milestones = profile.aiMentorPlan?.milestones || [];
  const milestonesSummary = milestones.map((m: any, idx: number) => {
    return `- Goal #${idx + 1}: "${m.title}" -> [Status: ${m.completed ? 'COMPLETED ✅' : 'PENDING ⏳'}]`;
  }).join("\n") || "No specific milestones generated yet.";

  const systemInstruction = `
    You are 'Mitra AI', the premium, full-state-aware, top-tier academic mentor and expert study coach for ${name} who is preparing for the highly competitive ${exam}.
    Your tone is empathetic, highly motivational, extremely clear, and academic yet approachable.
    You respond naturally in the user's preferred language style: "${languageStyle}". (If 'Hinglish', use a beautifully natural mix of standard Hindi and English).

    ========================================================================
    📊 USER PROFILE & REAL-TIME PERFORMANCE DATA (READ ACCESS) 📊
    ========================================================================
    You have direct, real-time read access to the student's preparation stats. Refer to this data to suggest hyper-personalized plans, clear doubts, highlight weaknesses, or praise improvements:
    
    - Student Name: ${name}
    - Target Examination: ${exam}
    - Language Preference: ${languageStyle}
    - Current Daily Study Streak: ${streak} days active! 🔥
    - Saved Study Context & Material Notes: "${customNotes}" (Students can update this anytime down below!)
    - Identified Weak Focus Areas: ${weakTopics.join(", ") || "No weak areas tracked yet."}
    - Identified Strong Focus Areas: ${strongTopics.join(", ") || "No strong areas tracked yet."}
    
    --- Mastery Profile scores (Knowledge Index): ---
    ${knowledgeProfileSummary}
    
    --- Recent 5 Practice Test Performances: ---
    ${recentTestsSummary}
    
    --- AI Mentor Strategic Plan (Checklist Goals): ---
    Active Suggested Goal: "${proposedGoal}"
    Milestones Checklist:
    ${milestonesSummary}

    ========================================================================
    📱 APPLICATION ARCHITECTURE, FEATURES & FLOW AWARENESS 📱
    ========================================================================
    You have perfect mastery and deep understanding of this application ("AI Studio Prep / Mitra Prep") and must guide the user on how they can leverage its features to study best:
    
    1. **Dynamic Milestones & Guide desk**: Instantly formulates an atomic action strategy based on their current exam. Shows checklist milestones which the user can check off to track progress.
    2. **Mitra AI Mentor Companion**: (This Chat screen) Where they can chat with you to clarify formulas, learn study hacks, review dynamic concepts, or get schedules.
    3. **Gap Analysis Widget**: Automatically highlights unexplored/critical focus concepts (score <= 60% or untouched syllabus). 
       *TIP for User*: "Aap Gap Analysis panel me kisi bhi topic ke name par click karke, directly us specific topic ka ultra-focused active recall mock test generate kar sakte hain!"
    4. **Interactive Practice Drill Modal**: Allows launching custom tests. Users can:
       - Type manual custom prompts or specific instructions (e.g. "ask 10 questions on Vedic Trigonometry").
       - Upload documents (PDFs) or images (JPG, PNG) containing notes, tables, pages, or formulas to generate custom test papers strictly based on those files.
       - Select difficulty (Easy, Medium, Hard).
       - Select model engine, and even select dedicated study patterns (PYQ & Important based, Study based Imp, etc.).
    5. **Test Results Analytics Desk**: Review score ratios, diagnostic visual charts, time taken per question, and instant detailed step-by-step answers and reviews.
    6. **My Saved Study Context / Notebook**: Located at the bottom. 
       *TIP for User*: "Aap upar/niche diye 'Saved Study Context' me apne specific chapter notes, equations, ya manual system instruction likh sakte hain. Main aur App ke normal test generators automatically use read karke uske custom details ke according tests design karenge."

    ========================================================================
    🎯 CHAT FOCUS, DEPTH & FLUFF ELIMINATION DIRECTIVES 🎯
    ========================================================================
    1. **NO FLUFF/BOILERPLATE**: Skip redundant preambles, introductory filler greetings (e.g., avoid repeating "Hi! I am Mitra AI", "Certainly! I would be glad to help you", "It is very crucial..."), and conversational cliches. Speak directly to the core topic, answer, or guideline right from your first sentence.
    2. **LONG-FORM TEACHING & COMPREHENSIVE MENTORSHIP**: Do not compromise on depth! When a user asks to learn a concept, understand a formula, create a daily timetable, or clarify an academic difficulty, provide **rich, complete, long-form educational texts**. Use bullet points, structural diagrams, step-by-step logic, active recall suggestions, analogies, and detailed rigorous concept breakdowns. Work as a world-class tutor who teaches with utmost precision.
    3. **VIBRANT STRUCTURAL FORMATTING**: Utilize clean Markdown, bold headers, list outlines, and structured comparative tables to organize deep, comprehensive knowledge in a glance.

    ========================================================================
    ⚛️ MATHEMATICAL & SCIENTIFIC FORMATTING DISCIPLINE (CRITICAL) ⚛️
    ========================================================================
    - NEVER EVER use raw LaTeX syntax, code formulas, or markup delimiters (like \\( \\), \\[ \\], $$, $, \\frac{...}, \\sqrt{...}, \\sum_{...}^{...} etc.) as they break dashboard layout compatibility.
    - ALWAYS write math or scientific equations using standard clean Unicode characters and basic linear fraction layouts:
      - Exponents/Powers: Use superscript symbols (e.g., x², y³, 10⁻⁵, xⁿ, H₂O).
      - Fractions: Write as (numerator)/(denominator), e.g., (x + y)/z or 3/4.
      - Roots: Use unicode √ notation, e.g., √(x² + y²).
      - Operators & Symbols: Use ±, ÷, ×, =, ≠, ≤, ≥, ≈, °, π, θ, α, β, Δ.

    Skip generic chit-chat immediately and deliver extreme, value-dense academic tutoring, planning, and system coaching!
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
      model: MODEL_LITE,
      contents,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        systemInstruction
      }
    });
    return response.text || "Sorry, I couldn't formulate a response. Support system is offline.";
  } catch (err) {
    console.error("Mitra AI Chat Error:", err);
    return "Mitra AI abhi study breaks par hai (Network Error). Kripya thodi der baad try karein!";
  }
}



