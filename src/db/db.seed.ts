//to upload this data in db : npx tsx src/db/db.seed.ts 
// To upload this data in DB: npx tsx src/db/db.seed.ts

import { db } from './db';
import { productsTable, salesTable } from './schema';

export async function seed() {
  console.log('🌱 Seeding database...');

  // Insert products (8 original + 10 new)
  await db.insert(productsTable).values([
    { name: 'Laptop', category: 'Electronics', price: 999.99, stock: 50 },
    { name: 'Mouse', category: 'Electronics', price: 25.99, stock: 200 },
    { name: 'Keyboard', category: 'Electronics', price: 75.0, stock: 150 },
    { name: 'Monitor', category: 'Electronics', price: 299.99, stock: 75 },
    { name: 'Desk Chair', category: 'Furniture', price: 199.99, stock: 40 },
    { name: 'Desk', category: 'Furniture', price: 399.99, stock: 30 },
    { name: 'Notebook', category: 'Stationery', price: 5.99, stock: 500 },
    { name: 'Pen Set', category: 'Stationery', price: 12.99, stock: 300 },

    // 🔹 New products
    { name: 'Smartphone', category: 'Electronics', price: 799.99, stock: 60 },
    { name: 'Headphones', category: 'Electronics', price: 149.99, stock: 120 },
    { name: 'Office Lamp', category: 'Furniture', price: 89.99, stock: 45 },
    { name: 'Bookshelf', category: 'Furniture', price: 249.99, stock: 25 },
    { name: 'Backpack', category: 'Accessories', price: 59.99, stock: 180 },
    { name: 'Water Bottle', category: 'Accessories', price: 19.99, stock: 350 },
    { name: 'Sticky Notes', category: 'Stationery', price: 3.49, stock: 600 },
    { name: 'Printer', category: 'Electronics', price: 199.99, stock: 35 },
    { name: 'Smartwatch', category: 'Electronics', price: 299.99, stock: 80 },
    { name: 'Desk Organizer', category: 'Accessories', price: 24.99, stock: 150 },
  ]);

  // Insert sales (11 original + 10 new)
  await db.insert(salesTable).values([
    { product_id: 1, quantity: 5, total_amount: 4999.95, customer_name: 'John Doe', region: 'North' },
    { product_id: 2, quantity: 10, total_amount: 259.9, customer_name: 'Jane Smith', region: 'East' },
    { product_id: 3, quantity: 3, total_amount: 225.0, customer_name: 'Mark Wilson', region: 'South' },
    { product_id: 4, quantity: 2, total_amount: 599.98, customer_name: 'Emily Johnson', region: 'West' },
    { product_id: 5, quantity: 1, total_amount: 199.99, customer_name: 'Michael Brown', region: 'North' },
    { product_id: 6, quantity: 4, total_amount: 1599.96, customer_name: 'Sarah Davis', region: 'East' },
    { product_id: 7, quantity: 20, total_amount: 119.8, customer_name: 'David Lee', region: 'South' },
    { product_id: 8, quantity: 15, total_amount: 194.85, customer_name: 'Emma White', region: 'West' },
    { product_id: 1, quantity: 1, total_amount: 999.99, customer_name: 'Chris Green', region: 'North' },
    { product_id: 3, quantity: 6, total_amount: 450.0, customer_name: 'Sophia Taylor', region: 'East' },
    { product_id: 2, quantity: 8, total_amount: 207.92, customer_name: 'James Hall', region: 'South' },

    // 🔹 New sales
    { product_id: 9, quantity: 2, total_amount: 1599.98, customer_name: 'Olivia Martin', region: 'West' },
    { product_id: 10, quantity: 5, total_amount: 749.95, customer_name: 'William King', region: 'North' },
    { product_id: 11, quantity: 3, total_amount: 269.97, customer_name: 'Ava Scott', region: 'East' },
    { product_id: 12, quantity: 1, total_amount: 249.99, customer_name: 'Daniel Harris', region: 'South' },
    { product_id: 13, quantity: 7, total_amount: 419.93, customer_name: 'Lily Brown', region: 'North' },
    { product_id: 14, quantity: 10, total_amount: 199.9, customer_name: 'Ethan Walker', region: 'East' },
    { product_id: 15, quantity: 25, total_amount: 87.25, customer_name: 'Charlotte Adams', region: 'West' },
    { product_id: 16, quantity: 2, total_amount: 399.98, customer_name: 'Lucas Clark', region: 'South' },
    { product_id: 17, quantity: 4, total_amount: 1199.96, customer_name: 'Amelia Lewis', region: 'North' },
    { product_id: 18, quantity: 6, total_amount: 149.94, customer_name: 'Benjamin Young', region: 'East' },
  ]);

  console.log('✅ Database seeded successfully!');
}

// Run seed automatically when this file is executed directly
seed();
