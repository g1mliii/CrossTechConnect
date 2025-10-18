# Dynamic Device Forms - Category-Specific Fields

## Overview

The device management system now supports dynamic, category-specific form fields that adapt based on the selected device category. This allows different device types to have their own unique specifications without hardcoding forms for each category.

## Features

### 1. Dynamic Field Rendering
- Forms automatically fetch and display category-specific fields when a category is selected
- Supports multiple field types: string, number, boolean, enum, array, object, date, url, email
- Real-time field visibility based on category selection

### 2. Field Validation
- Required field validation
- Min/max constraints for numbers
- Pattern validation for strings
- Type-specific validation (URL, email, etc.)

### 3. Field Metadata
- Labels and descriptions
- Units (e.g., Hz, GB, inches)
- Placeholder text
- Default values

### 4. Data Persistence
- Category-specific data stored in `device_specifications` table
- Linked to schema version for backward compatibility
- Separate from core device fields

## Architecture

### Database Schema

```
device_category_schemas
├── id
├── categoryId (FK to device_categories)
├── version
├── name
├── description
├── fields (JSON) - Field definitions
├── requiredFields (array)
└── inheritedFields (array)

device_specifications
├── id
├── deviceId (FK to devices)
├── categoryId (FK to device_categories)
├── schemaVersion
├── specifications (JSON) - Actual values
└── confidenceScores (JSON)
```

### API Endpoints

#### Get Category Schema
```
GET /api/categories/{categoryId}/schema
```
Returns the latest schema for a category, including field definitions.

#### Get Device Specifications
```
GET /api/devices/{deviceId}/specifications
```
Returns category-specific specifications for a device.

#### Save Device Specifications
```
POST/PUT /api/devices/{deviceId}/specifications
Body: {
  categoryId: string,
  schemaVersion: string,
  specifications: Record<string, any>
}
```

## Components

### 1. DynamicFormField
Renders individual form fields based on field type and definition.

**Props:**
- `fieldName`: Unique identifier for the field
- `fieldDef`: Field definition with type, label, constraints
- `value`: Current field value
- `onChange`: Callback when value changes
- `error`: Optional validation error message

### 2. CategorySpecificFields
Container component that fetches schema and renders all dynamic fields.

**Props:**
- `categoryId`: Selected category ID
- `specifications`: Current specification values
- `onChange`: Callback when specifications change
- `errors`: Optional validation errors per field

### 3. CategorySpecificDisplay
Read-only display of category-specific specifications.

**Props:**
- `deviceId`: Device ID
- `categoryId`: Category ID

## Usage

### Creating a Device with Dynamic Fields

1. User selects a category
2. Form fetches category schema via `/api/categories/{id}/schema`
3. Dynamic fields render based on schema definition
4. User fills in both core device fields and category-specific fields
5. On submit:
   - Core device data saved to `devices` table
   - Category-specific data saved to `device_specifications` table

### Editing a Device

1. Form loads device data and category
2. If specifications exist, they're loaded via `/api/devices/{id}/specifications`
3. Dynamic fields populate with existing values
4. On submit, both core and specification data are updated

### Viewing Device Details

1. Device detail page displays core information
2. `CategorySpecificDisplay` component fetches and displays specifications
3. Fields formatted based on type (URLs as links, booleans as Yes/No, etc.)

## Field Type Examples

### Gaming Console Schema
```json
{
  "resolution": {
    "type": "enum",
    "label": "Maximum Resolution",
    "required": true,
    "options": ["1080p", "1440p", "4K", "8K"]
  },
  "refreshRate": {
    "type": "number",
    "label": "Refresh Rate",
    "unit": "Hz",
    "required": true,
    "min": 30,
    "max": 240
  },
  "storageCapacity": {
    "type": "number",
    "label": "Storage Capacity",
    "unit": "GB",
    "required": true
  },
  "rayTracingSupport": {
    "type": "boolean",
    "label": "Ray Tracing Support",
    "default": false
  },
  "backwardCompatibility": {
    "type": "array",
    "label": "Backward Compatibility",
    "placeholder": "PS4, PS3"
  }
}
```

### Monitor Schema
```json
{
  "panelType": {
    "type": "enum",
    "label": "Panel Type",
    "required": true,
    "options": ["IPS", "VA", "TN", "OLED", "Mini-LED"]
  },
  "screenSize": {
    "type": "number",
    "label": "Screen Size",
    "unit": "inches",
    "required": true,
    "min": 10,
    "max": 100
  },
  "nativeResolution": {
    "type": "string",
    "label": "Native Resolution",
    "required": true,
    "placeholder": "3840x2160"
  },
  "hdrSupport": {
    "type": "array",
    "label": "HDR Support",
    "placeholder": "HDR10, Dolby Vision"
  }
}
```

## Testing

### Seed Data
The seed script creates sample schemas for:
- Gaming consoles (resolution, refresh rate, storage, ray tracing, VR support)
- Monitors (panel type, screen size, resolution, refresh rate, HDR support)

### Manual Testing Steps

1. **Create Device with Dynamic Fields:**
   - Navigate to `/admin/devices/new`
   - Select "Gaming" category
   - Verify gaming-specific fields appear
   - Fill in fields and submit
   - Verify device created with specifications

2. **Edit Device:**
   - Navigate to device detail page
   - Click "Edit"
   - Verify category-specific fields load with existing values
   - Modify values and save
   - Verify changes persisted

3. **View Device Details:**
   - Navigate to device detail page
   - Verify category-specific specifications section displays
   - Verify values formatted correctly

4. **Category Change:**
   - Edit a device
   - Change category
   - Verify old specifications cleared
   - Verify new category fields appear

## Future Enhancements

1. **Schema Versioning UI:** Admin interface to create and manage schemas
2. **Field Dependencies:** Show/hide fields based on other field values
3. **Computed Fields:** Auto-calculate values based on other fields
4. **Validation Rules:** Complex validation beyond basic constraints
5. **Field Groups:** Organize fields into collapsible sections
6. **Import/Export:** Bulk import devices with category-specific data
7. **Schema Migration:** Tools to migrate data between schema versions

## Related Requirements

- Requirement 1.1: Device Library Management
- Requirement 2.1: Standards-Based Compatibility Engine
- Requirement 6.1: Multi-Category Device Support
- Requirement 6.4: Extensible Schema System
