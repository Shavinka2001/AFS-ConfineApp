import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Convert image URL to base64 with CORS and authentication handling
 */
const loadImageAsBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      console.error('❌ [loadImageAsBase64] Invalid or empty image URL');
      reject(new Error('Invalid or empty image URL'));
      return;
    }
    
    console.log(`🔄 [loadImageAsBase64] Starting load for: ${imageUrl}`);
    
    // Try to fetch with authentication first (for protected images)
    const tryFetchWithAuth = async () => {
      try {
        // Get authentication token from localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        console.log(`🔑 [loadImageAsBase64] Auth token ${token ? 'found' : 'not found'}`);
        
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const fetchOptions = { 
          method: 'GET',
          headers,
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        };
        
        const response = await fetch(imageUrl, fetchOptions);
        
        console.log(`📡 [loadImageAsBase64] Fetch response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log(`📦 [loadImageAsBase64] Blob received, size: ${blob.size} bytes`);
        
        return new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log(`✅ [loadImageAsBase64] Base64 conversion complete`);
            res(reader.result);
          };
          reader.onerror = (error) => {
            console.error(`❌ [loadImageAsBase64] FileReader error:`, error);
            rej(new Error(`FileReader failed: ${error.message}`));
          };
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        console.warn(`⚠️ [loadImageAsBase64] Fetch failed, falling back to Image element:`, fetchError.message);
        throw fetchError;
      }
    };
    
    // Try fetch first, fallback to Image element
    tryFetchWithAuth()
      .then(resolve)
      .catch((fetchError) => {
        console.log(`🔄 [loadImageAsBase64] Attempting Image element fallback for: ${imageUrl}`);
        
        const img = new Image();
        
        // CRITICAL: Set crossOrigin to "anonymous" BEFORE setting src
        // This allows loading Blob Storage images (Azure/S3/Cloudinary) without CORS tainting
        img.crossOrigin = "anonymous";
        console.log('🔓 [loadImageAsBase64] CORS mode set to anonymous for Blob Storage compatibility');
        
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.error(`❌ [loadImageAsBase64] Image load timeout (10s): ${imageUrl}`);
          reject(new Error(`Image load timeout (10s): ${imageUrl}`));
        }, 10000);
    
        img.onload = () => {
          clearTimeout(timeout);
          console.log(`✅ [loadImageAsBase64] Image loaded successfully: ${imageUrl}`);
          console.log(`   → Dimensions: ${img.width}x${img.height}`);
          console.log(`   → Converting to base64 for PDF...`);
          
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Failed to get canvas context');
            }
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            console.log(`✅ [loadImageAsBase64] Base64 conversion complete (${Math.round(dataUrl.length / 1024)}KB)`);
            resolve(dataUrl);
          } catch (error) {
            console.error('❌ [loadImageAsBase64] Canvas conversion error:', error);
            reject(new Error(`Canvas conversion failed: ${error.message}`));
          }
        };
    
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`❌ [loadImageAsBase64] Image element load error:`, {
            url: imageUrl,
            error: error,
            originalFetchError: fetchError.message
          });
          reject(new Error(`Image load failed (CORS/Network): ${imageUrl}`));
        };
    
        // Add timestamp to prevent caching issues
        try {
          const urlWithTimestamp = imageUrl.includes('?') 
            ? `${imageUrl}&t=${Date.now()}`
            : `${imageUrl}?t=${Date.now()}`;
          
          console.log(`🔄 [loadImageAsBase64] Setting Image src: ${urlWithTimestamp}`);
          img.src = urlWithTimestamp;
        } catch (error) {
          clearTimeout(timeout);
          console.error(`❌ [loadImageAsBase64] Failed to set Image src:`, error);
          reject(new Error(`Invalid image URL: ${imageUrl}`));
        }
      });
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
    // Create case-insensitive, trimmed grouping key
    const building = (entry.building || 'N/A').toString().trim().toLowerCase();
    const location = (entry.locationDescription || 'N/A').toString().trim().toLowerCase();
    const space = (entry.confinedSpaceDescription || 'N/A').toString().trim().toLowerCase();
    const key = `${building}|||${location}|||${space}`;
    
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
      let items = [];
      
      if (Array.isArray(e[field])) {
        items = e[field].filter(item => item && String(item).trim());
      } else if (e[field] && typeof e[field] === 'string' && e[field].trim()) {
        items = [e[field]];
      } else if (e[field] && typeof e[field] === 'object') {
        if (e[field].path) items = [e[field].path];
        else if (e[field].url) items = [e[field].url];
      }
      
      items.forEach(i => {
        const key = String(i).trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(i);
        }
      });
    });
    return out.length > 0 ? out : [];
  };

  const uniqueIds = uniq(
    group.map(e => e.uniqueId || e.workOrderId || e._id?.slice(-4).padStart(4, '0'))
  );

  const extractSurveyors = (entry) => {
    if (Array.isArray(entry.surveyors) && entry.surveyors.length > 0) return entry.surveyors;
    if (entry.surveyors && typeof entry.surveyors === 'string') return [entry.surveyors];
    const nameFields = ['surveyorName', 'technician', 'createdBy'];
    for (const field of nameFields) {
      if (entry[field]) {
        if (Array.isArray(entry[field])) return entry[field];
        if (typeof entry[field] === 'string') return [entry[field]];
      }
    }
    return [];
  };

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
    confinedSpaceNameOrId: uniq(group.map(e => e.confinedSpaceNameOrId).filter(Boolean)).join(', ') || null,
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

    numberOfEntryPoints: uniq(group.map(e => e.numberOfEntryPoints).filter(Boolean)).join(', ') || null,

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
    
    // CRITICAL: Fetch full order details to ensure we have all image data
    console.log('📡 Fetching fresh order details with images...');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 
                        import.meta.env?.VITE_BACKEND_URL ||
                        window.location.origin.replace(':5173', ':5000');
    
    const fetchOrderDetails = async (order) => {
      try {
        const orderId = order._id || order.id || order.uniqueId;
        if (!orderId) {
          return order; // Silently use original data
        }
        
        // Try /api/workorders first (most common), then /api/work-orders as fallback
        const endpoints = [
          `${API_BASE_URL}/api/workorders/${orderId}`,
          `${API_BASE_URL}/api/work-orders/${orderId}`
        ];
        
        let fullOrder = null;
        
        for (const apiUrl of endpoints) {
          try {
            const response = await fetch(apiUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
            
            // Check if response is valid JSON
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
              const result = await response.json();
              fullOrder = result.data || result;
              break; // Success! Use this endpoint
            }
          } catch (err) {
            continue; // Try next endpoint
          }
        }
        
        // If we got fresh data, use it; otherwise fall back to original
        if (fullOrder) {
          return fullOrder;
        } else {
          // Only log warning once to avoid console spam
          if (!window.__pdfOrderFetchWarned) {
            console.warn(`⚠️ PDF Generator: Unable to fetch fresh order data - using cached data`);
            console.warn(`   This may happen if the workOrderManagement service is not running`);
            console.warn(`   PDF will still generate using available order information`);
            window.__pdfOrderFetchWarned = true;
          }
          return order;
        }
      } catch (error) {
        return order; // Silently fall back on any error
      }
    };
    
    // Fetch all orders in parallel
    const fullOrders = await Promise.all(orders.map(fetchOrderDetails));
    console.log(`✅ Fetched ${fullOrders.length} complete orders with image data`);
    
    const consolidatedEntries = consolidateEntries(fullOrders);
    console.log('Consolidated into', consolidatedEntries.length, 'entries');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const imageMaxWidth = 200;
    const imageMaxHeight = 150;

    const getImageUrl = (imgPath) => {
      if (!imgPath || typeof imgPath !== 'string') {
        console.warn('🔍 [getImageUrl] Invalid image path:', imgPath);
        return '';
      }
      
      const trimmedPath = imgPath.trim();
      if (!trimmedPath) return '';
      
      console.log(`🔍 [getImageUrl] Processing path: "${trimmedPath}"`);
      
      // Blob Storage URLs (Azure/S3/Cloudinary) - return as-is
      if (trimmedPath.startsWith('data:')) {
        console.log('✅ [getImageUrl] Data URL detected');
        return trimmedPath;
      }
      
      if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
        console.log(`✅ [getImageUrl] Blob Storage URL detected (external): ${trimmedPath}`);
        console.log('   → Returning as-is (no API base URL prepended)');
        return trimmedPath;
      }
      
      if (trimmedPath.startsWith('blob:')) {
        console.log('✅ [getImageUrl] Blob URL detected');
        return trimmedPath;
      }
      
      // Local path - construct full URL
      const envBackendUrl = import.meta.env?.VITE_API_BASE_URL || 
                           import.meta.env?.VITE_BACKEND_URL ||
                           import.meta.env?.VITE_API_URL;
      
      let backendURL = envBackendUrl || API_BASE_URL;
      
      const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
      const fullUrl = `${backendURL}${cleanPath}`;
      
      console.log(`✅ [getImageUrl] Constructed URL: ${trimmedPath} -> ${fullUrl}`);
      
      return fullUrl;
    };

    let currentY = margin;
    let pageNumber = 1;

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
      const normalizeImageField = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field.filter(item => item && String(item).trim());
        if (typeof field === 'string' && field.trim()) return [field];
        return [];
      };
      
      const picturesList = normalizeImageField(entry.pictures);
      const imagesList = normalizeImageField(entry.images);
      const photosList = normalizeImageField(entry.photos);
      const attachmentsList = normalizeImageField(entry.attachments);
      
      const allImagePaths = [...picturesList, ...imagesList, ...photosList, ...attachmentsList];
      const uniqueImagePaths = [...new Set(allImagePaths.map(p => String(p).trim()).filter(Boolean))];
      const imagePaths = uniqueImagePaths;
      
      console.log(`Found ${imagePaths.length} images to load`);

      const loadedImages = [];
      
      for (const imgPath of imagePaths) {
        try {
          const imageUrl = getImageUrl(imgPath);
          if (!imageUrl || !imageUrl.trim()) {
            console.warn('⚠️ Empty image URL, skipping');
            continue;
          }
          
          console.log(`📸 Loading image: ${imageUrl}`);
          
          let base64Data;
          try {
            base64Data = await loadImageAsBase64(imageUrl);
            if (!base64Data || !base64Data.startsWith('data:')) {
              console.warn('⚠️ Invalid base64 data returned, skipping:', imageUrl);
              continue;
            }
            console.log(`✅ Base64 conversion successful (${Math.round(base64Data.length / 1024)}KB)`);
          } catch (loadError) {
            console.warn('⚠️ CORS/Network error loading image, skipping:', loadError.message);
            continue;
          }
          
          const img = new Image();
          try {
            await Promise.race([
              new Promise((resolve, reject) => {
                img.onload = () => {
                  console.log(`✅ Image dimensions: ${img.width}x${img.height}`);
                  resolve();
                };
                img.onerror = (err) => {
                  console.error('❌ Image load error:', err);
                  reject(new Error('Failed to load image'));
                };
                img.src = base64Data;
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Image dimension calculation timeout (5s)')), 5000)
              )
            ]);
          } catch (dimError) {
            console.warn('⚠️ Failed to get image dimensions, skipping:', dimError.message);
            continue;
          }
          
          // Ensure minimum dimensions
          if (img.width === 0 || img.height === 0) {
            console.warn('⚠️ Image has zero dimensions, skipping');
            continue;
          }
          
          const ratio = Math.min(imageMaxWidth / img.width, imageMaxHeight / img.height);
          const width = img.width * ratio;
          const height = img.height * ratio;
          
          loadedImages.push({ dataUrl: base64Data, width, height, originalUrl: imageUrl });
          console.log(`✅ Image ${loadedImages.length} added to PDF queue: ${width.toFixed(0)}x${height.toFixed(0)}px`);
        } catch (error) {
          console.error('❌ Unexpected error loading image:', error.message);
        }
      }

      console.log(`Successfully loaded ${loadedImages.length}/${imagePaths.length} images`);

      // DETAILS TABLE
      const detailsText = `
Date of Survey: ${entry.dateOfSurvey ? new Date(entry.dateOfSurvey).toISOString().slice(0, 10) : 'Not Specified'}
Surveyors: ${Array.isArray(entry.surveyors) ? entry.surveyors.join(", ") : entry.surveyors || 'Not Specified'}
Space Name/ID: ${entry.confinedSpaceNameOrId || 'Not Specified'}

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
• Entry Points: ${entry.numberOfEntryPoints || 'Not Specified'}

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
          { 
            content: loadedImages.length > 0 
              ? `Photographic Documentation (${loadedImages.length}/${imagePaths.length} Images)` 
              : 'Photographic Documentation',
            styles: { fontStyle: 'bold', halign: 'center', fillColor: [245, 245, 245], fontSize: 11 } 
          }
        ],
        [
          { content: detailsText, styles: { valign: 'top', fontSize: 9, cellPadding: 8, overflow: 'linebreak' } },
          { content: '', styles: { valign: 'top', halign: 'center', cellPadding: 8, minCellHeight: 100 } }
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
            const gap = 10;
            const requiredHeight = loadedImages.length * (imageMaxHeight + gap) + 20;
            if (requiredHeight > (data.cell.styles.minCellHeight || 0)) {
              data.cell.styles.minCellHeight = requiredHeight;
            }
          }
        },
        didDrawCell: (data) => {
          if (data.row.index === 2 && data.column.index === 1 && loadedImages.length > 0) {
            let imgY = data.cell.y + 10;
            const centerX = data.cell.x + 10;

            console.log(`📸 Rendering ${loadedImages.length} images in PDF at Y: ${imgY}`);
            
            loadedImages.forEach((img, idx) => {
              // Check if there's enough space on current page
              if (imgY + img.height < pageHeight - margin) {
                try {
                  console.log(`  ✏️ Drawing image ${idx + 1}: ${img.width.toFixed(0)}x${img.height.toFixed(0)}px at X:${centerX}, Y:${imgY}`);
                  doc.addImage(img.dataUrl, 'JPEG', centerX, imgY, img.width, img.height);
                  imgY += img.height + 10;
                  console.log(`  ✅ Image ${idx + 1} drawn successfully`);
                } catch (drawError) {
                  console.error(`  ❌ Failed to draw image ${idx + 1}:`, drawError.message);
                }
              } else {
                console.warn(`  ⚠️ Image ${idx + 1} skipped - not enough space on page`);
              }
            });
            
            console.log(`✅ Completed rendering ${loadedImages.length} images in PDF`);
          }
        }
      });

      currentY = doc.lastAutoTable?.finalY || currentY + 250;
      
      pageNumber++;
    }

    // Footer - Document Complete
    const tableEnd = doc.lastAutoTable?.finalY || currentY;
    console.log(`📍 Last table ended at Y position: ${tableEnd}`);
    
    currentY = tableEnd + 30;
    
    if (currentY + 40 > pageHeight - margin - 30) {
      doc.addPage();
      currentY = margin + 40;
    }
    
    doc.setFillColor(35, 34, 73);
    doc.rect(0, currentY, pageWidth, 20, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('End of Assessment Report', pageWidth / 2, currentY + 13, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // FOOTER WITH PAGE NUMBERS
    const totalPages = doc.internal.getNumberOfPages();
    const footerLineY = pageHeight - 25;
    const footerTextY = pageHeight - 12;
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      
      const generatedText = `Generated: ${new Date().toLocaleString()}`;
      doc.text(generatedText, margin, footerTextY);
      
      const pageText = `Page ${i} of ${totalPages}`;
      doc.text(pageText, pageWidth - margin, footerTextY, { align: 'right' });
    }

    const currentDate = new Date().toISOString().slice(0, 10);
    const filename = `Consolidated_Report_${currentDate}_${Date.now()}.pdf`;
    
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

// Export aliases for compatibility with PDFDownloadButton.jsx and other components
export const generateDetailedPDF = handleDownloadFilteredPDF;
export const generateConsolidatedPDF = handleDownloadFilteredPDF;
export const generateSummaryTablePDF = handleDownloadFilteredPDF;

export default {
  handleDownloadFilteredPDF,
  generateDetailedPDF,
  generateConsolidatedPDF,
  generateSummaryTablePDF
};