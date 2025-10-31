# Location Import Template Guide

## Quick Start

1. Install xlsx library: `cd client && npm install xlsx`
2. Use the template format below for importing locations
3. Click the Import button in Location Management to upload your file

## Excel Template Columns

### Required Columns
- **Location Name**: Name of the location (e.g., "Main Office Building")
- **Street**: Street address (e.g., "123 Main Street")
- **City**: City name (e.g., "New York")

### Optional Columns
- **Type**: Location type - one of: residential, commercial, industrial, institutional, mixed-use (default: commercial)
- **Status**: Location status - one of: active, inactive, maintenance, under-construction (default: active)
- **State**: State abbreviation or full name (e.g., "NY" or "New York")
- **Zip Code**: Postal code (e.g., "10001")
- **Country**: Country name (default: "USA")
- **Phone**: Contact phone number (e.g., "(555) 123-4567")
- **Email**: Contact email address (e.g., "contact@example.com")
- **Latitude**: GPS latitude coordinate (e.g., "40.7128")
- **Longitude**: GPS longitude coordinate (e.g., "-74.0060")
- **Description**: Additional description or notes

## Sample Data

```
Location Name,Type,Status,Street,City,State,Zip Code,Country,Phone,Email,Latitude,Longitude,Description
Downtown Office,commercial,active,123 Main St,New York,NY,10001,USA,(555) 123-4567,downtown@example.com,40.7128,-74.0060,Main corporate office
Warehouse A,industrial,active,456 Industrial Blvd,Los Angeles,CA,90001,USA,(555) 234-5678,warehouse@example.com,34.0522,-118.2437,Primary storage facility
Retail Store 1,retail,active,789 Shopping Ave,Chicago,IL,60601,USA,(555) 345-6789,retail@example.com,41.8781,-87.6298,Downtown retail location
Manufacturing Plant,industrial,maintenance,321 Factory Rd,Houston,TX,77001,USA,(555) 456-7890,plant@example.com,29.7604,-95.3698,Under maintenance
Residential Complex,residential,active,654 Park Lane,Phoenix,AZ,85001,USA,(555) 567-8901,residential@example.com,33.4484,-112.0740,Apartment complex
```

## Export File Format

When you export from the system, you'll get these additional columns:
- **Technician Name**: Name of assigned technician (if any)
- **Technician Email**: Email of assigned technician (if any)
- **Technician Phone**: Phone of assigned technician (if any)
- **Building Count**: Number of buildings at this location
- **Created Date**: When the location was created
- **Updated Date**: Last update date

## Tips for Successful Import

1. **Use the exported file as a template**: Export current locations to see the exact format
2. **Clean your data**: Ensure no extra spaces, special characters in required fields
3. **Valid coordinates**: Latitude should be between -90 and 90, Longitude between -180 and 180
4. **Consistent formatting**: Use the same format for all rows
5. **Check required fields**: Location Name, Street, and City must not be empty
6. **Valid enums**: Type and Status must match allowed values exactly (case-insensitive)

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to import any locations" | File format incorrect | Use exported file as template |
| Some locations skipped | Missing required fields | Check Location Name, Street, City are filled |
| Coordinates not saving | Invalid format | Use decimal format (e.g., 40.7128, not 40°42'46"N) |
| Type/Status not saving | Invalid value | Use only allowed values listed above |

## Validation Rules

- **Location Name**: Max 200 characters, required
- **Type**: Must be one of the predefined types (case-insensitive)
- **Status**: Must be one of the predefined statuses (case-insensitive)
- **Email**: Must be valid email format
- **Coordinates**: Must be valid decimal numbers
- **Phone**: Any format accepted
- **Zip Code**: Any format accepted

## After Import

1. The system will display a success message with count of imported locations
2. If some rows failed, you'll see the error count
3. The location list will refresh automatically
4. Failed rows are skipped (not imported)
5. Check the browser console for detailed error messages if needed
