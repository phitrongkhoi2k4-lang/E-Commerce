import orderModel   from '../models/orderModel.js'
import productModel from '../models/productModel.js'

// ── Restore stock theo item ─────────────────────────────
const restoreStock = async (items) => {
    for (const item of items) {
        const product = await productModel.findById(item._id)
        if (!product) continue

        const qty  = item.quantity || 1
        const size = item.size

        const update = { $inc: { quantity: qty } }

        if (product.sizeQuantities && product.sizeQuantities.size > 0) {
            const current = Number(product.sizeQuantities.get(size) ?? 0)
            update.$set = {
                [`sizeQuantities.${size}`]: current + qty
            }
        }

        await productModel.findByIdAndUpdate(item._id, update)
    }
}

// ── Tính refund theo item ───────────────────────────────
const calculateRefund = (order, returnItems) => {
    let refund = 0

    for (const rItem of returnItems) {
        const match = order.items.find(
            i => i._id === rItem._id && i.size === rItem.size
        )

        if (!match) continue

        const pricePerItem = order.amount / order.items.reduce((s, i) => s + i.quantity, 0)

        refund += pricePerItem * (rItem.quantity || 1)
    }

    return Number(refund.toFixed(2))
}

// ── QUICK RETURN (ADMIN + PARTIAL SUPPORT) ──────────────
const quickReturn = async (req, res) => {
    try {
        const { orderId, returnItems } = req.body

        const order = await orderModel.findById(orderId)
        if (!order) return res.json({ success: false, message: 'Order not found' })

        if (order.returnStatus === 'completed') {
            return res.json({ success: false, message: 'Already returned' })
        }

        // 🔥 nếu không chọn item → return full
        const itemsToReturn = (returnItems && returnItems.length > 0)
            ? returnItems
            : order.items

        // ── 1. Restore stock đúng item ─────────
        await restoreStock(itemsToReturn)

        // ── 2. Tính refund đúng item ───────────
        const refundAmount = calculateRefund(order, itemsToReturn)

        // ── 3. Update order ────────────────────
        await orderModel.findByIdAndUpdate(orderId, {
            $set: {
                returnStatus: 'completed',
                refundAmount,
                returnDate: Date.now(),
                returnItems: itemsToReturn
            }
        })

        res.json({
            success: true,
            message: 'Return completed',
            refundAmount
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── REQUEST RETURN (USER) ───────────────────────────────
const requestReturn = async (req, res) => {
    try {
        const { orderId, reason, returnItems } = req.body
        const userId = req.userId

        const order = await orderModel.findById(orderId)
        if (!order) return res.json({ success: false, message: 'Order not found' })

        if (order.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized' })
        }

        if (order.status !== 'Delivered') {
            return res.json({ success: false, message: 'Only delivered orders can be returned' })
        }

        if (order.returnStatus !== 'none') {
            return res.json({ success: false, message: 'Already requested' })
        }

        await orderModel.findByIdAndUpdate(orderId, {
            returnRequested: true,
            returnReason: reason,
            returnStatus: 'pending',
            returnDate: Date.now(),
            returnItems: returnItems || []
        })

        res.json({ success: true, message: 'Return requested' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ── ADMIN FLOW (APPROVED / COMPLETED) ───────────────────
const updateReturnStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body

        const order = await orderModel.findById(orderId)
        if (!order) return res.json({ success: false, message: 'Order not found' })

        if (status === 'completed') {

            const itemsToReturn = order.returnItems?.length
                ? order.returnItems
                : order.items

            await restoreStock(itemsToReturn)

            const refundAmount = calculateRefund(order, itemsToReturn)

            await orderModel.findByIdAndUpdate(orderId, {
                $set: {
                    returnStatus: 'completed',
                    refundAmount,
                    returnDate: Date.now()
                }
            })

        } else {
            await orderModel.findByIdAndUpdate(orderId, {
                returnStatus: status
            })
        }

        res.json({ success: true, message: `Return ${status}` })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ── GET RETURNS ─────────────────────────────────────────
const getAllReturnRequests = async (req, res) => {
    try {
        const orders = await orderModel.find({
            $or: [
                { returnRequested: true },
                { returnStatus: { $in: ['pending', 'approved', 'rejected', 'completed'] } }
            ]
        })

        res.json({ success: true, orders })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export {
    quickReturn,
    requestReturn,
    updateReturnStatus,
    getAllReturnRequests
}
