# Shopify_FullStack_Trial
Integrating with Shopify APIs 
Handle event-driven backend logic (webhooks) 
Process and transform Shopify data
Customize a Shopify theme section

## Overview
- Backend: Node.js + Express + SQLite
- Frontend: Shopify theme section (Liquid + JS)
- Features: 
  - Fetch & store Shopify orders
  - Webhook for new orders
  - Low-stock report
  - AJAX Add-to-Cart in theme section

## Backend Setup
1. Navigate to backend folder:
cd backend

2. Install dependencies:

npm install


3. Add .env file with Shopify credentials:

SHOPIFY_STORE=your-store.myshopify.com
ADMIN_API_TOKEN=your-admin-api-token
WEBHOOK_SECRET=your-webhook-secret
PORT=3000


4. Run server:

npm start

## Endpoints

GET /fetch-orders → Fetch latest 20 orders from Shopify

GET /orders → Get orders from database

POST /webhook/orders/create → Webhook for new orders

GET /report/low-stock?threshold=5 → Low-stock report

## Frontend Setup

Copy featured-trial-product.liquid to your Shopify theme sections.

Go to Shopify Admin → Online Store → Themes → Customize

Add Featured Trial Product section and select a product.

Features:

Shows product title, price, first image

Add to Cart button with AJAX

Mobile-friendly
