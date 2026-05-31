import { Question } from '../types';

export const QUESTIONS: Question[] = [
  // General Awareness - Polity
  {
    id: 'ga-p-1',
    subject: 'General Awareness',
    topic: 'Polity',
    question: 'Who is known as the "Father of the Indian Constitution"?',
    options: ['Mahatma Gandhi', 'Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Patel'],
    correctAnswer: 1,
    explanation: 'Dr. B.R. Ambedkar was the chairman of the Drafting Committee and is regarded as the Father of the Indian Constitution.',
    difficulty: 'Easy'
  },
  {
    id: 'ga-p-2',
    subject: 'General Awareness',
    topic: 'Polity',
    question: 'The Retirement age of the Judges of High Court is:',
    options: ['60 years', '62 years', '65 years', '58 years'],
    correctAnswer: 1,
    explanation: 'Judges of the High Court retire at the age of 62, while Supreme Court judges retire at 65.',
    difficulty: 'Medium'
  },
  // General Awareness - Geography
  {
    id: 'ga-g-1',
    subject: 'General Awareness',
    topic: 'Rivers & Dams',
    question: 'Which is the longest river in India?',
    options: ['Godavari', 'Narmada', 'Ganga', 'Brahmaputra'],
    correctAnswer: 2,
    explanation: 'The Ganga is the longest river in India, flowing over 2,525 km.',
    difficulty: 'Easy'
  },
  {
    id: 'ga-g-2',
    subject: 'General Awareness',
    topic: 'Rivers & Dams',
    question: 'The Tehri Dam is built on which river?',
    options: ['Alaknanda', 'Bhagirathi', 'Ganga', 'Yamuna'],
    correctAnswer: 1,
    explanation: 'Tehri Dam, the highest dam in India, is built on the Bhagirathi River in Uttarakhand.',
    difficulty: 'Hard'
  },
  // General Awareness - Economy
  {
    id: 'ga-e-1',
    subject: 'General Awareness',
    topic: 'Economy',
    question: 'When is the National Income of India estimated?',
    options: ['NITI Aayog', 'Ministry of Finance', 'Central Statistical Office (CSO)', 'RBI'],
    correctAnswer: 2,
    explanation: 'The Central Statistical Office (CSO), now part of NSO, is responsible for estimating National Income.',
    difficulty: 'Medium'
  },
  {
    id: 'ga-e-2',
    subject: 'General Awareness',
    topic: 'Inflation',
    question: 'Which index is used to measure inflation in India for policy making?',
    options: ['WPI', 'CPI', 'GDP Deflator', 'Sensex'],
    correctAnswer: 1,
    explanation: 'The Consumer Price Index (CPI) is the primary measure of inflation used by the RBI for monetary policy.',
    difficulty: 'Medium'
  },
  // English
  {
    id: 'en-v-1',
    subject: 'English Language',
    topic: 'Vocabulary',
    question: 'Choose the synonym of "ABANDON":',
    options: ['Keep', 'Forsake', 'Adopt', 'Stay'],
    correctAnswer: 1,
    explanation: 'Abandon means to leave or give up completely; Forsake is its synonym.',
    difficulty: 'Easy'
  },
  // Reasoning
  {
    id: 're-a-1',
    subject: 'Reasoning',
    topic: 'Algebra',
    question: 'If 2x + 3 = 11, what is x?',
    options: ['2', '3', '4', '5'],
    correctAnswer: 2,
    explanation: '2x = 11 - 3 = 8; x = 8/2 = 4.',
    difficulty: 'Easy'
  }
];
