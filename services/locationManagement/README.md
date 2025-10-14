# Location Management Service

A comprehensive microservice for managing locations, buildings, and technician assignments in the Confine App ecosystem.

## Features

### Location Management
- **CRUD Operations**: Create, read, update, and delete locations
- **Technician Assignment**: Assign and manage technicians for specific locations
- **Address Management**: Complete address information with validation
- **Contact Information**: Phone, email, and emergency contact details
- **Operating Hours**: Configurable business hours and timezone support
- **Safety Protocols**: Manage safety requirements and hazardous areas
- **Status Tracking**: Active, inactive, maintenance, and construction statuses

### Building Management
- **Building CRUD**: Complete building lifecycle management
- **Multiple Building Types**: Residential, commercial, industrial, mixed-use, etc.
- **Detailed Specifications**: Floors, units, area, year built, accessibility features
- **Address Support**: Buildings can have separate addresses from parent location
- **Utility Tracking**: Electricity, water, gas, internet, and waste management
- **Safety Features**: Emergency exits, fire systems, security systems

### Confined Space Management
- **Space Tracking**: Define and manage confined spaces within buildings
- **Hazard Assessment**: Categorize and rate safety hazards
- **Entry Requirements**: Track ventilation and permit requirements
- **Safety Equipment**: Manage required safety equipment lists
- **Location Mapping**: Precise location within buildings (floor, unit, description)
- **Inspection Tracking**: Track last inspected dates and next due dates

### Security & Access Control
- **Role-Based Access**: Admin and Manager roles can manage locations
- **JWT Authentication**: Secure API access with token validation
- **Cross-Service Integration**: Validates users with auth service
- **Audit Trail**: Track who created and modified locations/buildings

## API Endpoints

### Location Endpoints
```
GET    /api/locations              - Get all locations (with filtering/pagination)
GET    /api/locations/stats        - Get location statistics
GET    /api/locations/available    - Get locations without assigned technicians
GET    /api/locations/:id          - Get specific location
POST   /api/locations              - Create new location
PUT    /api/locations/:id          - Update location
DELETE /api/locations/:id          - Delete location (soft delete)

POST   /api/locations/:id/assign-technician   - Assign technician to location
POST   /api/locations/:id/remove-technician   - Remove technician from location
GET    /api/locations/technician/:technicianId - Get locations by technician
```

### Building Endpoints
```
GET    /api/buildings                    - Get all buildings (with filtering/pagination)
GET    /api/buildings/stats              - Get building statistics
GET    /api/buildings/with-confined-spaces - Get buildings with confined spaces
GET    /api/buildings/location/:locationId - Get buildings by location
GET    /api/buildings/:id                - Get specific building
POST   /api/buildings                    - Create new building
PUT    /api/buildings/:id                - Update building
DELETE /api/buildings/:id                - Delete building (soft delete)

POST   /api/buildings/:id/confined-spaces      - Add confined space to building
DELETE /api/buildings/:id/confined-spaces/:spaceId - Remove confined space
```

## Data Models

### Location Model
- Basic information (name, description, type, status)
- Address with full geographic details
- Contact information with emergency contacts
- Assigned technician with assignment tracking
- Operating hours and timezone
- Safety protocols and hazardous areas
- Accessibility features
- Audit fields (created by, last modified by, timestamps)

### Building Model
- Basic information (name, description, building number)
- Location reference (parent location)
- Address (can be different from location)
- Detailed specifications (type, year, floors, units, area)
- Accessibility features and safety systems
- Utility provider information
- Floors and units structure
- Confined spaces with detailed hazard tracking
- Audit fields and tags

### Confined Space Tracking
- Comprehensive hazard assessment
- Entry point documentation
- Safety equipment requirements
- Inspection scheduling and tracking
- Risk level categorization

## Environment Configuration

```env
# Server Configuration
PORT=5004
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/confine_location_db

# JWT Configuration
JWT_SECRET=confine_app_secret_key_2024

# External Services
AUTH_SERVICE_URL=http://localhost:5001
WORK_ORDER_SERVICE_URL=http://localhost:5003

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd services/locationManagement
   npm install
   ```

2. **Set Up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create database: `confine_location_db`
   - Update `MONGODB_URI` in `.env` file

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

4. **Start the Service**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Health Check**
   ```bash
   curl http://localhost:5004/health
   ```

## Integration with Other Services

### Auth Service Integration
- Validates JWT tokens from auth service
- Fetches user details for technician assignment
- Enforces role-based access control
- Falls back to auth service for token validation

### Work Order Service Integration
- Locations can be referenced in work orders
- Buildings and confined spaces can be work order targets
- Technician assignments coordinate with work order assignments

### Frontend Integration
- React components for location and building management
- Real-time updates and responsive UI
- Role-based UI restrictions
- Comprehensive form validation

## Security Features

- **Input Validation**: All inputs validated using express-validator
- **SQL Injection Prevention**: MongoDB with parameterized queries
- **XSS Protection**: Helmet middleware for security headers
- **Rate Limiting**: Configurable rate limiting per IP
- **CORS Configuration**: Proper cross-origin resource sharing
- **Authentication**: JWT-based authentication with role verification
- **Data Sanitization**: Input sanitization and validation

## Performance Optimization

- **Database Indexing**: Optimized indexes for common queries
- **Pagination**: Efficient pagination for large datasets
- **Query Optimization**: Lean queries and selective population
- **Caching**: Response compression and proper HTTP caching headers
- **Connection Pooling**: MongoDB connection pool management

## Error Handling

- **Structured Error Responses**: Consistent error format across all endpoints
- **Validation Errors**: Detailed field-level validation error messages
- **HTTP Status Codes**: Proper status codes for different scenarios
- **Error Logging**: Comprehensive error logging for debugging
- **Graceful Degradation**: Fallback mechanisms for service dependencies

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Docker Deployment
```dockerfile
# Dockerfile included in service directory
docker build -t location-management-service .
docker run -p 5004:5004 location-management-service
```

### Environment-Specific Configuration
- Development: Local MongoDB, debug logging
- Staging: Staging database, verbose logging
- Production: Production database, error-only logging

## Monitoring & Logging

- **Health Checks**: Built-in health check endpoint
- **Request Logging**: Morgan HTTP request logging
- **Error Tracking**: Comprehensive error logging with context
- **Performance Metrics**: Response time and throughput monitoring
- **Database Monitoring**: Connection status and query performance

## API Documentation

Full API documentation available at `/api-docs` when running in development mode.

## Contributing

1. Follow the existing code structure and patterns
2. Add appropriate validation and error handling
3. Include tests for new features
4. Update documentation as needed
5. Follow security best practices

## License

MIT License - See LICENSE file for details