# NRC Verification Feature - Quick Reference Guide

## 🎯 What Can Users Do?

### Customers
- Upload front and/or back images of their NRC
- Check the status of their NRC verification
- See rejection reasons if their NRC was rejected
- Re-upload NRC if rejected

### Admin Users
- View all pending NRC submissions
- Review customer NRC images
- Approve NRC submissions (which automatically upgrades customer level)
- Reject NRC submissions with detailed reasons
- View approval/rejection history

## 📱 API Quick Reference

### For Customers

**Upload NRC (POST)**
```
POST /api/profile/nrc/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

nrc_front_image: (optional) image file, max 5MB
nrc_back_image: (optional) image file, max 5MB
```

**Check NRC Status (GET)**
```
GET /api/profile/nrc/status
Authorization: Bearer {token}
```

### For Admins

**List Pending NRCs (GET)**
```
GET /api/admin/nrc-verifications?status=pending&per_page=15
Authorization: Bearer {admin-token}
```

**Approve NRC (PATCH)**
```
PATCH /api/admin/nrc-verifications/{id}
Authorization: Bearer {admin-token}
Content-Type: application/json

{"status": "approved"}
```

**Reject NRC (PATCH)**
```
PATCH /api/admin/nrc-verifications/{id}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "status": "rejected",
  "rejection_reason": "Image quality is poor"
}
```

## 🔄 Customer Level Upgrade Path

When NRC is **approved**, customer level automatically upgrades:

```
basic ──→ silver ──→ gold ──→ platinum
```

Example:
- Customer at "basic" level → NRC approved → Upgraded to "silver"
- Customer at "silver" level → NRC approved → Upgraded to "gold"

## 📋 NRC Verification Status States

| Status | Meaning | Customer Action |
|--------|---------|-----------------|
| **pending** | Waiting for admin review | Check back later |
| **approved** | NRC verified successfully | Enjoy level upgrade! |
| **rejected** | NRC not accepted | Re-upload with fixes |

## 💾 File Requirements

- **Formats**: JPEG, PNG, or GIF
- **Max Size**: 5MB per image
- **Minimum**: At least 1 image (front or back)
- **Recommended**: Both front and back for best results

## 🚀 Example Workflow

### Step 1: Customer Uploads NRC
```bash
curl -X POST http://localhost:8000/api/profile/nrc/upload \
  -H "Authorization: Bearer CUST_TOKEN" \
  -F "nrc_front_image=@front.jpg" \
  -F "nrc_back_image=@back.jpg"
```

Response:
```json
{
  "success": true,
  "message": "NRC images uploaded successfully. Waiting for admin verification.",
  "data": {
    "nrc_verification_id": 5,
    "status": "pending",
    "created_at": "2026-07-10T14:30:00Z"
  }
}
```

### Step 2: Admin Reviews Pending NRCs
```bash
curl -X GET "http://localhost:8000/api/admin/nrc-verifications?status=pending" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Response: List of pending NRCs with user details and image paths

### Step 3: Admin Approves NRC
```bash
curl -X PATCH http://localhost:8000/api/admin/nrc-verifications/5 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

Response:
```json
{
  "success": true,
  "message": "NRC verified successfully. Customer level upgraded.",
  "data": {
    "nrc_verification_id": 5,
    "status": "approved",
    "verified_at": "2026-07-10T14:35:00Z",
    "new_customer_level": "silver"
  }
}
```

### Step 4: Customer Checks Status
```bash
curl -X GET http://localhost:8000/api/profile/nrc/status \
  -H "Authorization: Bearer CUST_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "NRC status retrieved successfully.",
  "data": {
    "has_nrc": true,
    "status": "approved",
    "nrc_verification_id": 5,
    "verified_at": "2026-07-10T14:35:00Z",
    "new_customer_level": "silver"
  }
}
```

## ⚠️ Common Issues & Solutions

### Issue: "At least one NRC image required"
**Solution**: Upload at least one image (front or back)

### Issue: "Image must be JPEG, PNG, or GIF"
**Solution**: Convert your image to JPEG, PNG, or GIF format

### Issue: "File size exceeds 5MB limit"
**Solution**: Compress your image to be under 5MB

### Issue: "NRC is already approved/rejected"
**Solution**: Cannot re-verify an already verified NRC. Only pending NRCs can be verified.

### Issue: "Rejection reason is required when rejecting"
**Solution**: Include a `rejection_reason` field when rejecting an NRC

## 📊 Database & Audit Trail

All NRC operations are automatically logged:
- Upload attempts
- Admin approvals
- Admin rejections
- Customer level upgrades

Access logs via: `GET /api/admin/audit-logs` (admin only)

## 🔐 Access Control

- **Customers**: Can only upload/view their own NRC
- **Admin**: Can view/verify any customer's NRC
- **Unauthenticated**: Cannot access any NRC endpoints

## 🎓 Testing the Feature

Run automated tests:
```bash
php artisan test tests/Feature/NrcUploadTest.php
php artisan test tests/Feature/NrcVerificationTest.php
php artisan test tests/Feature/NrcStatusTest.php
```

## 📖 Full Documentation

See `NRC_FEATURE_DOCUMENTATION.md` for:
- Complete API specifications
- Error codes and meanings
- Integration details
- Implementation notes

## 💡 Tips

1. **Upload high-quality images** - Clear, well-lit photos process faster
2. **Check status regularly** - Admin might need clarification
3. **Keep NRC readable** - All four corners should be visible
4. **One upload at a time** - Uploading new images replaces pending ones
5. **For admin**: Filter by status to quickly find submissions needing action

## 📞 Support

For issues or questions:
1. Check the error message in the API response
2. Review `NRC_FEATURE_DOCUMENTATION.md`
3. Check application logs: `storage/logs/laravel.log`
4. Contact system admin

---

**Last Updated**: 2026-07-10
**Feature Version**: 1.0
**Status**: ✅ Production Ready
