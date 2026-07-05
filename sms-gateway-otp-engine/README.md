# OTP Authentication Engine with Infinireach SMS Gateway

A complete Spring Boot application for Phone Number Authentication via OTP (One-Time Password) using Java 17 MVC architecture and PostgreSQL database. Integrates with Infinireach SMS Gateway for sending OTPs via SMS.

## 📋 Project Overview

This project provides a secure OTP-based authentication system that:
- Generates secure 6-digit random OTP codes
- Stores OTP with 5-minute expiration in PostgreSQL
- Sends OTP via SMS through Infinireach SMS Gateway API
- Verifies OTP with timestamp validation
- Marks phone numbers as verified upon successful verification

## 🛠 Tech Stack

- **Backend Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **Key Dependencies**:
  - Spring Web (REST APIs)
  - Spring Data JPA (Database ORM)
  - PostgreSQL Driver
  - Lombok (Boilerplate reduction)
  - Jackson (JSON serialization)

## 📦 Project Structure

```
sma-gateway-otp-engine/
├── src/
│   ├── main/
│   │   ├── java/com/infinireach/otp/
│   │   │   ├── OtpAuthenticationEngineApplication.java (Main class)
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java (REST endpoints)
│   │   │   ├── service/
│   │   │   │   └── OTPService.java (Business logic)
│   │   │   ├── repository/
│   │   │   │   └── OTPRepository.java (Database access)
│   │   │   ├── model/
│   │   │   │   └── PhoneAuthentication.java (JPA Entity)
│   │   │   ├── dto/
│   │   │   │   ├── SendOTPRequest.java
│   │   │   │   ├── VerifyOTPRequest.java
│   │   │   │   ├── OTPResponse.java
│   │   │   │   └── SmsPayload.java
│   │   │   └── util/
│   │   │       └── OTPGenerator.java (OTP generation utility)
│   │   └── resources/
│   │       └── application.properties (Configuration)
│   └── test/ (Test directory)
├── pom.xml (Maven configuration)
├── README.md (This file)
└── .github/
    └── copilot-instructions.md
```

## 🗄 Database Schema

### Table: phone_authentications

```sql
CREATE TABLE phone_authentications (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create index for faster lookups
CREATE INDEX idx_phone_number ON phone_authentications(phone_number);
CREATE INDEX idx_created_at ON phone_authentications(created_at DESC);
```

## 🚀 Getting Started

### Prerequisites

- Java 17 or higher
- PostgreSQL database
- Maven 3.6+
- Infinireach SMS Gateway API Token

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE otp_auth_db;

# Create table (execute the SQL script above)
```

### 2. Configure Application

Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/otp_auth_db
spring.datasource.username=postgres
spring.datasource.password=your_password_here

# Infinireach SMS Gateway Configuration
infinireach.api.token=YOUR_INFINIREACH_API_TOKEN_HERE

# OTP Configuration
otp.expiry.minutes=5
otp.length=6
```

### 3. Build and Run

```bash
# Navigate to project directory
cd sma-gateway-otp-engine

# Build project
mvn clean install

# Run application
mvn spring-boot:run

# Or run using JAR
java -jar target/otp-engine-1.0.0.jar
```

Application will start on `http://localhost:8080`

## 📡 API Endpoints

### 1. Send OTP

**Endpoint**: `POST /api/auth/send-otp`

**Request Body**:
```json
{
  "phoneNumber": "+1234567890"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP sent successfully to +1234567890",
  "phoneNumber": "+1234567890"
}
```

**Error Response (400/500)**:
```json
{
  "success": false,
  "message": "Failed to send OTP SMS",
  "errorDetails": "SMS gateway returned error",
  "phoneNumber": "+1234567890"
}
```

**Process Flow**:
1. Receives phone number from request
2. Generates secure 6-digit random OTP
3. Saves OTP to PostgreSQL with 5-minute expiration
4. Sends SMS via Infinireach API using Java 11+ HttpClient
5. Returns success/failure status

---

### 2. Verify OTP

**Endpoint**: `POST /api/auth/verify-otp`

**Request Body**:
```json
{
  "phoneNumber": "+1234567890",
  "otpCode": "123456"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "isVerified": true,
  "phoneNumber": "+1234567890"
}
```

**Error Response - Invalid OTP (400)**:
```json
{
  "success": false,
  "message": "Invalid OTP code",
  "isVerified": false,
  "phoneNumber": "+1234567890"
}
```

**Error Response - Expired OTP (400)**:
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP.",
  "isVerified": false,
  "phoneNumber": "+1234567890"
}
```

**Verification Logic**:
1. Retrieves latest OTP record for phone number
2. Validates OTP code matches
3. Checks if OTP is not expired:
   - **Timestamp Comparison**: `LocalDateTime.now().isBefore(expiryTime)`
   - If TRUE: OTP is VALID (not expired)
   - If FALSE: OTP is EXPIRED (equal to or past expiry time)
4. Updates `is_verified` flag to TRUE if all checks pass
5. Returns verification status

---

### 3. Health Check

**Endpoint**: `GET /api/auth/health`

**Response (200 OK)**:
```
OTP Authentication Engine is running
```

## 🔑 Key Implementation Details

### OTP Generation (`OTPGenerator.java`)
- Uses `SecureRandom` for cryptographically secure random number generation
- Generates 6-digit numeric codes (000000-999999)
- Formatted with leading zeros when necessary

### SMS Integration (`OTPService.java`)
- Uses Java 11+ standard `HttpClient` (no external HTTP library needed)
- Sends POST request to: `https://api.infinireach.io/api/v1/messages`
- Headers:
  - `Content-Type: application/json`
  - `X-API-Key: <YOUR_API_KEY>`
- Payload format:
  ```json
  {
    "channel": "sms",
    "to": "+959XXXXXXXX",
    "from": "+959944074981",
    "message": "Your OTP code is: 123456"
  }
  ```

### Timestamp Validation
OTP expiration is validated using `LocalDateTime` comparison:
```java
// Check if current time is before expiry time
if (LocalDateTime.now().isBefore(phoneAuth.getExpiryTime())) {
    // OTP is VALID (not expired)
} else {
    // OTP is EXPIRED
}
```

## 🧪 Testing with cURL

### Test Send OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Test Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otpCode": "123456"}'
```

### Test Health Check
```bash
curl http://localhost:8080/api/auth/health
```

## 📝 Configuration Properties

| Property | Description | Default |
|----------|-------------|---------|
| `spring.datasource.url` | PostgreSQL connection URL | jdbc:postgresql://localhost:5432/otp_auth_db |
| `spring.datasource.username` | Database username | postgres |
| `spring.datasource.password` | Database password | - |
| `infinireach.api.endpoint` | Infinireach API endpoint | https://api.infinireach.io/api/v1/messages |
| `infinireach.api.token` | Infinireach API key | - |
| `otp.expiry.minutes` | OTP expiration time in minutes | 5 |
| `otp.length` | OTP code length | 6 |

## 🔒 Security Considerations

1. **OTP Generation**: Uses `SecureRandom` for cryptographically strong randomization
2. **API Authentication**: Bearer token authentication for Infinireach API
3. **Expiration**: OTP automatically expires after 5 minutes
4. **Timestamp Validation**: Precise timestamp comparison to prevent expired OTP usage
5. **Logging**: Comprehensive logging for audit trail (sensitive data masked in production)

## 📚 Database Queries

### Find latest OTP for phone number
```sql
SELECT * FROM phone_authentications 
WHERE phone_number = '+1234567890' 
ORDER BY created_at DESC LIMIT 1;
```

### Find all verified phone numbers
```sql
SELECT * FROM phone_authentications 
WHERE is_verified = TRUE;
```

### Find expired OTPs
```sql
SELECT * FROM phone_authentications 
WHERE expiry_time < NOW() AND is_verified = FALSE;
```

## 🐛 Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `psql -U postgres`
- Check database URL, username, and password in `application.properties`
- Ensure database `otp_auth_db` exists

### SMS Not Sending
- Verify Infinireach API key is correct
- Check network connectivity to `https://api.infinireach.io`
- Review logs for HTTP response status and body
- Ensure phone number format is correct

### OTP Verification Fails
- Verify OTP code matches exactly (case-sensitive)
- Check OTP hasn't expired (within 5 minutes of generation)
- Review database records: `SELECT * FROM phone_authentications WHERE phone_number = '...'`

## 📖 Additional Notes

- The application uses Spring Boot's auto-configuration for JPA and REST
- Lombok is used to reduce boilerplate code (getters, setters, constructors)
- Jackson is used for JSON serialization/deserialization
- All endpoints support CORS for cross-origin requests
- Comprehensive logging using SLF4J with Logback

## 📄 License

This project is provided as-is for educational and development purposes.

## 👨‍💻 Author

OTP Engine Team

## 📞 Support

For issues or questions, please refer to the logs and ensure all configuration properties are correctly set.

---

**Happy OTP Authentication!** 🔐
