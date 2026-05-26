const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Kavya Bojja & Likhith Nariyam';
pptx.title = 'Azure FinOps AI Platform';

// Colors
const NAVY = '1A2340';
const BLUE = '2E75B6';
const LTBLUE = 'EBF4FF';
const WHITE = 'FFFFFF';
const LTGRAY = 'F5F5F5';
const DARK = '333333';
const GRAY = '888888';
const GREEN = '0F6E56';
const RED = 'C0392B';
const AMBER = 'D4850A';

const LOGO = path.resolve(__dirname, 'frontend/src/assets/logo.png');

function addLogo(slide) {
    slide.addImage({ path: LOGO, x: 0.4, y: 0.25, w: 1.4, h: 0.45 });
}
function addFooter(slide, num, total) {
    slide.addText('NexTurn Internal  |  Azure FinOps AI Platform  |  May 2026', {
        x: 0.5, y: 7.0, w: 12.3, h: 0.3, fontSize: 9, color: GRAY,
        align: 'center', fontFace: 'Arial'
    });
    slide.addText(`${num}/${total}`, {
        x: 12.0, y: 7.0, w: 1.0, h: 0.3, fontSize: 9, color: GRAY,
        align: 'right', fontFace: 'Arial'
    });
}

const TOTAL = 7;

// ═══════════════════════════════════════════════════════════════════
// SLIDE 1 — Title Slide
// ═══════════════════════════════════════════════════════════════════
let s1 = pptx.addSlide();
s1.background = { color: NAVY };
s1.addImage({ path: LOGO, x: 5.0, y: 0.8, w: 3.3, h: 1.1 });
s1.addText('Azure FinOps AI Platform', {
    x: 0.5, y: 2.3, w: 12.3, h: 1.0, fontSize: 40, bold: true,
    color: WHITE, align: 'center', fontFace: 'Arial'
});
s1.addShape(pptx.shapes.RECTANGLE, {
    x: 4.5, y: 3.4, w: 4.3, h: 0.06, fill: { color: BLUE }
});
s1.addText('ML-Powered Cost Anomaly Detection & Intelligent Auto-Tagging', {
    x: 1.0, y: 3.7, w: 11.3, h: 0.6, fontSize: 18,
    color: 'AABBDD', align: 'center', fontFace: 'Arial'
});
s1.addText('Kavya Bojja  •  Anomaly Detection Module\nLikhith Nariyam  •  Auto-Tagging Module', {
    x: 3.0, y: 4.8, w: 7.3, h: 0.9, fontSize: 14,
    color: 'CCDDEE', align: 'center', fontFace: 'Arial', lineSpacingMultiple: 1.5
});
s1.addText('Mentor: Raviteja Vedula', {
    x: 3.0, y: 5.8, w: 7.3, h: 0.4, fontSize: 13,
    color: GRAY, align: 'center', fontFace: 'Arial', italic: true
});
s1.addText('May 2026', {
    x: 3.0, y: 6.4, w: 7.3, h: 0.4, fontSize: 12,
    color: GRAY, align: 'center', fontFace: 'Arial'
});

// ═══════════════════════════════════════════════════════════════════
// SLIDE 2 — App Overview
// ═══════════════════════════════════════════════════════════════════
let s2 = pptx.addSlide();
s2.background = { color: WHITE };
addLogo(s2);
s2.addText('App Overview', {
    x: 2.2, y: 0.2, w: 8.0, h: 0.6, fontSize: 28, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s2.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 12.3, h: 0.04, fill: { color: BLUE }
});

// Problem box
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.2, w: 5.8, h: 2.5, fill: { color: LTBLUE }, rectRadius: 0.15
});
s2.addText('The Problem', {
    x: 0.8, y: 1.35, w: 5.2, h: 0.4, fontSize: 16, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s2.addText(
    '• Enterprise Azure spend grows unchecked — no real-time visibility\n' +
    '• Manual cost reviews miss anomalies buried in thousands of rows\n' +
    '• Untagged VMs create billing blind spots — 30%+ resources untracked\n' +
    '• Rule-based alerts fail at enterprise scale with diverse workloads',
    { x: 0.8, y: 1.8, w: 5.2, h: 1.7, fontSize: 12, color: DARK,
      fontFace: 'Arial', lineSpacingMultiple: 1.4, valign: 'top' }
);

// Solution box
s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.9, y: 1.2, w: 5.9, h: 2.5, fill: { color: 'F0FDF4' }, rectRadius: 0.15
});
s2.addText('Our Solution', {
    x: 7.2, y: 1.35, w: 5.3, h: 0.4, fontSize: 16, bold: true,
    color: GREEN, fontFace: 'Arial'
});
s2.addText(
    '• Isolation Forest ML model detects spend anomalies automatically\n' +
    '• Groq AI (Llama 3.3 70B) explains each anomaly in plain English\n' +
    '• Random Forest classifier auto-suggests missing resource tags\n' +
    '• Real-time dashboard with actionable insights for FinOps teams',
    { x: 7.2, y: 1.8, w: 5.3, h: 1.7, fontSize: 12, color: DARK,
      fontFace: 'Arial', lineSpacingMultiple: 1.4, valign: 'top' }
);

// Two modules
const mods = [
    { title: 'Module 1: Anomaly Detection', owner: 'Kavya Bojja', color: BLUE,
      items: 'Isolation Forest ML model\nGroq-powered AI explanations\nSeverity scoring (HIGH/MEDIUM)\nResource-level anomaly cards' },
    { title: 'Module 2: Auto-Tagging', owner: 'Likhith Nariyam', color: GREEN,
      items: 'Random Forest classifier\nConfidence-based tag suggestions\nGreen/Amber/Red badges\nBulk tag application' }
];
mods.forEach((m, i) => {
    const lx = 0.5 + i * 6.4;
    s2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: lx, y: 4.1, w: 5.8, h: 2.6, fill: { color: LTGRAY }, rectRadius: 0.15
    });
    s2.addShape(pptx.shapes.RECTANGLE, {
        x: lx, y: 4.1, w: 5.8, h: 0.5, fill: { color: m.color }, rectRadius: 0.15
    });
    s2.addText(m.title, {
        x: lx + 0.2, y: 4.15, w: 5.4, h: 0.4, fontSize: 14, bold: true,
        color: WHITE, fontFace: 'Arial'
    });
    s2.addText(m.owner, {
        x: lx + 0.3, y: 4.65, w: 5.2, h: 0.3, fontSize: 11,
        color: GRAY, fontFace: 'Arial', italic: true
    });
    s2.addText(m.items, {
        x: lx + 0.3, y: 5.0, w: 5.2, h: 1.5, fontSize: 12, color: DARK,
        fontFace: 'Arial', lineSpacingMultiple: 1.5, valign: 'top', bullet: true
    });
});
addFooter(s2, 2, TOTAL);

// ═══════════════════════════════════════════════════════════════════
// SLIDE 3 — System Architecture (detailed multi-zone)
// ═══════════════════════════════════════════════════════════════════
let s3 = pptx.addSlide();
s3.background = { color: WHITE };
addLogo(s3);
s3.addText('System Architecture', {
    x: 2.2, y: 0.2, w: 8.0, h: 0.6, fontSize: 28, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s3.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 12.3, h: 0.04, fill: { color: BLUE }
});

// ── ZONE 1: FRONTEND (purple) ──────────────────────────────────────
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 0.95, w: 12.3, h: 1.11, fill: { color: 'EDE9FE' }, rectRadius: 0.1,
    line: { color: '7C3AED', width: 2 }
});
s3.addText('FRONTEND  ·  React 18 + Vite  ·  localhost:5173', {
    x: 0.62, y: 0.97, w: 5.0, h: 0.22, fontSize: 9, bold: true,
    color: '4C1D95', fontFace: 'Arial'
});

const feBoxes = [
    { emoji: '🔒', title: 'Login Page',         sub: 'Session auth',    x: 0.62 },
    { emoji: '🏠', title: 'Home Dashboard',    sub: 'KPI overview',    x: 2.48 },
    { emoji: '🔍', title: 'Anomaly Detection', sub: 'Charts · AI Explain', x: 4.44 },
    { emoji: '🏷',  title: 'Auto-Tagging',      sub: 'Confidence · Bulk', x: 6.62 },
    { emoji: '📡', title: 'api.js',             sub: 'REST calls',      x: 8.53 },
    { emoji: '📊', title: 'Recharts',           sub: 'Line · Bar charts', x: 10.57 },
];
feBoxes.forEach(b => {
    s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: b.x, y: 1.16, w: 1.74, h: 0.76, fill: { color: b.title === 'api.js' || b.title === 'Recharts' ? '4C1D95' : '7C3AED' },
        rectRadius: 0.08, line: b.title === 'api.js' || b.title === 'Recharts'
            ? { color: 'C4B5FD', width: 1.5 }
            : { color: '7C3AED', width: 0 }
    });
    s3.addText(b.emoji + '\n' + b.title + '\n' + b.sub, {
        x: b.x, y: 1.16, w: 1.74, h: 0.76,
        fontSize: 8, color: WHITE, align: 'center', fontFace: 'Arial',
        lineSpacingMultiple: 1.2, valign: 'middle'
    });
});

// ── ARROW: FE → BE ─────────────────────────────────────────────────
s3.addText('↓ HTTP/REST', {
    x: 5.8, y: 2.06, w: 1.7, h: 0.24, fontSize: 11, bold: true,
    color: '6D28D9', align: 'center', fontFace: 'Arial'
});

// ── ZONE 2: BACKEND (blue) ─────────────────────────────────────────
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 2.30, w: 12.3, h: 1.14, fill: { color: 'DBEAFE' }, rectRadius: 0.1,
    line: { color: '1D4ED8', width: 2 }
});
s3.addText('BACKEND  ·  FastAPI  ·  Python 3.14  ·  localhost:8000', {
    x: 0.62, y: 2.32, w: 6.0, h: 0.22, fontSize: 9, bold: true,
    color: '1E3A8A', fontFace: 'Arial'
});

const beBoxes = [
    { emoji: '⚙',  title: 'main.py',          sub: 'CORS · Routers',    x: 0.62,  color: '1D4ED8', light: false },
    { emoji: '📋', title: 'anomalies.py',      sub: '/api/anomalies/*',  x: 2.36,  color: '1D4ED8', light: false },
    { emoji: '📋', title: 'tagging.py',        sub: '/api/tagging/*',    x: 4.44,  color: '1D4ED8', light: false },
    { emoji: '🧮', title: 'anomaly_engine.py', sub: 'Z-score · R2 · ratio', x: 6.40, color: '1E40AF', light: false },
    { emoji: '📂', title: 'data_loader.py',    sub: 'pandas · lru_cache', x: 8.48,  color: '1E40AF', light: false },
    { emoji: '🤖', title: 'grok_service.py',   sub: 'Groq API client',   x: 10.45, color: '166534', border: '4ADE80' },
];
beBoxes.forEach(b => {
    s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: b.x, y: 2.52, w: 1.74, h: 0.80, fill: { color: b.color },
        rectRadius: 0.08,
        line: b.border ? { color: b.border, width: 1.5 } : { color: b.color, width: 0 }
    });
    s3.addText(b.emoji + '\n' + b.title + '\n' + b.sub, {
        x: b.x, y: 2.52, w: 1.74, h: 0.80,
        fontSize: 7.5, color: WHITE, align: 'center', fontFace: 'Arial',
        lineSpacingMultiple: 1.2, valign: 'middle'
    });
});

// ── ARROW: BE → DATA ───────────────────────────────────────────────
s3.addText('↓ pandas read', {
    x: 5.7, y: 3.44, w: 1.9, h: 0.24, fontSize: 11, bold: true,
    color: '1D4ED8', align: 'center', fontFace: 'Arial'
});

// ── ZONE 3: DATA LAYER (slate) ─────────────────────────────────────
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 3.68, w: 12.3, h: 1.11, fill: { color: 'F1F5F9' }, rectRadius: 0.1,
    line: { color: '475569', width: 2 }
});
s3.addText('DATA LAYER  ·  Excel  ·  pandas  ·  lru_cache  ·  11 sheets', {
    x: 0.62, y: 3.70, w: 6.5, h: 0.22, fontSize: 9, bold: true,
    color: '1E293B', fontFace: 'Arial'
});

const dataBoxes = [
    { emoji: '💳', title: 'Billing_Data',       sub: '12,240 rows · hourly',  x: 0.62 },
    { emoji: '📈', title: 'Platform_Metrics',   sub: '48,960 rows · 15-min',  x: 3.04 },
    { emoji: '🗄',  title: 'Resource_Metadata',  sub: '17 Azure VMs',         x: 5.61 },
    { emoji: '🏷',  title: 'AI_Tagging',         sub: '14 suggestions',        x: 8.04 },
    { emoji: '⚠',  title: 'Anomaly_Summary',    sub: '5 types + 6 sheets',   x: 10.39 },
];
dataBoxes.forEach(b => {
    s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: b.x, y: 3.90, w: 2.05, h: 0.76, fill: { color: '334155' }, rectRadius: 0.08
    });
    s3.addText(b.emoji + '\n' + b.title + '\n' + b.sub, {
        x: b.x, y: 3.90, w: 2.05, h: 0.76,
        fontSize: 7.5, color: WHITE, align: 'center', fontFace: 'Arial',
        lineSpacingMultiple: 1.2, valign: 'middle'
    });
});

// ── ARROW: grok_service → Groq API ────────────────────────────────
s3.addText('↓ HTTPS', {
    x: 10.55, y: 3.32, w: 1.1, h: 0.40, fontSize: 10, bold: true,
    color: '059669', align: 'center', fontFace: 'Arial'
});

// ── ZONE 4: EXTERNAL AI (green) ───────────────────────────────────
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.87, y: 4.86, w: 4.93, h: 1.20, fill: { color: 'DCFCE7' }, rectRadius: 0.1,
    line: { color: '16A34A', width: 2 }
});
s3.addText('EXTERNAL AI  ·  Groq API  ·  api.groq.com  ·  HTTPS', {
    x: 8.00, y: 4.88, w: 4.70, h: 0.22, fontSize: 9, bold: true,
    color: '14532D', fontFace: 'Arial'
});

// Groq LLM box
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 8.00, y: 5.09, w: 1.86, h: 0.84, fill: { color: '16A34A' }, rectRadius: 0.08
});
s3.addText('🤖\nGroq LLM\nLlama 3.3 70B', {
    x: 8.00, y: 5.09, w: 1.86, h: 0.84,
    fontSize: 8, color: WHITE, align: 'center', fontFace: 'Arial',
    lineSpacingMultiple: 1.2, valign: 'middle'
});

// AI info panel
s3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 9.96, y: 5.09, w: 2.72, h: 0.84, fill: { color: '14532D' }, rectRadius: 0.08,
    line: { color: '4ADE80', width: 1 }
});
s3.addText(
    'AI: Explanation · Root cause · 3 Actions\n' +
    'Alternative · Confidence note\n' +
    'NOT AI: detection · tags · score',
    {
        x: 9.96, y: 5.09, w: 2.72, h: 0.84,
        fontSize: 7.5, color: 'BBF7D0', fontFace: 'Arial',
        lineSpacingMultiple: 1.3, valign: 'middle', align: 'left'
    }
);

addFooter(s3, 3, TOTAL);

// ═══════════════════════════════════════════════════════════════════
// SLIDE 4 — Tech Stack
// ═══════════════════════════════════════════════════════════════════
let s4 = pptx.addSlide();
s4.background = { color: WHITE };
addLogo(s4);
s4.addText('Tech Stack', {
    x: 2.2, y: 0.2, w: 8.0, h: 0.6, fontSize: 28, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s4.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 12.3, h: 0.04, fill: { color: BLUE }
});

const techCards = [
    { cat: 'Frontend', color: '4A90D9', items: ['React 18', 'Vite', 'Recharts', 'React Router', 'CSS3'] },
    { cat: 'Backend', color: '2E75B6', items: ['Python 3.11', 'FastAPI', 'Uvicorn', 'Pandas', 'OpenPyXL'] },
    { cat: 'ML / AI', color: '1A5276', items: ['scikit-learn', 'Isolation Forest', 'Random Forest', 'StandardScaler', 'Groq API'] },
    { cat: 'LLM', color: NAVY, items: ['Groq Cloud', 'Llama 3.3 70B', 'Prompt Engineering', 'JSON Responses', 'Rate Limiting'] },
    { cat: 'Data', color: GREEN, items: ['Excel Dataset', '60,000+ rows', '3 Sheets', '17 VMs', '4 Resource Groups'] },
    { cat: 'DevOps (V2)', color: AMBER, items: ['Azure AD', 'App Service', 'Key Vault', 'GitHub Actions', 'Docker'] },
];

techCards.forEach((tc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 0.5 + col * 4.2;
    const cy = 1.2 + row * 2.9;

    s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: 3.9, h: 2.5, fill: { color: LTGRAY }, rectRadius: 0.12
    });
    s4.addShape(pptx.shapes.RECTANGLE, {
        x: cx, y: cy, w: 3.9, h: 0.5, fill: { color: tc.color }, rectRadius: 0.1
    });
    s4.addText(tc.cat, {
        x: cx + 0.2, y: cy + 0.05, w: 3.5, h: 0.4, fontSize: 14, bold: true,
        color: WHITE, fontFace: 'Arial'
    });
    s4.addText(tc.items.join('\n'), {
        x: cx + 0.3, y: cy + 0.6, w: 3.3, h: 1.7, fontSize: 12, color: DARK,
        fontFace: 'Arial', lineSpacingMultiple: 1.5, valign: 'top', bullet: true
    });
});
addFooter(s4, 4, TOTAL);

// ═══════════════════════════════════════════════════════════════════
// SLIDE 5 — Dataset Overview
// ═══════════════════════════════════════════════════════════════════
let s5 = pptx.addSlide();
s5.background = { color: WHITE };
addLogo(s5);
s5.addText('Dataset Overview', {
    x: 2.2, y: 0.2, w: 8.0, h: 0.6, fontSize: 28, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s5.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 12.3, h: 0.04, fill: { color: BLUE }
});

// Stats callouts
const stats = [
    { num: '60,000+', label: 'Billing Records', color: BLUE },
    { num: '17', label: 'Virtual Machines', color: GREEN },
    { num: '4', label: 'Resource Groups', color: AMBER },
    { num: '3', label: 'Dataset Sheets', color: NAVY },
];
stats.forEach((st, i) => {
    const sx = 0.5 + i * 3.2;
    s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: 1.2, w: 2.9, h: 1.4, fill: { color: LTGRAY }, rectRadius: 0.12
    });
    s5.addText(st.num, {
        x: sx, y: 1.3, w: 2.9, h: 0.7, fontSize: 32, bold: true,
        color: st.color, align: 'center', fontFace: 'Arial'
    });
    s5.addText(st.label, {
        x: sx, y: 2.0, w: 2.9, h: 0.4, fontSize: 12,
        color: GRAY, align: 'center', fontFace: 'Arial'
    });
});

// 3 sheets table
const sheetRows = [
    ['Billing_Data', '60,000+ rows', 'ResourceID, CostUSD, Timestamp, SKU, Region, ReservationApplied, AnomalyFlag'],
    ['Platform_Metrics', '240,000+ rows', 'ResourceID, Timestamp, CPU_Percent, Memory_Percent, NetworkIn/Out_MB'],
    ['Resource_Metadata', '17 rows', 'ResourceID, Owner, ServiceName, Environment, SKU, Region, DepartmentTag, CostCenterTag'],
];
// Table header
s5.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 3.0, w: 12.3, h: 0.5, fill: { color: NAVY }
});
s5.addText('Sheet Name', { x: 0.6, y: 3.05, w: 2.5, h: 0.4, fontSize: 12, bold: true, color: WHITE, fontFace: 'Arial' });
s5.addText('Size', { x: 3.2, y: 3.05, w: 1.8, h: 0.4, fontSize: 12, bold: true, color: WHITE, fontFace: 'Arial' });
s5.addText('Key Columns', { x: 5.1, y: 3.05, w: 7.5, h: 0.4, fontSize: 12, bold: true, color: WHITE, fontFace: 'Arial' });

sheetRows.forEach((row, ri) => {
    const ry = 3.5 + ri * 0.65;
    const bg = ri % 2 === 0 ? LTGRAY : WHITE;
    s5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: ry, w: 12.3, h: 0.6, fill: { color: bg } });
    s5.addText(row[0], { x: 0.6, y: ry + 0.05, w: 2.5, h: 0.4, fontSize: 11, bold: true, color: NAVY, fontFace: 'Arial' });
    s5.addText(row[1], { x: 3.2, y: ry + 0.05, w: 1.8, h: 0.4, fontSize: 11, color: DARK, fontFace: 'Arial' });
    s5.addText(row[2], { x: 5.1, y: ry + 0.05, w: 7.5, h: 0.5, fontSize: 10, color: DARK, fontFace: 'Arial' });
});

// VM groups
s5.addText('Resource Groups:', {
    x: 0.5, y: 5.6, w: 12.3, h: 0.4, fontSize: 14, bold: true, color: NAVY, fontFace: 'Arial'
});
const groups = [
    { name: 'rg-finance', vms: 'vm-01 to vm-05', color: BLUE },
    { name: 'rg-ml', vms: 'vm-06 to vm-09', color: GREEN },
    { name: 'rg-infra', vms: 'vm-10 to vm-14', color: AMBER },
    { name: 'rg-search', vms: 'vm-15 to vm-17', color: NAVY },
];
groups.forEach((g, i) => {
    const gx = 0.5 + i * 3.2;
    s5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: gx, y: 6.05, w: 2.9, h: 0.7, fill: { color: g.color }, rectRadius: 0.1
    });
    s5.addText(`${g.name}\n${g.vms}`, {
        x: gx, y: 6.1, w: 2.9, h: 0.6, fontSize: 11, color: WHITE,
        align: 'center', fontFace: 'Arial', lineSpacingMultiple: 1.3
    });
});
addFooter(s5, 5, TOTAL);

// ═══════════════════════════════════════════════════════════════════
// SLIDE 6 — Live Demo Placeholder
// ═══════════════════════════════════════════════════════════════════
let s6 = pptx.addSlide();
s6.background = { color: NAVY };
addFooter(s6, 6, TOTAL);
s6.addImage({ path: LOGO, x: 5.0, y: 1.2, w: 3.3, h: 1.1 });
s6.addText('Live Demo', {
    x: 1.0, y: 2.8, w: 11.3, h: 0.9, fontSize: 40, bold: true,
    color: WHITE, align: 'center', fontFace: 'Arial'
});
s6.addShape(pptx.shapes.RECTANGLE, {
    x: 5.0, y: 3.75, w: 3.3, h: 0.05, fill: { color: BLUE }
});
s6.addText(
    '1. Login & Dashboard Overview\n' +
    '2. Anomaly Detection — ML-flagged cost spikes with AI explanations\n' +
    '3. Auto-Tagging — Confidence-based tag suggestions\n' +
    '4. Groq AI — Real-time anomaly explanation generation',
    { x: 2.0, y: 4.2, w: 9.3, h: 2.0, fontSize: 16, color: 'AABBDD',
      align: 'center', fontFace: 'Arial', lineSpacingMultiple: 1.6 }
);

// ═══════════════════════════════════════════════════════════════════
// SLIDE 7 — Future Roadmap & Thank You
// ═══════════════════════════════════════════════════════════════════
let s7 = pptx.addSlide();
s7.background = { color: WHITE };
addLogo(s7);
s7.addText('Future Roadmap & V2 Plan', {
    x: 2.2, y: 0.2, w: 8.0, h: 0.6, fontSize: 28, bold: true,
    color: NAVY, fontFace: 'Arial'
});
s7.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 0.85, w: 12.3, h: 0.04, fill: { color: BLUE }
});

const roadmap = [
    { phase: 'V2 Phase 1', time: 'Week 1-2', color: BLUE, items: 'Live Azure Cost Management API\nAzure Monitor real-time metrics\nAzure AD SSO authentication' },
    { phase: 'V2 Phase 2', time: 'Week 3-4', color: GREEN, items: 'Azure App Service deployment\nCI/CD with GitHub Actions\nKey Vault secret management' },
    { phase: 'V2 Phase 3', time: 'Week 5-6', color: AMBER, items: 'Agentic AI chatbot (no predefined flows)\nNatural language to SQL queries\nMulti-subscription support' },
];
roadmap.forEach((r, i) => {
    const rx = 0.5 + i * 4.2;
    s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: rx, y: 1.2, w: 3.9, h: 2.8, fill: { color: LTGRAY }, rectRadius: 0.12
    });
    s7.addShape(pptx.shapes.RECTANGLE, {
        x: rx, y: 1.2, w: 3.9, h: 0.55, fill: { color: r.color }, rectRadius: 0.1
    });
    s7.addText(r.phase, {
        x: rx + 0.2, y: 1.25, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: 'Arial'
    });
    s7.addText(r.time, {
        x: rx + 2.5, y: 1.25, w: 1.2, h: 0.4, fontSize: 10, color: 'D0E0F0', align: 'right', fontFace: 'Arial'
    });
    s7.addText(r.items, {
        x: rx + 0.3, y: 1.9, w: 3.3, h: 1.8, fontSize: 12, color: DARK,
        fontFace: 'Arial', lineSpacingMultiple: 1.5, valign: 'top', bullet: true
    });
});

// Thank you section
s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 1.5, y: 4.5, w: 10.3, h: 2.2, fill: { color: NAVY }, rectRadius: 0.15
});
s7.addText('Thank You!', {
    x: 1.5, y: 4.65, w: 10.3, h: 0.7, fontSize: 30, bold: true,
    color: WHITE, align: 'center', fontFace: 'Arial'
});
s7.addText('Kavya Bojja  •  Likhith Nariyam\nMentor: Raviteja Vedula', {
    x: 1.5, y: 5.3, w: 10.3, h: 0.6, fontSize: 14,
    color: 'AABBDD', align: 'center', fontFace: 'Arial', lineSpacingMultiple: 1.4
});
s7.addText('GitHub: github.com/KavyaSree123-dev/Azure-AI-FinOps-App', {
    x: 1.5, y: 6.0, w: 10.3, h: 0.4, fontSize: 11,
    color: GRAY, align: 'center', fontFace: 'Arial'
});
addFooter(s7, 7, TOTAL);

// ═══════════════════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════════════════
const outPath = path.resolve(__dirname, '..', 'Azure_FinOps_AI_Presentation.pptx');
pptx.writeFile({ fileName: outPath })
    .then(() => console.log(`Done! Saved to: ${outPath}`))
    .catch(err => console.error('Error:', err));
