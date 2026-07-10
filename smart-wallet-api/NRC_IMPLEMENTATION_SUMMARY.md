# NRC Image Upload & Verification Feature - Implementation Summary

## Overview
Successfully implemented a complete NRC (National Registration Card) image upload and verification feature for the Smart Wallet digital management system. Customers can now upload front and back images of their NRC, admins can verify/reject them, and upon approval, customers automatically get level upgrades.

## Files Created

### 1. Database Migration
- **File**: `database/migrations/2026_07_10_000001_create_nrc_verifications_table.php`
- **Purpose**: Creates the `nrc_verifications` table with fields for storing NRC image paths, status, rejection reasons, and verification details

### 2. Models
- **File**: `app/Models/NrcVerification.php`
  - New model for managing NRC verification records
  - Includes relationships with User and Admin models
  - Helper methods: `isPending()`, `isApproved()`, `isRejected()`

### 3. Services
- **File**: `app/Services/NrcVerificationService.php`
  - Handles NRC upload, verification (approve/reject), and status retrieval
  - Methods:
    - `uploadNrc()` - Uploads NRC images and creates verification record
    - `approveNrc()` - Approves NRC and triggers level upgrade
    - `rejectNrc()` - Rejects NRC with reason
    - `getNrcStatus()` - Returns current NRC verification status

### 4. HTTP Requests (Validation)
- **File**: `app/Http/Requests/UploadNrcRequest.php`
  - Validates NRC image uploads (max 5MB, image format only)
  
- **File**: `app/Http/Requests/Admin/VerifyNrcRequest.php`
  - Validates NRC verification requests
  - Requires rejection reason when rejecting

### 5. HTTP Resources
- **File**: `app/Http/Resources/NrcVerificationResource.php`
  - Formats NRC verification data for API responses

### 6. Tests
- **File**: `tests/Feature/NrcUploadTest.php`
  - Tests for customer NRC upload functionality
  - 8 test cases covering success and error scenarios

- **File**: `tests/Feature/NrcVerificationTest.php`
  - Tests for admin NRC verification
  - Tests for level upgrade path
  - 8 test cases

- **File**: `tests/Feature/NrcStatusTest.php`
  - Tests for NRC status retrieval
  - 6 test cases

### 7. Documentation
- **File**: `NRC_FEATURE_DOCUMENTATION.md`
  - Complete API documentation
  - Usage examples
  - Error handling guide

## Files Modified

### 1. Controllers
- **File**: `app/Http/Controllers/Api/UserProfileController.php`
  - Added `uploadNrc()` method - POST endpoint for NRC upload
  - Added `getNrcStatus()` method - GET endpoint for status retrieval
  - Injected `NrcVerificationService`

- **File**: `app/Http/Controllers/Api/AdminController.php`
  - Added `getNrcVerifications()` method - GET endpoint to list pending verifications
  - Added `verifyNrc()` method - PATCH endpoint to approve/reject NRC
  - Injected `NrcVerificationService`

### 2. Models
- **File**: `app/Models/User.php`
  - Added `nrcVerifications()` relationship (HasMany)
  - Added `latestNrcVerification()` relationship (HasOne)

- **File**: `app/Models/CustomerProfile.php`
  - Added relationships to access NRC verifications through user

### 3. Routes
- **File**: `routes/api.php`
  - Added POST `/api/profile/nrc/upload` - Customer NRC upload
  - Added GET `/api/profile/nrc/status` - Customer check NRC status
  - Added GET `/api/admin/nrc-verifications` - Admin list verifications
  - Added PATCH `/api/admin/nrc-verifications/{id}` - Admin verify NRC

## API Endpoints

### Customer Endpoints
1. **Upload NRC Images**
   - POST `/api/profile/nrc/upload`
   - Accepts form-data with `nrc_front_image` and/or `nrc_back_image`
   - Returns verification ID and status

2. **Get NRC Status**
   - GET `/api/profile/nrc/status`
   - Returns current NRC verification status, images, and rejection reason if any

### Admin Endpoints
1. **List NRC Verifications**
   - GET `/api/admin/nrc-verifications?status=pending`
   - Query parameter `status` can be: pending, approved, rejected
   - Returns paginated list with user details

2. **Verify/Reject NRC**
   - PATCH `/api/admin/nrc-verifications/{nrcVerificationId}`
   - Body: `{"status": "approved"}` or `{"status": "rejected", "rejection_reason": "..."}`
   - Automatically upgrades customer level on approval
   - Dispatches KycApprovedEvent for event-driven operations

## Key Features Implemented

### 1. Image Upload
- ✅ Support for both front and back NRC images
- ✅ At least one image required
- ✅ File validation (JPEG, PNG, GIF only)
- ✅ File size limit (5MB per image)
- ✅ Automatic file storage to `storage/app/public/nrc/`

### 2. Verification Workflow
- ✅ Admin can view all pending NRC submissions
- ✅ Admin can approve/reject with optional reasons
- ✅ Multiple status states: pending, approved, rejected
- ✅ Automatic old pending records deletion on new upload

### 3. Level Upgrade
- ✅ Automatic customer level upgrade on approval
- ✅ Upgrade path: basic → silver → gold → platinum
- ✅ Event-driven using existing `KycApprovedEvent`
- ✅ Triggers existing `UpgradeCustomerLevelListener`
- ✅ Updates customer `kyc_status` field

### 4. Audit Logging
- ✅ All NRC operations logged in audit_logs table
- ✅ Actions logged: nrc_upload, nrc_approved, nrc_rejected, customer_level_upgrade
- ✅ Includes admin details when verified
- ✅ Full audit trail for compliance

### 5. Error Handling
- ✅ Proper HTTP status codes (200, 400, 403, 404, 422, 500)
- ✅ Validation error messages
- ✅ User-friendly error responses
- ✅ Try-catch blocks for exception handling

## Integration with Existing Features

### Events
- Uses existing `KycApprovedEvent`
- Triggers existing `UpgradeCustomerLevelListener`
- Works with `UpgradeCustomerLevelListener` for automatic level upgrades

### Models
- Works with existing `User` model
- Works with existing `CustomerProfile` model
- Works with existing `CustomerLevelConfig` model
- Uses existing `AuditLog` model for logging

### Authentication
- Uses existing Laravel Sanctum authentication
- Role-based access control (customer vs admin)
- Works with existing authorization middleware

## Database Impact

### New Table: nrc_verifications
```sql
- id (primary key)
- user_id (foreign key)
- nrc_front_image_path (string, nullable)
- nrc_back_image_path (string, nullable)
- status (enum: pending, approved, rejected)
- rejection_reason (text, nullable)
- verified_by (foreign key, nullable)
- verified_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Indexes
- Index on user_id
- Index on status
- Index on created_at

## Testing
Run the following commands to test:

```bash
# Test NRC upload
php artisan test tests/Feature/NrcUploadTest.php

# Test admin verification
php artisan test tests/Feature/NrcVerificationTest.php

# Test NRC status retrieval
php artisan test tests/Feature/NrcStatusTest.php

# Run all tests
php artisan test
```

## File Structure
```
smart-wallet-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── UserProfileController.php (modified)
│   │   │   └── AdminController.php (modified)
│   │   ├── Requests/
│   │   │   ├── UploadNrcRequest.php (new)
│   │   │   └── Admin/VerifyNrcRequest.php (new)
│   │   └── Resources/
│   │       └── NrcVerificationResource.php (new)
│   ├── Models/
│   │   ├── User.php (modified)
│   │   ├── CustomerProfile.php (modified)
│   │   └── NrcVerification.php (new)
│   └── Services/
│       └── NrcVerificationService.php (new)
├── database/
│   └── migrations/
│       └── 2026_07_10_000001_create_nrc_verifications_table.php (new)
├── routes/
│   └── api.php (modified)
├── tests/
│   └── Feature/
│       ├── NrcUploadTest.php (new)
│       ├── NrcVerificationTest.php (new)
│       └── NrcStatusTest.php (new)
└── NRC_FEATURE_DOCUMENTATION.md (new)
```

## Usage Example

### Customer Upload NRC
```bash
curl -X POST http://localhost:8000/api/profile/nrc/upload \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -F "nrc_front_image=@front.jpg" \
  -F "nrc_back_image=@back.jpg"
```

### Admin Approve NRC
```bash
curl -X PATCH http://localhost:8000/api/admin/nrc-verifications/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

Result: Customer level automatically upgrades!

## Migration Status
✅ Migration applied successfully: `2026_07_10_000001_create_nrc_verifications_table`

## Next Steps (Optional Enhancements)
1. Add image processing/compression
2. Add OCR for automatic NRC validation
3. Add document storage to cloud (S3, etc.)
4. Add email notifications for status changes
5. Add admin notes/comments on verifications
6. Add bulk verification operations
7. Add analytics dashboard for KYC completion rates
8. Add retry limits for rejected NRCs

## Security Considerations
- ✅ File upload validation (type, size)
- ✅ Role-based access control
- ✅ User can only access own NRC data
- ✅ Admin can only manage other users' NRCs
- ✅ Sensitive data not exposed in responses
- ✅ Audit logging for compliance

## Performance Considerations
- ✅ Indexed database queries
- ✅ Lazy loading relationships
- ✅ Pagination for list endpoints
- ✅ Efficient file storage

---

**Implementation Date**: 2026-07-10
**Status**: ✅ Complete and Ready for Use
