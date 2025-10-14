# Work Orders Component Architecture

## Overview
This folder contains the modular components for the Technician Work Orders feature, following React best practices for component separation and maintainability.

## Component Structure

```
workOrders/
├── StatCard.jsx          # Reusable statistics display component
├── SearchAndFilters.jsx  # Search and filtering functionality
├── WorkOrderTable.jsx    # Table display with sorting and actions
├── ViewModal.jsx         # Modal for viewing inspection form details
└── EditModal.jsx         # Modal for editing inspection forms
```

## Components

### StatCard.jsx
**Purpose**: Reusable statistics card component for dashboard metrics
**Props**:
- `title` (string): The title of the statistic
- `value` (number): The numeric value to display
- `icon` (React Component): Lucide icon component
- `color` (string): Tailwind text color class
- `bgColor` (string): Tailwind gradient background class

### SearchAndFilters.jsx
**Purpose**: Handles search input and status/priority filtering
**Props**:
- `searchTerm` (string): Current search term
- `setSearchTerm` (function): Setter for search term
- `statusFilter` (string): Current status filter
- `setStatusFilter` (function): Setter for status filter
- `priorityFilter` (string): Current priority filter
- `setPriorityFilter` (function): Setter for priority filter

### WorkOrderTable.jsx
**Purpose**: Displays the main data table with sorting and action buttons
**Props**:
- `filteredForms` (array): Array of filtered inspection forms
- `sortConfig` (object): Current sort configuration
- `handleSort` (function): Function to handle column sorting
- `handleView` (function): Function to view form details
- `handleEdit` (function): Function to edit a form
- `handleDelete` (function): Function to delete a form
- `handleDownloadPDF` (function): Function to download form as PDF
- `formatDate` (function): Utility function to format dates
- `getStatusColor` (function): Utility function for status styling
- `getPriorityColor` (function): Utility function for priority styling

### ViewModal.jsx
**Purpose**: Modal component for viewing detailed inspection form information
**Props**:
- `showDetailModal` (boolean): Controls modal visibility
- `selectedForm` (object): The form data to display
- `closeDetailModal` (function): Function to close the modal
- `formatDate` (function): Utility function to format dates
- `getStatusColor` (function): Utility function for status styling
- `getPriorityColor` (function): Utility function for priority styling

### EditModal.jsx
**Purpose**: Modal component for editing inspection form data
**Props**:
- `showEditModal` (boolean): Controls modal visibility
- `editingForm` (object): The form data being edited
- `setEditingForm` (function): Function to update form data
- `closeEditModal` (function): Function to close the modal
- `handleUpdateForm` (function): Function to save changes
- `formatDate` (function): Utility function to format dates

## Design System

### Color Scheme
- Primary: `#232249` (Deep blue-purple)
- Secondary: `#2a2a5c` (Medium blue-purple)
- Accent: `#1a1b3a` (Dark blue-purple)

### Status Colors
- **Approved**: Green (`text-green-600 bg-green-100`)
- **Pending**: Yellow (`text-yellow-600 bg-yellow-100`)
- **Rejected**: Red (`text-red-600 bg-red-100`)

### Priority Colors
- **High**: Red (`text-red-600 bg-red-100`)
- **Medium**: Yellow (`text-yellow-600 bg-yellow-100`)
- **Low**: Green (`text-green-600 bg-green-100`)

## Benefits of This Architecture

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused in other parts of the application
3. **Maintainability**: Changes to specific functionality are isolated to relevant components
4. **Testability**: Each component can be unit tested independently
5. **Readability**: Smaller, focused components are easier to understand and debug
6. **Performance**: Components can be optimized individually (memoization, lazy loading)

## Usage Example

```jsx
import StatCard from './workOrders/StatCard';
import SearchAndFilters from './workOrders/SearchAndFilters';
import WorkOrderTable from './workOrders/WorkOrderTable';
import ViewModal from './workOrders/ViewModal';
import EditModal from './workOrders/EditModal';

// In your main component
<StatCard
  title="Total Forms"
  value={stats.total}
  icon={Package}
  color="text-[#232249]"
  bgColor="from-[#232249]/10 to-[#232249]/5"
/>
```

## Future Enhancements

1. **Error Boundaries**: Add error boundaries around each component
2. **Loading States**: Add skeleton loading states for each component
3. **Memoization**: Use React.memo for performance optimization
4. **Custom Hooks**: Extract common logic into custom hooks
5. **Storybook Integration**: Create stories for each component
6. **TypeScript**: Add TypeScript for better type safety
