import React, { useState } from 'react';
import { Download, FileText, Loader, FileSpreadsheet, Table } from 'lucide-react';
import {
  generateConsolidatedPDF,
  generateDetailedPDF,
  generateSummaryTablePDF
} from '../../utils/WorkOrderPDFGenerator';

const PDFDownloadButton = ({ 
  workOrders = [], 
  workOrder = null, 
  className = '', 
  size = 'default',
  type = 'single', // 'single', 'consolidated', 'detailed', 'summary'
  groupBy = 'building',
  label = null
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleDownload = async (downloadType = type) => {
    setIsGenerating(true);
    setError(null);
    setShowMenu(false);

    try {
      if (downloadType === 'single' && workOrder) {
        // Single work order PDF (legacy support)
        generateDetailedPDF([workOrder], {
          title: `Work Order: ${workOrder.workOrderId || 'N/A'}`,
          filename: `work-order-${workOrder.workOrderId || 'single'}.pdf`
        });
      } else if (downloadType === 'consolidated') {
        // Consolidated PDF with grouped data
        if (!workOrders || workOrders.length === 0) {
          throw new Error('No work orders available');
        }
        generateConsolidatedPDF(workOrders, {
          title: 'Consolidated Work Orders Report',
          filename: `work-orders-consolidated-${new Date().getTime()}.pdf`
        });
      } else if (downloadType === 'detailed') {
        // Detailed PDF with all work orders
        if (!workOrders || workOrders.length === 0) {
          throw new Error('No work orders available');
        }
        generateDetailedPDF(workOrders, {
          title: 'Detailed Work Orders Report',
          filename: `work-orders-detailed-${new Date().getTime()}.pdf`
        });
      } else if (downloadType === 'summary') {
        // Summary table PDF
        if (!workOrders || workOrders.length === 0) {
          throw new Error('No work orders available');
        }
        generateSummaryTablePDF(workOrders, {
          title: 'Work Orders Summary',
          filename: `work-orders-summary-${new Date().getTime()}.pdf`,
          groupBy: groupBy
        });
      }

      console.log(`PDF generated successfully (${downloadType})`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError(error.message || 'Failed to generate PDF');
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-1.5 text-xs';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'p-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'h-3 w-3';
      case 'large':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  // Multi-option dropdown for batch operations
  if (type === 'multi' && workOrders && workOrders.length > 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isGenerating}
          className={`
            ${getSizeClasses()}
            ${className}
            bg-white text-gray-700 hover:bg-gray-50 border border-gray-300
            rounded-lg shadow-sm transition-all duration-200 
            flex items-center gap-2 font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
        >
          {isGenerating ? (
            <>
              <Loader className={`${getIconSize()} animate-spin`} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className={getIconSize()} />
              <span>{label || 'Download PDF'}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* Dropdown menu */}
        {showMenu && !isGenerating && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={() => handleDownload('consolidated')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">Consolidated Report</div>
                    <div className="text-xs text-gray-500 mt-0.5">Groups similar entries</div>
                  </div>
                </button>
                
                <div className="border-t border-gray-100" />
                
                <button
                  onClick={() => handleDownload('detailed')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">Detailed Report</div>
                    <div className="text-xs text-gray-500 mt-0.5">Individual work orders</div>
                  </div>
                </button>
                
                <div className="border-t border-gray-100" />
                
                <button
                  onClick={() => handleDownload('summary')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <Table className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">Summary Table</div>
                    <div className="text-xs text-gray-500 mt-0.5">Grouped overview</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg shadow-lg border border-red-200 max-w-xs z-50">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Single button for simple operations
  return (
    <div className="relative">
      <button
        onClick={() => handleDownload()}
        disabled={isGenerating}
        className={`
          ${getSizeClasses()}
          ${className}
          ${isGenerating 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }
          rounded-lg shadow-sm transition-all duration-200 
          flex items-center gap-2 font-medium
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${error ? 'border-red-300 bg-red-50 text-red-700' : ''}
        `}
        title={error || (isGenerating ? 'Generating PDF...' : 'Download PDF')}
      >
        {isGenerating ? (
          <>
            <Loader className={`${getIconSize()} animate-spin`} />
            {size !== 'small' && <span>Generating...</span>}
          </>
        ) : (
          <>
            <Download className={getIconSize()} />
            {size !== 'small' && <span>{label || 'Download PDF'}</span>}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg shadow-lg border border-red-200 max-w-xs z-50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFDownloadButton;
