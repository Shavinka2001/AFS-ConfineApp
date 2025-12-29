import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Debug logger for incoming data
 */
const debugLogData = (entry, index) => {
  console.group(`PDF Data Debug - Entry ${index + 1}`);
  console.log('Full Entry Object:', entry);
  console.log('Date Fields:', {
    dateOfSurvey: entry.dateOfSurvey,
    surveyDate: entry.surveyDate,
    createdAt: entry.createdAt
  });
  console.log('Surveyor Fields:', {
    surveyors: entry.surveyors,
    surveyorName: entry.surveyorName,
    technician: entry.technician,
    createdBy: entry.createdBy
  });
  console.log('Space Fields:', {
    confinedSpaceNameOrId: entry.confinedSpaceNameOrId,
    spaceName: entry.spaceName,
    spaceId: entry.spaceId
  });
  console.log('Entry Points:', {
    numberOfEntryPoints: entry.numberOfEntryPoints,
    entryPoints: entry.entryPoints
  });
  console.log('Image Fields:', {
    pictures: entry.pictures,
    images: entry.images,
    photos: entry.photos,
    attachments: entry.attachments
  });
  console.groupEnd();
};

/**
 * Extract date from multiple possible fields
 */
const extractDate = (entry) => {
  const dateFields = ['dateOfSurvey', 'surveyDate', 'date', 'createdAt'];
  for (const field of dateFields) {
    if (entry[field]) {
      try {
        const date = new Date(entry[field]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 10);
        }
      } catch (e) {
        console.warn(`Invalid date format in ${field}:`, entry[field]);
      }
    }
  }
  return null;
};

/**
 * Extract surveyors from multiple possible fields
 */
const extractSurveyors = (entry) => {
  // Check array field first
  if (Array.isArray(entry.surveyors) && entry.surveyors.length > 0) {
    return entry.surveyors;
  }
  
  // Check string surveyors field
  if (entry.surveyors && typeof entry.surveyors === 'string') {
    return [entry.surveyors];
  }
  
  // Check alternative fields
  const nameFields = ['surveyorName', 'technician', 'createdBy', 'assignedTechnician'];
  for (const field of nameFields) {
    if (entry[field]) {
      if (Array.isArray(entry[field])) {
        return entry[field];
      }
      if (typeof entry[field] === 'string') {
        return [entry[field]];
      }
      if (entry[field].name || entry[field].fullName) {
        return [entry[field].name || entry[field].fullName];
      }
    }
  }
  
  return [];
};

/**
 * Extract space name/ID from multiple possible fields
 */
const extractSpaceNameOrId = (entry) => {
  const nameFields = ['confinedSpaceNameOrId', 'spaceName', 'spaceId', 'spaceNumber'];
  for (const field of nameFields) {
    if (entry[field] && String(entry[field]).trim()) {
      return String(entry[field]).trim();
    }
  }
  return null;
};

/**
 * Extract entry points from multiple possible fields
 */
const extractEntryPoints = (entry) => {
  const entryFields = ['numberOfEntryPoints', 'entryPoints', 'entryPointCount'];
  for (const field of entryFields) {
    if (entry[field]) {
      return String(entry[field]);
    }
  }
  return null;
};

/**
 * Convert image URL to base64 with CORS handling
 */
const loadImageAsBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Use higher resolution for better quality
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(dataUrl);
      } catch (error) {
        console.error('Canvas conversion error:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Image load error for URL:', imageUrl, error);
      reject(new Error(`Failed to load image: ${imageUrl}`));
    };
    
    // Add timestamp to prevent caching issues
    const urlWithTimestamp = imageUrl.includes('?') 
      ? `${imageUrl}&t=${Date.now()}`
      : `${imageUrl}?t=${Date.now()}`;
    
    img.src = urlWithTimestamp;
  });
};

// ============================
// CONSOLIDATION LOGIC
// ============================

const consolidateEntries = (entries = []) => {
  console.log('Starting consolidation with', entries.length, 'entries');
  const consolidated = [];
  const groupMap = new Map();

  entries.forEach((entry, index) => {
    // Debug log each entry
    debugLogData(entry, index);
    
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

  console.log('Consolidation complete:', consolidated.length, 'consolidated entries');
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
      .join('. ') || null;

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
    group.map(e => e.uniqueId || e.workOrderId || e._id?.slice(-4).padStart(4, '0'))
  );

  // Extract surveyors from all entries
  const allSurveyors = [];
  group.forEach(entry => {
    const surveyors = extractSurveyors(entry);
    surveyors.forEach(s => {
      if (s && !allSurveyors.includes(s)) {
        allSurveyors.push(s);
      }
    });
  });

  return {
    ...base,

    uniqueId: uniqueIds.join(', '),
    confinedSpaceNameOrId: uniq(group.map(e => extractSpaceNameOrId(e)).filter(Boolean)).join(', ') || null,

    dateOfSurvey: date('dateOfSurvey') || date('surveyDate') || date('createdAt'),
    surveyors: allSurveyors.length > 0 ? allSurveyors : null,

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

    numberOfEntryPoints: uniq(group.map(e => extractEntryPoints(e)).filter(Boolean)).join(', ') || null,

    pictures: orderedMedia('pictures'),
    images: orderedMedia('images'),
    photos: orderedMedia('photos'),
    attachments: orderedMedia('attachments'),

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
    return { success: false, message: "No work orders to export" };
  }

  try {
    console.log('Starting PDF generation for', orders.length, 'orders');
    
    // Sort orders if needed
    const sortedOrders = orders;

    const consolidatedEntries = consolidateEntries(sortedOrders);
    console.log('Consolidated into', consolidatedEntries.length, 'entries');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const imageMaxWidth = 200;
    const imageMaxHeight = 150;

    const getImageUrl = (imgPath) => {
      if (!imgPath) return '';
      if (imgPath.startsWith('data:')) return imgPath;
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
      if (imgPath.startsWith('blob:')) return imgPath;
      
      const API_BASE_URL = window.location.origin;
      return imgPath.startsWith('/') ? `${API_BASE_URL}${imgPath}` : `${API_BASE_URL}/${imgPath}`;
    };

    let currentY = margin;
    let pageNumber = 1;
    const totalGroups = consolidatedEntries.length;

    // Show loading indicator (you would integrate this with your UI)
    console.log('Processing images and generating PDF...');

    for (let i = 0; i < consolidatedEntries.length; i++) {
      const entry = consolidatedEntries[i];
      console.log(`Processing entry ${i + 1}/${consolidatedEntries.length}`);

      if (pageNumber > 1) {
        doc.addPage();
        currentY = margin;
      }

      // HEADER
      doc.setFillColor(35, 34, 73);
      doc.rect(0, 0, pageWidth, 70, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFINED SPACE ASSESSMENT', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: 'center' });

      currentY = 90;
      doc.setTextColor(0, 0, 0);

      // Basic Information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Building: ${entry.building || 'N/A'}`, margin, currentY);
      currentY += 18;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Location: ${entry.locationDescription || 'N/A'}`, margin, currentY);
      currentY += 15;
      doc.text(`Space Description: ${entry.confinedSpaceDescription || 'N/A'}`, margin, currentY);
      currentY += 15;

      if (entry._consolidated) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Consolidated Report (${entry._originalEntryCount} Spaces)`, margin, currentY);
        currentY += 15;
        doc.setFont('helvetica', 'normal');
        doc.text(`Work Order IDs: ${entry.uniqueId || 'N/A'}`, margin, currentY);
        currentY += 20;
      } else {
        doc.text(`Work Order ID: ${entry.uniqueId || entry.workOrderId || 'N/A'}`, margin, currentY);
        currentY += 20;
      }

      // COLLECT AND LOAD ALL IMAGES
      console.log(`Loading images for entry ${i + 1}...`);
      const picturesList = Array.isArray(entry.pictures) ? entry.pictures : (entry.pictures ? [entry.pictures] : []);
      const imagesList = Array.isArray(entry.images) ? entry.images : (entry.images ? [entry.images] : []);
      const photosList = Array.isArray(entry.photos) ? entry.photos : (entry.photos ? [entry.photos] : []);
      const attachmentsList = Array.isArray(entry.attachments) ? entry.attachments : (entry.attachments ? [entry.attachments] : []);
      
      const imagePaths = [...picturesList, ...imagesList, ...photosList, ...attachmentsList].filter(Boolean);
      console.log(`Found ${imagePaths.length} images to load`);

      const loadedImages = [];
      
      // Pre-load all images with base64 conversion
      for (const imgPath of imagePaths) {
        try {
          const imageUrl = getImageUrl(imgPath);
          console.log('Loading image:', imageUrl);
          
          const base64Data = await loadImageAsBase64(imageUrl);
          
          // Get image dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = base64Data;
          });
          
          const ratio = Math.min(imageMaxWidth / img.width, imageMaxHeight / img.height);
          const width = img.width * ratio;
          const height = img.height * ratio;
          
          loadedImages.push({ dataUrl: base64Data, width, height });
          console.log('Image loaded successfully:', imageUrl);
        } catch (error) {
          console.error('Failed to load image:', imgPath, error);
          // Continue with other images
        }
      }

      console.log(`Successfully loaded ${loadedImages.length}/${imagePaths.length} images`);

      console.log(`Successfully loaded ${loadedImages.length}/${imagePaths.length} images`);

      // Extract data with proper fallbacks
      const surveyDate = extractDate(entry) || 'Not Specified';
      const surveyors = extractSurveyors(entry);
      const surveyorNames = surveyors.length > 0 ? surveyors.join(", ") : 'Not Specified';
      const spaceNameOrId = extractSpaceNameOrId(entry) || 'Not Specified';
      const entryPoints = extractEntryPoints(entry) || 'Not Specified';

      // DETAILS TABLE
      const detailsText = `
Date of Survey: ${surveyDate}
Surveyors: ${surveyorNames}
Space Name/ID: ${spaceNameOrId}

CLASSIFICATION:
• Confined Space: ${entry.confinedSpace ? 'Yes' : 'No'}
• Permit Required: ${entry.permitRequired ? 'Yes' : 'No'}
• Entry Requirements: ${entry.entryRequirements || 'None Specified'}

HAZARD ASSESSMENT:
• Atmospheric Hazard: ${entry.atmosphericHazard ? 'Yes' : 'No'}
  ${entry.atmosphericHazardDescription ? `  Description: ${entry.atmosphericHazardDescription}` : ''}
• Engulfment Hazard: ${entry.engulfmentHazard ? 'Yes' : 'No'}
  ${entry.engulfmentHazardDescription ? `  Description: ${entry.engulfmentHazardDescription}` : ''}
• Configuration Hazard: ${entry.configurationHazard ? 'Yes' : 'No'}
  ${entry.configurationHazardDescription ? `  Description: ${entry.configurationHazardDescription}` : ''}
• Other Hazards: ${entry.otherRecognizedHazards ? 'Yes' : 'No'}
  ${entry.otherHazardsDescription ? `  Description: ${entry.otherHazardsDescription}` : ''}

SAFETY MEASURES:
• PPE Required: ${entry.ppeRequired ? 'Yes' : 'No'}
• PPE List: ${entry.ppeList || 'None Specified'}
• Forced Air Ventilation: ${entry.forcedAirVentilationSufficient ? 'Sufficient' : 'Requires Assessment'}
• Continuous Air Monitor: ${entry.dedicatedContinuousAirMonitor ? 'Yes' : 'No'}
• Warning Sign Posted: ${entry.warningSignPosted ? 'Yes' : 'No'}
• Entry Points: ${entryPoints}

ADDITIONAL INFORMATION:
• Other People Working Nearby: ${entry.otherPeopleWorkingNearSpace ? 'Yes' : 'No'}
• Visibility into Space: ${entry.canOthersSeeIntoSpace ? 'Yes' : 'No'}
• Contractors Enter Space: ${entry.contractorsEnterSpace ? 'Yes' : 'No'}

${entry.notes ? `Notes:\n${entry.notes}` : ''}
      `.trim();

      const tableData = [
        [
          { 
            content: entry._consolidated 
              ? `Consolidated Assessment: ${entry.building || 'Multiple Locations'}` 
              : `Assessment: ${entry.building || 'Location'}`, 
            colSpan: 2, 
            styles: { halign: 'center', fontStyle: 'bold', fillColor: [35, 34, 73], textColor: [255, 255, 255], fontSize: 12 } 
          }
        ],
        [
          { content: 'Assessment Details', styles: { fontStyle: 'bold', fillColor: [245, 245, 245], fontSize: 11 } },
          { content: `Photographic Documentation (${loadedImages.length} Images)`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [245, 245, 245], fontSize: 11 } }
        ],
        [
          { content: detailsText, styles: { valign: 'top', fontSize: 9, cellPadding: 8 } },
          { content: '', styles: { valign: 'top', halign: 'center', cellPadding: 8 } }
        ]
      ];

      autoTable(doc, {
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: { 
          fontSize: 10, 
          cellPadding: 6,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        columnStyles: { 
          0: { cellWidth: pageWidth * 0.5 - margin }, 
          1: { cellWidth: pageWidth * 0.5 - margin } 
        },
        didParseCell: (data) => {
          if (data.row.index === 2 && data.column.index === 1 && loadedImages.length > 0) {
            const imagesPerRow = 2;
            const gap = 8;
            const padding = 10;
            const imgWidth = (data.cell.width - padding * 2 - gap * (imagesPerRow - 1)) / imagesPerRow;
            const rows = Math.ceil(loadedImages.length / imagesPerRow);
            const requiredHeight = rows * (imageMaxHeight + gap) - gap + padding * 2;
            if (requiredHeight > (data.cell.styles.minCellHeight || 0)) {
              data.cell.styles.minCellHeight = requiredHeight;
            }
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 2 && data.column.index === 1 && loadedImages.length > 0) {
            const imagesPerRow = 2;
            const gap = 8;
            const padding = 10;
            const imgWidth = (data.cell.width - padding * 2 - gap * (imagesPerRow - 1)) / imagesPerRow;
            
            loadedImages.forEach((img, idx) => {
              const row = Math.floor(idx / imagesPerRow);
              const col = idx % imagesPerRow;
              
              const x = data.cell.x + padding + col * (imgWidth + gap);
              const y = data.cell.y + padding + row * (imageMaxHeight + gap);
              
              // Calculate aspect ratio
              const imgAspectRatio = img.width / img.height;
              const containerAspectRatio = imgWidth / imageMaxHeight;
              
              let drawWidth, drawHeight;
              if (imgAspectRatio > containerAspectRatio) {
                drawWidth = imgWidth;
                drawHeight = imgWidth / imgAspectRatio;
              } else {
                drawHeight = imageMaxHeight;
                drawWidth = imageMaxHeight * imgAspectRatio;
              }
              
              // Center image in container
              const offsetX = (imgWidth - drawWidth) / 2;
              const offsetY = (imageMaxHeight - drawHeight) / 2;
              
              // Draw border
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(1);
              doc.rect(x, y, imgWidth, imageMaxHeight);
              
              // Draw image
              try {
                doc.addImage(
                  img.dataUrl, 
                  'JPEG', 
                  x + offsetX, 
                  y + offsetY, 
                  drawWidth, 
                  drawHeight
                );
              } catch (error) {
                console.error('Error adding image to PDF:', error);
              }
            });
          }
        }
      });

      currentY = doc.previousAutoTable.finalY + 15;

      // PAGE BREAK IF NEEDED
      if (currentY + 40 > pageHeight - margin) {
        doc.addPage();
        currentY = margin + 25;
        
        // Re-add header on new page
        doc.setFillColor(35, 34, 73);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Confined Space Assessment Report (Continued)', pageWidth / 2, 13, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        currentY = margin + 25;
      }
    }

    // SIGNATURE SECTION
    currentY += 5;
    doc.setFillColor(35, 34, 73);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Surveyor Acknowledgement', margin + 5, currentY + 7);
    doc.setTextColor(0, 0, 0);
    currentY += 15;

    // Get unique surveyors from all filtered orders
    const allSurveyors = new Set();
    filteredOrders.forEach(order => {
      const surveyors = extractSurveyors(order);
      surveyors.forEach(name => allSurveyors.add(name));
    });

    if (allSurveyors.size > 0) {
      Array.from(allSurveyors).forEach((surveyorName, idx) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${idx + 1}. ${surveyorName}`, margin + 5, currentY);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin + 80, currentY + 1, pageWidth - margin, currentY + 1);
        currentY += 12;
        
        // Page break check
        if (currentY + 20 > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No surveyors specified', margin + 5, currentY);
      currentY += 15;
    }

    // FOOTER WITH PAGE NUMBERS
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      // Page number
      doc.text(
        `Page ${i} of ${totalPages}`, 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
      
      // Generation date
      doc.text(
        `Generated: ${new Date().toLocaleString()}`, 
        margin, 
        pageHeight - 10
      );
    }

    // Save PDF
    const filename = `confined_space_assessments_${new Date().toISOString().slice(0, 10)}_${new Date().getTime()}.pdf`;
    console.log(`Saving PDF: ${filename}`);
    doc.save(filename);
    
    console.log('✅ PDF generated successfully!');
    alert("PDF downloaded successfully!");
  } catch (error) {
    console.error("❌ Error downloading PDF:", error);
    console.error("Error stack:", error.stack);
    alert(`Failed to download PDF: ${error.message}`);
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
