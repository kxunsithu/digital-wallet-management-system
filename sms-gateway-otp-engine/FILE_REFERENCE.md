# File Reference Guide - OTP Authentication Engine

## Overview
This document provides a quick reference for all files in the project with descriptions of their key implementations.

---

## 📋 Root Level Files

### `pom.xml`
**Maven Build Configuration**
- Defines Spring Boot 3.2.0 as parent
- Java 17 as compilation target
- Key Dependencies:
  - spring-boot-starter-web (REST APIs)
  - spring-boot-starter-data-jpa (ORM)
  - postgresql:42.7.1 (Database driver)
  - lombok (Boilerplate reduction)
- Maven plugins for clean compile and spring-boot:run

### `README.md`
**Comprehensive Project Documentation**
- Complete setup and installation guide
- Full API endpoint documentation with examples
- Database schema and design
- Configuration properties reference
- Troubleshooting guide
- Security considerations
- Deployment checklist

### `QUICK_START.md`
**Quick Setup Guide (Read This First!)**
- 5-minute setup and testing steps
- Database and configuration setup
- cURL examples for testing endpoints
- Project structure overview
- Troubleshooting quick reference

### `PROJECT_COMPLETION_SUMMARY.md`
**Project Overview and Status**
- What was created summary
- Tech stack overview
- Key implementation features
- Deployment checklist
- Project status confirmation

### `FILE_REFERENCE.md`
**This File - File Reference Guide**

### `.gitignore`
**Git Ignore Configuration**
- Ignores Maven target directories
- IDE configurations (.idea, .vscode)
- Build artifacts (.class, .jar, .war)
- Environment files and logs
- OS files (.DS_Store, Thumbs.db)

### `.github/copilot-instructions.md`
**Copilot Project Instructions**
- Project overview for Copilot
- Key features implemented
- Configuration requirements
- Files and their responsibilities
- Next steps for production

---

## 📁 Java Source Files

### `src/main/java/com/infinireach/otp/OtpAuthenticationEngineApplication.java`
**Main Spring Boot Entry Point**
- `@SpringBootApplication` class
- Contains `main()` method to run the application
- Starts Spring Boot context on port 8080
- ~20 lines with full documentation

### `src/main/java/com/infinireach/otp/controller/AuthController.java`
**REST Controller - API Endpoints**
- Location: `/api/auth/`
- Endpoints:
  1. `POST /send-otp` - Send OTP to phone number
  2. `POST /verify-otp` - Verify OTP code
  3. `GET /health` - Health check
- CORS enabled for all origins
- Request/response validation
- Comprehensive documentation in method comments explaining each endpoint
- Key methods:
  - `sendOTP(SendOTPRequest)` - Processes OTP sending
  - `verifyOTP(VerifyOTPRequest)` - Processes OTP verification
  - `health()` - Returns health status

### `src/main/java/com/infinireach/otp/service/OTPService.java`
**Business Logic Layer**
- Core service with 3 main methods:

**1. `sendOTP(String phoneNumber)`**
- Generates secure 6-digit OTP using `OTPGenerator.generateOTP()`
- Creates `PhoneAuthentication` entity
- Sets expiry time: `LocalDateTime.now().plusMinutes(5)`
- Saves to PostgreSQL via `OTPRepository`
- Sends SMS via `sendSmsViaInfinireach()`
- Returns `OTPResponse` with status

**2. `sendSmsViaInfinireach(String phoneNumber, String otp)`**
- Uses Java 11+ `HttpClient` (no external library)
- Builds JSON payload: `{"to": phoneNumber, "message": "Your OTP code is: X"}`
- HTTP POST request to: `https://smsrelay.app/api/v1/send`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- Checks response status (200-299 = success)
- Returns boolean success status

**3. `verifyOTP(String phoneNumber, String otpCode)`**
- Retrieves latest OTP from database: `findLatestByPhoneNumber()`
- Validates OTP code matches
- **CRITICAL: Timestamp Validation**
  - Checks: `if (LocalDateTime.now().isBefore(phoneAuth.getExpiryTime()))`
  - If TRUE: OTP is VALID (not expired)
  - If FALSE: OTP is EXPIRED
- Updates `is_verified = true` on success
- Returns `OTPResponse` with verification status
- Comprehensive logging throughout

### `src/main/java/com/infinireach/otp/repository/OTPRepository.java`
**Data Access Layer - JPA Repository**
- Extends `JpaRepository<PhoneAuthentication, Long>`
- Custom Query Methods:

1. `findLatestByPhoneNumber(String phoneNumber)`
   - Native SQL query
   - `SELECT * FROM phone_authentications WHERE phone_number = :phoneNumber ORDER BY created_at DESC LIMIT 1`
   - Returns latest OTP for a phone number

2. `findByPhoneNumberAndOtpCode(String phoneNumber, String otpCode)`
   - Native SQL query
   - Finds record matching both phone and OTP
   - Used during verification

### `src/main/java/com/infinireach/otp/model/PhoneAuthentication.java`
**JPA Entity - Database Model**
- Maps to PostgreSQL table: `phone_authentications`
- Fields:
  - `id` (SERIAL PRIMARY KEY) - Auto-generated
  - `phoneNumber` - VARCHAR(20), NOT NULL
  - `otpCode` - VARCHAR(6), NOT NULL
  - `expiryTime` - TIMESTAMP, NOT NULL
  - `isVerified` - BOOLEAN, DEFAULT FALSE
  - `createdAt` - TIMESTAMP, auto-set on creation
  - `updatedAt` - TIMESTAMP, auto-updated
- Annotations: `@Entity`, `@Table(name = "phone_authentications")`, Lombok
- Lifecycle callbacks:
  - `@PrePersist` - Sets timestamps on creation
  - `@PreUpdate` - Updates timestamp on modification

### `src/main/java/com/infinireach/otp/util/OTPGenerator.java`
**Utility - Secure OTP Generation**
- Static utility class
- Uses `SecureRandom` for cryptographically strong randomization
- Key Methods:

1. `generateOTP()`
   - Generates random number: 0 to 999,999
   - Formats with 6 digits: `String.format("%06d", randomNumber)`
   - Examples: "001234", "567890", "000001"
   - Returns as String

2. `generateOTP(int length)`
   - Overloaded method for custom length
   - Generates OTP of specified length

### `src/main/java/com/infinireach/otp/dto/SendOTPRequest.java`
**DTO - Send OTP Request**
- Simple POJO with single field:
  - `phoneNumber` - String
- Annotations: Lombok `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`
- Auto-generates getters, setters, equals, hashCode, toString, constructor, builder

### `src/main/java/com/infinireach/otp/dto/VerifyOTPRequest.java`
**DTO - Verify OTP Request**
- Fields:
  - `phoneNumber` - String
  - `otpCode` - String
- Same Lombok annotations as SendOTPRequest

### `src/main/java/com/infinireach/otp/dto/OTPResponse.java`
**DTO - Standard API Response**
- Fields:
  - `success` - Boolean (success/failure status)
  - `message` - String (human-readable message)
  - `errorDetails` - String (optional error info)
  - `phoneNumber` - String (phone involved)
  - `isVerified` - Boolean (for verify endpoint response)
- Uses for both send and verify endpoint responses

### `src/main/java/com/infinireach/otp/dto/SmsPayload.java`
**DTO - Infinireach API Payload**
- Represents JSON body sent to SMS gateway
- Fields (with `@JsonProperty` annotations):
  - `to` - Recipient phone number
  - `message` - SMS message content
- Used to serialize to JSON for Infinireach API

---

## ⚙️ Configuration Files

### `src/main/resources/application.properties`
**Spring Boot Configuration**
- Server: `server.port=8080`
- Database Connection:
  - `spring.datasource.url=jdbc:postgresql://localhost:5432/otp_auth_db`
  - `spring.datasource.username=postgres`
  - `spring.datasource.password=` (USER SETS THIS)
- JPA/Hibernate:
  - `spring.jpa.hibernate.ddl-auto=update` (auto-creates tables)
  - `spring.jpa.show-sql=false`
- Infinireach Gateway:
  - `infinireach.api.endpoint=https://smsrelay.app/api/v1/send`
  - `infinireach.api.token=` (USER SETS THIS)
- OTP Settings:
  - `otp.expiry.minutes=5`
  - `otp.length=6`
- Logging:
  - `logging.level.com.infinireach.otp=DEBUG`

### `src/main/resources/schema.sql`
**PostgreSQL Database Schema**
- Creates `phone_authentications` table with:
  - id (SERIAL PRIMARY KEY)
  - phone_number (VARCHAR 20)
  - otp_code (VARCHAR 6)
  - expiry_time (TIMESTAMP)
  - is_verified (BOOLEAN DEFAULT FALSE)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
- Creates 3 indexes for performance:
  - idx_phone_number
  - idx_created_at
  - idx_phone_otp
- Includes column comments

---

## 📊 Architecture Flow

```
API Request
    ↓
AuthController
    ↓
OTPService
    ├─ OTPGenerator (generates OTP)
    ├─ OTPRepository (saves to DB)
    ├─ HttpClient (sends via SMS)
    └─ PhoneAuthentication (entity)
    ↓
PostgreSQL Database
```

---

## 🔄 Request Flow Examples

### Send OTP Flow
```
POST /api/auth/send-otp
{phoneNumber: "+1234567890"}
    ↓
AuthController.sendOTP()
    ↓
OTPService.sendOTP()
    ├─ OTPGenerator.generateOTP() → "123456"
    ├─ Create PhoneAuthentication entity
    ├─ Set expiryTime = now + 5 minutes
    ├─ OTPRepository.save() → DB
    ├─ sendSmsViaInfinireach() → Infinireach API
    └─ Return OTPResponse
    ↓
200 OK / 500 Error
```

### Verify OTP Flow
```
POST /api/auth/verify-otp
{phoneNumber: "+1234567890", otpCode: "123456"}
    ↓
AuthController.verifyOTP()
    ↓
OTPService.verifyOTP()
    ├─ OTPRepository.findLatestByPhoneNumber()
    ├─ Validate otpCode matches
    ├─ Check: LocalDateTime.now().isBefore(expiryTime)
    │   ├─ TRUE → OTP VALID
    │   └─ FALSE → OTP EXPIRED
    ├─ If valid: set isVerified = true, save
    └─ Return OTPResponse with isVerified
    ↓
200 OK / 400 Bad Request
```

---

## 🔐 Security Implementation

| Layer | Implementation |
|-------|-----------------|
| OTP Generation | `SecureRandom` for cryptographic strength |
| API Calls | Bearer token authentication to Infinireach |
| Database | Password-protected PostgreSQL |
| Timestamps | Precise `LocalDateTime` comparison |
| Input Validation | Null/empty checks on controller |
| Error Messages | No sensitive data in error responses |
| Logging | Comprehensive but masks sensitive data |

---

## 📝 Key Code Patterns Used

### Lombok Annotations (Reduces Boilerplate)
```java
@Data                    // equals, hashCode, toString, getters, setters
@NoArgsConstructor       // No-arg constructor
@AllArgsConstructor      // All-arg constructor
@Builder                 // Builder pattern
@Slf4j                   // Logger instance
```

### JPA Lifecycle
```java
@PrePersist  // Runs before saving to DB
@PreUpdate   // Runs before updating in DB
```

### Spring Annotations
```java
@RestController          // REST endpoint class
@Service                 // Business logic class
@Repository              // Data access class
@Component               // Generic Spring component
@Autowired               // Dependency injection
@Value                   // Property injection
```

---

## 💾 Database Operations

### Create
```java
PhoneAuthentication auth = PhoneAuthentication.builder()
    .phoneNumber(phone)
    .otpCode(otp)
    .expiryTime(LocalDateTime.now().plusMinutes(5))
    .isVerified(false)
    .build();
otpRepository.save(auth);
```

### Read
```java
Optional<PhoneAuthentication> auth = 
    otpRepository.findLatestByPhoneNumber(phone);
```

### Update
```java
auth.setIsVerified(true);
otpRepository.save(auth);
```

### Query
```java
Optional<PhoneAuthentication> auth = 
    otpRepository.findByPhoneNumberAndOtpCode(phone, otp);
```

---

## 🧪 Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Send valid phone number | OTP generated, saved, SMS sent, 200 OK |
| Send invalid/null phone | 400 Bad Request |
| Verify with correct OTP | isVerified=true, 200 OK |
| Verify with wrong OTP | Invalid message, 400 Bad Request |
| Verify after 5 min expiry | Expired message, 400 Bad Request |
| Verify before expiry | isVerified=true, 200 OK |

---

## 📦 Dependencies Summary

| Dependency | Purpose | Version |
|------------|---------|---------|
| Spring Boot | Web framework | 3.2.0 |
| Spring Data JPA | ORM framework | Included |
| PostgreSQL Driver | Database driver | 42.7.1 |
| Lombok | Boilerplate reduction | Latest |
| Jackson | JSON processing | Included |
| SLF4J | Logging API | Included |

---

## 🎯 File Reading Recommendation

For understanding the project:

1. **Start with documentation**
   - README.md (overview)
   - QUICK_START.md (setup)

2. **Review key classes in order**
   - OtpAuthenticationEngineApplication.java (entry point)
   - AuthController.java (API definition)
   - OTPService.java (business logic)
   - OTPRepository.java (data access)
   - PhoneAuthentication.java (entity)

3. **Understand utilities and DTOs**
   - OTPGenerator.java
   - SendOTPRequest, VerifyOTPRequest
   - OTPResponse, SmsPayload

---

✨ **Project ready for development and deployment!**
