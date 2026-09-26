from __future__ import annotations

import sqlite3
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DATABASE = Path(__file__).resolve().parent / "store.db"

app = Flask(__name__)
PUBLIC_DEMO = os.environ.get("PUBLIC_DEMO", "false").lower() == "true"

PRODUCTS = [
    ("weekender", "The Weekender", "Everyday", 899, "Moss green", "Bestseller", "photo-1588850561407-ed78c282e89b", "#d9dfcb"),
    ("field-day", "Field Day", "Sport", 1099, "Washed olive", "New", "photo-1521369909029-2afed882baee", "#e9d8c4"),
    ("slow-morning", "Slow Morning", "Everyday", 999, "Soft sand", "Easy favorite", "photo-1588850561407-ed78c282e89b", "#e7dfd2"),
    ("off-hours", "Off Hours", "Statement", 1199, "Deep navy", "Limited run", "photo-1523381210434-271e8be1f52b", "#d9dfe1"),
    ("sideline", "Sideline", "Sport", 949, "Classic blue", "Everyday sport", "photo-1521369909029-2afed882baee", "#dce3e2"),
    ("good-company", "Good Company", "Statement", 1299, "Burnt orange", "A little bold", "photo-1535713875002-d1d0cf377fde", "#ead8c8"),
]


def connect_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with connect_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
                price INTEGER NOT NULL, color TEXT NOT NULL, tag TEXT NOT NULL,
                image TEXT NOT NULL, background TEXT NOT NULL, available INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL,
                phone TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL,
                state TEXT NOT NULL, pincode TEXT NOT NULL, total INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL,
                product_id TEXT NOT NULL, product_name TEXT NOT NULL,
                unit_price INTEGER NOT NULL, quantity INTEGER NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            );
            """
        )
        db.executemany(
            "INSERT OR IGNORE INTO products (id,name,category,price,color,tag,image,background) VALUES (?,?,?,?,?,?,?,?)",
            PRODUCTS,
        )


# Initialize on import too, since production WSGI servers import this module.
initialize_database()


@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:filename>")
def frontend_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)


@app.get("/api/products")
def get_products():
    with connect_db() as db:
        rows = db.execute(
            "SELECT id,name,category,price,color,tag,image,background FROM products WHERE available=1 ORDER BY rowid"
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.get("/api/config")
def get_config():
    return jsonify(public_demo=PUBLIC_DEMO)


@app.post("/api/orders")
def create_order():
    if PUBLIC_DEMO:
        return jsonify(error="This public preview is not accepting orders yet."), 403
    data = request.get_json(silent=True) or {}
    required = ("name", "phone", "address", "city", "state", "pincode")
    customer = {key: str(data.get(key, "")).strip() for key in required}
    if any(not value for value in customer.values()):
        return jsonify(error="Please complete all delivery details."), 400
    if len(customer["phone"]) < 7 or len(customer["pincode"]) < 4:
        return jsonify(error="Please check the phone number and pincode."), 400

    items = data.get("items")
    if not isinstance(items, list) or not items:
        return jsonify(error="Your bag is empty."), 400
    quantities = {}
    for item in items:
        if not isinstance(item, dict):
            return jsonify(error="One of the items is invalid."), 400
        product_id, quantity = item.get("product_id"), item.get("quantity")
        if not isinstance(product_id, str) or not isinstance(quantity, int) or isinstance(quantity, bool) or not 1 <= quantity <= 99:
            return jsonify(error="One of the item quantities is invalid."), 400
        quantities[product_id] = quantities.get(product_id, 0) + quantity

    with connect_db() as db:
        products = {}
        for product_id in quantities:
            row = db.execute(
                "SELECT id,name,price FROM products WHERE id=? AND available=1", (product_id,)
            ).fetchone()
            if row is None:
                return jsonify(error="A product in your bag is no longer available."), 400
            products[product_id] = dict(row)
        total = sum(products[key]["price"] * qty for key, qty in quantities.items())
        cursor = db.execute(
            "INSERT INTO orders (customer_name,phone,address,city,state,pincode,total) VALUES (?,?,?,?,?,?,?)",
            (customer["name"], customer["phone"], customer["address"], customer["city"], customer["state"], customer["pincode"], total),
        )
        order_id = cursor.lastrowid
        db.executemany(
            "INSERT INTO order_items (order_id,product_id,product_name,unit_price,quantity) VALUES (?,?,?,?,?)",
            [(order_id, products[key]["id"], products[key]["name"], products[key]["price"], qty) for key, qty in quantities.items()],
        )
    return jsonify(order_id=order_id, total=total, message="Your order has been saved."), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)
