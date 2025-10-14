import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class WorkOrderPDFGenerator {
  constructor() {
    this.pdf = null;
    this.currentY = 20;
    this.pageHeight = 297; // A4 height in mm
    this.margins = { left: 18, right: 18, top: 20, bottom: 20 };
    this.colors = {
      primary: '#232249',      // Dark blue primary
      secondary: '#5b1d1b',    // Dark burgundy secondary
      accent: '#3b82f6',       // Professional blue accent
      lightGray: '#f9fafb',    // Very light gray background
      text: '#000000',         // Pure black for better contrast
      textSecondary: '#374151', // Darker gray for better readability
      border: '#d1d5db',       // Slightly darker border
      white: '#ffffff'         // White background
    };
    this.fonts = {
      heading: { size: 16, weight: 'bold' },
      subheading: { size: 12, weight: 'bold' },
      body: { size: 10, weight: 'normal' },
      caption: { size: 8, weight: 'normal' },
      title: { size: 20, weight: 'bold' }
    };
  }

  // Helper method to format values for PDF display
  formatValue(value, defaultValue = 'N/A') {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return String(value);
  }

  // Helper method to convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  async generatePDF(workOrder) {
    try {
      this.pdf = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margins.top;

      // Check if this is a consolidated report
      if (workOrder._isConsolidatedReport) {
        return this.generateConsolidatedPDF(workOrder);
      }

      // Add header
      this.addHeader(workOrder);
      
      // Add work order info
      this.addWorkOrderInfo(workOrder);
      
      // Add space information
      this.addSpaceInformation(workOrder);
      
      // Add hazard assessment
      this.addHazardAssessment(workOrder);
      
      // Add safety requirements
      this.addSafetyRequirements(workOrder);
      
      // Add personnel information
      this.addPersonnelInfo(workOrder);
      
      // Add images if available
      if (workOrder.imageUrls && workOrder.imageUrls.length > 0) {
        await this.addImages(workOrder.imageUrls);
      }
      
      // Add notes
      if (workOrder.notes) {
        this.addNotes(workOrder.notes);
      }
      
      // Add footer
      this.addFooter();
      
      // Generate filename
      const fileName = `Work_Order_${workOrder.workOrderId || 'Draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      this.pdf.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  async generateConsolidatedPDF(consolidatedReport) {
    try {
      // Add consolidated report cover page
      await this.addConsolidatedCoverPage(consolidatedReport);

      // Process each consolidated entry directly (no table of contents)
      for (let i = 0; i < consolidatedReport.consolidatedEntries.length; i++) {
        const entry = consolidatedReport.consolidatedEntries[i];

        // Add new page for each entry
        this.pdf.addPage();
        this.currentY = this.margins.top;

        // Add entry header with consolidation info
        this.addConsolidatedEntryHeader(entry, i + 1, consolidatedReport.consolidatedEntries.length);

        // Add work order info
        this.addWorkOrderInfo(entry);

        // Add space information (without extra consolidation details)
        this.addSpaceInformation(entry);

        // Add hazard assessment
        this.addHazardAssessment(entry);

        // Add safety requirements
        this.addSafetyRequirements(entry);

        // Add personnel information
        this.addPersonnelInfo(entry);

        // Add images if available
        if (entry.imageUrls && entry.imageUrls.length > 0) {
          await this.addImages(entry.imageUrls);
        }

        // Add notes
        if (entry.notes) {
          this.addNotes(entry.notes);
        }
      }

      // Add footer to all pages
      this.addFooter();

      // Generate filename
      const fileName = `Consolidated_Work_Orders_${new Date().toISOString().split('T')[0]}.pdf`;

      // Save the PDF
      this.pdf.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating consolidated PDF:', error);
      throw new Error('Failed to generate consolidated PDF: ' + error.message);
    }
  }

  addHeader(workOrder) {
    const pdf = this.pdf;
    
    // Modern unique header with layered design
    const primaryRGB = this.hexToRgb(this.colors.primary);
    const accentRGB = this.hexToRgb(this.colors.accent);
    const secondaryRGB = this.hexToRgb(this.colors.secondary);
    
    // Base dark background with depth
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(0, 0, 210, 35, 'F');
    
    // Unique curved accent wave pattern
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setGState(pdf.GState({ opacity: 0.15 }));
    // Create wave effect with circles
    for (let i = 0; i < 8; i++) {
      pdf.circle(i * 30 - 10, 10, 25, 'F');
    }
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    // Dynamic side accent bar with gradient effect
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(0, 0, 6, 35, 'F');
    
    // Secondary accent triangular shape
    pdf.setFillColor(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
    pdf.setGState(pdf.GState({ opacity: 0.2 }));
    pdf.triangle(210, 0, 210, 35, 170, 0);
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    // Modern icon-style bullet
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.circle(this.margins.left + 2, 13, 2.5, 'F');
    
    // Bold contemporary typography
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFINED SPACE', this.margins.left + 8, 14);
    
    // Sleek subtitle with modern spacing
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(200, 200, 200);
    pdf.text('SAFETY ASSESSMENT REPORT', this.margins.left + 8, 22);
    
    // Ultra-modern floating card design for info
    const cardX = 210 - this.margins.right - 56;
    const cardWidth = 54;
    
    // Floating card shadow effect
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.roundedRect(cardX + 1, 8, cardWidth, 20, 3, 3, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    // Main info card with modern styling
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(cardX, 7, cardWidth, 20, 3, 3, 'F');
    
    // Accent strip on card
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(cardX, 7, cardWidth, 3, 'F');
    
    // Work Order ID with modern layout
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WORK ORDER', cardX + 3, 14);
    
    const workOrderId = workOrder.workOrderId || `WO-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.text(workOrderId, cardX + 3, 18.5);
    
    // Date with icon-style design
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATE', cardX + 3, 22);
    
    const date = new Date(workOrder.surveyDate || workOrder.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(date, cardX + 3, 25.5);
    
    // Bottom accent line with modern styling
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(0, 34, 210, 1, 'F');
    
    this.currentY = 42;
  }

  addWorkOrderInfo(workOrder) {
    this.addSectionHeader('Work Order Information');
    
    const info = [
      ['Status:', this.formatValue(workOrder.status, 'Pending')],
      ['Priority:', this.formatValue(workOrder.priority, 'Medium')],
      ['Technician:', this.formatValue(workOrder.technician, 'Not assigned')],
      ['Created:', new Date(workOrder.createdAt).toLocaleDateString()]
    ];
    
    this.addInfoTable(info);
    this.currentY += 6; // Reduced from 10
  }

  addSpaceInformation(workOrder) {
    this.addSectionHeader('Space Information');
    
    const info = [
      ['Space Name:', this.formatValue(workOrder.spaceName)],
      ['Building:', this.formatValue(workOrder.building)],
      ['Location:', this.formatValue(workOrder.locationDescription)],
      ['Confined Space:', workOrder.isConfinedSpace ? 'Yes' : 'No'],
      ['Permit Required:', workOrder.permitRequired ? 'Yes' : 'No'],
      ['Entry Points:', this.formatValue(workOrder.numberOfEntryPoints, 'Not specified')]
    ];
    
    this.addInfoTable(info);
    
    if (workOrder.confinedSpaceDescription) {
      this.currentY += 3; // Reduced from 5
      this.addText('Description:', true);
      this.addText(this.formatValue(workOrder.confinedSpaceDescription), false, 5);
    }
    
    this.currentY += 6; // Reduced from 10
  }

  addHazardAssessment(workOrder) {
    this.addSectionHeader('Hazard Assessment');
    
    const hazards = [
      {
        name: 'Atmospheric Hazard',
        present: workOrder.atmosphericHazard,
        description: workOrder.atmosphericHazardDescription
      },
      {
        name: 'Engulfment Hazard',
        present: workOrder.engulfmentHazard,
        description: workOrder.engulfmentHazardDescription
      },
      {
        name: 'Configuration Hazard',
        present: workOrder.configurationHazard,
        description: workOrder.configurationHazardDescription
      },
      {
        name: 'Other Hazards',
        present: workOrder.otherRecognizedHazards,
        description: workOrder.otherHazardsDescription
      }
    ];

    // Use the new hazard summary table
    this.addHazardSummaryTable(hazards);
  }

  addSafetyRequirements(workOrder) {
    this.addSectionHeader('Safety Requirements');
    
    const safety = [
      ['PPE Required:', workOrder.ppeRequired ? 'Yes' : 'No'],
      ['Forced Air Ventilation:', workOrder.forcedAirVentilationSufficient ? 'Sufficient' : 'Not Sufficient'],
      ['Air Monitor Required:', workOrder.dedicatedAirMonitor ? 'Yes' : 'No'],
      ['Warning Sign Posted:', workOrder.warningSignPosted ? 'Yes' : 'No']
    ];
    
    this.addInfoTable(safety);
    
    if (workOrder.ppeList) {
      this.currentY += 3; // Reduced from 5
      this.addText('PPE List:', true);
      this.addText(this.formatValue(workOrder.ppeList), false, 5);
    }
    
    this.currentY += 6; // Reduced from 10
  }

  addPersonnelInfo(workOrder) {
    this.addSectionHeader('Personnel & Access');
    
    const personnel = [
      ['Others Working Nearby:', workOrder.otherPeopleWorkingNearSpace ? 'Yes' : 'No'],
      ['Visibility into Space:', workOrder.canOthersSeeIntoSpace ? 'Yes' : 'No'],
      ['Contractors Enter Space:', workOrder.contractorsEnterSpace ? 'Yes' : 'No']
    ];
    
    this.addInfoTable(personnel);
    this.currentY += 6; // Reduced from 10
  }

  async addImages(imageUrls) {
    this.addSectionHeader('Documentation & Images');
    
    let imagesPerRow = 2;
    let imageWidth = 80;
    let imageHeight = 60;
    let currentCol = 0;
    let successfulImages = 0;
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        // Check if we need a new page
        this.checkPageBreak(imageHeight + 20);
        
        const imageData = await this.loadImage(imageUrls[i]);
        if (imageData) {
          const x = this.margins.left + (currentCol * (imageWidth + 10));
          const y = this.currentY;
          
          // Add image
          this.pdf.addImage(imageData, 'JPEG', x, y, imageWidth, imageHeight);
          
          // Add image label
          this.pdf.setFontSize(10);
          this.pdf.setTextColor(100, 100, 100);
          this.pdf.text(`Image ${i + 1}`, x, y + imageHeight + 5);
          
          successfulImages++;
          currentCol++;
          if (currentCol >= imagesPerRow) {
            currentCol = 0;
            this.currentY += imageHeight + 15;
          }
        } else {
          // Add placeholder for failed image
          const x = this.margins.left + (currentCol * (imageWidth + 10));
          const y = this.currentY;
          
          // Draw placeholder rectangle
          this.pdf.setDrawColor(200, 200, 200);
          this.pdf.setFillColor(245, 245, 245);
          this.pdf.rect(x, y, imageWidth, imageHeight, 'FD');
          
          // Add placeholder text
          this.pdf.setFontSize(10);
          this.pdf.setTextColor(150, 150, 150);
          this.pdf.text('Image unavailable', x + imageWidth/2 - 25, y + imageHeight/2);
          this.pdf.text(`Image ${i + 1}`, x, y + imageHeight + 5);
          
          currentCol++;
          if (currentCol >= imagesPerRow) {
            currentCol = 0;
            this.currentY += imageHeight + 15;
          }
        }
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
        // Continue with other images
      }
    }
    
    // Adjust currentY if we have remaining images in the last row
    if (currentCol > 0) {
      this.currentY += imageHeight + 10; // Reduced from 15
    }
    
    // Add summary text
    if (successfulImages < imageUrls.length) {
      this.pdf.setFontSize(8); // Reduced from 9
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text(
        `Note: ${successfulImages} of ${imageUrls.length} images loaded successfully. Some images may be unavailable due to access restrictions.`,
        this.margins.left,
        this.currentY
      );
      this.currentY += 8; // Reduced from 10
    }
    
    this.currentY += 6; // Reduced from 10
  }

  addNotes(notes) {
    this.addSectionHeader('Additional Notes');
    this.addText(this.formatValue(notes), false, 5);
    this.currentY += 6; // Reduced from 10
  }

  addFooter() {
    const pdf = this.pdf;
    const pageCount = pdf.getNumberOfPages();
    const primaryRGB = this.hexToRgb(this.colors.primary);
    const accentRGB = this.hexToRgb(this.colors.accent);
    
    // Skip the first page (cover page) for consolidated reports
    const startPage = pageCount > 1 && this.pdf.internal.pages[1] ? 2 : 1;
    
    for (let i = startPage; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Modern minimalist footer
      const footerY = this.pageHeight - 15;
      
      // Thin top accent line
      pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.setLineWidth(0.8);
      pdf.line(0, footerY - 2, 210, footerY - 2);
      
      // Light background
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, footerY - 2, 210, 17, 'F');
      
      // Left side - Generation info with icon-like element
      pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.circle(this.margins.left + 2, footerY + 4, 1, 'F');
      
      pdf.setFontSize(6);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      const generateTime = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated ${generateTime}`, this.margins.left + 6, footerY + 5);
      
      // Center - Modern branding
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      pdf.text('CONFINED SPACE', 105, footerY + 5, { align: 'center' });
      
      // Right side - Modern page numbers with background
      pdf.setFillColor(229, 231, 235); // Light gray background
      pdf.roundedRect(210 - this.margins.right - 18, footerY + 1, 16, 6, 2, 2, 'F');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      pdf.text(`${i}/${pageCount}`, 210 - this.margins.right - 10, footerY + 5, { align: 'center' });
    }
  }

  addSectionHeader(title) {
    this.checkPageBreak(22);
    
    const pdf = this.pdf;
    const primaryRGB = this.hexToRgb(this.colors.primary);
    const accentRGB = this.hexToRgb(this.colors.accent);
    
    this.currentY += 8;
    
    // Modern side accent bar
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(this.margins.left - 5, this.currentY - 2, 3, 10, 'F');
    
    // Subtle gradient background effect
    pdf.setFillColor(249, 250, 251);
    pdf.rect(this.margins.left, this.currentY - 2, 180, 10, 'F');
    
    // Modern typography
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title.toUpperCase(), this.margins.left + 5, this.currentY + 5);
    
    // Thin underline
    pdf.setDrawColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setLineWidth(0.5);
    pdf.line(this.margins.left + 5, this.currentY + 7, this.margins.left + 60, this.currentY + 7);
    
    this.currentY += 16;
  }

  addDataTable(headers, data, options = {}) {
    const pdf = this.pdf;
    const {
      columnWidths = null,
      headerColor = this.colors.primary,
      alternateRowColor = true,
      headerHeight = 12,
      rowHeight = 10,
      fontSize = 8,
      headerFontSize = 9,
      borderWidth = 0.3,
      padding = 3
    } = options;

    // Calculate column widths if not provided
    const tableWidth = 210 - this.margins.left - this.margins.right;
    const numColumns = headers.length;
    const defaultColumnWidth = tableWidth / numColumns;
    const colWidths = columnWidths || headers.map(() => defaultColumnWidth);

    // Check if we need a page break
    const totalHeight = headerHeight + (data.length * rowHeight) + 6;
    this.checkPageBreak(totalHeight);

    let currentY = this.currentY;

    // Draw table background
    const tableHeight = headerHeight + (data.length * rowHeight);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(this.margins.left - 2, currentY - 2, tableWidth + 4, tableHeight + 4, 'F');

    // Draw table border
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(borderWidth);
    pdf.rect(this.margins.left - 2, currentY - 2, tableWidth + 4, tableHeight + 4, 'D');

    // Draw header
    const headerRGB = this.hexToRgb(headerColor);
    pdf.setFillColor(headerRGB.r, headerRGB.g, headerRGB.b);
    pdf.rect(this.margins.left - 2, currentY - 2, tableWidth + 4, headerHeight, 'F');

    // Header border
    pdf.setDrawColor(209, 213, 219);
    pdf.rect(this.margins.left - 2, currentY - 2, tableWidth + 4, headerHeight, 'D');

    // Header text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(headerFontSize);
    pdf.setFont('helvetica', 'bold');

    let xPos = this.margins.left;
    headers.forEach((header, index) => {
      const width = colWidths[index];
      pdf.text(header, xPos + padding, currentY + headerHeight - 3);
      xPos += width;
    });

    currentY += headerHeight;

    // Draw data rows
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');

    data.forEach((row, rowIndex) => {
      // Alternate row background
      if (alternateRowColor && rowIndex % 2 === 1) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(this.margins.left - 2, currentY, tableWidth + 4, rowHeight, 'F');
      }

      // Row border
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(this.margins.left - 2, currentY + rowHeight, this.margins.left + tableWidth + 2, currentY + rowHeight);

      // Row data
      pdf.setTextColor(0, 0, 0); // Pure black for better contrast
      xPos = this.margins.left;
      row.forEach((cell, colIndex) => {
        const width = colWidths[colIndex];
        const cellText = String(cell || '');
        const maxWidth = width - (padding * 2);

        // Handle text wrapping if needed
        if (pdf.getTextWidth(cellText) > maxWidth) {
          const lines = pdf.splitTextToSize(cellText, maxWidth);
          pdf.text(lines[0], xPos + padding, currentY + rowHeight - 3);
        } else {
          pdf.text(cellText, xPos + padding, currentY + rowHeight - 3);
        }

        xPos += width;
      });

      currentY += rowHeight;
    });

    // Update current Y position
    this.currentY = currentY + 4;
  }

  addSummaryTable(title, data, options = {}) {
    this.addSectionHeader(title);

    const headers = ['Metric', 'Value', 'Status'];
    const tableData = data.map(item => [
      item.label,
      item.value,
      item.status || 'N/A'
    ]);

    // Status-based color coding
    const statusColors = {
      'Good': '#10b981',      // Green
      'Warning': '#f59e0b',   // Yellow
      'Critical': '#ef4444',  // Red
      'N/A': '#6b7280'       // Gray
    };

    // Custom rendering for status column
    const customOptions = {
      ...options,
      columnWidths: [80, 60, 40],
      rowHeight: 12,
      fontSize: 9,
      headerFontSize: 10
    };

    this.addDataTable(headers, tableData, customOptions);

    // Add status indicators after the table
    this.currentY += 2;
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'normal');

    Object.entries(statusColors).forEach(([status, color], index) => {
      const rgb = this.hexToRgb(color);
      this.pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      this.pdf.circle(this.margins.left + (index * 35), this.currentY, 2, 'F');

      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(status, this.margins.left + (index * 35) + 5, this.currentY + 1);
    });

    this.currentY += 8;
  }

  addWorkOrderSummaryTable(workOrders) {
    this.addSectionHeader('WORK ORDER SUMMARY');

    const headers = ['ID', 'Space', 'Building', 'Status', 'Priority', 'Date'];
    const tableData = workOrders.map(wo => [
      wo.workOrderId || 'N/A',
      wo.spaceName || wo.confinedSpaceNameOrId || 'N/A',
      wo.building || 'N/A',
      wo.status || 'Pending',
      wo.priority || 'Medium',
      new Date(wo.surveyDate || wo.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    ]);

    const options = {
      columnWidths: [25, 45, 35, 25, 25, 25],
      rowHeight: 10,
      fontSize: 7,
      headerFontSize: 8,
      alternateRowColor: true
    };

    this.addDataTable(headers, tableData, options);
    this.currentY += 6;
  }

  addHazardSummaryTable(hazards) {
    this.addSectionHeader('HAZARD ASSESSMENT SUMMARY');

    const headers = ['Hazard Type', 'Present', 'Description'];
    const tableData = hazards.map(hazard => [
      hazard.name,
      hazard.present ? 'Yes' : 'No',
      hazard.description || 'N/A'
    ]);

    const options = {
      columnWidths: [50, 20, 90],
      rowHeight: 12,
      fontSize: 8,
      headerFontSize: 9,
      alternateRowColor: true
    };

    this.addDataTable(headers, tableData, options);
    this.currentY += 6;
  }

  addInfoTable(data) {
    const pdf = this.pdf;
    const rowHeight = 11;
    const accentRGB = this.hexToRgb(this.colors.accent);
    
    // Modern card-style background with shadow effect
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(this.margins.left - 3, this.currentY - 3, 165, data.length * rowHeight + 6, 3, 3, 'F');
    
    // Subtle border
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(this.margins.left - 3, this.currentY - 3, 165, data.length * rowHeight + 6, 3, 3, 'D');
    
    this.currentY += 2;
    
    data.forEach((row, index) => {
      // Modern row separator with accent color
      if (index > 0) {
        pdf.setDrawColor(243, 244, 246);
        pdf.setLineWidth(0.3);
        pdf.line(this.margins.left + 2, this.currentY, this.margins.left + 158, this.currentY);
      }
      
      this.currentY += 2;
      
      // Label with modern styling
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(accentRGB.r, accentRGB.g, accentRGB.b);
      pdf.text(row[0].toUpperCase(), this.margins.left + 3, this.currentY + 5);
      
      // Value with clean typography
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const valueText = String(row[1]);
      const maxWidth = 95;
      if (pdf.getTextWidth(valueText) > maxWidth) {
        const truncated = valueText.substring(0, 23) + '...';
        pdf.text(truncated, this.margins.left + 50, this.currentY + 5);
      } else {
        pdf.text(valueText, this.margins.left + 50, this.currentY + 5);
      }
      
      this.currentY += 9;
    });
    
    this.currentY += 4;
  }

  addText(text, isBold = false, leftMargin = 0) {
    const pdf = this.pdf;
    
    pdf.setFontSize(9); // Reduced from 10
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0); // Pure black for better contrast
    
    // Split long text into multiple lines with proper width calculation
    const maxWidth = 170 - leftMargin - 10; // Add padding to prevent overlap
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach(line => {
      this.checkPageBreak(8); // Reduced from 10
      pdf.text(line, this.margins.left + leftMargin, this.currentY + 4);
      this.currentY += 6; // Reduced from 8
    });
  }

  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.pdf.addPage();
      this.currentY = this.margins.top;
    }
  }

  async loadLogo() {
    try {
      // Try to load logo from public folder with high quality
      const logoPath = '/logo.jpg';
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Use higher resolution for clarity
          const scaleFactor = 2; // 2x resolution for sharper image
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Scale and draw the image
          ctx.scale(scaleFactor, scaleFactor);
          ctx.drawImage(img, 0, 0);
          
          // Convert to high quality JPEG (1.0 = maximum quality)
          const dataURL = canvas.toDataURL('image/jpeg', 1.0);
          resolve(dataURL);
        };
        
        img.onerror = () => {
          console.log('Logo not found, using placeholder');
          resolve(null);
        };
        
        // Set crossOrigin for better compatibility
        img.crossOrigin = 'anonymous';
        img.src = logoPath;
        
        // Timeout after 3 seconds (increased for better loading)
        setTimeout(() => resolve(null), 3000);
      });
    } catch (error) {
      console.log('Error loading logo:', error);
      return null;
    }
  }

  async loadImage(url) {
    return new Promise((resolve) => {
      console.log('🖼️ Attempting to load image:', url);
      
      // Set a timeout for image loading
      const timeout = setTimeout(() => {
        console.log('⏰ Image loading timeout - creating placeholder');
        resolve(this.createPlaceholderImage());
      }, 8000); // Increased timeout to 8 seconds
      
      // Method 1: Try fetch approach first
      this.tryFetchMethod(url, timeout, resolve);
    });
  }

  createPlaceholderImage() {
    try {
      // Create a canvas-based placeholder image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 400;
      canvas.height = 300;
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);
      
      // Add border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 398, 298);
      
      // Add icon (camera symbol)
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📷', 200, 140);
      
      // Add main text
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Work Order Image', 200, 180);
      
      // Add sub text
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Arial';
      ctx.fillText('Loading from secure storage...', 200, 205);
      
      // Add technical note
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial';
      ctx.fillText('If image fails to load, check network connection', 200, 240);
      
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.log('Failed to create placeholder image:', error);
      return null;
    }
  }

  async tryFetchMethod(url, timeout, resolve) {
    try {
      console.log('📥 Trying fetch method...');
      
      // Use the correct proxy endpoint path (no /api prefix since it's already in the base URL)
      const baseUrl = import.meta.env.VITE_WORKORDER_API_URL || 'http://localhost:3012/api';
      const proxyUrl = `${baseUrl.replace('/api', '')}/api/proxy-image?url=${encodeURIComponent(url)}`;
      console.log('🔄 Using proxy URL:', proxyUrl);
      
      // Add authentication token if available
      const token = localStorage.getItem('token');
      const headers = {
        'Accept': 'image/*'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          clearTimeout(timeout);
          console.log('✅ Image loaded successfully via proxy');
          resolve(e.target.result);
        };
        
        reader.onerror = () => {
          console.log('❌ FileReader error, trying image element...');
          this.tryImageElement(url, timeout, resolve);
        };
        
        reader.readAsDataURL(blob);
        return;
      } else {
        console.log('❌ Proxy fetch failed with status:', response.status, 'Response:', await response.text());
        this.tryImageElement(url, timeout, resolve);
      }
    } catch (fetchError) {
      console.log('❌ Fetch method failed:', fetchError.message);
      this.tryImageElement(url, timeout, resolve);
    }
  }

  tryImageElement(url, timeout, resolve) {
    console.log('🖼️ Trying image element method...');
    
    // Try proxy URL first instead of direct URL
    const baseUrl = import.meta.env.VITE_WORKORDER_API_URL || 'http://localhost:3012/api';
    const proxyUrl = `${baseUrl.replace('/api', '')}/api/proxy-image?url=${encodeURIComponent(url)}`;
    console.log('🔄 Using proxy image element with URL:', proxyUrl);
    
    const img = new Image();
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        console.log('✅ Image loaded successfully via proxy image element');
        resolve(dataURL);
      } catch (error) {
        console.log('❌ Canvas processing error:', error.message);
        resolve(this.createPlaceholderImage());
      }
    };
    
    img.onerror = () => {
      console.log('❌ Proxy image element failed, trying direct URL...');
      
      // Fallback to direct URL (will likely fail due to CORS but worth trying)
      const directImg = new Image();
      directImg.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = directImg.width;
          canvas.height = directImg.height;
          ctx.drawImage(directImg, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          console.log('✅ Image loaded successfully via direct URL');
          resolve(dataURL);
        } catch (error) {
          console.log('❌ Direct canvas processing error:', error.message);
          resolve(this.createPlaceholderImage());
        }
      };
      
      directImg.onerror = () => {
        clearTimeout(timeout);
        console.log('❌ Image element failed - CORS restrictions detected');
        console.log('💡 To fix: Configure CORS in Azure Storage Account');
        resolve(this.createPlaceholderImage());
      };
      
      directImg.crossOrigin = 'anonymous';
      directImg.src = url;
    };
    
    // Set crossOrigin and use proxy URL
    img.crossOrigin = 'anonymous';
    img.src = proxyUrl;
  }

  addConsolidatedHeader(consolidatedReport) {
    const pdf = this.pdf;

    // Clean simple header with new primary color
    const primaryRGB = this.hexToRgb(this.colors.primary);
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(0, 0, 210, 28, 'F'); // Reduced from 35
    
    // Simple accent line
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 26, 210, 2, 'F'); // Adjusted position

    // Clean title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14); // Reduced from 16
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONSOLIDATED SAFETY REPORT', this.margins.left, 15);
    
    // Simple subtitle
    pdf.setFontSize(7); // Reduced from 9
    pdf.setFont('helvetica', 'normal');
    pdf.text('Multiple Assessments Combined', this.margins.left, 22);
    
    // Simple stats on right
    pdf.setFontSize(7); // Reduced from 8
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Entries: ${consolidatedReport._totalConsolidatedEntries}/${consolidatedReport._totalOriginalEntries}`, 210 - this.margins.right, 15, { align: 'right' });
    pdf.text(`Generated: ${new Date(consolidatedReport._generatedAt).toLocaleDateString()}`, 210 - this.margins.right, 22, { align: 'right' });

    this.currentY = 35; // Reduced from 45
  }

  async addConsolidatedCoverPage(consolidatedReport) {
    const pdf = this.pdf;
    const primaryRGB = this.hexToRgb(this.colors.primary);
    const accentRGB = this.hexToRgb(this.colors.accent);

    // Clean white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Subtle geometric design elements
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setGState(pdf.GState({ opacity: 0.03 }));
    pdf.circle(220, -20, 80, 'F');
    pdf.circle(-30, 320, 100, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    // Logo section at the top - balanced size
    const logoData = await this.loadLogo();
    if (logoData) {
      // Add actual logo image (centered, optimal size)
      pdf.addImage(logoData, 'JPEG', 80, 35, 50, 50);
    } else {
      // Fallback: Create a simple logo placeholder
      pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
      pdf.circle(105, 60, 20, 'F');
      
      // Logo text in white
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CSM', 105, 65, { align: 'center' });
    }
    
    // Main title section
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SAFETY ASSESSMENT', 105, 105, { align: 'center' });
    
    // Thin decorative line
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(55, 113, 100, 1.5, 'F');
    
    // Subtitle with better contrast
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0); // Pure black for clarity
    pdf.text('Comprehensive Report', 105, 125, { align: 'center' });
    
    // Generation date with clear text
    const generatedDate = new Date(consolidatedReport._generatedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0); // Pure black for clarity
    pdf.text('Report Generated:', 105, 150, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.text(generatedDate, 105, 160, { align: 'center' });
    
    // Simple clean footer bar
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(0, 270, 210, 27, 'F');
    
    // Accent stripe
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(0, 270, 210, 2, 'F');
    
    // Clear footer text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFINED SPACE', 105, 282, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Management System', 105, 290, { align: 'center' });
  }

  addConsolidatedEntryHeader(entry, entryNumber) {
    const pdf = this.pdf;

    // Modern entry header with unique geometric design
    const primaryRGB = this.hexToRgb(this.colors.primary);
    const accentRGB = this.hexToRgb(this.colors.accent);
    const secondaryRGB = this.hexToRgb(this.colors.secondary);
    
    // Base header background with depth
    pdf.setFillColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    pdf.rect(0, this.currentY - 5, 210, 30, 'F');
    
    // Dynamic diagonal accent pattern
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.triangle(0, this.currentY - 5, 0, this.currentY + 25, 60, this.currentY - 5);
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    // Modern side accent bar
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(0, this.currentY - 5, 5, 30, 'F');
    
    // Unique hexagonal badge for entry number
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.circle(this.margins.left + 14, this.currentY + 10, 9, 'F');
    
    // Inner circle for depth
    pdf.setFillColor(59, 130, 246);
    pdf.circle(this.margins.left + 14, this.currentY + 10, 7.5, 'F');
    
    // Entry number text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(entryNumber.toString(), this.margins.left + 14, this.currentY + 13.5, { align: 'center' });
    
    // Modern title with contemporary spacing
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    const title = entry._consolidated ? 'CONSOLIDATED ENTRY' : 'INDIVIDUAL ENTRY';
    pdf.text(title, this.margins.left + 28, this.currentY + 12);
    
    // Sleek subtitle with space info
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(200, 200, 200);
    
    const spaceInfo = entry.spaceName || entry.confinedSpaceNameOrId || 'Space Assessment';
    const truncatedInfo = spaceInfo.length > 25 ? spaceInfo.substring(0, 22) + '...' : spaceInfo;
    pdf.text(truncatedInfo, this.margins.left + 28, this.currentY + 18);
    
    // Modern info cards on right side
    const cardY = this.currentY + 4;
    
    // Date card with modern styling
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.15 }));
    pdf.roundedRect(210 - this.margins.right - 50, cardY, 48, 8, 2, 2, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 200, 200);
    pdf.text('DATE', 210 - this.margins.right - 47, cardY + 3);
    
    const surveyDate = new Date(entry.surveyDate || entry.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(surveyDate, 210 - this.margins.right - 47, cardY + 6.5);
    
    // Building card
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.15 }));
    pdf.roundedRect(210 - this.margins.right - 50, cardY + 10, 48, 8, 2, 2, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 200, 200);
    pdf.text('BUILDING', 210 - this.margins.right - 47, cardY + 13);
    
    const building = entry.building || 'N/A';
    const buildingText = building.length > 15 ? building.substring(0, 12) + '...' : building;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(buildingText, 210 - this.margins.right - 47, cardY + 16.5);
    
    // Bottom accent line with gradient effect
    pdf.setFillColor(accentRGB.r, accentRGB.g, accentRGB.b);
    pdf.rect(0, this.currentY + 24, 210, 1, 'F');

    this.currentY += 32;
  }
}

export default WorkOrderPDFGenerator;