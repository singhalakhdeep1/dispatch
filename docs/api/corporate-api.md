# Corporate Accounts API

## Overview
B2B corporate account management for company lunch programs and business orders.

## Endpoints

### Corporate Account Management
- `POST /v1/corporate/accounts` - Create corporate account
- `GET /v1/corporate/accounts/:id` - Get corporate account details
- `PATCH /v1/corporate/accounts/:id` - Update corporate account
- `GET /v1/corporate/accounts/:id/employees` - Get employees
- `POST /v1/corporate/accounts/:accountId/employees` - Add employee
- `PATCH /v1/corporate/employees/:id` - Update employee
- `DELETE /v1/corporate/employees/:id` - Remove employee
- `GET /v1/corporate/accounts/:id/orders` - Get corporate orders
- `POST /v1/corporate/orders/:orderId/approve` - Approve corporate order
- `POST /v1/corporate/orders/:orderId/reject` - Reject corporate order
- `GET /v1/corporate/accounts/:id/billing` - Get billing summary

## Features
- Corporate account registration and management
- Employee management with spending limits
- Order approval workflow
- Credit limit management
- Billing and utilization tracking
- Department-based organization
- Order history and reporting