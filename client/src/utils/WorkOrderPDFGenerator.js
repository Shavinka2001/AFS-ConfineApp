import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================
// CONSOLIDATION LOGIC
// ============================

const consolidateEntries = (entries = []) => {
  const consolidated = [];
  const groupMap = new Map();

  entries.forEach((entry, index) => {
    const key = `${entry.building || 'N/A'}|||${entry.locationDescription || 'N/A'}|||${entry.confinedSpaceDescription || 'N/A'}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push({ ...entry, originalIndex: index });
  });

  groupMap.forEach(group => {
    consolidated.push(
      group.length === 1
        ? cleanSingleEntry(group[0])
        : consolidateGroup(group)
    );
  });

  return consolidated;
};

const cleanSingleEntry = (entry) => {
  const clean = { ...entry };
  delete clean.originalIndex;
  return clean;
};

const consolidateGroup = (group) => {
  const base = { ...group[0] };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))];

  const text = (field) =>
    uniq(group.map(e => e[field]).filter(v => typeof v === 'string' && v.trim()))
      .join('. ') || 'N/A';

  const bool = (field) => group.some(e => e[field] === true);

  const date = (field) =>
    group.map(e => e[field]).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;

  const orderedMedia = (field) => {
    const sorted = [...group].sort((a, b) => a.originalIndex - b.originalIndex);
    const out = [];
    const seen = new Set();
    sorted.forEach(e => {
      const items = Array.isArray(e[field]) ? e[field] : e[field] ? [e[field]] : [];
      items.forEach(i => {
        const key = String(i);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(i);
        }
      });
    });
    return out;
  };

  const uniqueIds = uniq(
    group.map(e => e.uniqueId || e._id?.slice(-4).padStart(4, '0'))
  );

  return {
    ...base,

    uniqueId: uniqueIds.join(', '),
    confinedSpaceNameOrId: uniq(group.map(e => e.confinedSpaceNameOrId)).join(', '),

    dateOfSurvey: date('dateOfSurvey'),
    surveyors: uniq(group.flatMap(e => e.surveyors || [])),

    entryRequirements: text('entryRequirements'),
    atmosphericHazardDescription: text('atmosphericHazardDescription'),
    engulfmentHazardDescription: text('engulfmentHazardDescription'),
    configurationHazardDescription: text('configurationHazardDescription'),
    otherHazardsDescription: text('otherHazardsDescription'),
    ppeList: text('ppeList'),
    notes: text('notes'),

    confinedSpace: bool('confinedSpace'),
    permitRequired: bool('permitRequired'),
    atmosphericHazard: bool('atmosphericHazard'),
    engulfmentHazard: bool('engulfmentHazard'),
    configurationHazard: bool('configurationHazard'),
    otherRecognizedHazards: bool('otherRecognizedHazards'),
    ppeRequired: bool('ppeRequired'),
    forcedAirVentilationSufficient: bool('forcedAirVentilationSufficient'),
    dedicatedContinuousAirMonitor: bool('dedicatedContinuousAirMonitor'),
    warningSignPosted: bool('warningSignPosted'),
    otherPeopleWorkingNearSpace: bool('otherPeopleWorkingNearSpace'),
    canOthersSeeIntoSpace: bool('canOthersSeeIntoSpace'),
    contractorsEnterSpace: bool('contractorsEnterSpace'),

    numberOfEntryPoints: text('numberOfEntryPoints'),

    pictures: orderedMedia('pictures'),
    images: orderedMedia('images'),

    _consolidated: true,
    _originalEntryCount: group.length,
    _originalIndexes: group.map(e => e.originalIndex),
    _consolidatedSpaceIds: uniqueIds
  };
};

// ============================
// PDF GENERATION
// ============================

export const handleDownloadFilteredPDF = async (orders = [], sortBy) => {
  if (!orders || orders.length === 0) {
    console.warn("No work orders to export.");
    return;
  }

  try {
    // Sort orders if needed
    const sortedOrders = orders; // implement getSortedOrdersForExport if needed

    const consolidatedEntries = consolidateEntries(sortedOrders);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const imageMaxWidth = 150;
    const imageMaxHeight = 80;

    const getImageUrl = (imgPath) => {
      if (!imgPath) return '';
      if (imgPath.startsWith('data:') || imgPath.startsWith('http')) return imgPath;
      const API_BASE_URL = import.meta.env.VITE_API_URL_CONFINE || 'http://localhost:5002';
      return imgPath.startsWith('/image/') ? `${API_BASE_URL}${imgPath}` : `${API_BASE_URL}/${imgPath}`;
    };

    let currentY = margin;
    let pageNumber = 1;
    const totalGroups = consolidatedEntries.length;

    for (let i = 0; i < consolidatedEntries.length; i++) {
      const entry = consolidatedEntries[i];

      if (pageNumber > 1) {
        doc.addPage();
        currentY = margin;
      }

      // HEADER
      doc.setFontSize(16).setFont('helvetica', 'bold');
      doc.text('CONFINED SPACE ASSESSMENT', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      doc.setFontSize(10).setFont('helvetica', 'normal');
      doc.text(`Building: ${entry.building || 'N/A'}`, margin, currentY);
      doc.text(`Location: ${entry.locationDescription || 'N/A'}`, margin, currentY + 15);
      doc.text(`Space: ${entry.confinedSpaceDescription || 'N/A'}`, margin, currentY + 30);

      if (entry._consolidated) {
        doc.text(`Consolidated Report: ${entry._originalEntryCount} Spaces`, margin, currentY + 45);
        doc.text(`IDs: ${entry.uniqueId}`, margin, currentY + 60);
        currentY += 75;
      } else {
        doc.text(`Work Order ID: ${entry.uniqueId || 'N/A'}`, margin, currentY + 45);
        currentY += 60;
      }

      // LOAD IMAGES
      const picturesList = Array.isArray(entry.pictures) ? entry.pictures : (entry.pictures ? [entry.pictures] : []);
      const imagesList = Array.isArray(entry.images) ? entry.images : (entry.images ? [entry.images] : []);
      const imagePaths = [...picturesList, ...imagesList];

      const imgInfos = new Array(imagePaths.length);
      const allImagePromises = imagePaths.map((imgPath, idx) => {
        const imageUrl = getImageUrl(imgPath);
        return new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            const ratio = Math.min(imageMaxWidth / img.width, imageMaxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;

            const canvas = document.createElement('canvas');
            canvas.width = width * 4;
            canvas.height = height * 4;
            const ctx = canvas.getContext('2d');
            ctx.scale(4, 4);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            imgInfos[idx] = { dataUrl: canvas.toDataURL('image/png', 1.0), width, height };
            resolve();
          };
          img.onerror = () => resolve();
          img.src = imageUrl;
        });
      });

      await Promise.all(allImagePromises);
      const orderedImgInfos = imgInfos.filter(Boolean);

      // DETAILS TABLE
      const detailsText = `
Date: ${entry.dateOfSurvey?.slice(0, 10) || 'N/A'}
Surveyors: ${Array.isArray(entry.surveyors) ? entry.surveyors.join(", ") : entry.surveyors || 'N/A'}
Space Name/ID: ${entry.confinedSpaceNameOrId || 'N/A'}

Confined Space: ${entry.confinedSpace ? 'Yes' : 'No'}
Permit Required: ${entry.permitRequired ? 'Yes' : 'No'}
Entry Requirements: ${entry.entryRequirements || 'N/A'}

HAZARDS:
• Atmospheric: ${entry.atmosphericHazard ? 'Yes' : 'No'} - ${entry.atmosphericHazardDescription || 'N/A'}
• Engulfment: ${entry.engulfmentHazard ? 'Yes' : 'No'} - ${entry.engulfmentHazardDescription || 'N/A'}
• Configuration: ${entry.configurationHazard ? 'Yes' : 'No'} - ${entry.configurationHazardDescription || 'N/A'}
• Other: ${entry.otherRecognizedHazards ? 'Yes' : 'No'} - ${entry.otherHazardsDescription || 'N/A'}

SAFETY:
• PPE Required: ${entry.ppeRequired ? 'Yes' : 'No'}
• PPE List: ${entry.ppeList || 'N/A'}
• Forced Air Ventilation: ${entry.forcedAirVentilationSufficient ? 'Sufficient' : 'Insufficient'}
• Dedicated Monitor: ${entry.dedicatedContinuousAirMonitor ? 'Yes' : 'No'}
• Warning Sign: ${entry.warningSignPosted ? 'Yes' : 'No'}
• Entry Points: ${entry.numberOfEntryPoints || 'N/A'}

Notes:
${entry.notes || 'N/A'}
      `.trim();

      const tableData = [
        [
          { content: entry._consolidated ? `Consolidated: ${entry.building}` : `Work Order: ${entry.building}`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } }
        ],
        [
          { content: `Building: ${entry.building}`, styles: { fontStyle: 'bold' } },
          { content: 'Photographic Documentation', styles: { fontStyle: 'bold', halign: 'center' } }
        ],
        [
          { content: detailsText, styles: { valign: 'top', fontSize: 10 } },
          { content: '', styles: { valign: 'top', halign: 'center' } }
        ]
      ];

      autoTable(doc, {
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 8 },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } },
        didParseCell: (data) => {
          if (data.row.index === 2 && data.column.index === 1 && orderedImgInfos.length > 0) {
            const gap = 5, padding = 2;
            const requiredHeight = orderedImgInfos.length * (imageMaxHeight + gap) - gap + padding * 2;
            if (requiredHeight > (data.cell.styles.minCellHeight || 0)) data.cell.styles.minCellHeight = requiredHeight;
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 2 && data.column.index === 1 && orderedImgInfos.length > 0) {
            const gap = 5, padding = 2;
            const colWidth = data.cell.width - padding * 2;
            orderedImgInfos.forEach((img, idx) => {
              const x = data.cell.x + padding;
              const y = data.cell.y + padding + idx * (imageMaxHeight + gap);
              doc.addImage(img.dataUrl, 'PNG', x, y, Math.min(img.width, colWidth), Math.min(img.height, imageMaxHeight));
            });
          }
        }
      });

      let signatureY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(12).setFont('helvetica', 'bold');
      doc.text("ASSESSOR SIGNATURE", margin, signatureY);
      doc.setFontSize(10).setFont('helvetica', 'normal');
      const allSurveyors = Array.isArray(entry.surveyors) ? [...new Set(entry.surveyors.filter(Boolean))] : [];
      doc.text(`Name: ${allSurveyors.join(", ") || 'N/A'}`, margin, signatureY + 15);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, signatureY + 30);

      doc.setFontSize(8);
      doc.text(`Page ${pageNumber} of ${totalGroups}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      pageNumber++;
      if (i < consolidatedEntries.length - 1) await new Promise(r => setTimeout(r, 100));
    }

    doc.save('confined-space-work-orders.pdf');

    const savedReports = orders.length - consolidatedEntries.length;
    console.log(`Generated ${consolidatedEntries.length} PDF reports! Saved ${savedReports} duplicates through consolidation.`);

  } catch (error) {
    console.error('Error generating PDFs:', error);
    throw error;
  }
};

// ============================
// EXPORT ALIASES FOR COMPATIBILITY
// ============================

export const generateConsolidatedPDF = async (workOrders, options = {}) => {
  const { filename = 'work-orders-consolidated.pdf' } = options;
  await handleDownloadFilteredPDF(workOrders);
};

export const generateDetailedPDF = async (workOrders, options = {}) => {
  const { filename = 'work-orders-detailed.pdf' } = options;
  await handleDownloadFilteredPDF(workOrders);
};

export const generateSummaryTablePDF = async (workOrders, options = {}) => {
  const { filename = 'work-orders-summary.pdf' } = options;
  await handleDownloadFilteredPDF(workOrders);
};

export const consolidateWorkOrderData = consolidateEntries;

export default {
  generateConsolidatedPDF,
  generateDetailedPDF,
  generateSummaryTablePDF,
  consolidateWorkOrderData,
  handleDownloadFilteredPDF
};
