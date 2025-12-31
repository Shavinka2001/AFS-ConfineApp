import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInspectionFormPDF = async (form, includeImages = true) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header with logo area and title
    doc.setFillColor(35, 34, 73); // #232249
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // White text for header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFINED SPACE INSPECTION FORM', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Safety Compliance Documentation', pageWidth / 2, 40, { align: 'center' });
    
    // Form ID and date in header
    doc.setFontSize(12);
    doc.text(`Form ID: ${form.id}`, 20, 52);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 52);

    yPosition = 80;

    // Reset text color for body
    doc.setTextColor(0, 0, 0);

    // Status banner
    const statusColors = {
      'Approved': [34, 197, 94],    // green
      'Pending': [251, 191, 36],    // yellow  
      'Rejected': [239, 68, 68]     // red
    };
    
    const statusColor = statusColors[form.status] || [156, 163, 175];
    doc.setFillColor(...statusColor);
    doc.rect(20, yPosition, pageWidth - 40, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`STATUS: ${form.status.toUpperCase()} | PRIORITY: ${form.priority.toUpperCase()}`, 
             pageWidth / 2, yPosition + 10, { align: 'center' });
    
    yPosition += 25;
    doc.setTextColor(0, 0, 0);

    // Space Information Section
    yPosition = addSection(doc, 'SPACE INFORMATION', yPosition);
    
    const spaceData = [
      ['Space Name:', form.spaceName || 'N/A'],
      ['Building:', form.building || 'N/A'],
      ['Location:', form.location || form.locationDescription || 'N/A'],
      ['Inspection Date:', form.date || form.surveyDate || form.createdAt ? new Date(form.date || form.surveyDate || form.createdAt).toLocaleDateString() : 'N/A'],
      ['Surveyor:', form.technician || form.surveyorName || form.createdBy || 'N/A']
    ];
    
    yPosition = addDataTable(doc, spaceData, yPosition);

    // Personnel Information Section
    yPosition = addSection(doc, 'PERSONNEL INFORMATION', yPosition);
    
    const personnelData = [
      ['Entry Supervisor:', form.entrySupervisor || 'N/A'],
      ['Attendant:', form.attendant || 'N/A'],
      ['Entrants:', form.entrants ? form.entrants.replace(/\n/g, ', ') : 'N/A']
    ];
    
    yPosition = addDataTable(doc, personnelData, yPosition);

    // Safety Measures Section
    yPosition = addSection(doc, 'SAFETY MEASURES', yPosition);
    
    const safetyData = [
      ['Ventilation Required:', form.ventilationRequired || 'N/A'],
      ['Testing Equipment:', form.testingEquipment || 'N/A'],
      ['Communication Methods:', form.communicationMethods || 'N/A']
    ];
    
    yPosition = addDataTable(doc, safetyData, yPosition);

    // Isolation Procedures Section
    yPosition = addSection(doc, 'ISOLATION PROCEDURES', yPosition);
    yPosition = addTextBlock(doc, form.isolationProcedures || 'No procedures specified', yPosition);

    // Additional Notes Section
    if (form.notes) {
      yPosition = addSection(doc, 'ADDITIONAL NOTES', yPosition);
      yPosition = addTextBlock(doc, form.notes, yPosition);
    }

    // Images Section
    if (includeImages && form.images && form.images.length > 0) {
      // Add new page for images if needed
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }
      
      yPosition = addSection(doc, `ATTACHED IMAGES (${form.images.length})`, yPosition);
      yPosition = await addImages(doc, form.images, yPosition);
    }

    // Timestamps Section
    yPosition = addSection(doc, 'FORM HISTORY', yPosition);
    
    const timestampData = [
      ['Submitted:', new Date(form.submittedAt).toLocaleString()],
      ['Last Modified:', new Date(form.lastModified).toLocaleString()],
      ['PDF Generated:', new Date().toLocaleString()]
    ];
    
    yPosition = addDataTable(doc, timestampData, yPosition);

    // Footer
    addFooter(doc);

    return doc;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

// Helper function to add section headers
function addSection(doc, title, yPosition) {
  const pageHeight = doc.internal.pageSize.height;
  
  // Check if we need a new page
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }
  
  yPosition += 10;
  
  // Section background
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPosition - 5, doc.internal.pageSize.width - 40, 15, 'F');
  
  // Section border
  doc.setDrawColor(35, 34, 73);
  doc.setLineWidth(0.5);
  doc.rect(20, yPosition - 5, doc.internal.pageSize.width - 40, 15);
  
  // Section title
  doc.setTextColor(35, 34, 73);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 25, yPosition + 5);
  
  doc.setTextColor(0, 0, 0);
  return yPosition + 20;
}

// Helper function to add data tables
function addDataTable(doc, data, yPosition) {
  const pageHeight = doc.internal.pageSize.height;
  
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.autoTable({
    startY: yPosition,
    body: data,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 8,
      lineColor: [200, 200, 200],
      lineWidth: 0.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 249, 250] },
      1: { cellWidth: 120 }
    },
    margin: { left: 20, right: 20 },
    tableWidth: 'auto'
  });
  
  return doc.lastAutoTable.finalY + 10;
}

// Helper function to add text blocks
function addTextBlock(doc, text, yPosition) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const splitText = doc.splitTextToSize(text, pageWidth - 50);
  const textHeight = splitText.length * 6;
  
  // Add background for text block
  doc.setFillColor(252, 252, 252);
  doc.rect(20, yPosition - 5, pageWidth - 40, textHeight + 10, 'F');
  
  // Add border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(20, yPosition - 5, pageWidth - 40, textHeight + 10);
  
  doc.text(splitText, 25, yPosition + 5);
  
  return yPosition + textHeight + 20;
}

// Helper function to add images
async function addImages(doc, images, yPosition) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const maxImageWidth = (pageWidth - 60) / 2; // Two images per row
  const maxImageHeight = 80;
  
  let currentX = 20;
  let currentY = yPosition;
  let imagesInRow = 0;
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Check if we need a new page
    if (currentY > pageHeight - maxImageHeight - 20) {
      doc.addPage();
      currentY = 20;
      currentX = 20;
      imagesInRow = 0;
    }
    
    try {
      let imgData;
      
      // Handle different image formats
      if (typeof image === 'string') {
        // Handle direct URLs (blob storage, http/https URLs, or base64)
        if (image.startsWith('data:')) {
          // Already base64 encoded
          imgData = image;
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          // Blob storage URL (Azure, S3, Cloudinary, etc.)
          console.log(`Loading blob storage image: ${image}`);
          imgData = await loadImageAsBase64(image);
        } else if (image.startsWith('blob:')) {
          // Local blob URL from file upload
          imgData = await convertBlobToBase64(image);
        } else {
          // Relative path - construct full URL
          const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 
                              import.meta.env?.VITE_BACKEND_URL ||
                              window.location.origin.replace(':5173', ':5000');
          const cleanPath = image.startsWith('/') ? image : `/${image}`;
          const fullUrl = `${API_BASE_URL}${cleanPath}`;
          console.log(`Loading image from API: ${fullUrl}`);
          imgData = await loadImageAsBase64(fullUrl);
        }
      } else if (image.url) {
        // Handle object with url property
        if (image.url.startsWith('blob:')) {
          imgData = await convertBlobToBase64(image.url);
        } else if (image.url.startsWith('http://') || image.url.startsWith('https://')) {
          imgData = await loadImageAsBase64(image.url);
        } else {
          imgData = image.url;
        }
      } else if (image.file) {
        // Handle file objects
        imgData = await convertFileToBase64(image.file);
      } else {
        console.warn('Unsupported image format, skipping:', image);
        continue; // Skip invalid images
      }
      
      if (!imgData || !imgData.startsWith('data:')) {
        console.warn('Invalid image data, skipping');
        continue;
      }
      
      // Add image with border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(currentX, currentY, maxImageWidth, maxImageHeight);
      
      doc.addImage(imgData, 'JPEG', currentX + 2, currentY + 2, maxImageWidth - 4, maxImageHeight - 4);
      
      // Add image caption
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Image ${i + 1}`, currentX, currentY + maxImageHeight + 10);
      
      imagesInRow++;
      
      if (imagesInRow === 2) {
        // Move to next row
        currentY += maxImageHeight + 20;
        currentX = 20;
        imagesInRow = 0;
      } else {
        // Move to next column
        currentX += maxImageWidth + 20;
      }
      
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Continue with next image
    }
  }
  
  return currentY + (imagesInRow > 0 ? maxImageHeight + 20 : 0);
}

// Helper function to load image from URL and convert to base64 (supports blob storage)
function loadImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      reject(new Error('Invalid image URL'));
      return;
    }
    
    console.log(`Loading image: ${imageUrl}`);
    
    // Try to fetch with authentication first (for protected images)
    const tryFetchWithAuth = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers,
          credentials: 'include',
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        return new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.onerror = (error) => rej(new Error(`FileReader failed: ${error.message}`));
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        throw fetchError;
      }
    };
    
    // Try fetch first, fallback to Image element
    tryFetchWithAuth()
      .then(resolve)
      .catch(() => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Allow CORS for blob storage
        
        const timeout = setTimeout(() => {
          reject(new Error(`Image load timeout: ${imageUrl}`));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
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
            resolve(dataUrl);
          } catch (error) {
            reject(new Error(`Canvas conversion failed: ${error.message}`));
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error(`Image load failed: ${imageUrl}`));
        };
        
        const urlWithTimestamp = imageUrl.includes('?') 
          ? `${imageUrl}&t=${Date.now()}`
          : `${imageUrl}?t=${Date.now()}`;
        
        img.src = urlWithTimestamp;
      });
  });
}

// Helper function to convert blob URL to base64
function convertBlobToBase64(blobUrl) {
  return new Promise((resolve, reject) => {
    fetch(blobUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

// Helper function to convert file to base64
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to add footer
function addFooter(doc) {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Footer line
  doc.setDrawColor(35, 34, 73);
  doc.setLineWidth(1);
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  
  // Footer text
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Confined Space Inspection System - Confidential Document', 20, pageHeight - 15);
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
}
