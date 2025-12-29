import * as XLSX from 'xlsx';

/**
 * Export work order data to Excel with all fields
 * @param {Array} workOrders - Array of work order objects
 * @param {string} filename - Name of the exported file (without extension)
 */
export const exportWorkOrdersToExcel = (workOrders, filename = 'confined_space_assessments') => {
  try {
    if (!workOrders || workOrders.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare data for Excel with all fields - using import-compatible headers
    const excelData = workOrders.map((order, index) => ({
      // Basic Information
      'Work Order ID': order.workOrderId || order._id || '',
      'Space Name': order.spaceName || '',
      'Building': order.building || '',
      'Location Description': order.locationDescription || '',
      'Confined Space Description': order.confinedSpaceDescription || '',
      'Technician': order.technician || '',
      'Priority': order.priority || '',
      'Status': order.status || '',
      'Survey Date': order.surveyDate ? new Date(order.surveyDate).toLocaleDateString() : '',
      
      // Space Classification
      'Confined Space': order.isConfinedSpace === true ? 'Yes' : order.isConfinedSpace === false ? 'No' : '',
      'Permit Required': order.permitRequired === true ? 'Yes' : order.permitRequired === false ? 'No' : '',
      'Entry Requirements': order.entryRequirements || '',
      
      // Hazard Assessment
      'Atmospheric Hazard': order.atmosphericHazard === true ? 'Yes' : order.atmosphericHazard === false ? 'No' : '',
      'Atmospheric Hazard Description': order.atmosphericHazardDescription || '',
      'Engulfment Hazard': order.engulfmentHazard === true ? 'Yes' : order.engulfmentHazard === false ? 'No' : '',
      'Engulfment Hazard Description': order.engulfmentHazardDescription || '',
      'Configuration Hazard': order.configurationHazard === true ? 'Yes' : order.configurationHazard === false ? 'No' : '',
      'Configuration Hazard Description': order.configurationHazardDescription || '',
      'Other Hazards': order.otherRecognizedHazards === true ? 'Yes' : order.otherRecognizedHazards === false ? 'No' : '',
      'Other Hazards Description': order.otherHazardsDescription || '',
      
      // Safety Requirements
      'PPE Required': order.ppeRequired === true ? 'Yes' : order.ppeRequired === false ? 'No' : '',
      'PPE List': order.ppeList || '',
      'Forced Air Ventilation Sufficient': order.forcedAirVentilationSufficient === true ? 'Yes' : (order.forcedAirVentilationSufficient === false ? 'No' : ''),
      'Air Monitor Required': order.dedicatedAirMonitor === true ? 'Yes' : (order.dedicatedAirMonitor === false ? 'No' : ''),
      'Warning Sign Posted': order.warningSignPosted === true ? 'Yes' : (order.warningSignPosted === false ? 'No' : ''),
      
      // Entry Points and Access
      'Number of Entry Points': order.numberOfEntryPoints || '',
      'Other People Working Near Space': order.otherPeopleWorkingNearSpace === true ? 'Yes' : order.otherPeopleWorkingNearSpace === false ? 'No' : '',
      'Can Others See Into Space': order.canOthersSeeIntoSpace === true ? 'Yes' : order.canOthersSeeIntoSpace === false ? 'No' : '',
      'Contractors Enter Space': order.contractorsEnterSpace === true ? 'Yes' : order.contractorsEnterSpace === false ? 'No' : '',
      
      // Additional Information
      'Images': order.imageUrls ? order.imageUrls.join(';') : '',
      'Notes': order.notes || '',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessments');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 20 },  // Work Order ID
      { wch: 25 },  // Space Name
      { wch: 20 },  // Building
      { wch: 40 },  // Location Description
      { wch: 40 },  // Confined Space Description
      { wch: 20 },  // Technician
      { wch: 12 },  // Priority
      { wch: 12 },  // Status
      { wch: 15 },  // Survey Date
      { wch: 18 },  // Confined Space
      { wch: 18 },  // Permit Required
      { wch: 40 },  // Entry Requirements
      { wch: 20 },  // Atmospheric Hazard
      { wch: 40 },  // Atmospheric Hazard Description
      { wch: 20 },  // Engulfment Hazard
      { wch: 40 },  // Engulfment Hazard Description
      { wch: 20 },  // Configuration Hazard
      { wch: 40 },  // Configuration Hazard Description
      { wch: 20 },  // Other Hazards
      { wch: 40 },  // Other Hazards Description
      { wch: 15 },  // PPE Required
      { wch: 40 },  // PPE List
      { wch: 30 },  // Forced Air Ventilation Sufficient
      { wch: 20 },  // Air Monitor Required
      { wch: 20 },  // Warning Sign Posted
      { wch: 20 },  // Number of Entry Points
      { wch: 30 },  // Other People Working Near Space
      { wch: 25 },  // Can Others See Into Space
      { wch: 25 },  // Contractors Enter Space
      { wch: 60 },  // Images
      { wch: 50 },  // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Generate Excel file and trigger download
    const timestamp = new Date().toISOString().split('T')[0];
    const excelFilename = `${filename}_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, excelFilename);

    return {
      success: true,
      message: `Successfully exported ${workOrders.length} records to ${excelFilename}`,
      count: workOrders.length
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export data: ${error.message}`);
  }
};

/**
 * Export filtered work orders with custom fields
 * @param {Array} workOrders - Array of work order objects
 * @param {Array} fields - Array of field names to include in export
 * @param {string} filename - Name of the exported file (without extension)
 */
export const exportCustomFieldsToExcel = (workOrders, fields, filename = 'custom_export') => {
  try {
    if (!workOrders || workOrders.length === 0) {
      throw new Error('No data to export');
    }

    if (!fields || fields.length === 0) {
      throw new Error('No fields specified for export');
    }

    // Field mapping for better display names
    const fieldMapping = {
      'workOrderId': 'Work Order ID',
      'surveyDate': 'Survey Date',
      'technician': 'Technician',
      'priority': 'Priority',
      'status': 'Status',
      'spaceName': 'Space Name',
      'building': 'Building',
      'locationDescription': 'Location',
      'isConfinedSpace': 'Confined Space',
      'permitRequired': 'Permit Required',
      'atmosphericHazard': 'Atmospheric Hazard',
      'engulfmentHazard': 'Engulfment Hazard',
      'configurationHazard': 'Configuration Hazard',
      'ppeRequired': 'PPE Required',
      'createdAt': 'Created Date'
    };

    // Prepare data with selected fields
    const excelData = workOrders.map((order, index) => {
      const row = { 'No.': index + 1 };
      
      fields.forEach(field => {
        const displayName = fieldMapping[field] || field;
        let value = order[field];
        
        // Format value based on type
        if (value === true || value === false) {
          value = value ? 'Yes' : 'No';
        } else if (value instanceof Date) {
          value = value.toLocaleString();
        } else if (field.includes('Date') || field.includes('At')) {
          value = value ? new Date(value).toLocaleString() : 'N/A';
        } else if (!value) {
          value = 'N/A';
        }
        
        row[displayName] = value;
      });
      
      return row;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

    // Generate Excel file and trigger download
    const timestamp = new Date().toISOString().split('T')[0];
    const excelFilename = `${filename}_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, excelFilename);

    return {
      success: true,
      message: `Successfully exported ${workOrders.length} records`,
      count: workOrders.length
    };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Failed to export data: ${error.message}`);
  }
};
