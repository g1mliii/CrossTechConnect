# Authentication System Documentation

## Overview

The Device Compatibility Platform uses JWT-based authentication with Redis session management. The system provides secure user registration, login, token refresh, and logout functionality.

## Features

- **Secure Password Hashing**: Uses bcrypt with configurable rounds
- **JWT Tokens**: Access and refresh token system
- **Redis Session Management**: Distributed session storage
- **Password Validation**: Enforces strong password requirements
- **Protected Routes**: Middleware for API route protection
- **Role-based Authorization**: Reputation-based access control

## API Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "reputationScore": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 604800
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "reputationScore": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 604800
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

### Logout User
```http
POST /api/auth/logout
Authorization: Bearer jwt-access-token
```

### Get User Profile
```http
GET /api/auth/me
Authorization: Bearer jwt-access-token
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "reputationScore": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "stats": {
      "deviceCount": 5,
      "devicesCreated": 2,
      "verificationsSubmitted": 10
    }
  }
}
```

## Using Protected Routes

### Basic Authentication
```typescript
import { withAuth } from '@/lib/middleware';

async function protectedHandler(req: AuthenticatedRequest) {
  // req.user is available and contains user information
  const userId = req.user?.id;
  
  return NextResponse.json({ message: 'Protected data' });
}

export const GET = withAuth(protectedHandler);
```

### Role-based Authorization
```typescript
import { withRole } from '@/lib/middleware';

// Require minimum reputation score of 100
const moderatorHandler = withRole(100)(async (req) => {
  return NextResponse.json({ message: 'Moderator only data' });
});

export const GET = moderatorHandler;
```

### Optional Authentication
```typescript
import { withOptionalAuth } from '@/lib/middleware';

async function optionalAuthHandler(req: AuthenticatedRequest) {
  if (req.user) {
    // User is authenticated
    return NextResponse.json({ message: 'Hello ' + req.user.displayName });
  } else {
    // User is not authenticated
    return NextResponse.json({ message: 'Hello anonymous user' });
  }
}

export const GET = withOptionalAuth(optionalAuthHandler);
```

## Password Requirements

Passwords must meet the following criteria:
- At least 8 characters long
- Contains at least one uppercase letter
- Contains at least one lowercase letter
- Contains at least one number
- Contains at least one special character

## Environment Variables

```env
# JWT Configuration
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Password Hashing
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_URL="redis://localhost:6379"
```

## Error Handling

The authentication system returns standardized error responses:

```json
{
  "error": "Error type",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": ["Additional error details"]
}
```

Common error codes:
- `AUTH_REQUIRED`: Authentication token required
- `INVALID_TOKEN`: Token is invalid or expired
- `INVALID_CREDENTIALS`: Email or password incorrect
- `USER_EXISTS`: User already registered
- `VALIDATION_ERROR`: Input validation failed
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds
2. **JWT Security**: Tokens include issuer and audience claims
3. **Session Management**: Redis-based session storage with TTL
4. **Token Rotation**: Refresh tokens are rotated on use
5. **Input Validation**: Comprehensive validation for all inputs
6. **Rate Limiting**: Built-in rate limiting middleware (configurable)

## Testing

Run the authentication tests:
```bash
npm run test
```

The test suite covers:
- Password hashing and verification
- JWT token generation and validation
- Email and password validation
- API endpoint functionality
- Error handling scenarios