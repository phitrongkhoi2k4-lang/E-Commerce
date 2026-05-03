import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId:        { type: String,  required: true },
    items:         { type: Array,   required: true },
    amount:        { type: Number,  required: true },
    address:       { type: Object,  required: true },
    status:        { type: String,  required: true, default: 'Order Placed' },
    paymentMethod: { type: String,  required: true },
    payment:       { type: Boolean, required: true, default: false },
    date:          { type: Number,  required: true },
    promoCode:     { type: String,  default: '' },
    discountAmount:{ type: Number,  default: 0 },

    // 🔥 NEW
    isReviewed: { type: Boolean, default: false },

    // ── Return ─────────────────────────
    returnRequested: { type: Boolean, default: false },
    returnReason:    { type: String,  default: '' },
    returnStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected', 'completed'],
        default: 'none'
    },
    returnDate:   { type: Number, default: null },
    returnItems:  { type: Array,  default: [] },
    refundAmount: { type: Number, default: 0 },
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)
export default orderModel
