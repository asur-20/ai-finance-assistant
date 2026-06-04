# AI Finance Assistant

An AI-powered finance analytics assistant built using Mastra, PostgreSQL, Groq, Express, and TypeScript.

## Features

* Spending analytics
* Monthly spending trends
* Category comparisons
* Merchant normalization
* Recurring subscription detection
* Refund-aware net spending
* Portfolio valuation
* Investment returns calculation
* Grounded AI responses using PostgreSQL

---

## Tech Stack

* TypeScript
* Node.js
* PostgreSQL
* Mastra
* Groq API
* Express.js

---

## Project Architecture

User → API → Finance Agent → SQL Tools → PostgreSQL → Grounded Response

---

## API Endpoint

### POST /ask

Request:

```json
{
  "question": "What is my portfolio value?"
}
```

Response:

```json
{
  "answer": "Total portfolio value is ₹119983.81"
}
```

---

## Example Queries

* What was my biggest expense?
* Compare food and travel spending
* Show recurring subscriptions
* What is my portfolio value?
* What are my portfolio returns?
* Show top merchants

---

## Setup Instructions

### Install dependencies

```bash
npm install
```

### Configure environment

Create `.env`

```env
DATABASE_URL=your_postgres_url
GROQ_API_KEY=your_groq_key
```

### Start server

```bash
npx tsx src/mastra/server.ts
```

---

## Database

PostgreSQL stores:

* transactions
* holdings
* fund NAV data
* merchant analytics

---

## Key Finance Intelligence

### Merchant Normalization

Handles noisy merchants like:

* SWIGGY*ORDER
* Swiggy Instamart
* SWIGGY BANGALORE

as a single merchant entity.

### Refund-aware Spending

Net spending calculations include refunds and reversals.

### Portfolio Analytics

Calculates:

* latest NAV
* current portfolio value
* total investment returns

---
## Screenshots

### PostgreSQL Database

![Database](screenshots/db-tables.png)

---

### API Response

![API](screenshots/api-response.png)

---

### Recurring Subscription Detection

![Subscriptions](screenshots/subscriptions.png)

---

### Portfolio Returns

![Portfolio](screenshots/portfolio-returns.png)
