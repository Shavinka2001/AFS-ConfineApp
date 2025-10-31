# Excel Import/Export Setup

## Installation Required

To enable Excel import/export functionality in LocationManagement, you need to install the xlsx library:

```bash
cd client
npm install xlsx
```

## Features Added

### 1. Removed Status Field from Inspection (Confined Spaces)
- Removed status field from ConfinedSpaceModal component
- Removed status field from Building model (confinedSpaces array)
- Cleaned up status display logic and unused functions

### 2. Excel Export
- Click the green "Export" button in LocationManagement header
- Exports all locations with the following columns:
  - Location Name, Type, Status
  - Address details (Street, City, State, Zip Code, Country)
  - Contact Info (Phone, Email)
  - Coordinates (Latitude, Longitude)
  - Assigned Technician details
  - Building Count
  - Description
  - Created/Updated dates
- File is named: `Locations_Export_YYYY-MM-DD.xlsx`

### 3. Excel Import
- Click the blue "Import" button in LocationManagement header
- Select an Excel file (.xlsx or .xls)
- Required columns:
  - Location Name (required)
  - Street (required)
  - City (required)
- Optional columns:
  - Type, Status, State, Zip Code, Country
  - Phone, Email
  - Latitude, Longitude
  - Description
- System will:
  - Validate each row
  - Import valid locations
  - Show success/error count in toast notification
  - Refresh location list automatically

## Excel Template Format

| Location Name | Type | Status | Street | City | State | Zip Code | Country | Phone | Email | Latitude | Longitude | Description |
|--------------|------|--------|--------|------|-------|----------|---------|-------|-------|----------|-----------|-------------|
| Example Location | commercial | active | 123 Main St | New York | NY | 10001 | USA | 555-1234 | contact@example.com | 40.7128 | -74.0060 | Sample description |

## Files Modified

1. **client/src/components/location/LocationManagement.jsx**
   - Added xlsx import
   - Added FileDown and FileUp icons from lucide-react
   - Added handleExportToExcel function
   - Added handleImportFromExcel function
   - Added Export and Import buttons to header

2. **client/src/components/location/ConfinedSpaceModal.jsx**
   - Removed status field from newSpace state initialization
   - Removed status field from form reset
   - Removed status display from confined space list
   - Removed unused getStatusIcon and AlertTriangle import

3. **services/locationManagement/models/Building.js**
   - Removed status field from confinedSpaces schema

## Usage Instructions

### To Export:
1. Go to Location Management page
2. Click the green "Export" button in the header
3. Excel file will be downloaded automatically

### To Import:
1. Prepare your Excel file with the required format (see template above)
2. Go to Location Management page
3. Click the blue "Import" button in the header
4. Select your Excel file
5. Wait for the import to complete
6. Check the toast notification for success/error count

## Notes

- Import validates required fields (Location Name, Street, City)
- Invalid rows are skipped and counted as errors
- Coordinates should be valid decimal numbers
- Type should be one of: residential, commercial, industrial, institutional, mixed-use
- Status should be one of: active, inactive, maintenance, under-construction
