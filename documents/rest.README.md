# 📚 REST API Endpoints Documentation

## 🔐 Authentication (auth)

### POST /auth/signup
**Description**: Registers a new user in the system
**Requires authentication**: No

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

**Response Success (201)**:
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "role": "CLIENT",
  "accountStatus": "UNVERIFIED",
  "created_at": "2025-06-01T10:00:00Z"
}
```

**Validations**:
- Email must be valid and unique
- Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol

---

### POST /auth/login
**Description**: Authenticates a user and returns JWT tokens
**Requires authentication**: No

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "Password123!",
  "otp": "123456"
}
```

**Response Success (200)**:
```json
{
  "id": 1,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: If the account is not verified, the `otp` field is required

---

### POST /auth/refresh
**Description**: Renews the access token using the refresh token
**Requires authentication**: RefreshToken

**Headers**:
```
Authorization: Bearer <refresh_token>
```

**Response Success (200)**:
```json
{
  "id": 1,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/signout
**Description**: Signs out by invalidating the refresh token
**Requires authentication**: JWT

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response Success (200)**:
```json
{
  "message": "Successfully signed out"
}
```

---

### POST /auth/forgot-password
**Description**: Sends email with link to reset password
**Requires authentication**: No
**Rate Limit**: 3 requests/5min

**Request Body**:
```json
{
  "email": "usuario@example.com"
}
```

**Response Success (200)**:
```json
{
  "message": "If an account exists, a reset link has been sent."
}
```

---

### POST /auth/reset-password
**Description**: Resets the password using the token sent by email
**Requires authentication**: No
**Rate Limit**: 1 request/sec, 3 requests/5min

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewPassword123!"
}
```

**Response Success (200)**:
```json
{
  "message": "Password reset successfully"
}
```

---

## 👥 User Management (users)

### POST /users
**Description**: Creates a new user (alternative endpoint to signup)
**Requires authentication**: No

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

**Response Success (201)**:
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "role": "CLIENT",
  "accountStatus": "UNVERIFIED",
  "created_at": "2025-06-01T10:00:00Z"
}
```

---

### GET /users/me
**Description**: Gets information of the authenticated user
**Requires authentication**: JWT

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response Success (200)**:
```json
{
  "userId": 1
}
```

---

### DELETE /users/:id
**Description**: Deletes a user (ADMIN/EDITOR only)
**Requires authentication**: JWT
**Required roles**: ADMIN, EDITOR

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response Success (200)**:
```json
{
  "message": "User deleted successfully"
}
```

---

### PATCH /users/:user_id/role
**Description**: Updates a user's role (ADMIN only)
**Requires authentication**: JWT
**Required roles**: ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "newRole": "EDITOR"
}
```

**Response Success (200)**:
```json
{
  "id": 2,
  "email": "usuario@example.com",
  "role": "EDITOR",
  "accountStatus": "VERIFIED",
  "first_name": null,
  "last_name": null,
  "phone": null,
  "is_active": true,
  "created_at": "2025-06-01T10:00:00Z",
  "updated_at": "2025-06-01T11:00:00Z"
}
```

**Available roles**: CLIENT, EDITOR, ADMIN

---

### POST /users/request-otp
**Description**: Requests a new OTP code for verification
**Requires authentication**: No

**Request Body**:
```json
{
  "email": "usuario@example.com"
}
```

**Response Success (200)**:
```json
{
  "message": "OTP sent successfully.Please check email"
}
```

---

## 💳 Stripe Payments (api/payments)

### POST /api/payments
**Description**: Creates a payment intent with Stripe to process payment
**Requires authentication**: JWT
**Required roles**: CLIENT

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Success (200)**:
```json
{
  "paymentId": "pay_1234567890",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "stripePaymentId": "pi_1234567890",
  "amount": 2500,
  "currency": "USD",
  "status": "PENDING"
}
```

---

### POST /api/payments/webhook
**Description**: Stripe webhook to confirm payments
**Requires authentication**: No (Stripe signature)

**Headers**:
```
stripe-signature: <stripe_signature>
Content-Type: application/json
```

**Request Body**: Raw Stripe webhook payload

**Response Success (200)**:
```json
{
  "paymentId": "pay_1234567890",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "stripePaymentId": "pi_1234567890",
  "amount": 2500,
  "currency": "USD",
  "status": "PAID",
  "paymentAt": "2025-06-01T11:30:00Z"
}
```

---

## 📧 Email Management (email)

### POST /email/send
**Description**: Sends a custom email
**Requires authentication**: No

**Request Body**:
```json
{
  "recipients": ["recipient@example.com"],
  "subject": "Email subject",
  "html": "<h1>HTML Content</h1><p>Email message</p>",
  "text": "Plain text content (optional)"
}
```

**Response Success (200)**:
```json
{
  "message": "Email sent successfully"
}
```

---

## 🔧 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Successful operation |
| 201 | Resource created successfully |
| 400 | Bad request (validation failed) |
| 401 | Not authenticated |
| 403 | Not authorized (insufficient permissions) |
| 404 | Resource not found |
| 422 | Unprocessable entity (duplicate email) |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

---

## 🛡️ Security

### JWT Authentication
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Reset Token**: Valid for 15 minutes

### Rate Limiting
- **General authentication**: 10 requests/minute
- **Reset password**: 1 request/second, 3 requests/5 minutes
- **Forgot password**: 3 requests/5 minutes

### User Roles
- **CLIENT**: Normal users, can make purchases
- **EDITOR**: Can manage products and categories
- **ADMIN**: Full system access

### OTP Validation
- 6-digit codes
- Valid for 5 minutes
- Hashed with bcrypt

---

## 🗃️ Database

### Main Models
- **User**: System users
- **Product**: Products (t-shirts)
- **Category**: Product categories
- **Order**: Purchase orders
- **Payment**: Processed payments
- **ShoppingCart**: Shopping cart
- **Favorite**: Favorite products
- **OTP**: Verification codes

---