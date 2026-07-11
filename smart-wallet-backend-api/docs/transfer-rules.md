# Money Transfer Role Rules

This document describes the allowed and forbidden transfer flows for the backend money transfer API.

## Roles
- `admin`
- `agent_manager`
- `agent`
- `customer`

## Allowed transfer flows
| Sender | Receiver | Route | Transaction type |
|---|---|---|---|
| customer | customer | `POST /api/transfers/customer` | `customer_to_customer` |
| customer | agent | `POST /api/transfers/customer` | `customer_to_agent` |
| agent | customer | `POST /api/transfers/agent` | `agent_to_customer` |
| agent | agent_manager | `POST /api/transfers/agent` | `agent_to_agent_manager` |
| agent_manager | agent | `POST /api/transfers/manager` | `manager_to_agent` |
| agent_manager | admin | `POST /api/transfers/manager` | `manager_to_admin` |
| admin | agent_manager | `POST /api/transfers/admin` | `admin_to_agent_manager` |

## Forbidden transfer flows
| Sender | Receiver | Reason |
|---|---|---|
| admin | customer | Admin may only send to `agent_manager` |
| customer | admin | Customer may only send to `customer` or `agent` |
| admin | agent | Admin may only send to `agent_manager` |
| agent | admin | Agent may only send to `customer` or `agent_manager` |
| agent_manager | customer | Agent manager may only send to `agent` or `admin` |
| customer | agent_manager | Customer may only send to `customer` or `agent` |

## Endpoint authorization
- `POST /api/transfers/admin` requires `auth:sanctum` and `ensure.admin`
- `POST /api/transfers/manager` requires `auth:sanctum` and `ensure.agent_manager`
- `POST /api/transfers/agent` requires `auth:sanctum` and `ensure.agent`
- `POST /api/transfers/customer` requires `auth:sanctum`

## Receiver resolution
A transfer may resolve the receiver by one of:
- `qr_id`
- `receiver_user_id`
- `receiver_phone`
- `receiver_wallet_number`

If `qr_id` is provided, the transfer uses the QR code owner as receiver.
Otherwise, the backend resolves the receiver from wallet number or phone number.

## PIN validation
All transfer routes require a valid PIN attached in `pin`:
- `pin` must be a 4-digit string
- the backend verifies the PIN against the `pins` table prior to executing the transfer

## Transfer rules enforcement
The API validates role combinations in `MoneyTransferController::determineTransferType()`.
If a role combination is not allowed, the API returns a `422` response with a clear message.

## Special creation rules
- `manager_to_agent`: receiver must be an agent created by the sending manager.
- `agent_to_agent`: receiver must be an agent created by the sending agent.

These are enforced in `MoneyTransferController::validateCreatedRecipient()`.
