# Custom Password Reset Implementation Plan

## Overview
Implement a custom password reset flow using Brevo emails and manual token management, replacing Supabase's built-in password reset system.

## Configuration Decisions

- **Token Expiration**: 1 hour
- **Rate Limiting**: 5 requests per user per hour
- **Email Design**: Dark theme with golden accents (matching existing notification emails)
- **Post-Reset Action**: Auto sign-in and redirect to dashboard
- **Session Handling**: Keep current session active (don't invalidate)
- **Token Cleanup**: On-demand cleanup when user requests new reset (invalidate old tokens)

## Database Schema

### PasswordResetToken Model (Already Created ✅)

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  token     String    @unique
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  usedAt    DateTime? @map("used_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

**Fields:**
- `id`: UUID primary key
- `userId`: References auth.users (cascade delete if user deleted)
- `token`: Unique secure random token (use crypto.randomBytes)
- `expiresAt`: Timestamp when token expires (1 hour from creation)
- `createdAt`: When token was generated
- `usedAt`: When token was used (null = unused)

## Implementation Components

### 1. Token Generation Service

**File**: `src/lib/services/password-reset-service.ts`

**Functions:**
- `generateResetToken(userId: string)`: Creates secure token, stores in DB
  - Generate cryptographically secure random token (32 bytes, hex encoded)
  - Set expiration to 1 hour from now
  - Invalidate any existing unused tokens for this user
  - Store in database
  - Return token string

- `validateToken(token: string)`: Validates token exists and hasn't expired
  - Look up token in database
  - Check not expired (expiresAt > now)
  - Check not already used (usedAt is null)
  - Return userId if valid, null if invalid

- `markTokenAsUsed(token: string)`: Marks token as used
  - Update usedAt timestamp
  - Prevent token reuse

- `checkRateLimit(userId: string)`: Checks if user has exceeded rate limit
  - Count tokens created in last hour for this user
  - Return true if count < 5, false otherwise

**Security Considerations:**
- Use `crypto.randomBytes(32).toString('hex')` for token generation
- Tokens are 64 characters long (256-bit entropy)
- Store tokens in plaintext (not hashed) - they're single-use and expire quickly
- Always validate expiration on every check

### 2. API Endpoint: Request Password Reset

**File**: `src/app/api/auth/request-reset/route.ts`

**Method**: POST

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link."
}
```

**Flow**:
1. Validate email format
2. Look up user by email in Supabase auth.users (server-side with service role)
3. If user not found: Still return success (security - don't reveal if email exists)
4. Check rate limit for this user
5. If rate limit exceeded: Return success but don't send email (security)
6. Generate reset token and store in DB
7. Send email via Brevo with reset link
8. Return success response

**Error Handling**:
- Invalid email format → 400 Bad Request
- Database errors → 500 Internal Server Error
- Email send errors → Log but still return 200 (don't reveal email service status)

**Security Notes**:
- Always return success response (don't reveal if email exists)
- Log actual errors server-side for debugging
- Rate limiting prevents abuse

### 3. API Endpoint: Verify Reset Token

**File**: `src/app/api/auth/verify-reset-token/route.ts`

**Method**: GET

**Query Parameters**:
- `token`: The reset token to validate

**Response (Valid)**:
```json
{
  "valid": true
}
```

**Response (Invalid)**:
```json
{
  "valid": false,
  "error": "Invalid or expired reset link"
}
```

**Flow**:
1. Extract token from query params
2. Call `validateToken(token)`
3. Return validation result

**Use Case**:
- Reset password page calls this on mount to verify token before showing form
- Shows appropriate error if token is invalid/expired

### 4. API Endpoint: Reset Password

**File**: `src/app/api/auth/reset-password/route.ts`

**Method**: POST

**Request Body**:
```json
{
  "token": "abc123...",
  "newPassword": "SecurePass123!"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Invalid or expired reset link"
}
```

**Flow**:
1. Validate token exists and is valid
2. Validate new password meets requirements (8+ chars, uppercase, lowercase, number, special)
3. Get userId from token
4. Update password in Supabase auth using admin client: `supabase.auth.admin.updateUserById(userId, { password: newPassword })`
5. Mark token as used
6. Create new session for user (sign them in)
7. Return session tokens

**Error Handling**:
- Invalid token → 400 Bad Request
- Weak password → 400 Bad Request with specific validation errors
- Supabase errors → 500 Internal Server Error

**Security Notes**:
- Password validation enforced server-side
- Token marked as used immediately (one-time use)
- New session created (auto sign-in)

### 5. Brevo Email Template

**File**: `src/lib/services/email-templates.ts`

**New Function**: `buildPasswordResetEmail(user: { email: string, name: string }, resetUrl: string)`

**Template Design**:
- Match existing notification email style (dark theme, golden accents)
- Clear subject: "Reset Your Password - Movie Release Tracker"
- Prominent reset button with golden styling
- Expiration notice (1 hour)
- Security note: "If you didn't request this, you can safely ignore this email"
- Link to forgot password page if they need help

**Email Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; overflow: hidden;">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f3d96b 0%, #d4a929 100%); padding: 30px; text-align: center;">
              <div style="font-size: 48px;">🔐</div>
              <h1 style="margin: 10px 0 0 0; color: #0a0a0a; font-size: 24px; font-weight: 600;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; color: #ededed;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Hi {{name}},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Movie Release Tracker account.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{resetUrl}}" style="display: inline-block; padding: 14px 36px; background-color: #f3d96b; color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 0 15px rgba(243, 217, 107, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                This link will expire in <strong style="color: #f3d96b;">1 hour</strong> for security reasons.
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>

              <!-- Alternative link -->
              <div style="margin: 30px 0 0 0; padding: 20px; background-color: #262626; border-radius: 6px; border-left: 3px solid #f3d96b;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #a3a3a3;">
                  Button not working? Copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 12px; color: #f3d96b; word-break: break-all;">
                  {{resetUrl}}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #262626;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #a3a3a3;">
                <strong style="color: #f3d96b;">Movie Release Tracker</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Never miss a movie release
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Email Service Integration**:

Add to `src/lib/services/email-service.ts`:

```typescript
async sendPasswordResetEmail(user: { email: string, name: string }, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
  const emailHtml = buildPasswordResetEmail(user, resetUrl)

  const sendSmtpEmail = {
    to: [{ email: user.email, name: user.name }],
    sender: { email: 'noreply@moviereleasetracker.com', name: 'Movie Release Tracker' },
    subject: 'Reset Your Password - Movie Release Tracker',
    htmlContent: emailHtml,
  }

  await this.sendTransacEmail(sendSmtpEmail)
}
```

### 6. Forgot Password Page

**File**: `src/app/auth/forgot-password/page.tsx`

**Changes Needed**:
- Update API call from `resetPassword(email)` to `fetch('/api/auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) })`
- Handle response and show success message
- Same UI as current implementation (already built)

**Flow**:
1. User enters email
2. Call `/api/auth/request-reset`
3. Always show success message (don't reveal if email exists)
4. Success message mentions checking spam folder

### 7. Reset Password Page

**File**: `src/app/auth/reset-password/page.tsx`

**Changes Needed**:
- Remove Supabase session verification
- Add token extraction from URL query params
- Call `/api/auth/verify-reset-token?token=...` on mount
- If token invalid: show error with link to request new reset
- If token valid: show password form
- On submit: call `/api/auth/reset-password` with token and new password
- Handle response: set session tokens and redirect to dashboard

**States**:
- `verifying`: true (checking token validity)
- `tokenValid`: boolean (token check result)
- `error`: string (error message)
- `success`: boolean (password reset successful)
- `password`, `confirmPassword`: form fields

**Flow**:
1. Extract token from URL query params
2. Verify token is valid (API call)
3. If invalid: Show error with link to forgot password page
4. If valid: Show password form with strength meter
5. User enters new password (must meet all 5 requirements)
6. Submit to `/api/auth/reset-password`
7. If successful: Show success message with countdown, set session, redirect to dashboard
8. If error: Show error message

### 8. Session Management After Reset

**Approach**: Use Supabase's `setSession` method

```typescript
// In reset-password page after successful API call
const { session } = await response.json()
await AuthService.supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token
})

// Then redirect
router.push('/dashboard')
```

This auto-signs the user in without requiring them to manually sign in after reset.

## File Structure

```
src/
├── app/
│   └── api/
│       └── auth/
│           ├── request-reset/
│           │   └── route.ts          # NEW: Request password reset
│           ├── verify-reset-token/
│           │   └── route.ts          # NEW: Verify token validity
│           └── reset-password/
│               └── route.ts          # NEW: Reset password with token
├── lib/
│   └── services/
│       ├── password-reset-service.ts # NEW: Token management
│       ├── email-service.ts          # MODIFY: Add sendPasswordResetEmail
│       └── email-templates.ts        # MODIFY: Add buildPasswordResetEmail
├── app/auth/
│   ├── forgot-password/
│   │   └── page.tsx                  # MODIFY: Use new API endpoint
│   └── reset-password/
│       └── page.tsx                  # MODIFY: Use token-based flow
└── prisma/
    └── schema.prisma                 # ALREADY UPDATED ✅
```

## Implementation Order

### Phase 1: Backend Services (Core Logic)
1. Create `password-reset-service.ts` with token management functions
2. Add password reset email template to `email-templates.ts`
3. Add `sendPasswordResetEmail` method to `email-service.ts`

### Phase 2: API Endpoints
1. Create `/api/auth/request-reset` endpoint
2. Create `/api/auth/verify-reset-token` endpoint
3. Create `/api/auth/reset-password` endpoint

### Phase 3: Frontend Pages
1. Update forgot-password page to use new API
2. Update reset-password page to use token-based flow

### Phase 4: Testing
1. Test token generation and storage
2. Test email sending
3. Test token validation
4. Test password reset flow
5. Test rate limiting
6. Test expired tokens
7. Test used tokens
8. Test auto sign-in after reset

## Security Features

1. **Cryptographically Secure Tokens**: Using `crypto.randomBytes(32)` for 256-bit entropy
2. **Short Expiration**: 1 hour token lifetime
3. **One-Time Use**: Tokens marked as used after password reset
4. **Rate Limiting**: Max 5 reset requests per user per hour
5. **Token Invalidation**: Old unused tokens invalidated when new one requested
6. **Email Enumeration Prevention**: Always return success response
7. **Server-Side Validation**: Password requirements enforced server-side
8. **Secure Password Update**: Using Supabase admin API to update auth.users
9. **HTTPS Only**: Reset links only work over HTTPS in production

## Error Handling

### User-Facing Errors
- "Invalid or expired reset link" → Token expired or invalid
- "Password must meet all requirements" → Weak password
- "Too many reset requests. Please try again later." → Rate limit hit

### Server-Side Logging
- Log all reset requests (email, timestamp, success/failure)
- Log token generation and validation attempts
- Log email send failures
- Log password update failures

## Testing Checklist

- [ ] Request reset with valid email
- [ ] Request reset with non-existent email (should still show success)
- [ ] Verify email is received
- [ ] Click reset link and verify redirect to reset page
- [ ] Verify token validation on page load
- [ ] Try weak password (should show validation errors)
- [ ] Submit strong password meeting all requirements
- [ ] Verify auto sign-in and redirect to dashboard
- [ ] Try using same token twice (should fail)
- [ ] Wait for token to expire and try to use (should fail)
- [ ] Request 6 resets in a row (6th should be blocked by rate limit)
- [ ] Verify old tokens are invalidated when new one is requested

## Rollback Plan

If you need to revert to Supabase's built-in password reset:

1. **Switch branches**: `git checkout feature/reset-password`
2. **Delete custom table**:
   ```sql
   DROP TABLE IF EXISTS password_reset_tokens CASCADE;
   ```
3. **Revert Prisma schema**: Remove `PasswordResetToken` model
4. **Regenerate Prisma**: `npm run db:generate`

## Cleanup Considerations

**Token Cleanup Strategy**: On-demand (when user requests new reset)
- When generating new token, delete all old unused tokens for that user
- No cron job needed
- Used tokens can be kept indefinitely (for audit trail) or cleaned up manually

**Optional**: Add a cleanup function to remove tokens older than 7 days:
```typescript
async cleanupOldTokens() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  await prisma.passwordResetToken.deleteMany({
    where: {
      createdAt: { lt: sevenDaysAgo }
    }
  })
}
```

This can be called manually or added as a monthly cron job.

## Environment Variables

No new environment variables needed! Uses existing:
- `NEXT_PUBLIC_APP_URL` - For reset link generation
- `BREVO_API_KEY` - For sending emails
- `DATABASE_URL` - For token storage
- `SUPABASE_SERVICE_ROLE_KEY` - For updating passwords

## Advantages Over Supabase Built-In

1. ✅ Full control over email design (matches your branding)
2. ✅ Track emails in Brevo dashboard
3. ✅ Custom rate limiting
4. ✅ Clean URL query params (no hash fragments)
5. ✅ Audit trail of reset requests
6. ✅ Template version controlled in codebase
7. ✅ Consistent with existing email infrastructure

## Estimated Implementation Time

- Phase 1 (Backend Services): 45 minutes
- Phase 2 (API Endpoints): 1 hour
- Phase 3 (Frontend Pages): 45 minutes
- Phase 4 (Testing): 30 minutes

**Total**: ~3 hours

## Dependencies

All dependencies already installed:
- `@prisma/client` - Database access
- `@getbrevo/brevo` - Email sending
- `crypto` (Node.js built-in) - Token generation
- `@supabase/supabase-js` - Password updates

No new packages needed!
