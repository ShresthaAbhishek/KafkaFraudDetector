# Fraud Detection System

## What This System Does
This project is a real-time fraud detection system designed to identify potentially fraudulent financial transactions. Built with Node.js, it leverages **Apache Kafka** for high-throughput message streaming and **Redis** for fast data caching. The system processes incoming transactions through a REST API, applies fraud detection rules, and generates alerts for suspicious activities. Key features include:
- **Transaction Processing**: Accepts user transactions (e.g., user ID, amount, currency, location) via an HTTP endpoint.
- **Fraud Detection**: Analyzes transactions for patterns like large amounts (> $10,000), high-frequency transactions (5 within 60 seconds), or unusual location changes.
- **Alert Generation**: Sends real-time fraud alerts to a Kafka topic, which can be logged or stored for further analysis.
- **Scalable Architecture**: Uses Docker Compose to orchestrate services, making it easy to deploy and scale.

This system is ideal for developers or organizations looking to implement or study real-time fraud detection in financial applications.

## Overview
The system consists of three main services:
1. **Transaction Service** (`transaction-service.js`): Accepts transaction data via a REST API, stores it in Redis, and sends it to a Kafka topic (`transactions`).
2. **Fraud Detection Service** (`fraud-detection-service.js`): Consumes transactions from Kafka, applies fraud detection rules, and sends alerts to a Kafka topic (`fraud-alerts`).
3. **Alert Service** (`alert-service.js`): Consumes fraud alerts from Kafka and logs them, optionally storing them in Redis.

The services are orchestrated using Docker Compose, with Kafka and Redis running as dependencies.

## Table of Contents
- [What This System Does](#what-this-system-does)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Testing the API](#testing-the-api)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites
Ensure you have the following installed:
- [Docker](https://www.docker.com/get-started) (with Docker Compose)
- [Node.js](https://nodejs.org/) (optional, for local development without Docker)
- [Git](https://git-scm.com/) (to clone the repository)
- A GitHub account and repository to push the code

## Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/ShresthaAbhishek/KafkaFraudDetector.git
   cd KafkaFraudDetector
   ```

2. **Ensure Project Files**
   Verify that the following files are present:
   - `transaction-service.js`
   - `fraud-detection-service.js`
   - `alert-service.js`
   - `docker-compose.yml`
   - `Dockerfile`
   - `package.json`
   - `package-lock.json`
   - `node_modules` (optional, will be installed via Docker if not present)

3. **Push to GitHub**
   If you haven't already, initialize a Git repository and push the code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of fraud detection system"
   git remote add origin https://github.com/ShresthaAbhishek/KafkaFraudDetector.git
   git push -u origin main
   ```

   **Note**: You may want to add `node_modules` to a `.gitignore` file to avoid uploading it:
   ```bash
   echo "node_modules/" >> .gitignore
   git add .gitignore
   git commit -m "Add .gitignore for node_modules"
   git push origin main
   ```

## Running the Application
1. **Start the Services**
   Use Docker Compose to start Kafka, Redis, and the Node.js services:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the Node.js services using the `Dockerfile`.
   - Start Kafka (port `9094`), Kafka UI (port `8080`), and Redis (port `6379`).
   - Launch the transaction, fraud detection, and alert services.

2. **Verify Services**
   - **Kafka UI**: Open `http://localhost:8080` to view Kafka topics and messages.
   - **Transaction Service**: The API will be available at `http://localhost:3000`.
   - **Redis**: Accessible at `redis://:caremember@localhost:6379` (password: `caremember`).

3. **Stop the Services**
   To stop the services, press `Ctrl+C` in the terminal running Docker Compose, then clean up:
   ```bash
   docker-compose down
   ```

## Testing the API
The transaction service exposes a REST API endpoint to submit transactions.

1. **Send a Transaction**
   Use `curl` or a tool like Postman to send a POST request to `http://localhost:3000/api/v1/transactions`:
   ```bash
   curl -X POST http://localhost:3000/api/v1/transactions \
   -H "Content-Type: application/json" \
   -d '{
     "userId": "user123",
     "amount": 15000,
     "currency": "USD",
     "location": "New York"
   }'
   ```

   **Expected Response**:
   ```json
   {
     "transactionId": "<generated-uuid>"
   }
   ```

2. **Monitor Fraud Alerts**
   - Check the console logs of the `alert-service` container to see fraud alerts (e.g., for large transactions or unusual locations).
   - Use Kafka UI (`http://localhost:8080`) to inspect the `transactions` and `fraud-alerts` topics.

3. **Fraud Detection Rules**
   The fraud detection service triggers alerts based on:
   - **Large Transactions**: Amounts exceeding $10,000.
   - **High Frequency**: 5 transactions within 60 seconds.
   - **Unusual Location**: Transactions from a different location than the previous one.

## Project Structure
```
KafkaFraudDetector/
├── transaction-service.js     # Transaction API service
├── fraud-detection-service.js # Fraud detection logic
├── alert-service.js           # Fraud alert consumer
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker image for Node.js services
├── package.json               # Node.js dependencies
├── package-lock.json          # Dependency lock file
├── node_modules/              # Node.js modules (optional, ignored in .gitignore)
├── README.md                  # Documentation
├── .gitignore                 # Git ignore file
└── LICENSE                    # MIT License
```

## Environment Variables
The services use the following environment variables (set in `docker-compose.yml`):
- `KAFKA_BROKER`: Kafka broker address (default: `kafka:9092` in Docker, `localhost:9094` locally).
- `REDIS_URL`: Redis connection URL (default: `redis://:caremember@redis:6379`).

To override these, create a `.env` file in the project root:
```bash
KAFKA_BROKER=kafka:9092
REDIS_URL=redis://:caremember@redis:6379
```

## Troubleshooting
- **Kafka Connection Issues**: Ensure Kafka is running and accessible at the specified broker (`kafka:9092` in Docker). Check Kafka UI at `http://localhost:8080`.
- **Redis Connection Errors**: Verify the Redis password (`caremember`) and URL. Ensure the Redis container is running (`docker ps`).
- **Port Conflicts**: If ports `3000`, `6379`, `8080`, or `9094` are in use, stop conflicting services or modify `docker-compose.yml`.
- **Node.js Errors**: Ensure `node_modules` is installed or let Docker handle it via `npm install` in the `Dockerfile`.

To view logs for a specific service:
```bash
docker logs <container-name>
```
(e.g., `transaction-service`, `fraud-detection-service`, `alert-service`, `kafka`, or `redis`).
