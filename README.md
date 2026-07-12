# E-Commerce App (MERN Stack)

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge\&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge\&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI-06B6D4?style=for-the-badge\&logo=tailwindcss)
![JWT](https://img.shields.io/badge/JWT-Authentication-black?style=for-the-badge\&logo=jsonwebtokens)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image-blue?style=for-the-badge\&logo=cloudinary)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge\&logo=socketdotio)

**A Full-Stack E-Commerce Web Application Built with the MERN Stack**

Customer Shopping • Admin Dashboard • Reviews • Live Chat • Revenue Analytics • Return Management

</div>

---

# Table of Contents

* About
* Features
* Tech Stack
* System Architecture
* Project Structure
* Installation
* Environment Variables
* Run Project

---

# About

This project is a full-stack E-Commerce web application developed using the **MERN Stack (MongoDB, Express.js, React.js and Node.js)**.

The application provides a complete online shopping experience for customers while offering administrators a powerful dashboard to manage products, orders, customers, reviews, returns and business analytics.

The project was developed as a graduation project to demonstrate practical knowledge of full-stack web development, RESTful APIs, authentication, database design and software engineering practices.

---

# Features

## Customer Features

* User Registration & Login
* JWT Authentication
* Browse Products
* Product Categories
* Product Search
* Product Filtering
* Product Sorting
* Product Details
* Related Products
* Shopping Cart
* Place Orders
* Order History
* Product Reviews
* Upload Review Images
* Upload Review Videos
* Dark / Light Mode
* English / Vietnamese Language
* Currency Conversion
* Live Chat with Admin

---

## Admin Features

* Secure Admin Login
* Dashboard
* Add Products
* Update Products
* Delete Products
* Product Inventory Management
* Bestseller Management
* Discount Management
* Order Management
* Revenue Dashboard
* Profit Dashboard
* Customer Reviews Management
* Return Request Management
* Live Customer Chat

---

## Revenue Dashboard

* Revenue by Date
* Revenue by Month
* Revenue by Quarter
* Revenue by Year
* Profit Calculation
* Refund Tracking
* Return Statistics

---

## Return Management

Customers can:

* Request Return
* Submit Return Reason

Administrators can:

* Approve Return
* Reject Return
* Complete Refund
* Restore Inventory Automatically

---

## Review System

Customers can:

* Rate Products
* Write Reviews
* Upload Images
* Upload Videos

Administrators can:

* View Reviews
* Manage Reviews

---

## Real-time Chat

* Customer Chat Widget
* Admin Chat Dashboard
* Socket.io Communication
* Real-time Messaging

---

# Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Axios
* React Router

---

## Backend

* Node.js
* Express.js
* JWT Authentication
* Multer
* Cloudinary
* Socket.io

---

## Database

* MongoDB
* Mongoose

---

## Development Tools

* Git
* GitHub
* VS Code
* Postman
* npm

---

# System Architecture

```text
                    Customer
                        │
                        ▼
                React Frontend
                        │
        REST API + Socket.io
                        │
                        ▼
             Node.js + Express
                        │
      ┌────────────┬──────────────┐
      ▼            ▼              ▼
 MongoDB      Cloudinary     JWT Auth
```

---

# Project Structure

```text
Ecommerce-app
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── admin
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── config
│   └── server.js
│
└── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/phitrongkhoi2k4-lang/E-Commerce.git
```

Move into the project folder

```bash
cd E-Commerce
```

Install dependencies

Backend

```bash
cd backend
npm install
```

Frontend

```bash
cd frontend
npm install
```

Admin

```bash
cd admin
npm install
```

---

# Environment Variables

Backend

```env
MONGODB_URI=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=
```

Frontend

```env
VITE_BACKEND_URL=http://localhost:5173
```

Admin

```env
VITE_BACKEND_URL=http://localhost:5174
```

---

# Run Project

### Backend

```bash
cd backend
npm run server
```

### Frontend

```bash
cd frontend
npm run dev
```

### Admin

```bash
cd admin
npm run dev
```
