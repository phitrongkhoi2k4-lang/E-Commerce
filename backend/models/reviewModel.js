import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    userId:    { type: String, required: true },
    userName:  { type: String },

    rating:  { type: Number, required: true },
    comment: { type: String, required: true },

    images: { type: Array, default: [] },
    videos: { type: Array, default: [] },

    date: { type: Number },

    // 🔥 NEW: Admin reply
    adminReply: {
        message: String,
        date: Number
    }

})

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema)
export default reviewModel