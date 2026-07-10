# NRC Verification Feature - Workflow Diagrams

## 📊 Customer NRC Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER NRC UPLOAD FLOW                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Customer   │
│  (Logged In) │
└──────┬───────┘
       │
       │ 1. POST /api/profile/nrc/upload
       │    (with front/back images)
       ▼
┌──────────────────────────┐
│  UserProfileController   │
│    uploadNrc() method    │
└──────┬───────────────────┘
       │
       │ Validate request
       ▼
┌──────────────────────────┐
│   UploadNrcRequest       │
│   Validation Rules       │
│ - image format check     │
│ - file size check (5MB)  │
│ - at least 1 image       │
└──────┬───────────────────┘
       │
       ├─ ✅ Valid
       │   │
       │   ▼
       │  ┌─────────────────────────┐
       │  │ NrcVerificationService  │
       │  │   uploadNrc() method    │
       │  └────────┬────────────────┘
       │           │
       │           │ 1. Store images to storage/app/public/nrc/
       │           │ 2. Create NrcVerification record (status: pending)
       │           │ 3. Create audit log
       │           ▼
       │  ┌────────────────────────┐
       │  │   NrcVerification      │
       │  │   (Created in DB)      │
       │  │ - status: pending      │
       │  │ - front_image: path    │
       │  │ - back_image: path     │
       │  └────────┬───────────────┘
       │           │
       │           │ Return success response
       │           ▼
       │  ┌─────────────────────────┐
       │  │ API Response (200 OK)   │
       │  │ {                       │
       │  │   "success": true,      │
       │  │   "nrc_id": 5,          │
       │  │   "status": "pending"   │
       │  │ }                       │
       │  └────────┬────────────────┘
       │           │
       │           ▼
       │  ┌──────────────────────────┐
       │  │ Customer sees message:   │
       │  │ "Waiting for admin to    │
       │  │  verify your NRC"        │
       │  └──────────────────────────┘
       │
       └─ ❌ Invalid
           │
           ▼
          ┌─────────────────────────┐
          │ API Response (422)       │
          │ Validation errors       │
          │ (file format, size, etc)│
          └─────────────────────────┘
```

## 🔍 Admin NRC Verification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│               ADMIN NRC VERIFICATION FLOW                         │
└──────────────────────────────────────────────────────────────────┘

┌────────┐
│ Admin  │
│(Role)  │
└────┬───┘
     │
     │ 1. GET /api/admin/nrc-verifications?status=pending
     ▼
┌─────────────────────────┐
│  AdminController        │
│ getNrcVerifications()   │
└────────┬────────────────┘
     │
     │ Query database for pending NRCs
     │ Include user and image details
     ▼
┌──────────────────────────┐
│ Database Query           │
│ SELECT from              │
│ nrc_verifications WHERE  │
│ status = 'pending'       │
└────────┬─────────────────┘
     │
     ▼
┌────────────────────────────┐
│ Return Paginated List       │
│ ┌──────────────────────┐   │
│ │ Verification #1      │   │
│ │ - User: John Doe     │   │
│ │ - Status: pending    │   │
│ │ - Images: paths      │   │
│ │ - Created: date      │   │
│ │ - Action buttons:    │   │
│ │   [✅ Approve]       │   │
│ │   [❌ Reject]        │   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ Verification #2      │   │
│ │ ... more items       │   │
│ └──────────────────────┘   │
└────────┬─────────────────────┘
         │
         │ Admin reviews NRC images
         │ and decides to:
         │
    ┌────┴────────────────────────┐
    │                              │
    │ ✅ APPROVE                  │ ❌ REJECT
    │                              │
    ▼                              ▼
┌──────────────────────┐  ┌────────────────────┐
│ PATCH /api/admin/    │  │ PATCH /api/admin/  │
│ nrc-verifications/1  │  │ nrc-verifications/1│
│ {"status":"approved"}│  │ {"status": "reject"│
└──────────┬───────────┘  │  "reason": "..."} │
           │              └────────┬───────────┘
           │                       │
           ▼                       ▼
    ┌─────────────────┐   ┌──────────────────┐
    │ AdminController │   │ AdminController  │
    │  verifyNrc()    │   │   verifyNrc()    │
    └────────┬────────┘   └────────┬─────────┘
             │                     │
             │ Call service        │ Call service
             ▼                     ▼
    ┌──────────────────────────────────────┐
    │   NrcVerificationService             │
    │   approveNrc() or rejectNrc()        │
    └────────────────┬─────────────────────┘
                     │
        ┌────────────┴───────────────┐
        │                            │
        ▼ (if approved)              ▼ (if rejected)
    ┌──────────────────┐        ┌──────────────────┐
    │ Update NRC       │        │ Update NRC       │
    │ status: approved │        │ status: rejected │
    │ verified_by: id  │        │ rejection_reason │
    │ verified_at: now │        │ verified_by: id  │
    └────────┬─────────┘        │ verified_at: now │
             │                  └────────┬─────────┘
             │                           │
             ├─────────────┬─────────────┤
             │             │             │
             ▼             │             ▼
    ┌──────────────────┐   │   ┌──────────────────┐
    │ Dispatch Event:  │   │   │ Create Audit Log │
    │ KycApprovedEvent │   │   │ - action: rejected
    │ (triggers level  │   │   │ - reason: stored │
    │  upgrade)        │   │   └──────────────────┘
    └────────┬─────────┘   │
             │             │
             ▼             │
    ┌──────────────────────┐│
    │UpgradeCustLevel      ││
    │Listener              ││
    │                      ││
    │ 1. Get current level ││
    │ 2. Upgrade level:    ││
    │    basic → silver    ││
    │    silver → gold     ││
    │    gold → platinum   ││
    │ 3. Update profile    ││
    │ 4. Create audit log  ││
    └────────┬─────────────┘│
             │              │
             └──────────┬───┘
                        │
                        ▼
            ┌──────────────────────────┐
            │ API Response (200 OK)    │
            │ {                        │
            │  "success": true,        │
            │  "status": "approved",   │
            │  "new_level": "silver"   │
            │ }                        │
            └────────┬─────────────────┘
                     │
                     ▼
            ┌──────────────────────────┐
            │ Customer Level Upgraded! │
            │ basic → silver           │
            │ kyc_status: approved     │
            └──────────────────────────┘
```

## ✅ Customer Level Upgrade Path

```
┌────────────────────────────────────────────────────────────┐
│         CUSTOMER LEVEL UPGRADE ON NRC APPROVAL              │
└────────────────────────────────────────────────────────────┘

User Creates Account
        │
        ▼
    ┌────────┐
    │ BASIC  │  (Default Level)
    │ Level  │
    └───┬────┘
        │
        │ Upload NRC Images
        │ (POST /api/profile/nrc/upload)
        ▼
    ┌──────────────┐
    │ Pending      │
    │ (Admin      │
    │  reviews)    │
    └───┬──────────┘
        │
        │ Admin approves NRC
        │ (PATCH with status: approved)
        ▼
    ┌──────────────────┐
    │ ✅ APPROVED      │
    │ Event Dispatched │
    └────────┬─────────┘
             │
             │ KycApprovedEvent triggered
             ▼
    ┌──────────────────┐
    │ Level Upgraded   │
    │ BASIC → SILVER   │
    │ kyc_status:      │
    │ approved         │
    └───┬──────────────┘
        │
        │ Customer still at SILVER
        │ Can upload new NRC again
        ▼
    ┌──────────────┐
    │ New NRC      │
    │ Upload       │
    └───┬──────────┘
        │
        ▼
    ┌──────────────┐
    │ ✅ APPROVED  │
    ▼
    ┌──────────────────┐
    │ SILVER → GOLD    │
    └────┬─────────────┘
         │
         ▼
    ┌──────────────────┐
    │ GOLD LEVEL       │
    │ Status: active   │
    │ kyc_status:      │
    │ approved         │
    └─────┬────────────┘
          │
          │ (Process repeats)
          ▼
    ┌──────────────────┐
    │ GOLD → PLATINUM  │
    │ (Maximum Level)  │
    └──────────────────┘
```

## 🔄 Status Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│            NRC VERIFICATION STATUS FLOW                   │
└──────────────────────────────────────────────────────────┘

Customer uploads NRC
        │
        ▼
    ┌──────────────┐
    │   PENDING    │ ◄─────────────────┐
    │   Status     │                   │
    └──┬────────┬──┘                   │
       │        │                      │
   Admin views │ Admin reviews         │ Customer
   or rejects  │ and decides           │ re-uploads
               │                       │ (if rejected)
       ┌───────┴───────┐               │
       │               │               │
       ▼               ▼               │
    ┌─────────┐    ┌──────────┐       │
    │APPROVED │    │ REJECTED │───────┘
    │ Status  │    │  Status  │
    └──┬──────┘    └──────────┘
       │
       │ Event: KycApprovedEvent
       │ Action: Level upgrade
       ▼
    ┌──────────────┐
    │ KYC_STATUS   │
    │ = approved   │
    │ + Level ⬆    │
    └──────────────┘

    ┌──────────────┐
    │ REJECTION    │
    │ REASON       │
    │ = stored     │
    │ + Available  │
    │   to customer│
    └──────────────┘
```

## 🗂️ Database Relationship Diagram

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ phone_number    │
│ role_id         │
│ status          │
│ nrc_number      │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────┐
│   NrcVerifications           │
├──────────────────────────────┤
│ id (PK)                      │
│ user_id (FK → users)         │
│ nrc_front_image_path         │
│ nrc_back_image_path          │
│ status (pending/approved/    │
│         rejected)            │
│ rejection_reason             │
│ verified_by (FK → users)     │
│ verified_at                  │
│ created_at                   │
│ updated_at                   │
└──────────────────────────────┘
         ▲
         │
         │ Verified by
         │ (admin user)
         │
┌────────┘
│
└─ linked from Users (verified_by field)
```

## 📱 API Response Flow

```
┌────────────────────────────────────────────────────────────┐
│              API REQUEST & RESPONSE FLOW                    │
└────────────────────────────────────────────────────────────┘

CLIENT                              SERVER
                    
 │                                   │
 │ 1. POST /api/profile/nrc/upload   │
 │    (multipart/form-data)          │
 ├──────────────────────────────────►│
 │    with images                    │
 │                                   │
 │                                   ▼
 │                          ┌─────────────────┐
 │                          │ Validate request│
 │                          │ - Check auth    │
 │                          │ - Validate files│
 │                          │ - Check role    │
 │                          └────────┬────────┘
 │                                   │
 │                                   ▼
 │                          ┌─────────────────┐
 │                          │ Process upload  │
 │                          │ - Store images  │
 │                          │ - Create record │
 │                          │ - Log action    │
 │                          └────────┬────────┘
 │                                   │
 │ 2. 200 OK Response                │
 │◄──────────────────────────────────┤
 │ {                                 │
 │   "success": true,                │
 │   "message": "...",               │
 │   "data": {                       │
 │     "nrc_verification_id": 1,    │
 │     "status": "pending",          │
 │     "created_at": "..."           │
 │   }                               │
 │ }                                 │
 │                                   │
 
 │ 3. GET /api/profile/nrc/status    │
 ├──────────────────────────────────►│
 │                                   │
 │                                   ▼
 │                          ┌─────────────────┐
 │                          │ Get latest NRC  │
 │                          │ from database   │
 │                          └────────┬────────┘
 │                                   │
 │ 4. 200 OK Response                │
 │◄──────────────────────────────────┤
 │ {                                 │
 │   "success": true,                │
 │   "message": "...",               │
 │   "data": {                       │
 │     "has_nrc": true,              │
 │     "status": "pending",          │
 │     "nrc_verification_id": 1,    │
 │     "created_at": "..."           │
 │   }                               │
 │ }                                 │
 │                                   │
```

## 🔐 Authorization Flow

```
┌──────────────────────────────────────────────────────────┐
│           AUTHORIZATION & ROLE-BASED ACCESS               │
└──────────────────────────────────────────────────────────┘

Request comes in
        │
        ▼
    ┌─────────────────┐
    │ Check Auth      │
    │ (Sanctum token) │
    └─────┬───────────┘
          │
      ┌───┴───┐
      │       │
  ✅ Valid  ❌ Invalid
      │       │
      │       ▼
      │    Respond: 401 Unauthorized
      │
      ▼
    ┌──────────────────┐
    │ Check Role       │
    │ (customer/admin) │
    └─────┬────────────┘
          │
    ┌─────┴──────────────┬──────────────────┐
    │                    │                  │
    ▼                    ▼                  ▼
CUSTOMER ROLE        ADMIN ROLE        OTHER ROLES
    │                    │                  │
    ▼                    ▼                  ▼
✅ Can upload         ✅ Can verify      ❌ Forbidden
  NRC images          NRC
❌ Cannot verify      ❌ Cannot see      
  NRC                   user data
```

---

## 💡 Key Takeaways

1. **Upload Flow**: Simple form submission with file validation
2. **Verification Flow**: Admin reviews and approves/rejects with reasons
3. **Level Upgrade**: Automatic event-driven upgrade on approval
4. **Status Tracking**: Multiple states with clear transitions
5. **Database Structure**: Simple normalized design with proper relationships
6. **Authorization**: Role-based access control throughout

---

For complete implementation details, see `NRC_FEATURE_DOCUMENTATION.md`
