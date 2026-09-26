# Cap Store

## Run the full app with Flask

The Flask app serves the storefront and the API from one address. This is needed for the browser to reach `/api/products` and `/api/orders`.

1. Open Terminal and go to this project folder:

   ```sh
   cd cap_store
   ```

2. (Recommended) Create and activate a virtual environment:

   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Flask and start the server:

   ```sh
   python3 -m pip install -r backend/requirements.txt
   python3 backend/app.py
   ```

4. Open **http://127.0.0.1:5000** in your browser. Keep the terminal running while you use the site; press **Ctrl+C** to stop it.

The app creates `backend/store.db` and seeds the product catalog the first time it starts. Products load from SQLite; placing a demo order saves the delivery details and order items to that database. No payment is collected.

## Publish a public preview

The repository includes a Render Blueprint in `render.yaml`. Sign in to Render, create a new Blueprint, connect `bkrish17/cap_store`, and deploy. Render will build the Flask web service and provide an `onrender.com` URL that can be shared. Future pushes to `main` deploy automatically.

The hosted preview sets `PUBLIC_DEMO=true`: visitors can browse and use the cart, but checkout is disabled so it does not collect customer names, phone numbers, or addresses. The free service may take about a minute to wake after 15 minutes without traffic, and its local SQLite file is temporary. Use a persistent database and review privacy, security, and order handling before accepting real orders.

## API routes

- `GET /api/products` — list available products
- `POST /api/orders` — create an order from delivery details and product quantities

Use Flask to run the app. VS Code Live Server serves static files only, so it cannot handle these API requests.
