import axios from 'axios';
import { jsPDF } from 'jspdf';
import qrCodePng from '@/assets/qr-code.png';

import { useAuthStore } from '../stores/useAuthStore';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const authStore = useAuthStore();

// 2) Set up jsPDF for Avery 6460/5160
const pageWidth = 8.5 * 72; // ~612 pt
const pageHeight = 11 * 72; // ~792 pt
const labelWidth = 2.625 * 72; // ~189 pt
const labelHeight = 1 * 72; // 72 pt
const marginX = 0.19 * 72; // ~13.7 pt
const marginY = 0.5 * 72; // 36 pt
const gapX = 0.125 * 72; // 9 pt

// We'll leave room for the QR code by limiting max text width
const maxTextWidth = labelWidth - 50; // ~139 pt for text

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'pt',
  format: [pageWidth, pageHeight],
});

const labelsPerPage = 30; // 3 columns x 10 rows
let labelIndex = 0;

// Font config
const BASE_FONT = 'helvetica';
const BASE_FONT_SIZE = 10;
const MIN_FONT_SIZE = 6;
// We'll define line spacing as (fontSize + 2)
const EXTRA_LINE_SPACING = 2;

/**
 * printLineOrWrap:
 *  - Tries to print `text` on a single line if it fits horizontally
 *  - If it doesn't fit, we wrap the text across multiple lines
 *  - If those lines still don't fit vertically, we shrink the font until it does
 */
function printLineOrWrap(
  text: string,
  xLeft: number,
  yRef: { value: number },
  labelBottom: number
) {
  let fontSize = BASE_FONT_SIZE;

  while (fontSize >= MIN_FONT_SIZE) {
    doc.setFont(BASE_FONT, 'normal');
    doc.setFontSize(fontSize);

    const lineSpacing = fontSize + EXTRA_LINE_SPACING;

    // Measure the width if we put all text on one line
    const textWidth = doc.getTextWidth(text);

    // 1) Single-line fit check
    if (textWidth <= maxTextWidth && yRef.value + lineSpacing <= labelBottom) {
      // Single-line fits
      doc.text(text, xLeft, yRef.value);
      yRef.value += lineSpacing;
      break;
    } else {
      // Single-line doesn't fit horizontally or vertically -> wrap
      const wrappedLines = doc.splitTextToSize(text, maxTextWidth);
      const totalHeight = wrappedLines.length * lineSpacing;

      if (yRef.value + totalHeight <= labelBottom || fontSize <= MIN_FONT_SIZE) {
        // Either it fits or can't shrink further
        for (const line of wrappedLines) {
          doc.text(line, xLeft, yRef.value);
          yRef.value += lineSpacing;
        }
        break;
      } else {
        // Shrink font size and try again
        fontSize -= 1;
      }
    }
  }
}

const generateLabelsPDF = async (projectByScopeId: number) => {
  try {
    // 1) Fetch your data via the proxy
    const userRoles = authStore.userInfo?.clientPrincipal?.userRoles.join(',') || '';

    const response = await axios.post(
      `${apiBaseUrl}/api-proxy`,
      {
        userRoles,
        targetUrl: `${apiBaseUrl}/ihi-project/${projectByScopeId}/units-info`,
        targetMethodType: 'GET',
      },
      { timeout: 10000 }
    );

    const data = response.data;
    if (!Array.isArray(data.unitsByScope)) {
      throw new Error('Response data is not an array of units.');
    }

    // 3) Loop through each unit, generate labels
    for (const unit of data.unitsByScope) {
      const pageNumber = Math.floor(labelIndex / labelsPerPage);
      const labelPosition = labelIndex % labelsPerPage;

      if (labelPosition === 0 && pageNumber > 0) {
        doc.addPage();
      }

      const col = labelPosition % 3;
      const row = Math.floor(labelPosition / 3);

      const x = marginX + col * (labelWidth + gapX);
      const y = marginY + row * labelHeight;

      // Remove the border by commenting out or removing these lines:
      // doc.setLineWidth(0.5);
      // doc.rect(x, y, labelWidth, labelHeight);

      // We'll track the current Y in an object
      const textY = { value: y + 12 };
      const labelBottom = y + labelHeight;

      // Print lines (all normal font)
      doc.setFont(BASE_FONT, 'normal');
      doc.setFontSize(BASE_FONT_SIZE);

      printLineOrWrap('CP Build Enterprises', x + 5, textY, labelBottom);
      printLineOrWrap('Install Team: IHI', x + 5, textY, labelBottom);
      printLineOrWrap(`Project: ${data.projectName ?? ''}`, x + 5, textY, labelBottom);

      // Bldg line
      const bldgLine = `Bldg: ${unit.building ?? ''}, Lvl: ${unit.building_level ?? ''}, Unit: ${
        unit.unit ?? ''
      }`;
      printLineOrWrap(bldgLine, x + 5, textY, labelBottom);

      // Add QR code on the right
      doc.addImage(qrCodePng, 'PNG', x + labelWidth - 46, y + 10, 36, 36);

      labelIndex++;
    }

    // 4) Save PDF
    doc.save('labels.pdf');
  } catch (error) {
    console.error('Error generating labels PDF:', error);
  }
};

export default generateLabelsPDF;
