import express from 'express'
import auth from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'
import upload from '../middleware/multer.js'

import {
  addReview,
  getProductReviews,
  getAllReviews,
  replyReview,
  deleteReview,
  checkReviewed
} from '../controllers/reviewController.js'

const router = express.Router()

// ── USER ───────────────────────────────

// 🔥 BẮT BUỘC có multer
router.post(
  '/add',
  auth,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 }
  ]),
  addReview
)

router.get('/all', adminAuth, getAllReviews)
router.post('/reply', adminAuth, replyReview)
router.post('/delete', adminAuth, deleteReview)
router.post('/checked/:productId', auth, checkReviewed)
router.get('/product/:productId', getProductReviews)
router.get('/:productId', getProductReviews)

export default router
