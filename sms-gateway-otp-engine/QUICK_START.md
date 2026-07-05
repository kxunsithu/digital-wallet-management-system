# Quick Start Guide - OTP Authentication Engine

## 📋 Prerequisites

- Java 17+
- PostgreSQL
- Maven 3.6+
- Infinireach SMS Gateway API Token

## 🚀 Setup Steps

### 1️⃣ Database Setup (PostgreSQL)

```bash
# Create database
createdb otp_auth_db

# Connect to database and create table
psql -U postgres -d otp_auth_db -f src/main/resources/schema.sql
```

### 2️⃣ Configure Application

Edit `src/main/resources/application.properties`:

```properties
# 🔴 REQUIRED: Update these values
spring.datasource.password=your_password_here
infinireach.api.token=YOUR_INFINIREACH_API_TOKEN_HERE
```

### 3️⃣ Build Project

```bash
mvn clean install
```

### 4️⃣ Run Application

```bash
mvn spring-boot:run
```

Application will start on: **http://localhost:8080**

## 🧪 Test Endpoints

### Send OTP (generates and sends OTP via SMS)
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to +1234567890",
  "phoneNumber": "+1234567890"
}
```

---

### Verify OTP (verifies OTP and marks phone as verified)
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otpCode": "123456"}'
```

**Response (Valid OTP):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "isVerified": true,
  "phoneNumber": "+1234567890"
}
```

**Response (Expired/Invalid OTP):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP.",
  "isVerified": false,
  "phoneNumber": "+1234567890"
}
```

---

### Health Check
```bash
curl http://localhost:8080/api/auth/health
```

**Response:**
```
OTP Authentication Engine is running
```

## 📁 Project Structure Overview

```
├── src/main/java/com/infinireach/otp/
│   ├── OtpAuthenticationEngineApplication.java  (Main Entry Point)
│   ├── controller/
│   │   └── AuthController.java                   (REST Endpoints)
│   ├── service/
│   │   └── OTPService.java                       (Business Logic)
│   ├── repository/
│   │   └── OTPRepository.java                    (Database Access)
│   ├── model/
│   │   └── PhoneAuthentication.java              (JPA Entity)
│   ├── dto/
│   │   ├── SendOTPRequest.java
│   │   ├── VerifyOTPRequest.java
│   │   ├── OTPResponse.java
│   │   └── SmsPayload.java
│   └── util/
│       └── OTPGenerator.java                     (Secure OTP Generation)
├── src/main/resources/
│   ├── application.properties                    (Configuration)
│   └── schema.sql                                (Database Schema)
├── pom.xml                                        (Maven Dependencies)
└── README.md                                      (Full Documentation)
```

## 🔑 Key Features

✅ **Secure OTP Generation** - Uses `SecureRandom` for cryptographically strong 6-digit codes
✅ **5-Minute Expiration** - OTP automatically expires after 5 minutes
✅ **PostgreSQL Storage** - Persistent storage with timestamp tracking
✅ **Infinireach SMS Gateway** - Uses Java 11+ `HttpClient` for SMS delivery
✅ **Timestamp Validation** - Precise `LocalDateTime` comparison for expiration checking
✅ **Comprehensive Logging** - Full audit trail for debugging

## 🔒 What Happens Behind the Scenes

### When you call `/api/auth/send-otp`:
1. Generate secure 6-digit OTP
2. Save to PostgreSQL with 5-minute expiration
3. Send SMS via Infinireach API with message: "Your OTP code is: XXXXXX"
4. Return success/failure status

### When you call `/api/auth/verify-otp`:
1. Retrieve latest OTP record from database
2. Check if OTP code matches user input
3. Check if current time is BEFORE expiration time:
   - ✅ `LocalDateTime.now().isBefore(expiryTime)` → VALID
   - ❌ Otherwise → EXPIRED
4. Mark phone as verified if all checks pass
5. Return verification status

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `org.postgresql.util.PSQLException: Connection refused` | Start PostgreSQL: `pg_ctl start` |
| `ERROR 28P01: invalid password authentication` | Check DB password in `application.properties` |
| `SMS not sending` | Verify Infinireach API token is correct and network is accessible |
| `OTP verification fails` | Ensure OTP hasn't expired (5-min window) and code is exact match |

## 📚 Full Documentation

See `README.md` for comprehensive documentation including:
- Complete API reference
- Database schema details
- Configuration options
- Security considerations
- Production deployment guidance

## 🎯 Next Steps

1. ✅ Complete setup and test endpoints
2. Add rate limiting for security
3. Add input validation (phone format, OTP format)
4. Integrate with your frontend application
5. Deploy to production with HTTPS

---

**Happy authenticating!** 🔐
