export interface ExamConfig {
  id: string;
  name: string;
  group: string;
  description: string;
  patternInstructions: string;
  defaultTopics: string[];
}

export const EXAMS_CONFIG: ExamConfig[] = [
  {
    id: 'university-semester',
    name: 'University Semester',
    group: 'Academic',
    description: 'General college or university level semester assessments.',
    patternInstructions: 'Focus on conceptual understanding, detailed explanations, and academic rigor suitable for higher education.',
    defaultTopics: ['Core Major Subjects', 'Electives', 'Standard Academic Theory']
  },
  {
    id: 'competitive-entrance',
    name: 'Entrance Exam (JEE/NEET/SAT)',
    group: 'Entrance',
    description: 'Admissions tests for engineering, medical, or undergraduate colleges.',
    patternInstructions: 'Focus on high-speed problem solving, accurate fundamentals in Science/Math/English, and logic-based assessments.',
    defaultTopics: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Aptitude']
  },
  {
    id: 'professional-cert',
    name: 'Professional Certification',
    group: 'Career',
    description: 'IT, Medical, Project Management or other professional certifications.',
    patternInstructions: 'Industry-standard technical questions based on official curriculum and real-world scenario-based problems.',
    defaultTopics: ['Technical Domain', 'Best Practices', 'Standards & Protocols']
  },
  {
    id: 'govt-exam',
    name: 'Govt & Civil Services',
    group: 'Public Sector',
    description: 'UPSC, SSC, Banking, and other public sector recruitment exams.',
    patternInstructions: 'High-level conceptual questions on History, Polity, Geography, Economy, Reasoning, and Current Affairs.',
    defaultTopics: ['General Awareness', 'Reasoning', 'Quantitative Aptitude', 'English']
  },
  {
    id: 'school-boards',
    name: 'School Boards (K-12)',
    group: 'School',
    description: 'Middle and high school level board exams including CBSE, ICSE, or State Boards.',
    patternInstructions: 'Curriculum-aligned questions focusing on foundational knowledge and board-specific marking schemes.',
    defaultTopics: ['Mathematics', 'Science', 'Social Studies', 'Language']
  }
];

export function getExamConfig(name: string): ExamConfig {
  const normalized = name ? name.trim() : '';
  const found = EXAMS_CONFIG.find(e => e.name.toLowerCase() === normalized.toLowerCase());
  if (found) return found;

  return {
    id: `custom-${encodeURIComponent(normalized || 'exam')}`,
    name: normalized || 'My Custom Study Map',
    group: 'Custom',
    description: `Tailored practice exam for ${normalized || 'Custom Topics'}.`,
    patternInstructions: `Focus on curriculum parameters, core principles, reasoning, and conceptual clarity associated with ${normalized || 'the custom study goals'}.`,
    defaultTopics: ['Core Concepts', 'Syllabus Focus', 'Analytical Reasoning']
  };
}
