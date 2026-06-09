
export type Subject = string;
export type Topic = string;

export interface Question {
  id: string;
  subject: Subject;
  topic: Topic;
  question: string;
  options: string[];
  correctAnswer: number; // index of options
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface UserPerformance {
  strongTopics: Topic[];
  weakTopics: Topic[];
  testHistory: TestResult[];
  knowledgeProfile: Record<Topic, number>; // score 0-100
  streak: number;
  lastAiAnalysis?: {
    summary: string;
    weakTopicAnalysis: string;
    suggestions: string[];
    predictedBrief: string;
  };
}

export interface TestResult {
  date: string;
  score: number;
  total: number;
  timeSpent: number; // in seconds
  subject: Subject | 'Full Mock';
  topicPerformance: Partial<Record<Topic, { correct: number; total: number }>>;
  questions?: Question[];
  aiAnalysis?: {
    summary: string;
    weakTopicAnalysis: string;
    suggestions: string[];
    predictedBrief: string;
  };
}

export interface UserProfile {
  name: string;
  exam: string;
  language: string;
  customExamDetails?: string;
  onboarded: boolean;
  performance: UserPerformance;
  learningGoals?: string[];
  customStudyNotes?: string;
  aiMentorPlan?: {
    summary: string;
    milestones: { title: string; completed: boolean }[];
    suggestedAction: string;
    lastStructuredDate?: string;
  };
  chatHistory?: {
    role: 'user' | 'model';
    text: string;
    date: string;
  }[];
}

export interface DrillFile {
  name: string;
  type: string;
  base64: string;
}

export interface DrillSetup {
  customTopic?: string;
  customPrompt?: string;
  files?: DrillFile[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  selectedModel?: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite';
  videoInfo?: {
    title: string;
    description: string;
  };
  studyScheme?: 'PYQ & Important based' | 'Study based Imp' | 'Pure System';
}
