import reviewModel from '../models/reviewModel.js'
import userModel   from '../models/userModel.js'
import productModel from '../models/productModel.js'
import { v2 as cloudinary } from 'cloudinary'

// ─────────────────────────────────────────────
// ADD REVIEW
// ─────────────────────────────────────────────
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body
        const userId = req.userId   // 🔥 FIX

        if (!productId || !rating || !comment) {
            return res.json({
                success: false,
                message: 'Missing fields'
            })
        }

        if (!comment.trim()) {
            return res.json({
                success: false,
                message: 'Comment empty'
            })
        }

        // Check already reviewed
        const existing = await reviewModel.findOne({ productId, userId })
        if (existing) {
            return res.json({
                success: false,
                message: 'Already reviewed'
            })
        }

        const user = await userModel.findById(userId)

        const imageFiles = req.files?.images || []
        const videoFiles = req.files?.videos || []

        // Upload images
        const imageURLs = await Promise.all(
            imageFiles.slice(0, 5).map(file =>
                cloudinary.uploader.upload(file.path, {
                    folder: 'reviews'
                }).then(r => r.secure_url)
            )
        )

        // Upload videos
        const videoURLs = await Promise.all(
            videoFiles.slice(0, 2).map(file =>
                cloudinary.uploader.upload(file.path, {
                    resource_type: 'video',
                    folder: 'reviews'
                }).then(r => r.secure_url)
            )
        )

        await reviewModel.create({
            productId,
            userId,
            userName: user?.name || 'User',
            rating: Number(rating),
            comment: comment.trim(),
            images: imageURLs,
            videos: videoURLs,
            adminReply: null,
            date: Date.now()
        })

        res.json({ success: true })

    } catch (err) {
        console.log(err)
        res.json({ success: false, message: err.message })
    }
}


// ─────────────────────────────────────────────
// GET PRODUCT REVIEWS
// ─────────────────────────────────────────────
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params

        const reviews = await reviewModel
            .find({ productId })
            .sort({ date: -1 })

        res.json({ success: true, reviews })

    } catch (err) {
        res.json({ success: false })
    }
}


// ─────────────────────────────────────────────
// CHECK REVIEW
// ─────────────────────────────────────────────
const checkReviewed = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.userId

        const review = await reviewModel.findOne({ productId, userId })

        res.json({
            success: true,
            reviewed: !!review
        })

    } catch (err) {
        res.json({ success: false, reviewed: false })
    }
}


// ─────────────────────────────────────────────
// ADMIN: GET ALL
// ─────────────────────────────────────────────
const getAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel
            .find({})
            .sort({ date: -1 })

        const productIds = [...new Set(reviews.map(review => review.productId).filter(Boolean))]
        const products = await productModel.find(
            { _id: { $in: productIds } },
            { name: 1, image: 1 }
        )

        const productMap = new Map(
            products.map(product => [
                product._id.toString(),
                {
                    name: product.name,
                    image: Array.isArray(product.image) ? product.image[0] : ''
                }
            ])
        )

        const reviewsWithProducts = reviews.map(review => {
            const product = productMap.get(review.productId) || null
            return {
                ...review.toObject(),
                product
            }
        })

        res.json({ success: true, reviews: reviewsWithProducts })

    } catch (err) {
        res.json({ success: false })
    }
}


// ─────────────────────────────────────────────
// ADMIN: REPLY
// ─────────────────────────────────────────────
const replyReview = async (req, res) => {
    try {
        const { reviewId, message } = req.body

        if (!message?.trim()) {
            return res.json({ success: false, message: 'Reply empty' })
        }

        await reviewModel.findByIdAndUpdate(reviewId, {
            adminReply: {
                message: message.trim(),
                date: Date.now()
            }
        })

        res.json({ success: true })

    } catch (err) {
        res.json({ success: false })
    }
}


// ─────────────────────────────────────────────
// ADMIN: DELETE
// ─────────────────────────────────────────────
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.body

        await reviewModel.findByIdAndDelete(reviewId)

        res.json({ success: true })

    } catch (err) {
        res.json({ success: false })
    }
}


export {
    addReview,
    getProductReviews,
    checkReviewed,
    getAllReviews,
    replyReview,
    deleteReview
}
