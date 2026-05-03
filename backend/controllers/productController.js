import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js";
import orderModel   from "../models/orderModel.js";

// ── Helper: sum all size quantities ──────────────────────────────────────────
const sumSizeQty = (sizeQtyObj) =>
    Object.values(sizeQtyObj || {}).reduce((s, n) => s + Number(n || 0), 0)

// ── Helper: parse & validate discount fields ──────────────────────────────────
const parseDiscountFields = ({ discountPrice, discountStartDate, discountEndDate, sellingPrice, price }) => {
    const basePrice = Number(sellingPrice) || Number(price) || 0
    const parsed    = discountPrice === '' || discountPrice === undefined || discountPrice === null
        ? null
        : Number(discountPrice)

    // datetime-local strings (e.g. "2026-04-27T09:30") have no timezone info.
    // Browsers send them in LOCAL time but Date.parse treats them as LOCAL too,
    // so just use Date.parse directly — no UTC conversion needed.
    const start = discountStartDate ? Date.parse(discountStartDate) : null
    const end   = discountEndDate   ? Date.parse(discountEndDate)   : null

    const valid = parsed !== null && !Number.isNaN(parsed) &&
        parsed >= 0 && parsed < basePrice &&
        start && end && start < end

    return {
        discountPrice:     valid ? parsed : null,
        discountStartDate: valid ? start  : null,
        discountEndDate:   valid ? end    : null,
    }
}

// ── Add product ───────────────────────────────────────────────────────────────
const addProduct = async (req, res) => {
    try {
        const {
            name, description, price, category, subCategory,
            sizes, bestseller, quantity,
            costPrice, sellingPrice,
            sizeQuantities  // ← NEW: JSON string of { S: 10, M: 5, ... }
        } = req.body

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];
        const images = [image1, image2, image3, image4].filter(i => i !== undefined)

        const imagesURL = await Promise.all(
            images.map(async item => {
                const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                return result.secure_url
            })
        )

        // Parse sizeQuantities from JSON string
        let parsedSizeQty = {}
        try { parsedSizeQty = sizeQuantities ? JSON.parse(sizeQuantities) : {} } catch {}

        // Total quantity = sum of all sizes (or fallback to legacy quantity field)
        const totalQty = Object.keys(parsedSizeQty).length > 0
            ? sumSizeQty(parsedSizeQty)
            : Number(quantity) || 0

        const productData = {
            name,
            description,
            category,
            subCategory,
            bestseller:      bestseller === "true",
            sizes:           JSON.parse(sizes),
            image:           imagesURL,
            date:            Date.now(),
            quantity:        totalQty,
            costPrice:       Number(costPrice)    || 0,
            sellingPrice:    Number(sellingPrice) || 0,
            price:           Number(sellingPrice) || Number(price) || 0,
            sizeQuantities:  parsedSizeQty,       // ← NEW
        }

        const product = new productModel(productData)
        await product.save()
        res.json({ success: true, message: "Product Added" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── List products ─────────────────────────────────────────────────────────────
const listProduct = async (req, res) => {
    try {
        const products = await productModel.find({})
        res.json({ success: true, products })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Remove product ────────────────────────────────────────────────────────────
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Product Removed" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Single product ────────────────────────────────────────────────────────────
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Update product ────────────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const {
            id, name, category, subCategory, price,
            quantity, bestseller, costPrice, sellingPrice,
            discountPrice, discountStartDate, discountEndDate,
            sizeQuantities
        } = req.body

        // Parse sizeQuantities
        let parsedSizeQty = {}
        try { parsedSizeQty = sizeQuantities ? JSON.parse(sizeQuantities) : {} } catch {}

        // Recompute total quantity from sizes if provided
        const totalQty = Object.keys(parsedSizeQty).length > 0
            ? sumSizeQty(parsedSizeQty)
            : Number(quantity)

        const parsedDiscount = parseDiscountFields({
            discountPrice, discountStartDate, discountEndDate, sellingPrice, price
        })

        const updateData = {
            name,
            category,
            subCategory,
            quantity:          totalQty,
            bestseller:        bestseller === 'true',
            costPrice:         Number(costPrice)    || 0,
            sellingPrice:      Number(sellingPrice) || 0,
            price:             Number(sellingPrice) || Number(price) || 0,
            discountPrice:     parsedDiscount.discountPrice,
            discountStartDate: parsedDiscount.discountStartDate,
            discountEndDate:   parsedDiscount.discountEndDate,
            sizeQuantities:    parsedSizeQty,
        }

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' })
            const existing = await productModel.findById(id)
            const updatedImages = [...(existing.image || [])]
            updatedImages[0] = result.secure_url
            updateData.image = updatedImages
        }

        // Use $set explicitly so null values (cleared discounts) overwrite existing ones
        await productModel.findByIdAndUpdate(id, { $set: updateData })
        res.json({ success: true, message: 'Product Updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── Revenue endpoint ──────────────────────────────────────────────────────────
const getRevenue = async (req, res) => {
    try {
        // Fetch all fields needed — no projection restriction so refundAmount always comes through
        const orders   = await orderModel.find({}).lean()   // lean() returns plain JS objects
        const products = await productModel.find({}, { _id: 1, costPrice: 1, sellingPrice: 1, price: 1 })
        const productMap = {}
        products.forEach(p => {
            productMap[p._id.toString()] = {
                costPrice:    p.costPrice    || 0,
                sellingPrice: p.sellingPrice || p.price || 0,
            }
        })

        const enrichedOrders = []

        orders.forEach(order => {
            // Calculate gross profit for this order
            let orderProfit = 0
            ;(order.items || []).forEach(item => {
                const prod = productMap[item._id?.toString()] || {}
                const sp   = prod.sellingPrice || item.price || 0
                const cp   = prod.costPrice    || 0
                orderProfit += (sp - cp) * (item.quantity || 1)
            })

            // lean() gives plain objects — access fields directly
            const returnStatus = order.returnStatus || ''
            const refundAmount = order.refundAmount || 0
            const isRefunded   = returnStatus === 'approved'
            const refund       = isRefunded
                ? (refundAmount > 0 ? refundAmount : order.amount)
                : 0
            const raw          = order   // alias for consistency below

            // Original sale row
            enrichedOrders.push({
                _id:          raw._id,
                amount:       raw.amount,
                date:         raw.date,
                status:       raw.status,
                profit:       parseFloat(orderProfit.toFixed(2)),
                isRefund:     false,
                returnStatus: returnStatus || 'none',
            })

            // Refund row — only when approved
            if (isRefunded) {
                enrichedOrders.push({
                    _id:          String(raw._id) + '_refund',
                    amount:       -refund,
                    date:         raw.returnDate || raw.date,
                    status:       'Refunded',
                    profit:       -parseFloat(orderProfit.toFixed(2)),
                    isRefund:     true,
                    returnStatus: 'approved',
                })
            }
        })

        res.json({ success: true, orders: enrichedOrders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProduct, addProduct, removeProduct, singleProduct, updateProduct, getRevenue }