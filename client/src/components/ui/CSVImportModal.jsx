import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const CSVImportModal = ({ isOpen, onClose, onImport, isLoading = false }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  const csvTemplate = [
    'Survey Date,Confined Space Name/ID,Building,Location Description,Confined Space Description,Is this a Confined Space?,Permit Required?,Entry Requirements,Atmospheric Hazard?,Atmospheric Hazard Description,Engulfment Hazard?,Engulfment Hazard Description,Configuration Hazard?,Configuration Hazard Description,Other Recognized Hazards?,Other Hazards Description,PPE Required?,PPE List,Forced Air Ventilation Sufficient?,Dedicated Air Monitor?,Warning Sign Posted?,Number of Entry Points,Other People Working Near Space?,Can Others See into Space?,Do Contractors Enter Space?,Is the Space Normally Locked?',
    '2024-01-15,Underground Storage Tank,Building A,Main Floor Storage Area,Underground storage tank with limited access and ventilation requirements,Yes,Yes,Permit required for entry with gas testing,No,,No,,Yes,Limited headroom and narrow opening,No,,Yes,Hard hat and safety harness required,Yes,Yes,Yes,2,Yes,Yes,No,Yes',
    '2024-01-16,Electrical Vault,Building B,Basement Level,Electrical equipment vault with high voltage systems,Yes,Yes,Lockout/tagout procedures required,Yes,Electrical arc flash and oxygen deficiency,No,,No,,No,,Yes,Electrical rated PPE and insulated gloves,Yes,Yes,No,1,No,Yes,No,Yes',
    '2024-01-17,Chemical Storage Area,Building C,Ground Floor East Wing,Chemical storage area with ventilation system and emergency eyewash,Yes,Yes,Chemical PPE and continuous air monitoring required,Yes,Toxic vapor and oxygen deficiency potential,Yes,Chemical engulfment risk from spills,Yes,Multiple tank configurations and piping hazards,Yes,Multiple chemical storage and reaction hazards,Yes,Full chemical PPE with SCBA respirator,Yes,Yes,Yes,3,Yes,No,Yes,Yes'
  ];

  const downloadTemplate = () => {
    // Create Excel workbook with template data
    const wb = XLSX.utils.book_new();
    
    // Convert CSV template to array format for Excel
    const headers = csvTemplate[0].split(',');
    const data = csvTemplate.slice(1).map(row => row.split(','));
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Work Orders Template');
    
    // Save as Excel file
    XLSX.writeFile(wb, 'work-orders-template.xlsx');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const supportedFormats = ['csv', 'xlsx', 'xls'];
      
      if (supportedFormats.includes(fileExtension)) {
        setCsvFile(file);
        parseFile(file);
      } else {
        setErrors(['Please select a valid CSV or Excel file (.csv, .xlsx, .xls)']);
      }
    }
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    reader.onload = (e) => {
      try {
        let data;
        
        if (fileExtension === 'csv') {
          // Parse CSV
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            setErrors(['File must contain at least a header row and one data row']);
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
          
          data = { headers, dataRows };
        } else {
          // Parse Excel (.xlsx, .xls)
          const workbook = XLSX.read(e.target.result, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays with raw values (preserving dates and numbers)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false, // Get formatted values
            dateNF: 'yyyy-mm-dd' // Format dates as ISO
          });
          
          if (jsonData.length < 2) {
            setErrors(['File must contain at least a header row and one data row']);
            return;
          }
          
          const headers = jsonData[0].map(h => String(h || '').trim());
          const dataRows = jsonData.slice(1).map(row => 
            row.map(cell => {
              // Preserve the original cell value type
              if (cell === null || cell === undefined) return '';
              if (typeof cell === 'number') return cell; // Keep numbers as numbers
              return String(cell).trim(); // Convert others to trimmed strings
            })
          );
          
          data = { headers, dataRows };
        }

        // Process the data
        processFileData(data.headers, data.dataRows);
        
      } catch (error) {
        setErrors([`Error parsing file: ${error.message}`]);
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const processFileData = (headers, dataRows) => {
    try {
      console.log('Processing file data...');
      console.log('Headers:', headers);
      console.log('Data rows count:', dataRows.length);
      console.log('First data row:', dataRows[0]);
      
      // Helper function to parse boolean values (Yes/No)
      const parseBoolean = (value) => {
        if (value === null || value === undefined || value === '') return false;
        if (typeof value === 'boolean') return value;
        
        // Trim whitespace and convert to lowercase for case-insensitive comparison
        const normalized = String(value).trim().toLowerCase();
        
        // Check for truthy values - return boolean true
        if (['yes', 'y', 'true', '1', 'x'].includes(normalized)) {
          return true;
        }
        
        // Check for falsy values - return boolean false
        if (['no', 'n', 'false', '0', ''].includes(normalized)) {
          return false;
        }
        
        // Default to false for unrecognized values
        return false;
      };
      
      // Helper function to parse numeric values
      const parseNumeric = (value) => {
        if (value === null || value === undefined || value === '') return '';
        if (typeof value === 'number') return value;
        
        // Try parsing as number
        const num = Number(String(value).trim());
        return isNaN(num) ? '' : num;
      };
      
      // Helper function to parse Excel dates
      const parseExcelDate = (value) => {
        if (!value) return '';
        
        // If it's already a valid date string, return it
        if (typeof value === 'string' && value.includes('-')) {
          return value;
        }
        
        // Excel stores dates as serial numbers (days since 1900-01-01)
        if (!isNaN(value) && typeof value === 'number') {
          // Excel's epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
          // So we subtract 1 to account for this
          const excelEpoch = new Date(1900, 0, 1);
          const msPerDay = 86400000; // milliseconds in a day
          const date = new Date(excelEpoch.getTime() + (value - 2) * msPerDay);
          
          // Format as YYYY-MM-DD for backend
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        
        // Try parsing as regular date string
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.warn('Could not parse date:', value);
        }
        
        return value;
      };
      
      // Expected headers mapping - handles new professional format and legacy formats
      const headerMapping = {
        'Survey Date': 'surveyDate',
        'Confined Space Name/ID': 'spaceName',
        'Space Name': 'spaceName', // Legacy support
        'Space Name/ID': 'spaceName', // Legacy support
        'Building': 'building',
        'Location Description': 'locationDescription',
        'Confined Space Description': 'confinedSpaceDescription',
        'Is this a Confined Space?': 'isConfinedSpace',
        'Confined Space': 'isConfinedSpace', // Legacy support
        'Is Confined Space': 'isConfinedSpace', // Legacy support
        'Permit Required?': 'permitRequired',
        'Permit Required': 'permitRequired', // Legacy support
        'Entry Requirements': 'entryRequirements',
        'Atmospheric Hazard?': 'atmosphericHazard',
        'Atmospheric Hazard': 'atmosphericHazard', // Legacy support
        'Atmospheric Hazard Description': 'atmosphericHazardDescription',
        'Engulfment Hazard?': 'engulfmentHazard',
        'Engulfment Hazard': 'engulfmentHazard', // Legacy support
        'Engulfment Hazard Description': 'engulfmentHazardDescription',
        'Configuration Hazard?': 'configurationHazard',
        'Configuration Hazard': 'configurationHazard', // Legacy support
        'Configuration Hazard Description': 'configurationHazardDescription',
        'Other Recognized Hazards?': 'otherRecognizedHazards',
        'Other Hazards': 'otherRecognizedHazards', // Legacy support
        'Other Recognized Hazards': 'otherRecognizedHazards', // Legacy support
        'Other Hazards Description': 'otherHazardsDescription',
        'PPE Required?': 'ppeRequired',
        'PPE Required': 'ppeRequired', // Legacy support
        'PPE List': 'ppeList',
        'Forced Air Ventilation Sufficient?': 'forcedAirVentilationSufficient',
        'Forced Air Ventilation Sufficient': 'forcedAirVentilationSufficient', // Legacy support
        'Dedicated Air Monitor?': 'dedicatedAirMonitor',
        'Air Monitor Required': 'dedicatedAirMonitor', // Legacy support
        'Dedicated Air Monitor': 'dedicatedAirMonitor', // Legacy support
        'Warning Sign Posted?': 'warningSignPosted',
        'Warning Sign Posted': 'warningSignPosted', // Legacy support
        'Number of Entry Points': 'numberOfEntryPoints',
        'Other People Working Near Space?': 'otherPeopleWorkingNearSpace',
        'Other People Working Near Space': 'otherPeopleWorkingNearSpace', // Legacy support
        'Can Others See into Space?': 'canOthersSeeIntoSpace',
        'Can Others See Into Space': 'canOthersSeeIntoSpace', // Legacy support
        'Do Contractors Enter Space?': 'contractorsEnterSpace',
        'Contractors Enter Space': 'contractorsEnterSpace', // Legacy support
        'Is the Space Normally Locked?': 'isSpaceNormallyLocked',
        'Images': 'images',
        'Image URLs': 'images', // Legacy support
        'Notes': 'notes',
        'Additional Notes': 'notes' // Legacy support
      };

      // Validate headers
      const requiredHeaders = ['Building'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
        return;
      }

      // Define boolean and numeric fields
      const booleanFields = [
        'isConfinedSpace', 'permitRequired', 'atmosphericHazard', 'engulfmentHazard',
        'configurationHazard', 'otherRecognizedHazards', 'ppeRequired',
        'forcedAirVentilationSufficient', 'dedicatedAirMonitor', 'warningSignPosted',
        'otherPeopleWorkingNearSpace', 'canOthersSeeIntoSpace', 'contractorsEnterSpace',
        'isSpaceNormallyLocked'
      ];
      
      const numericFields = ['numberOfEntryPoints'];
      const dateFields = ['surveyDate', 'createdDate'];
      
      // Parse data rows
      const parsedData = dataRows.map((row, index) => {
        const rowData = {};

        headers.forEach((header, i) => {
          const mappedField = headerMapping[header];
          if (mappedField) {
            let value = row[i];
            
            // Special handling for different field types
            if (dateFields.includes(mappedField)) {
              value = parseExcelDate(value);
            } else if (booleanFields.includes(mappedField)) {
              value = parseBoolean(value);
            } else if (numericFields.includes(mappedField)) {
              value = parseNumeric(value);
            } else if (value === null || value === undefined) {
              value = '';
            } else {
              value = String(value).trim();
            }
            
            rowData[mappedField] = value;
          }
        });

        return rowData;
      }).filter(rowData => {
        // Filter out completely empty rows or rows missing critical data
        return rowData.building && String(rowData.building).trim() !== '';
      });

      console.log('Parsed data sample:', parsedData[0]);
      console.log('Total parsed rows:', parsedData.length);

      setCsvData(parsedData);
      setPreview(parsedData.slice(0, 5)); // Show first 5 rows as preview
      setErrors([]);
      
    } catch (error) {
      console.error('Error processing file data:', error);
      setErrors([`Error processing file data: ${error.message}`]);
    }
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      setErrors(['No data to import']);
      return;
    }

    console.log('Starting import process...');
    console.log('Data to import:', csvData);

    try {
      const result = await onImport(csvData);
      console.log('Import result:', result);
      setImportResults(result);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([`Import failed: ${error.message}`]);
    }
  };

  const resetModal = () => {
    setCsvFile(null);
    setCsvData([]);
    setErrors([]);
    setPreview([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-200/50 overflow-hidden max-w-6xl w-full min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-y-auto">
        {/* Mobile-Responsive Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#232249] to-[#2d2d5f] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/20 shrink-0">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  Bulk Import Work Orders
                </h2>
                <p className="text-white/70 text-xs sm:text-sm mt-1">
                  Upload CSV or Excel file to import
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-2 sm:p-3 transition-colors border border-white/20 shrink-0 touch-manipulation"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {!importResults ? (
            <>
              {/* Mobile-Responsive Download Template Section */}
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-blue-900">Download Excel Template</h3>
                      <p className="text-blue-700 text-sm">Use this template to format your data correctly</p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors touch-manipulation whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Download Excel Template</span>
                    <span className="sm:hidden">Download Template</span>
                  </button>
                </div>
              </div>

              {/* Mobile-Responsive File Upload Section */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Select CSV or Excel File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:border-[#232249] transition-colors touch-manipulation">
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm sm:text-base">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#232249] hover:underline font-medium touch-manipulation"
                      >
                        Click to upload
                      </button>
                      <span className="hidden sm:inline"> or drag and drop your file here</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">CSV, Excel (.xlsx, .xls) files supported</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {csvFile && (
                  <div className="mt-4 p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                      <span className="text-green-800 font-medium text-sm sm:text-base truncate flex-1">{csvFile.name}</span>
                      <span className="text-green-600 text-xs sm:text-sm whitespace-nowrap">({csvData.length} rows)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile-Responsive Errors */}
              {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-red-800 font-medium mb-2 text-sm sm:text-base">Errors Found:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-red-700 text-xs sm:text-sm break-words">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile-Responsive Preview */}
              {preview.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Data Preview (First 5 rows)</h3>
                  <div className="table-responsive overflow-x-auto bg-gray-50 rounded-xl border border-gray-200 -webkit-overflow-scrolling-touch">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Space Name</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Building</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Technician</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Priority</th>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Confined Space</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{row.spaceName || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{row.building || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{row.technician || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{row.priority || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{row.isConfinedSpace || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mobile-Responsive Import Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium touch-manipulation order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={csvData.length === 0 || errors.length > 0 || isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#232249] text-white rounded-xl hover:bg-[#1a1a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>Import {csvData.length} Work Orders</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Mobile-Responsive Import Results */
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                {importResults.data?.results?.successful > 0 ? (
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                ) : (
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto mb-3 sm:mb-4" />
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Import Complete</h3>
                <p className="text-gray-600 px-4 text-sm sm:text-base">{importResults.message}</p>
              </div>

              {importResults.data?.results && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-xl sm:text-2xl font-bold text-blue-900">{importResults.data.results.total}</div>
                    <div className="text-blue-700 text-xs sm:text-sm">Total Processed</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                    <div className="text-xl sm:text-2xl font-bold text-green-900">{importResults.data.results.successful}</div>
                    <div className="text-green-700 text-xs sm:text-sm">Successful</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <div className="text-xl sm:text-2xl font-bold text-red-900">{importResults.data.results.failed}</div>
                    <div className="text-red-700 text-xs sm:text-sm">Failed</div>
                  </div>
                </div>
              )}

              {importResults.data?.results?.errors?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 sm:p-6 border border-red-200">
                  <h4 className="text-red-800 font-medium mb-3 sm:mb-4 text-sm sm:text-base">Import Errors:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {importResults.data.results.errors.map((error, index) => (
                      <div key={index} className="text-red-700 text-xs sm:text-sm break-words">
                        <span className="font-medium">Row {error.row}:</span> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 sm:px-8 py-3 bg-[#232249] text-white rounded-xl hover:bg-[#1a1a3a] transition-colors font-medium touch-manipulation"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;