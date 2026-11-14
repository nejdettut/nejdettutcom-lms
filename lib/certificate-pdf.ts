import "server-only";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

// Inter is a Turkish-capable Unicode font embedded as TTF. StandardFonts
// (Helvetica/TimesRoman) use WinAnsi encoding and throw on ş/ı/ğ/İ/ç.
// Repair stray U+FFFD before drawing (appears if upstream encoding
// mangled bytes during insert).
function clean(s: string): string {
  return s.replace(/�/g, "?");
}

const REG_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSans-Regular.ttf",
);
const BOLD_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSans-Bold.ttf",
);

let cachedRegular: Uint8Array | null = null;
let cachedBold: Uint8Array | null = null;
async function loadRegular(): Promise<Uint8Array> {
  if (cachedRegular) return cachedRegular;
  cachedRegular = new Uint8Array(await fs.readFile(REG_PATH));
  return cachedRegular;
}
async function loadBold(): Promise<Uint8Array> {
  if (cachedBold) return cachedBold;
  cachedBold = new Uint8Array(await fs.readFile(BOLD_PATH));
  return cachedBold;
}

type Input = {
  verificationCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  completedAt: Date;
  verifyUrl: string;
};

export async function renderCertificatePdf(input: Input): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // A4 landscape: 842 × 595 pt
  const page = pdf.addPage([842, 595]);

  const [regBytes, boldBytes] = await Promise.all([loadRegular(), loadBold()]);
  // Static Noto Sans — proper glyph outlines (variable fonts broke rendering
  // via pdf-lib fontkit). subset:true keeps PDF small by embedding only used
  // glyphs.
  const sans = await pdf.embedFont(regBytes, { subset: false });
  const sansBold = await pdf.embedFont(boldBytes, { subset: false });

  const ink = rgb(0.059, 0.09, 0.165); // slate-900
  const accent = rgb(0.055, 0.647, 0.914); // sky-500
  const line = rgb(0.682, 0.733, 0.812); // slate-400

  // Outer border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: 782,
    height: 535,
    borderColor: line,
    borderWidth: 1.5,
  });
  // Inner accent line
  page.drawRectangle({
    x: 42,
    y: 42,
    width: 758,
    height: 511,
    borderColor: accent,
    borderWidth: 0.6,
  });

  // Top accent band
  page.drawRectangle({
    x: 42,
    y: 500,
    width: 758,
    height: 3,
    color: accent,
  });

  // Issuer brand strip
  page.drawText("Z", {
    x: 70,
    y: 515,
    size: 26,
    font: sansBold,
    color: accent,
  });
  page.drawText("nejdettut.com · LMS", {
    x: 100,
    y: 522,
    size: 11,
    font: sans,
    color: ink,
  });

  // Title
  page.drawText("Katılım Sertifikası", {
    x: 180,
    y: 420,
    size: 36,
    font: sansBold,
    color: ink,
  });

  // Subtitle
  page.drawText("Certificate of Completion", {
    x: 215,
    y: 395,
    size: 14,
    font: sans,
    color: accent,
  });

  // "bu sertifika" line
  page.drawText("Bu sertifika", {
    x: 60,
    y: 340,
    size: 14,
    font: sans,
    color: ink,
  });

  // Student name — centered, bold
  const name = clean(input.studentName);
  const nameSize = name.length > 40 ? 24 : name.length > 25 ? 32 : 40;
  const nameWidth = sansBold.widthOfTextAtSize(name, nameSize);
  page.drawText(name, {
    x: (842 - nameWidth) / 2,
    y: 285,
    size: nameSize,
    font: sansBold,
    color: ink,
  });

  // Course line
  const line2 = clean(
    `${input.courseTitle} kursunu başarıyla tamamlamıştır.`,
  );
  const line2Width = sans.widthOfTextAtSize(line2, 14);
  page.drawText(line2, {
    x: (842 - line2Width) / 2,
    y: 235,
    size: 14,
    font: sans,
    color: ink,
  });

  // Footer: instructor + date
  page.drawText(`Eğitmen: ${clean(input.instructorName)}`, {
    x: 70,
    y: 160,
    size: 12,
    font: sans,
    color: ink,
  });
  const dateStr = input.completedAt.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(`Tamamlanma: ${dateStr}`, {
    x: 70,
    y: 142,
    size: 12,
    font: sans,
    color: ink,
  });

  // Verification box (right)
  page.drawRectangle({
    x: 560,
    y: 100,
    width: 220,
    height: 80,
    borderColor: line,
    borderWidth: 0.6,
  });
  page.drawText("Doğrulama", {
    x: 572,
    y: 160,
    size: 9,
    font: sans,
    color: ink,
  });
  page.drawText(input.verificationCode, {
    x: 572,
    y: 138,
    size: 14,
    font: sans,
    color: accent,
  });
  page.drawText(input.verifyUrl, {
    x: 572,
    y: 118,
    size: 8,
    font: sans,
    color: ink,
  });

  // Page footer
  page.drawText(
    "nejdettut.com — Bu sertifika yukarıdaki kodla çevrimiçi doğrulanabilir.",
    { x: 70, y: 60, size: 9, font: sans, color: ink },
  );

  return pdf.save();
}
