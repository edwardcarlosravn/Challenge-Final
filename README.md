# T-Shirts Store API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">REST API for a t-shirts store developed with NestJS, GraphQL, Prisma and PostgreSQL</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version" /></a>
</p>

## Description

Complete REST API for a t-shirts store that includes user management, products, categories, shopping cart, orders, favorites, Stripe payments and email notifications. The project implements JWT authentication, role-based authorization, OTP validation and multiple design patterns.

## Technologies Used

- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **GraphQL**: Apollo Server
- **Authentication**: JWT, Passport.js
- **Payments**: Stripe Integration
- **Email**: Nodemailer
- **Validation**: class-validator, class-transformer
- **Documentation**: Auto-generated with GraphQL Playground

## Architecture

- **Clean Architecture** with layer separation
- **CQRS Pattern** for complex operations
- **Repository Pattern** for data access
- **Use Cases** for business logic
- **DTOs** for validation and data transformation

## Installation and Configuration

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm or yarn

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tshirts_store"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRATION="15m"
REFRESH_JWT_SECRET="your-refresh-jwt-secret"
REFRESH_JWT_EXPIRATION="7d"
JWT_RESET_SECRET="your-reset-jwt-secret"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Application
PORT=3000
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
RESET_PASSWORD_URL="http://localhost:3000/reset-password"
```

## Project setup

```bash
$ npm install
```

## Database setup

```bash
# Generate Prisma client
$ npx prisma generate

# Run database migrations
$ npx prisma migrate deploy

# Seed the database (optional)
$ npx prisma db seed
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

---

## 📚 API Documentation

This project provides two types of APIs:

### 🌐 REST API
Complete documentation of REST endpoints for authentication, user management, payments, and email services.

**[📖 View REST API Documentation](./documents/rest.README.md)**

### 🚀 GraphQL API
Complete documentation of GraphQL queries and mutations for products, orders, shopping cart, and favorites.

**[📖 View GraphQL API Documentation](./documents/graphql.README.md)**

---

## 🛡️ Security

### JWT Authentication
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Reset Token**: Valid for 15 minutes

### Rate Limiting
- **General authentication**: 10 requests/minute
- **Reset password**: 1 request/second, 3 requests/5 minutes
- **Forgot password**: 3 requests/5 minutes

### User Roles
- **CLIENT**: Normal users, can make purchases
- **EDITOR**: Can manage products and categories
- **ADMIN**: Full system access

### OTP Validation
- 6-digit codes
- Valid for 5 minutes
- Hashed with bcrypt

---

## 🗃️ Database

### Main Models
- **User**: System users
- **Product**: Products (t-shirts)
- **Category**: Product categories
- **Order**: Purchase orders
- **Payment**: Processed payments
- **ShoppingCart**: Shopping cart
- **Favorite**: Favorite products
- **OTP**: Verification codes

---

## 👨‍💻 Author

**Edward Huayllasco Carlos**

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Node.js Framework
- [Prisma](https://prisma.io/) - Modern ORM for TypeScript
- [Stripe](https://stripe.com/) - Payment Platform
- [Apollo GraphQL](https://www.apollographql.com/) - GraphQL Platform