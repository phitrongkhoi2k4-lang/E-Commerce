import express from 'express'
import {
  requestReturn,
  getAllReturnRequests,
  updateReturnStatus,
  quickReturn
} from '../controllers/returnController.js'

import authUser  from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const returnRouter = express.Router()

// Customer
returnRouter.post('/request', authUser, requestReturn)

// Admin
returnRouter.get('/admin', adminAuth, getAllReturnRequests)
returnRouter.post('/update', adminAuth, updateReturnStatus)

// 🔥 NEW: Quick return
returnRouter.post('/quick', adminAuth, quickReturn)

export default returnRouter