# Digital Wallet Management System REST API

Enterprise-grade, secure Digital Wallet Management System built with Spring Boot 3.x and Java 21.

## Tech Stack
- **Java 21**
- **Spring Boot 3.x** (Spring Security, Data JPA)
- **PostgreSQL**
- **JWT** (Stateless Authentication)
- **Lombok**
- **OpenAPI 3** (Swagger UI)
- **Docker** (Multi-stage build)

## Core Features
- **Role-Based Access Control**: CUSTOMER, AGENT, ADMINISTRATOR.
- **Wallet Integrity**: Transactional balance modifications, optimistic locking, and DB constraints.
- **Idempotency**: Support for `X-Idempotency-Key` to prevent duplicate transactions.
- **Clean Architecture**: Modularized layers (Controller, Service, Repository, Entity).

## API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Register a new user and create a wallet.
- `POST /api/v1/auth/login`: Login and receive JWT token.

### Wallet
- `GET /api/v1/wallets/balance`: View current wallet balance.

### Transactions
- `POST /api/v1/transactions/transfer`: Transfer money to another wallet.
- `GET /api/v1/transactions/history`: View paginated transaction history.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Maven (optional, if running locally)

### Run with Docker Compose
```bash
docker-compose up --build
```

### API Documentation
Once the application is running, you can access the Swagger UI at:
`http://localhost:8080/swagger-ui.html`

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `DATABASE_USERNAME`: Database username.
- `DATABASE_PASSWORD`: Database password.
- `JWT_SECRET`: Secret key for JWT signing.
- `SMS_API_KEY`: API key for InfiniReach SMS (for OTP integration).
