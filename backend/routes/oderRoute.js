import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import auth from '../middleware/auth.js'

import {
  placeOrdder,
  placeOrdderStripe,
  placeOrdderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  revenueOrders
} from '../controllers/orderController.js'

const router = express.Router()

// ── USER ─────────────────────────────────────────

// Place order (COD)
router.post('/place', auth, placeOrdder)

// Stripe (future)
router.post('/stripe', auth, placeOrdderStripe)

// Razorpay (future)
router.post('/razorpay', auth, placeOrdderRazorpay)

// Get user orders
router.post('/userorders', auth, userOrders)


// ── ADMIN ───────────────────────────────────────

// Get all orders
router.get('/list', adminAuth, allOrders)

// Update order status (including return/refund)
router.post('/status', adminAuth, updateStatus)

// 🔥 Revenue & Profit API (FIX BUG)
router.get('/revenue', adminAuth, revenueOrders)


export default router