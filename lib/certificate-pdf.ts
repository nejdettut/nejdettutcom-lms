import "server-only";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
  // A4 landscape: 842 × 595 pt
  const page = pdf.addPage([842, 595]);

  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifLight = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

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
    font: serif,
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
    font: serif,
    color: ink,
  });

  // Subtitle
  page.drawText("Certificate of Completion", {
    x: 215,
    y: 395,
    size: 14,
    font: serifLight,
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

  // Student name — centered
  const name = input.studentName;
  const nameSize = name.length > 40 ? 24 : name.length > 25 ? 32 : 40;
  const nameWidth = serif.widthOfTextAtSize(name, nameSize);
  page.drawText(name, {
    x: (842 - nameWidth) / 2,
    y: 285,
    size: nameSize,
    font: serif,
    color: ink,
  });

  // Course line
  const line2 = `${input.courseTitle} kursunu başarıyla tamamlamıştır.`;
  const line2Width = sans.widthOfTextAtSize(line2, 14);
  page.drawText(line2, {
    x: (842 - line2Width) / 2,
    y: 235,
    size: 14,
    font: sans,
    color: ink,
  });

  // Footer: instructor + date
  page.drawText(`Eğitmen: ${input.instructorName}`, {
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
    font: serif,
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
