import React, { useState, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import PDFDownloadButton from '../ui/PDFDownloadButton';
import {
  consolidateWorkOrderData,
  generateConsolidatedPDF,
  generateDetailedPDF,
  generateSummaryTablePDF
} from '../../utils/WorkOrderPDFGenerator';
import workOrderAPI from '../../services/workOrderAPI';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Example component demonstrating PDF generation functionality
 * This shows how to use the PDF generator with real database data
 */
const PDFExportExample = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consolidatedStats, setConsolidatedStats] = useState(null);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await workOrderAPI.getWorkOrders(token, {
        page: 1,
        limit: 1000 // Fetch more for demonstration
      });

      if (response.success && response.data?.orders) {
        const orders = response.data.orders;
        setWorkOrders(orders);
        
        // Calculate consolidation stats
        const consolidated = consolidateWorkOrderData(orders);
        setConsolidatedStats({
          original: orders.length,
          consolidated: consolidated.length,
          saved: orders.length - consolidated.length,
          savingsPercent: ((orders.length - consolidated.length) / orders.length * 100).toFixed(1)
        });
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Example 1: Generate consolidated PDF programmatically
  const handleGenerateConsolidated = () => {
    generateConsolidatedPDF(workOrders, {
      title: 'Consolidated Work Orders Report',
      filename: `consolidated-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  // Example 2: Generate detailed PDF programmatically
  const handleGenerateDetailed = () => {
    generateDetailedPDF(workOrders, {
      title: 'Detailed Work Orders Report',
      filename: `detailed-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  // Example 3: Generate summary by building
  const handleGenerateSummaryByBuilding = () => {
    generateSummaryTablePDF(workOrders, {
      title: 'Work Orders Summary - By Building',
      groupBy: 'building',
      filename: `summary-by-building-${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  // Example 4: Generate summary by status
  const handleGenerateSummaryByStatus = () => {
    generateSummaryTablePDF(workOrders, {
      title: 'Work Orders Summary - By Status',
      groupBy: 'status',
      filename: `summary-by-status-${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading work orders...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          PDF Export Examples
        </h2>
        <p className="text-gray-600">
          Demonstrating various PDF generation methods with real database data
        </p>
      </div>

      {/* Statistics */}
      {consolidatedStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="text-blue-600 text-sm font-medium mb-1">Total Work Orders</div>
            <div className="text-3xl font-bold text-blue-900">{consolidatedStats.original}</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="text-green-600 text-sm font-medium mb-1">Consolidated Groups</div>
            <div className="text-3xl font-bold text-green-900">{consolidatedStats.consolidated}</div>
          </div>
          <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
            <div className="text-purple-600 text-sm font-medium mb-1">Reports Saved</div>
            <div className="text-3xl font-bold text-purple-900">{consolidatedStats.saved}</div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <div className="text-orange-600 text-sm font-medium mb-1">Efficiency Gain</div>
            <div className="text-3xl font-bold text-orange-900">{consolidatedStats.savingsPercent}%</div>
          </div>
        </div>
      )}

      {/* Example 1: Using PDFDownloadButton Component */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Method 1: Using PDFDownloadButton Component
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The easiest way - use the PDFDownloadButton component with multi-option dropdown
        </p>
        <div className="flex gap-3">
          <PDFDownloadButton
            workOrders={workOrders}
            type="multi"
            size="large"
            label="Export PDFs (Multi-option)"
            groupBy="building"
          />
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <code className="text-xs text-gray-700">
            {`<PDFDownloadButton
  workOrders={workOrders}
  type="multi"
  size="large"
  label="Export PDFs"
  groupBy="building"
/>`}
          </code>
        </div>
      </div>

      {/* Example 2: Programmatic Generation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-green-600" />
          Method 2: Programmatic PDF Generation
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Call PDF generation functions directly for custom implementations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleGenerateConsolidated}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Consolidated PDF
          </button>
          <button
            onClick={handleGenerateDetailed}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Detailed PDF
          </button>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <code className="text-xs text-gray-700">
            {`generateConsolidatedPDF(workOrders, {
  title: 'Consolidated Report',
  filename: 'report.pdf'
});`}
          </code>
        </div>
      </div>

      {/* Example 3: Summary Reports by Different Criteria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Table className="w-5 h-5 text-purple-600" />
          Method 3: Summary Reports (Grouped)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Generate summary tables grouped by different criteria
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleGenerateSummaryByBuilding}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Table className="w-4 h-4" />
            Summary by Building
          </button>
          <button
            onClick={handleGenerateSummaryByStatus}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Table className="w-4 h-4" />
            Summary by Status
          </button>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <code className="text-xs text-gray-700">
            {`generateSummaryTablePDF(workOrders, {
  groupBy: 'building', // or 'status', 'priority', 'technician'
  filename: 'summary.pdf'
});`}
          </code>
        </div>
      </div>

      {/* Example 4: Individual Buttons for Different Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Method 4: Individual Buttons for Specific PDF Types
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Use separate buttons for different PDF types
        </p>
        <div className="flex flex-wrap gap-3">
          <PDFDownloadButton
            workOrders={workOrders}
            type="consolidated"
            size="default"
            label="Consolidated"
          />
          <PDFDownloadButton
            workOrders={workOrders}
            type="detailed"
            size="default"
            label="Detailed"
          />
          <PDFDownloadButton
            workOrders={workOrders}
            type="summary"
            size="default"
            label="Summary"
            groupBy="building"
          />
        </div>
      </div>

      {/* Data Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Sample Data Preview
        </h3>
        {workOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Work Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Building</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {workOrders.slice(0, 5).map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{order.workOrderId || 'N/A'}</td>
                    <td className="px-4 py-2">{order.building || 'N/A'}</td>
                    <td className="px-4 py-2 max-w-xs truncate">{order.locationDescription || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.priority || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workOrders.length > 5 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing 5 of {workOrders.length} work orders
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No work orders available</p>
        )}
      </div>
    </div>
  );
};

export default PDFExportExample;
