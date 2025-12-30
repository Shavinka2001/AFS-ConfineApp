import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================
// CONFIGURATION & UTILS
// ============================

// 1. Backend URL එක සොයා ගැනීම (Blob නොවන Local images සඳහා)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL_CONFINE || 
                 import.meta.env?.VITE_API_BASE_URL || 
                 import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Development fallback
  const currentPort = window.location.port;
  if (currentPort === '5173' || currentPort === '3000') {
    return `${window.location.protocol}//${window.location.hostname}:5000`; 
  }
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

// 2. Fetch Full Order Details (Missing Images Fix)
const fetchFullOrderDetails = async (id) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // ඔබේ API Endpoint එක මෙතනට හරියටම දාන්න
    const response = await fetch(`${API_BASE_URL}/api/work-orders/${id}`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.data || data.workOrder || data; // API response structure එක අනුව ගැලපේ
  } catch (error) {
    console.error(`Failed to fetch details for order ${id}:`, error);
    return null;
  }
};

// 3. Image URL Handling (Blob Storage Support)
const getImageUrl = (imgPath) => {
  if (!imgPath || typeof imgPath !== 'string') return '';
  
  // Blob Storage URL එකක් නම් (http/https වලින් පටන් ගනී නම්) වෙනස් කරන්න එපා
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) {
    return imgPath;
  }
  
  // Local path එකක් නම් Backend URL එක එකතු කරන්න
  const cleanPath = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// 4. Load Image Logic (CORS Fix)
const loadImageAsBase64 = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) { resolve(null); return; }

    const img = new Image();
    img.crossOrigin = "Anonymous"; // CORS Fix for Blob Storage

    const timeout = setTimeout(() => resolve(null), 8000); // 8s timeout

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
        console.warn('Canvas error:', e);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn(`Failed to load image: ${imageUrl}`);
      resolve(null);
    };

    // Cache buster to ensure fresh loading
    img.src = imageUrl.includes('?') ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;
  });
};

// ============================
// CONSOLIDATION LOGIC
// ============================
const consolidateEntries = (entries = []) => {
  const consolidated = [];
  const groupMap = new Map();

  entries.forEach((entry, index) => {
    if (!entry) return;
    const bldg = (entry.building || 'N/A').toString().trim().toLowerCase();
    const loc = (entry.locationDescription || 'N/A').toString().trim().toLowerCase();
    const desc = (entry.confinedSpaceDescription || 'N/A').toString().trim().toLowerCase();
    const key = `${bldg}|||${loc}|||${desc}`;
    
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(entry);
  });

  groupMap.forEach(group => {
    consolidated.push(group.length === 1 ? group[0] : consolidateGroup(group));
  });

  return consolidated;
};

const consolidateGroup = (group) => {
  const base = { ...group[0] };
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const text = (field) => uniq(group.map(e => e[field])).join('. ') || null;
  const bool = (field) => group.some(e => e[field] === true);

  // Collect all images from the group
  const collectImages = (field) => {
    const all = [];
    group.forEach(e => {
        const items = Array.isArray(e[field]) ? e[field] : (e[field] ? [e[field]] : []);
        items.forEach(i => all.push(i));
    });
    return [...new Set(all)];
  };

  return {
    ...base,
    uniqueId: uniq(group.map(e => e.uniqueId || e.workOrderId || e._id?.slice(-4))).join(', '),
    confinedSpaceNameOrId: uniq(group.map(e => e.confinedSpaceNameOrId)).join(', '),
    
    // Merge Text Fields
    entryRequirements: text('entryRequirements'),
    notes: text('notes'),
    ppeList: text('ppeList'),
    
    // Merge Booleans
    confinedSpace: bool('confinedSpace'),
    permitRequired: bool('permitRequired'),
    atmosphericHazard: bool('atmosphericHazard'),
    // ... Add other boolean fields as needed

    // Merge Images
    pictures: collectImages('pictures'),
    images: collectImages('images'),
    photos: collectImages('photos'),
    
    _consolidated: true,
    _originalEntryCount: group.length
  };
};

// ============================
// MAIN PDF GENERATION FUNCTION
// ============================
export const handleDownloadFilteredPDF = async (initialOrders = []) => {
  if (!initialOrders || initialOrders.length === 0) {
    alert("No work orders to export.");
    return;
  }

  try {
    // 1. FETCH FULL DATA (Crucial Step)
    console.log("🔄 Fetching full details for PDF generation...");
    const fetchPromises = initialOrders.map(order => fetchFullOrderDetails(order._id));
    const fullOrdersRaw = await Promise.all(fetchPromises);
    const fullOrders = fullOrdersRaw.filter(Boolean); // Remove failed fetches

    // 2. CONSOLIDATE DATA
    const consolidatedEntries = consolidateEntries(fullOrders);
    console.log(`Generating PDF for ${consolidatedEntries.length} entries...`);

    // 3. INIT PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const imageMaxHeight = 150;

    let pageNumber = 1;

    for (let i = 0; i < consolidatedEntries.length; i++) {
      const entry = consolidatedEntries[i];

      if (i > 0) doc.addPage(); // New page for each entry

      // --- HEADER ---
      doc.setFillColor(35, 34, 73);
      doc.rect(0, 0, pageWidth, 70, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFINED SPACE ASSESSMENT', pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      // Reset for Body
      doc.setTextColor(0, 0, 0);
      let currentY = 100;

      // --- INFO SECTION (Top of page) ---
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Building: ${entry.building || 'N/A'}`, margin, currentY);
      currentY += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Location: ${entry.locationDescription || 'N/A'}`, margin, currentY);
      currentY += 15;
      doc.text(`Space Description: ${entry.confinedSpaceDescription || 'N/A'}`, margin, currentY);
      currentY += 15;
      doc.text(`Work Order ID: ${entry.uniqueId || entry._id || 'N/A'}`, margin, currentY);
      currentY += 25; // Gap before table

      // --- PREPARE IMAGES ---
      const allImages = [
          ...(entry.pictures || []),
          ...(entry.images || []),
          ...(entry.photos || [])
      ].filter(Boolean);
      
      const loadedImages = [];
      // Only load first 3 images to save space/time if needed, or loop all
      for (const imgPath of [...new Set(allImages)]) {
          const url = getImageUrl(imgPath);
          const base64 = await loadImageAsBase64(url);
          if (base64) {
             const imgObj = new Image();
             imgObj.src = base64;
             loadedImages.push({ dataUrl: base64, w: imgObj.width, h: imgObj.height });
          }
      }

      // --- DETAILS TEXT FOR TABLE ---
      const detailsText = `
Date of Survey: ${entry.dateOfSurvey ? new Date(entry.dateOfSurvey).toLocaleDateString() : 'N/A'}
Surveyors: ${(Array.isArray(entry.surveyors) ? entry.surveyors : [entry.surveyors]).join(', ') || 'N/A'}
Space Name/ID: ${entry.confinedSpaceNameOrId || 'N/A'}

CLASSIFICATION:
• Confined Space: ${entry.confinedSpace ? 'Yes' : 'No'}
• Permit Required: ${entry.permitRequired ? 'Yes' : 'No'}

HAZARDS:
• Atmospheric: ${entry.atmosphericHazard ? 'Yes' : 'No'}
• Engulfment: ${entry.engulfmentHazard ? 'Yes' : 'No'}
• Configuration: ${entry.configurationHazard ? 'Yes' : 'No'}

SAFETY MEASURES:
• PPE Required: ${entry.ppeRequired ? 'Yes' : 'No'} (${entry.ppeList || 'None'})
• Ventilation: ${entry.forcedAirVentilationSufficient ? 'Sufficient' : 'Requires Assessment'}
• Air Monitor: ${entry.dedicatedContinuousAirMonitor ? 'Yes' : 'No'}

NOTES:
${entry.notes || 'N/A'}
      `.trim();

      // --- MAIN TABLE (Using autoTable) ---
      autoTable(doc, {
        body: [
          [
            { content: 'Assessment Details', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, 
            { content: `Photographic Documentation (${loadedImages.length} Images)`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'center' } }
          ],
          [
            { content: detailsText, styles: { fontSize: 9, cellPadding: 10, valign: 'top' } }, 
            { content: '', styles: { minCellHeight: 150, valign: 'top' } } // Empty cell for images
          ]
        ],
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.5 },
        columnStyles: { 0: { cellWidth: pageWidth * 0.5 - margin }, 1: { cellWidth: pageWidth * 0.5 - margin } },
        didDrawCell: (data) => {
            // Draw Images in the right column
            if (data.row.index === 1 && data.column.index === 1) {
                if (loadedImages.length === 0) {
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.text("No Images Available", data.cell.x + data.cell.width / 2, data.cell.y + 50, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                } else {
                    const padding = 10;
                    let imgY = data.cell.y + padding;
                    
                    loadedImages.forEach((img) => {
                        // Check if image fits, otherwise skip or handle (simple vertical stack)
                        if (imgY + 50 > data.cell.y + data.cell.height) return;

                        const ratio = Math.min((data.cell.width - 20) / img.w, 120 / img.h);
                        const w = img.w * ratio;
                        const h = img.h * ratio;
                        const xOffset = (data.cell.width - 20 - w) / 2;

                        doc.addImage(img.dataUrl, 'JPEG', data.cell.x + padding + xOffset, imgY, w, h);
                        imgY += h + 10;
                    });
                }
            }
        }
      });

      // --- CALCULATE Y FOR SIGNATURE ---
      // This solves the overlapping issue!
      currentY = doc.lastAutoTable.finalY + 40;

      // Check for page break
      if (currentY > pageHeight - 120) {
        doc.addPage();
        currentY = 60;
      }

      // --- SIGNATURE SECTION ---
      doc.setFillColor(35, 34, 73);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SURVEYOR ACKNOWLEDGEMENT', pageWidth / 2, currentY + 13, { align: 'center' });
      
      currentY += 40;
      doc.setTextColor(0, 0, 0);

      const surveyors = Array.isArray(entry.surveyors) ? entry.surveyors : [entry.surveyors];
      const validSurveyors = [...new Set(surveyors.filter(Boolean))];

      if (validSurveyors.length === 0) validSurveyors.push("Unassigned");

      validSurveyors.forEach(name => {
          doc.setDrawColor(150, 150, 150);
          doc.line(margin, currentY, pageWidth - margin, currentY); // Signature Line
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`Name: ${name}`, margin, currentY + 15);
          
          doc.setFont('helvetica', 'normal');
          const dateText = `Date: ${new Date().toLocaleDateString()}`;
          const dateWidth = doc.getTextWidth(dateText);
          doc.text(dateText, pageWidth - margin - dateWidth, currentY + 15);
          
          currentY += 40; // Space for next surveyor
      });

      // --- FOOTER ---
      const footerY = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY);
      doc.text(`Page ${pageNumber} of ${consolidatedEntries.length}`, pageWidth - margin, footerY, { align: 'right' });
      
      pageNumber++;
    }

    doc.save(`Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert("PDF Downloaded Successfully!");

  } catch (error) {
    console.error("PDF Error:", error);
    alert("Failed to generate PDF. Check console.");
  }
};