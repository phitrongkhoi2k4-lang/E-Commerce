// frontend/src/context/ShopContext.jsx
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

export const ShopContext = createContext();

const PROMO_CODES = {
    SAVE10: { type: 'percentage', value: 10 },
    WELCOME15: { type: 'percentage', value: 15 },
};

const isDiscountActiveForProduct = (product) => {
    if (!product) return false;

    const now = Date.now();
    const start = Number(product.discountStartDate || 0);
    const end = Number(product.discountEndDate || 0);
    const discountPrice = Number(product.discountPrice);
    const regularPrice = Number(product.sellingPrice || product.price || 0);

    return Boolean(
        discountPrice >= 0 &&
        regularPrice > 0 &&
        discountPrice < regularPrice &&
        start &&
        end &&
        now >= start &&
        now <= end
    );
};

const ShopContextProvider = (props) => {

    const currency     = '$';
    const delivery_fee = 10;
    const backendUrl   = import.meta.env.VITE_BACKEND_URL
    console.log("BACKEND URL:", backendUrl);

    const [search,     setSearch]     = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems,  setCartItems]  = useState({});
    const [products,   setProducts]   = useState([]);
    const [token,      setToken]      = useState('')
    const [promoCode,  setPromoCode]  = useState(localStorage.getItem('promoCode') || '')
    const navigate = useNavigate()

    // ── addToCart — now accepts an optional quantity (default 1) ─────────────
    const addToCart = async (itemId, size, quantity = 1) => {

        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        // Out-of-stock guard using sizeQuantities if available
        const product = products.find(p => p._id === itemId)
        if (product) {
            const sizeQty = product.sizeQuantities
            if (sizeQty && Object.keys(sizeQty).length > 0) {
                const availableForSize = Number(sizeQty[size] ?? 0)
                if (availableForSize === 0) {
                    toast.error(`Size ${size} is out of stock`);
                    return;
                }
                // Check cart won't exceed available stock
                const alreadyInCart = cartItems[itemId]?.[size] || 0
                if (alreadyInCart + quantity > availableForSize) {
                    toast.error(`Only ${availableForSize} available for size ${size}`);
                    return;
                }
            } else if (product.quantity !== undefined && product.quantity === 0) {
                toast.error('This product is out of stock');
                return;
            }
        }

        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += quantity;   // ← add quantity not just 1
            } else {
                cartData[itemId][size] = quantity;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = quantity;
        }
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) totalCount += cartItems[items][item];
                } catch (error) { console.log(error) }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {
        // Cap at available stock for this size
        const product = products.find(p => p._id === itemId)
        if (product && quantity > 0) {
            const sizeQty = product.sizeQuantities
            if (sizeQty && Object.keys(sizeQty).length > 0) {
                const available = Number(sizeQty[size] ?? 0)
                if (quantity > available) {
                    toast.error(`Only ${available} available for size ${size}`)
                    quantity = available
                }
            }
        }

        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find(p => p._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += getProductPrice(itemInfo) * cartItems[items][item];
                    }
                } catch (error) { console.log(error) }
            }
        }
        return totalAmount;
    }

    const isDiscountActive = (product) => isDiscountActiveForProduct(product)

    const getProductPrice = (product) => {
        if (!product) return 0
        if (isDiscountActiveForProduct(product)) {
            return Number(product.discountPrice || 0)
        }
        return Number(product.sellingPrice || product.price || 0)
    }

    const getDiscountAmount = () => {
        const subtotal = getCartAmount();
        const normalizedCode = promoCode.trim().toUpperCase();
        const promo = PROMO_CODES[normalizedCode];

        if (!promo || subtotal <= 0) return 0;

        if (promo.type === 'percentage') {
            return Number(((subtotal * promo.value) / 100).toFixed(2));
        }

        return 0;
    }

    const getOrderSummary = () => {
        const subtotal = getCartAmount();
        const discount = Math.min(getDiscountAmount(), subtotal);
        const shipping = subtotal === 0 ? 0 : delivery_fee;
        const total = Math.max(0, Number((subtotal - discount + shipping).toFixed(2)));

        return {
            subtotal,
            discount,
            shipping,
            total,
        };
    }

    const applyPromoCode = (code) => {
        const normalizedCode = code.trim().toUpperCase();
        const promo = PROMO_CODES[normalizedCode];

        if (!normalizedCode) {
            toast.error('Enter discount code');
            return false;
        }

        if (!promo) {
            toast.error('Invalid discount code');
            return false;
        }

        if (getCartAmount() <= 0) {
            toast.error('Add products to cart first');
            return false;
        }

        setPromoCode(normalizedCode);
        localStorage.setItem('promoCode', normalizedCode);
        toast.success(`Discount code ${normalizedCode} applied`);
        return true;
    }

    const removePromoCode = () => {
        setPromoCode('');
        localStorage.removeItem('promoCode');
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            console.log("FULL RESPONSE:", response.data);
            const productsData = response.data.products || response.data.data;
            if (productsData) {
                setProducts(productsData);
            } else {
                toast.error("No products found in API");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) setCartItems(response.data.cartData)
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }

    useEffect(() => { getProductsData() }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
    }, [])

    useEffect(() => {
        if (getCartAmount() === 0 && promoCode) {
            removePromoCode();
        }
    }, [cartItems, products])

    const value = {
        products, currency, delivery_fee, search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems, getCartCount, updateQuantity, getCartAmount,
        getDiscountAmount, getOrderSummary, promoCode, applyPromoCode, removePromoCode,
        getProductPrice, isDiscountActive,
        navigate, backendUrl, setToken, token
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;
