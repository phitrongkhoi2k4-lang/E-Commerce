import userModel from "../models/userModel.js"

// ── ADD TO CART ─────────────────────────
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size, quantity = 1 } = req.body  // ← accept quantity

        const userData = await userModel.findById(userId)
        if (!userData) return res.json({ success: false, message: "User not found" })

        let cartData = userData.cartData || {}
        if (!cartData[itemId]) cartData[itemId] = {}

        // Add the actual quantity, not always 1
        cartData[itemId][size] = (cartData[itemId][size] || 0) + Number(quantity)

        await userModel.findByIdAndUpdate(userId, { cartData })
        res.json({ success: true, message: "Added to cart" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── UPDATE CART ─────────────────────────
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, size, quantity } = req.body

        const userData = await userModel.findById(userId)
        if (!userData) return res.json({ success: false, message: "User not found" })

        let cartData = userData.cartData || {}
        if (!cartData[itemId]) cartData[itemId] = {}

        cartData[itemId][size] = quantity

        await userModel.findByIdAndUpdate(userId, { cartData })
        res.json({ success: true, message: "Cart updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ── GET USER CART ───────────────────────
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) return res.json({ success: false, message: "No userId" })

        const userData = await userModel.findById(userId)
        if (!userData) return res.json({ success: false, message: "User not found" })

        res.json({ success: true, cartData: userData.cartData || {} })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addToCart, updateCart, getUserCart }