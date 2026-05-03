// backend/models/chatModel.js
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    sender:  { type: String, enum: ['customer', 'admin'], required: true },
    text:    { type: String, required: true },
    date:    { type: Number, default: Date.now },
})

const chatSchema = new mongoose.Schema({
    // userId from JWT — each customer gets one chat thread
    userId:   { type: String, required: true, unique: true },
    userName: { type: String, default: 'Customer' },
    messages: { type: [messageSchema], default: [] },
    // track unread count for admin
    unreadAdmin: { type: Number, default: 0 },
    updatedAt:   { type: Number, default: Date.now },
})

const chatModel = mongoose.models.chat || mongoose.model('chat', chatSchema)
export default chatModel