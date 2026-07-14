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
* Business Process
* Use Case
* Class Diagram
* Sequence Diagram
* ERD Diagram
* DFD Diagram
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
# Business Process
Purchase Process
<img width="904" height="242" alt="image" src="https://github.com/user-attachments/assets/e66b049a-5904-448e-af66-8c4a4b6a2131" />

Review Process
<img width="904" height="279" alt="image" src="https://github.com/user-attachments/assets/db18ca02-4fdf-4138-9a20-c761572aac5a" />

Return Process
<img width="904" height="266" alt="image" src="https://github.com/user-attachments/assets/1985a5b6-db66-4a76-b031-91267bc66d28" />

Discount Management Process
<img width="904" height="302" alt="image" src="https://github.com/user-attachments/assets/f65946ed-d68c-48c8-a5ec-f2f9c56c123f" />

# Use Case
<img width="427" height="583" alt="image" src="https://github.com/user-attachments/assets/7236a484-811f-4a69-bbaa-86d855337544" />

<img width="453" height="436" alt="image" src="https://github.com/user-attachments/assets/89492302-8018-4ef7-bcae-6caa02ad8e85" />

# Class Diagram
<img width="467" height="603" alt="image" src="https://github.com/user-attachments/assets/d85bdcd3-062a-409d-87c8-7cee160449bc" />

# Sequence Diagram
Purchase Process

<img width="824" height="900" alt="image" src="https://github.com/user-attachments/assets/642a84ae-332c-4b7e-82ad-564ab4b17955" />

Review Process

<img width="806" height="874" alt="image" src="https://github.com/user-attachments/assets/f79b6429-1ffe-4f14-9028-7983a2dc2367" />

Return Process

<img width="673" height="753" alt="image" src="https://github.com/user-attachments/assets/51a14a2d-37c6-4c95-8d12-ed3d05a5c462" />

Discount Management Process

<img width="640" height="723" alt="image" src="https://github.com/user-attachments/assets/60af7eb7-2c46-490a-9f9d-b4a1c0780a5e" />

# ERD Diagram
<img width="465" height="692" alt="image" src="https://github.com/user-attachments/assets/376db331-9254-49b7-9315-f6fb991562da" />

# DFD Diagram
DFD level 0

<img width="599" height="193" alt="image" src="https://github.com/user-attachments/assets/eacd5f92-8efa-42a2-8bad-0114591ec98f" />

DFD level 1

<img width="749" height="223" alt="image" src="https://github.com/user-attachments/assets/d5c1e632-2e55-4331-b025-3cea373909af" />

**---
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
