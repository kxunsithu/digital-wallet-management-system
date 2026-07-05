# OTP Authentication Engine - Copilot Instructions

## Project Overview

This is a Spring Boot OTP (One-Time Password) authentication system integrated with Infinireach SMS Gateway. The project demonstrates Java MVC architecture with PostgreSQL database.

## Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **SMS Gateway**: Infinireach API

## Key Features Implemented

1. ✅ JPA Entity (`PhoneAuthentication.java`) with timestamp tracking
2. ✅ Repository Layer (`OTPRepository.java`) with custom queries
3. ✅ Service Layer (`OTPService.java`) with:
   - Secure OTP generation using `SecureRandom`
   - PostgreSQL persistence with 5-minute expiration
   - Infinireach SMS Gateway integration using Java 11+ `HttpClient`
   - OTP verification with timestamp validation
4. ✅ REST Controller (`AuthController.java`) with:
   - POST `/api/auth/send-otp` endpoint
   - POST `/api/auth/verify-otp` endpoint
   - GET `/api/auth/health` health check
5. ✅ DTOs for request/response handling
6. ✅ Comprehensive logging and error handling

## Configuration Required

Before running the application, update `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/otp_auth_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD_HERE

# Infinireach SMS Gateway
infinireach.api.endpoint=https://api.infinireach.io/api/v1/messages
infinireach.api.token=YOUR_INFINIREACH_API_KEY_HERE
infinireach.api.content-type=application/json
```

## Running the Application

1. Create PostgreSQL database:
   ```bash
   createdb otp_auth_db
   ```

2. Build and run:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

3. Application starts on `http://localhost:8080`

## API Testing

### Send OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otpCode": "123456"}'
```

## Key Implementation Details

### OTP Timestamp Validation

The verify endpoint uses precise timestamp comparison:

```java
// If current time is BEFORE expiry time → OTP is VALID
if (LocalDateTime.now().isBefore(phoneAuth.getExpiryTime())) {
    // OTP is not expired
} else {
    // OTP has expired
}
```

### SMS Delivery

Uses Java 11+ standard `HttpClient` (no external library):

```java
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(infiniReachApiEndpoint))
    .header("Content-Type", "application/json")
    .header("X-API-Key", infiniReachApiToken)
    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
    .build();
```

## Project Structure

```
src/main/java/com/infinireach/otp/
├── OtpAuthenticationEngineApplication.java
├── controller/AuthController.java
├── service/OTPService.java
├── repository/OTPRepository.java
├── model/PhoneAuthentication.java
├── dto/{SendOTPRequest, VerifyOTPRequest, OTPResponse, SmsPayload}
└── util/OTPGenerator.java

src/main/resources/
├── application.properties
└── schema.sql
```

## Next Steps for Production

1. Add input validation (phone number format, OTP format)
2. Implement rate limiting to prevent brute force
3. Add authentication/authorization for API endpoints
4. Store API token in secure vault (e.g., environment variables or Vault)
5. Add comprehensive unit and integration tests
6. Add database migrations (Flyway or Liquibase)
7. Implement caching for performance optimization
8. Add monitoring and alerting (logs, metrics)
9. Use HTTPS in production
10. Add database encryption for sensitive fields

## Files and Responsibilities

| File | Purpose |
|------|---------|
| `pom.xml` | Maven dependencies and build configuration |
| `application.properties` | Spring Boot configuration |
| `OtpAuthenticationEngineApplication.java` | Application entry point |
| `AuthController.java` | REST API endpoints |
| `OTPService.java` | Business logic and SMS integration |
| `OTPRepository.java` | Database access layer |
| `PhoneAuthentication.java` | JPA entity model |
| `OTPGenerator.java` | Secure OTP generation utility |

## Troubleshooting

- **Database Connection Issues**: Verify PostgreSQL is running and credentials are correct
- **SMS Not Sending**: Check Infinireach API token and network connectivity
- **OTP Verification Fails**: Ensure OTP hasn't expired (5-minute window) and code matches exactly

## Documentation

Full documentation is available in `README.md`.
