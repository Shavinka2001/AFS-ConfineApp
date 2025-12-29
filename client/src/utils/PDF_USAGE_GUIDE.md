# Work Order PDF Generator - Usage Guide

## Overview
The Work Order PDF Generator provides comprehensive PDF generation capabilities with data consolidation features for Building, Location Description, and Confined Space Description.

## Features

### 1. Data Consolidation
Automatically groups work orders by:
- **Building**: Physical building name
- **Location Description**: Specific location within the building
- **Confined Space Description**: Detailed description of the confined space

This reduces redundancy and creates cleaner, more organized reports.

### 2. PDF Generation Types

#### Consolidated PDF
Groups similar entries together based on building, location, and confined space.
- **Best for**: Executive summaries, overview reports
- **Output**: One entry per unique location with combined work order IDs

#### Detailed PDF
Individual work orders with complete information.
- **Best for**: Technical documentation, compliance records
- **Output**: One page per work order with all fields

#### Summary Table PDF
Tabular overview grouped by criteria (building, status, priority, technician).
- **Best for**: Quick reference, management reports
- **Output**: Tables grouped by selected criteria

## Usage Examples

### Basic Usage in React Components

```jsx
import PDFDownloadButton from '../components/ui/PDFDownloadButton';
import { generateConsolidatedPDF, generateDetailedPDF } from '../utils/WorkOrderPDFGenerator';

// Example 1: Simple button for single work order
function WorkOrderDetail({ workOrder }) {
  return (
    <PDFDownloadButton
      workOrder={workOrder}
      type="single"
      size="default"
      label="Download PDF"
    />
  );
}

// Example 2: Multi-option dropdown for batch operations
function WorkOrderList({ workOrders }) {
  return (
    <PDFDownloadButton
      workOrders={workOrders}
      type="multi"
      size="large"
      label="Export PDFs"
      groupBy="building"
    />
  );
}

// Example 3: Programmatic PDF generation
function CustomExport({ workOrders }) {
  const handleExport = () => {
    // Consolidated report
    generateConsolidatedPDF(workOrders, {
      title: 'Monthly Inspection Report',
      filename: 'monthly-report.pdf'
    });
    
    // Detailed report
    generateDetailedPDF(workOrders, {
      title: 'Detailed Work Orders',
      filename: 'detailed-orders.pdf'
    });
  };
  
  return <button onClick={handleExport}>Export</button>;
}
```

### Using the Consolidation Function

```javascript
import { consolidateWorkOrderData } from '../utils/WorkOrderPDFGenerator';

// Get consolidated data
const consolidated = consolidateWorkOrderData(workOrders);

console.log(`Original: ${workOrders.length} orders`);
console.log(`Consolidated: ${consolidated.length} groups`);

// Each consolidated group contains:
consolidated.forEach(group => {
  console.log({
    building: group.building,
    location: group.locationDescription,
    confinedSpace: group.confinedSpaceDescription,
    workOrderCount: group.count,
    workOrderIds: group.workOrderIds,
    technicians: group.technicians,
    surveyDates: group.surveyDates
  });
});
```

## API Integration

### Backend Endpoint
```javascript
// GET /api/orders/consolidated-data
// Returns orders with pre-grouped consolidated data

const response = await workOrderAPI.getConsolidatedData(token);

// Response structure:
{
  success: true,
  data: {
    totalOrders: 150,
    consolidatedGroups: 45,
    orders: [...],          // All orders
    consolidated: [...]     // Pre-grouped data
  }
}
```

## Component Props

### PDFDownloadButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| workOrders | Array | [] | Array of work orders to export |
| workOrder | Object | null | Single work order (for type='single') |
| type | String | 'single' | PDF type: 'single', 'consolidated', 'detailed', 'summary', 'multi' |
| size | String | 'default' | Button size: 'small', 'default', 'large' |
| groupBy | String | 'building' | Grouping criteria for summary: 'building', 'status', 'priority', 'technician' |
| label | String | null | Custom button label |
| className | String | '' | Additional CSS classes |

## PDF Generation Options

### generateConsolidatedPDF Options
```javascript
{
  title: 'Custom Report Title',
  includeImages: false,           // Include work order images
  filename: 'custom-name.pdf'     // Output filename
}
```

### generateDetailedPDF Options
```javascript
{
  title: 'Detailed Work Orders Report',
  filename: 'work-orders-detailed.pdf'
}
```

### generateSummaryTablePDF Options
```javascript
{
  title: 'Work Orders Summary',
  filename: 'summary.pdf',
  groupBy: 'building'  // 'building', 'status', 'priority', 'technician'
}
```

## Data Structure

### Work Order Object
```javascript
{
  workOrderId: 'WO-2024-001',
  building: 'Building A',
  locationDescription: 'Basement Level 1, East Wing',
  confinedSpaceDescription: 'Underground utility vault, 8x10 feet',
  spaceName: 'Utility Vault #5',
  surveyDate: '2024-12-15',
  technician: 'John Doe',
  priority: 'high',
  status: 'approved',
  isConfinedSpace: true,
  permitRequired: true,
  // ... additional fields
}
```

### Consolidated Group Object
```javascript
{
  building: 'Building A',
  locationDescription: 'Basement Level 1, East Wing',
  confinedSpaceDescription: 'Underground utility vault',
  count: 3,                          // Number of work orders in group
  workOrderIds: ['WO-001', 'WO-002', 'WO-003'],
  surveyDates: ['2024-12-15', '2024-12-16'],
  technicians: ['John Doe', 'Jane Smith'],
  orders: [...],                     // Full work order objects
  // Common fields from first order
  isConfinedSpace: true,
  permitRequired: true,
  priority: 'high',
  // ... additional consolidated fields
}
```

## Best Practices

1. **Large Datasets**: For datasets > 1000 records, consider:
   - Filtering data before PDF generation
   - Using pagination
   - Generating multiple smaller PDFs

2. **Performance**: 
   - Consolidation function is optimized with Map data structure
   - Runs in O(n) time complexity
   - Memory efficient for typical datasets (< 10,000 records)

3. **Customization**:
   - Extend the PDF generators with custom sections
   - Modify styling in the generator functions
   - Add custom grouping logic

4. **Error Handling**:
   ```javascript
   try {
     generateConsolidatedPDF(workOrders);
   } catch (error) {
     console.error('PDF generation failed:', error);
     // Show user-friendly error message
   }
   ```

## Examples in the Application

### Admin Dashboard
```jsx
// In AdminWorkOrders.jsx
<PDFDownloadButton
  workOrders={filteredOrders}
  type="multi"
  size="default"
  label="Download PDF"
  groupBy="building"
  className="border border-blue-200"
/>
```

### Manager Dashboard
```jsx
// In ManagerWorkOrders.jsx
<PDFDownloadButton
  workOrders={managerWorkOrders}
  type="consolidated"
  label="Monthly Report"
/>
```

### Technician View
```jsx
// In TechnicianWorkOrders.jsx
<PDFDownloadButton
  workOrder={selectedOrder}
  type="single"
  size="small"
/>
```

## Troubleshooting

### Issue: PDF not generating
- Check browser console for errors
- Verify jsPDF and jspdf-autotable are installed
- Ensure workOrders data is properly formatted

### Issue: Consolidation not working
- Verify building, locationDescription, and confinedSpaceDescription fields exist
- Check for null/undefined values
- Review consolidation key generation logic

### Issue: Performance problems
- Reduce number of orders being processed
- Disable image inclusion: `includeImages: false`
- Generate PDFs in batches

## Future Enhancements

Potential improvements:
- [ ] Image embedding in PDFs
- [ ] Custom template support
- [ ] Email integration
- [ ] Scheduled PDF generation
- [ ] Cloud storage integration
- [ ] Digital signatures
- [ ] QR code generation for work orders
- [ ] Multi-language support

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations in the codebase
3. Contact the development team
