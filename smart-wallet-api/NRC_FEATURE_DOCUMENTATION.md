# NRC Image Upload and Verification Feature

## Overview
This feature allows customers to upload front and back images of their NRC (National Registration Card) for KYC (Know Your Customer) verification. Admin users can review and approve/reject these submissions, which will automatically upgrade customer levels upon approval.

## Features
- **Customer NRC Upload**: Customers can upload front and back images of their NRC
- **Admin Review**: Admin can view all pending NRC verifications
- **Approval/Rejection**: Admin can approve or reject NRC submissions with optional rejection reasons
- **Automatic Level Upgrade**: Upon approval, customers automatically get level upgraded (basic → silver → gold → platinum)
- **Status Tracking**: Customers can check their NRC verification status
- **Audit Logging**: All NRC operations are logged for compliance

## Database Structure

### nrc_verifications Table
```sql
- id: Primary key
- user_id: Foreign key to users table
- nrc_front_image_path: Path to front image
- nrc_back_image_path: Path to back image
- status: pending | approved | rejected
- rejection_reason: Optional reason for rejection
- verified_by: Foreign key to admin user who verified
- verified_at: Timestamp of verification
- created_at: Creation timestamp
- updated_at: Update timestamp
```

## API Endpoints

### Customer Endpoints

#### 1. Upload NRC Images
**POST** `/api/profile/nrc/upload`

**Authentication**: Required (Customer)

**Request Body** (form-data):
```
nrc_front_image: File (optional, max 5MB)
nrc_back_image: File (optional, max 5MB)
```

**Note**: At least one image (front or back) is required.

**Response** (Success):
```json
{
  "success": true,
  "message": "NRC images uploaded successfully. Waiting for admin verification.",
  "data": {
    "nrc_verification_id": 1,
    "status": "pending",
    "created_at": "2026-07-10T10:30:00Z"
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "At least one NRC image (front or back) is required."
}
```

#### 2. Get NRC Verification Status
**GET** `/api/profile/nrc/status`

**Authentication**: Required (Customer)

**Response** (Success):
```json
{
  "success": true,
  "message": "NRC status retrieved successfully.",
  "data": {
    "has_nrc": true,
    "status": "pending",
    "nrc_verification_id": 1,
    "nrc_front_image": "nrc/front/path/to/image.jpg",
    "nrc_back_image": "nrc/back/path/to/image.jpg",
    "rejection_reason": null,
    "verified_at": null,
    "created_at": "2026-07-10T10:30:00Z"
  }
}
```

**Response** (No NRC):
```json
{
  "success": true,
  "message": "NRC status retrieved successfully.",
  "data": {
    "has_nrc": false,
    "status": null,
    "message": "No NRC verification record found."
  }
}
```

### Admin Endpoints

#### 1. Get NRC Verifications (List)
**GET** `/api/admin/nrc-verifications?status=pending&per_page=15`

**Authentication**: Required (Admin)

**Query Parameters**:
- `status`: pending | approved | rejected (default: pending)
- `per_page`: Number of items per page (default: 15)

**Response**:
```json
{
  "success": true,
  "message": "NRC verifications retrieved.",
  "data": {
    "nrc_verifications": [
      {
        "id": 1,
        "user_id": 5,
        "user": {
          "id": 5,
          "phone_number": "09123456789",
          "full_name": "John Doe",
          "nrc_number": "12/ABC(N)123456",
          "status": "active"
        },
        "nrc_front_image": "nrc/front/path/to/image.jpg",
        "nrc_back_image": "nrc/back/path/to/image.jpg",
        "status": "pending",
        "rejection_reason": null,
        "verified_by": null,
        "verified_at": null,
        "created_at": "2026-07-10T10:30:00Z",
        "updated_at": "2026-07-10T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}
```

#### 2. Verify (Approve) NRC
**PATCH** `/api/admin/nrc-verifications/{nrcVerificationId}`

**Authentication**: Required (Admin)

**Request Body** (JSON):
```json
{
  "status": "approved"
}
```

**Response**:
```json
{
  "success": true,
  "message": "NRC verified successfully. Customer level upgraded.",
  "data": {
    "nrc_verification_id": 1,
    "status": "approved",
    "verified_at": "2026-07-10T10:35:00Z",
    "new_customer_level": "silver"
  }
}
```

#### 3. Reject NRC
**PATCH** `/api/admin/nrc-verifications/{nrcVerificationId}`

**Authentication**: Required (Admin)

**Request Body** (JSON):
```json
{
  "status": "rejected",
  "rejection_reason": "NRC images are not clear. Please upload high-quality images."
}
```

**Response**:
```json
{
  "success": true,
  "message": "NRC rejected. Customer notified.",
  "data": {
    "nrc_verification_id": 1,
    "status": "rejected",
    "rejection_reason": "NRC images are not clear. Please upload high-quality images.",
    "verified_at": "2026-07-10T10:35:00Z"
  }
}
```

## Workflow

### Customer Journey
1. **Upload NRC**: Customer uploads front and/or back images via `/api/v1/profile/nrc/upload`
2. **Check Status**: Customer can check verification status via `/api/v1/profile/nrc/status`
3. **Wait for Verification**: Admin reviews the images
4. **Approval**: Upon approval, customer level is automatically upgraded
5. **Rejection**: If rejected, customer receives reason and can re-upload

### Admin Journey
1. **View Pending**: Admin views all pending NRC verifications via `/api/v1/admin/nrc-verifications?status=pending`
2. **Review Images**: Admin reviews NRC front and back images
3. **Verify**: Admin either approves or rejects the NRC
4. **Auto-Upgrade**: Upon approval, system automatically dispatches `KycApprovedEvent` which triggers level upgrade
5. **Audit Log**: All actions are logged in audit_logs table

## Level Upgrade Path
When NRC is approved, customer level follows this upgrade path:
- basic → silver
- silver → gold
- gold → platinum
- platinum → platinum (already at max)

## Audit Logging
All NRC operations create audit log entries:
- `nrc_upload`: When customer uploads NRC images
- `nrc_approved`: When admin approves NRC
- `nrc_rejected`: When admin rejects NRC
- `customer_level_upgrade`: When customer level is upgraded (triggered by KycApprovedEvent)

## File Storage
- NRC images are stored in `storage/app/public/nrc/` directory
- Front images: `storage/app/public/nrc/front/`
- Back images: `storage/app/public/nrc/back/`
- Filenames are generated by Laravel's `store()` method

## Error Handling
The API returns appropriate HTTP status codes and error messages:
- `200`: Success
- `400`: Validation error (missing/invalid fields)
- `403`: Forbidden (user doesn't have permission)
- `404`: Not found (NRC verification not found)
- `422`: Unprocessable entity (validation failed)
- `500`: Server error

## Integration with Existing Features
- Uses existing `KycApprovedEvent` for event dispatching
- Uses existing `UpgradeCustomerLevelListener` for automatic level upgrades
- Uses existing `AuditLog` model for logging all operations
- Uses existing customer profile system (kyc_status field)

## Models Modified/Created
- **New**: `NrcVerification` model
- **New**: `NrcVerificationResource` HTTP resource
- **New**: `NrcVerificationService` service class
- **Modified**: `User` model (added nrcVerifications and latestNrcVerification relationships)
- **Modified**: `CustomerProfile` model (added NRC relationships)

## Controllers Modified/Created
- **Modified**: `UserProfileController` (added uploadNrc and getNrcStatus methods)
- **Modified**: `AdminController` (added getNrcVerifications and verifyNrc methods)

## Requests Modified/Created
- **New**: `UploadNrcRequest` (validates NRC upload)
- **New**: `VerifyNrcRequest` (validates NRC verification)

## Testing
See the test files for comprehensive examples:
- Customer upload tests
- Admin verification tests
- Level upgrade verification tests
- Error handling tests

## Example Usage

### Upload NRC Images (Customer)
```bash
curl -X POST http://localhost:8000/api/profile/nrc/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "nrc_front_image=@/path/to/nrc_front.jpg" \
  -F "nrc_back_image=@/path/to/nrc_back.jpg"
```

### Check NRC Status (Customer)
```bash
curl -X GET http://localhost:8000/api/profile/nrc/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Pending NRC Verifications (Admin)
```bash
curl -X GET http://localhost:8000/api/admin/nrc-verifications?status=pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve NRC (Admin)
```bash
curl -X PATCH http://localhost:8000/api/admin/nrc-verifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

### Reject NRC (Admin)
```bash
curl -X PATCH http://localhost:8000/api/admin/nrc-verifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected", "rejection_reason": "Images not clear"}'
```

## Notes
- NRC images should be clear and readable
- Both front and back images are optional but at least one is required
- Images must be in JPEG, PNG, or GIF format
- Maximum file size is 5MB per image
- Existing pending verifications are automatically deleted when new images are uploaded
- KYC status is updated to 'approved' when NRC is verified
