import React, { useState } from 'react';
import { Download, FileText, Loader } from 'lucide-react';
import WorkOrderPDFGenerator from '../../utils/WorkOrderPDFGenerator';

const PDFDownloadButton = ({ workOrder, className = '', size = 'default' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!workOrder) {
      setError('No work order data available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const pdfGenerator = new WorkOrderPDFGenerator();
      const result = await pdfGenerator.generatePDF(workOrder);
      
      if (result.success) {
        console.log(`PDF generated successfully: ${result.fileName}`);
        // Show success message (optional)
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      setError('Failed to generate PDF. Please try again.');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
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

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`
          ${getSizeClasses()}
          ${className}
          ${isGenerating 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
          }
          rounded-lg transition-all duration-200 flex items-center gap-2 font-medium
          ${error ? 'bg-red-50 text-red-600' : ''}
        `}
        title={error || (isGenerating ? 'Generating PDF...' : 'Download PDF')}
      >
        {isGenerating ? (
          <Loader className={`${getIconSize()} animate-spin`} />
        ) : (
          <Download className={getIconSize()} />
        )}
        
        {size !== 'small' && (
          <span>
            {isGenerating ? 'Generating...' : 'PDF'}
          </span>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-red-600 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-red-600"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFDownloadButton;
