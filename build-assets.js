import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  const svgPath = path.join(publicDir, 'icon.svg');
  const out192 = path.join(publicDir, 'icon-192.png');
  const out512 = path.join(publicDir, 'icon-512.png');
  const destDesktop = path.join(publicDir, 'screenshot-desktop.png');
  const destMobile = path.join(publicDir, 'screenshot-mobile.png');

  console.log('--- Static Assets Build Script Start ---');
  console.log('SVG Path:', svgPath);

  // Generate 192x192 PNG
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(out192);
  console.log('Generated 192x192 PNG at:', out192);

  // Generate 512x512 PNG
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(out512);
  console.log('Generated 512x512 PNG at:', out512);

  // Vector blueprint for 1920x1080 desktop mock screenshot
  const svgDesktop = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080B11"/>
          <stop offset="50%" stop-color="#0F1117"/>
          <stop offset="100%" stop-color="#141822"/>
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.15"/>
        </linearGradient>
        <linearGradient id="btn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00F2FE"/>
          <stop offset="100%" stop-color="#3B82F6"/>
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1860" height="1020" x="30" y="30" rx="36" fill="url(#bg)" stroke="#1E293B" stroke-width="4"/>
      
      <!-- Glowing background elements -->
      <circle cx="960" cy="540" r="400" fill="url(#glow)" filter="blur(80px)"/>
      <circle cx="200" cy="200" r="300" fill="#3B82F6" opacity="0.05" filter="blur(60px)"/>

      <!-- App Header Mockup -->
      <rect x="80" y="80" width="1760" height="80" rx="16" fill="#111520" stroke="#1E293B" stroke-width="2"/>
      <circle cx="120" cy="120" r="10" fill="#EF4444"/>
      <circle cx="150" cy="120" r="10" fill="#F59E0B"/>
      <circle cx="180" cy="120" r="10" fill="#10B981"/>
      
      <!-- Logo and App Title -->
      <rect x="230" y="100" width="40" height="40" rx="8" fill="url(#btn)"/>
      <text x="285" y="128" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="24" letter-spacing="1">MOCK MITRA</text>
      <text x="470" y="125" fill="#475569" font-family="'Inter', sans-serif" font-weight="800" font-size="20">|</text>
      <text x="495" y="126" fill="#94A3B8" font-family="'Inter', sans-serif" font-weight="500" font-size="16">India's Premium Exam AI Guru</text>

      <!-- Main Layout Grid -->
      <!-- Left Sidebar Mock -->
      <rect x="80" y="190" width="320" height="810" rx="20" fill="#0A0D15" stroke="#1E293B" stroke-width="1.5"/>
      <text x="120" y="250" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="700" font-size="18">DASHBOARD</text>
      
      <rect x="110" y="290" width="260" height="48" rx="10" fill="#1E293B"/>
      <text x="140" y="320" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="600" font-size="15">📚 All Tests</text>
      
      <text x="140" y="390" fill="#64748B" font-family="'Inter', sans-serif" font-weight="600" font-size="15">🤖 Chat Mitra</text>
      <text x="140" y="460" fill="#64748B" font-family="'Inter', sans-serif" font-weight="600" font-size="15">🔥 Prep Analytics</text>
      <text x="140" y="530" fill="#64748B" font-family="'Inter', sans-serif" font-weight="600" font-size="15">⚙️ Settings</text>

      <!-- Center Hero Area -->
      <rect x="430" y="190" width="1410" height="320" rx="24" fill="#0E1321" stroke="#334155" stroke-width="2"/>
      <text x="490" y="270" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="42" letter-spacing="-1">Prepare Smarter for India's Top Exams</text>
      <text x="490" y="315" fill="#94A3B8" font-family="'Inter', sans-serif" font-size="18" font-weight="500">Practice full-length test series matching the actual SSC, Banking &amp; Railways blueprints with instant friendly explanations.</text>
      
      <!-- Custom Badges -->
      <rect x="490" y="360" width="180" height="42" rx="21" fill="#1E1E2E" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="515" y="386" fill="#3B82F6" font-family="'Inter', sans-serif" font-weight="700" font-size="14">🔥 SSC CGL / CHSL</text>

      <rect x="685" y="360" width="160" height="42" rx="21" fill="#1E1E2E" stroke="#10B981" stroke-width="1.5"/>
      <text x="710" y="386" fill="#10B981" font-family="'Inter', sans-serif" font-weight="700" font-size="14">⚡ IBPS / RBI Bank</text>

      <rect x="860" y="360" width="180" height="42" rx="21" fill="#1E1E2E" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="885" y="386" fill="#F59E0B" font-family="'Inter', sans-serif" font-weight="700" font-size="14">🚆 RRB Railways</text>

      <!-- Bottom Columns: Left Test Cards & Right AI Tutor Chat Mockup -->
      <!-- Test Selection Row -->
      <rect x="430" y="540" width="680" height="460" rx="24" fill="#070A0F" stroke="#1E293B" stroke-width="1.5"/>
      <text x="470" y="595" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="22">📚 Recommended Mock Tests</text>
      
      <!-- Sub Test item 1 -->
      <rect x="470" y="630" width="600" height="96" rx="16" fill="#111625" stroke="#1E293B" stroke-width="1.5"/>
      <text x="500" y="675" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="700" font-size="18">SSC CGL Tier 1 Mock #01</text>
      <text x="500" y="700" fill="#64748B" font-family="'Inter', sans-serif" font-weight="500" font-size="13">100 MCQ Qs | 60 Mins | General Aptitude &amp; Reasoning</text>
      <rect x="940" y="660" width="100" height="38" rx="8" fill="url(#btn)"/>
      <text x="965" y="684" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="13">START</text>

      <!-- Sub Test item 2 -->
      <rect x="470" y="750" width="600" height="96" rx="16" fill="#111625" stroke="#1E293B" stroke-width="1.5"/>
      <text x="500" y="795" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="700" font-size="18">SBI PO Prelims Full Practice</text>
      <text x="500" y="820" fill="#64748B" font-family="'Inter', sans-serif" font-weight="500" font-size="13">100 MCQ Qs | 60 Mins | Quantitative Aptitude &amp; English</text>
      <rect x="940" y="780" width="100" height="38" rx="8" fill="url(#btn)"/>
      <text x="965" y="804" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="13">START</text>

      <!-- Center Test statistics -->
      <rect x="470" y="870" width="280" height="100" rx="16" fill="#1E293B" opacity="0.4"/>
      <text x="500" y="905" fill="#94A3B8" font-family="'Inter', sans-serif" font-weight="600" font-size="13">YOUR ACTIVE STREAK</text>
      <text x="500" y="945" fill="#F59E0B" font-family="'Inter', sans-serif" font-weight="900" font-size="32">🔥 12 Days</text>

      <rect x="770" y="870" width="300" height="100" rx="16" fill="#132B3B" opacity="0.8"/>
      <text x="800" y="905" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="600" font-size="13">QUESTIONS RESOLVED</text>
      <text x="800" y="945" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="900" font-size="32">⚡ 480 MCQ</text>

      <!-- Right Column AI Doubts Guru Mitra Chat -->
      <rect x="1140" y="540" width="700" height="460" rx="24" fill="#0E1321" stroke="#334155" stroke-width="1.5"/>
      <text x="1180" y="595" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="22">🤖 Mitra AI Tutor Doubt Solver</text>
      
      <!-- Student Chat bubble -->
      <rect x="1260" y="630" width="540" height="88" rx="18" fill="#13233C" stroke="#1D4ED8" stroke-width="1"/>
      <text x="1290" y="665" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="500" font-size="14">Explain standard SSC reasoning pattern for letter analogy sequences?</text>
      <text x="1290" y="690" fill="#64748B" font-family="'Inter', sans-serif" font-weight="600" font-size="11">Student - Just Now</text>

      <!-- Mitra AI reply -->
      <rect x="1180" y="735" width="540" height="140" rx="18" fill="#111C2B" stroke="#00F2FE" stroke-width="1.5"/>
      <text x="1210" y="770" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="800" font-size="14">🤖 Mitra AI GURU Response:</text>
      <text x="1210" y="798" fill="#E2E8F0" font-family="'Inter', sans-serif" font-weight="500" font-size="13">In Reasoning Letter Analogy, try mapping alphabet positions (A=1, B=2... Z=26).</text>
      <text x="1210" y="820" fill="#E2E8F0" font-family="'Inter', sans-serif" font-weight="500" font-size="13">Look for increment series (+2, +3), opposite pairs (A-Z, B-Y) or mirrored offsets.</text>
      <text x="1210" y="842" fill="#E2E8F0" font-family="'Inter', sans-serif" font-weight="500" font-size="13">Let's solve Example Pattern: BGL:FKP :: CHM:?</text>
      <text x="1210" y="862" fill="#10B981" font-family="'Inter', sans-serif" font-weight="700" font-size="11">Answer: GLQ | Quick &amp; Simple Explanations</text>

      <!-- Typing bar mockup -->
      <rect x="1180" y="900" width="620" height="60" rx="16" fill="#090E17" stroke="#1E293B" stroke-width="2"/>
      <text x="1210" y="936" fill="#475569" font-family="'Inter', sans-serif" font-weight="500" font-size="14">Poocho koi bhi exam related doubt...</text>
      <circle cx="1770" cy="930" r="16" fill="url(#btn)"/>
      <path d="M1764 930 L1776 930 M1770 924 L1776 930 L1770 936" stroke="#FFFFFF" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>
  `;

  // Vector blueprint for 1080x1920 mobile portrait mockup
  const svgMobile = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080C14"/>
          <stop offset="50%" stop-color="#111420"/>
          <stop offset="100%" stop-color="#181D2D"/>
        </linearGradient>
        <linearGradient id="gBtn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00F2FE"/>
          <stop offset="100%" stop-color="#3B82F6"/>
        </linearGradient>
        <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00F2FE" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.2"/>
        </linearGradient>
      </defs>

      <!-- Shell background resembling a smartphone frame -->
      <rect width="1020" height="1860" x="30" y="30" rx="64" fill="url(#mBg)" stroke="#2D3748" stroke-width="6"/>

      <!-- Status Bar Area -->
      <text x="90" y="100" fill="#94A3B8" font-family="'Inter', sans-serif" font-weight="700" font-size="20">09:41</text>
      <circle cx="910" cy="92" r="10" fill="#94A3B8"/>
      <rect x="930" y="82" width="40" height="20" rx="4" stroke="#94A3B8" stroke-width="2" fill="none"/>
      <rect x="934" y="86" width="22" height="12" rx="2" fill="#94A3B8"/>

      <!-- Central Icon Brand Header -->
      <circle cx="540" cy="400" r="150" fill="url(#neon)" filter="blur(40px)"/>
      
      <!-- Styled Large Logo -->
      <rect x="460" y="280" width="160" height="160" rx="32" fill="url(#gBtn)" filter="blur(0px)"/>
      <text x="510" y="390" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="100">M</text>

      <text x="540" y="530" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="56" text-anchor="middle" letter-spacing="1">Mock Mitra</text>
      <text x="540" y="585" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="700" font-size="24" text-anchor="middle" letter-spacing="2">GOVT EXAM PREPARATION AI GURU</text>

      <!-- Value Propositions / Cards -->
      <g transform="translate(100, 680)">
        <rect width="880" height="180" rx="24" fill="#0F1422" stroke="#1E293B" stroke-width="2"/>
        <text x="50" y="70" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="28">🔥 Full Length Practice Tests</text>
        <text x="50" y="115" fill="#64748B" font-family="'Inter', sans-serif" font-weight="500" font-size="20">Exact exam blue-print matches with detailed subtopics</text>
      </g>

      <g transform="translate(100, 900)">
        <rect width="880" height="180" rx="24" fill="#0F1422" stroke="#10B981" stroke-opacity="0.3" stroke-width="2"/>
        <text x="50" y="70" fill="#10B981" font-family="'Inter', sans-serif" font-weight="800" font-size="28">🤖 Smart Doubt Solver AI</text>
        <text x="50" y="115" fill="#94A3B8" font-family="'Inter', sans-serif" font-weight="500" font-size="20">Get crystal clear step-by-step Hindi/English answers</text>
      </g>

      <g transform="translate(100, 1120)">
        <rect width="880" height="180" rx="24" fill="#0F1422" stroke="#E2E8F0" stroke-opacity="0.1" stroke-width="2"/>
        <text x="50" y="70" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="800" font-size="28">⚡ Smart Streak Analytics</text>
        <text x="50" y="115" fill="#64748B" font-family="'Inter', sans-serif" font-weight="500" font-size="20">Form preparation habits, trace scores and progress path</text>
      </g>

      <!-- Active Status Badges -->
      <rect x="180" y="1360" width="720" height="64" rx="32" fill="#132B3B" stroke="#00F2FE" stroke-dasharray="8 4" stroke-width="1.5"/>
      <text x="540" y="1400" fill="#00F2FE" font-family="'Inter', sans-serif" font-weight="700" font-size="20" text-anchor="middle">⚡ Join 10,000+ Students Preparing Online Daily</text>

      <!-- Giant Interactive Call to Action -->
      <rect x="100" y="1520" width="880" height="110" rx="28" fill="url(#gBtn)"/>
      <text x="540" y="1588" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="32" text-anchor="middle" letter-spacing="1.5">START GETTING PREPARED 🚀</text>

      <!-- Bottom Home Indicator Mockup -->
      <rect x="420" y="1840" width="240" height="10" rx="5" fill="#475569"/>
    </svg>
  `;

  console.log('Generating Desktop Screenshot...');
  await sharp(Buffer.from(svgDesktop))
    .png()
    .toFile(destDesktop);
  console.log('Generated Desktop Screenshot successfully:', destDesktop);

  console.log('Generating Mobile Screenshot...');
  await sharp(Buffer.from(svgMobile))
    .png()
    .toFile(destMobile);
  console.log('Generated Mobile Screenshot successfully:', destMobile);

  console.log('--- Static Assets Build Script Complete ---');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
