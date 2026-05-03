import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const DELIVERY_FEE = 10;
const PROMO_CODES = {
  SAVE10: { type: "percentage", value: 10 },
  WELCOME15: { type: "percentage", value: 15 },
};

const getEffectiveProductPrice = (product) => {
  if (!product) return 0;

  const now = Date.now();
  const regularPrice = Number(product.sellingPrice || product.price || 0);
  const discountPrice = Number(product.discountPrice);
  const start = Number(product.discountStartDate || 0);
  const end = Number(product.discountEndDate || 0);

  const activeDiscount =
    discountPrice >= 0 &&
    regularPrice > 0 &&
    discountPrice < regularPrice &&
    start &&
    end &&
    now >= start &&
    now <= end;

  return activeDiscount ? discountPrice : regularPrice;
};

// ── STOCK: decrease ────────────────────────────────────────────
const decreaseStock = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) continue;

    const qty = item.quantity || 1;
    const size = item.size;

    const update = { $inc: { quantity: -qty } };

    if (product.sizeQuantities && product.sizeQuantities.size > 0) {
      const current = Number(product.sizeQuantities.get(size) ?? 0);
      update.$set = {
        [`sizeQuantities.${size}`]: Math.max(0, current - qty),
      };
    }

    await productModel.findByIdAndUpdate(item._id, update);
  }
};

// ── CALCULATE PROFIT ───────────────────────────────────────────
const calculateProfit = async (items) => {
  let profit = 0;

  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) continue;

    const qty = item.quantity || 1;

    const cost =
      product.costPrice > 0
        ? product.costPrice
        : product.price * 0.6;

    const price =
      product.sellingPrice > 0
        ? product.sellingPrice
        : product.price;

    profit += (price - cost) * qty;
  }

  return Number(profit.toFixed(2));
};

const calculateSubtotal = async (items) => {
  let subtotal = 0;

  for (const item of items) {
    const product = await productModel.findById(item._id);
    if (!product) continue;

    const qty = item.quantity || 1;
    const price =
      getEffectiveProductPrice(product);

    subtotal += price * qty;
  }

  return Number(subtotal.toFixed(2));
};

const calculateDiscount = (subtotal, promoCode = "") => {
  const normalizedCode = promoCode.trim().toUpperCase();
  const promo = PROMO_CODES[normalizedCode];

  if (!promo || subtotal <= 0) {
    return { normalizedCode: "", discountAmount: 0 };
  }

  if (promo.type === "percentage") {
    return {
      normalizedCode,
      discountAmount: Number(((subtotal * promo.value) / 100).toFixed(2)),
    };
  }

  return { normalizedCode: "", discountAmount: 0 };
};

// ── PLACE ORDER ────────────────────────────────────────────────
const placeOrdder = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 FIX CHÍNH
    const { items, address, promoCode = "" } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "Auth failed (no userId)" });
    }

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "No items" });
    }

    const profit = await calculateProfit(items);
    const subtotal = await calculateSubtotal(items);
    const { normalizedCode, discountAmount } = calculateDiscount(subtotal, promoCode);
    const amount = Number((Math.max(0, subtotal - discountAmount) + DELIVERY_FEE).toFixed(2));

    const orderData = {
      userId,
      items,
      address,
      amount,
      profit,
      promoCode: normalizedCode,
      discountAmount,
      paymentMethod: "COD",
      payment: false,
      status: "Order Placed",
      date: Date.now(),
      returnStatus: "none",
      refundAmount: 0,
    };

    await orderModel.create(orderData);

    await decreaseStock(items);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ── PAYMENT STUBS ──────────────────────────────────────────────
const placeOrdderStripe = async (req, res) => {
  res.json({ success: false, message: "Stripe not implemented" });
};

const placeOrdderRazorpay = async (req, res) => {
  res.json({ success: false, message: "Razorpay not implemented" });
};

// ── ALL ORDERS ─────────────────────────────────────────────────
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ── USER ORDERS ────────────────────────────────────────────────
const userOrders = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 FIX

    if (!userId) {
      return res.json({ success: false, message: "Auth failed" });
    }

    const orders = await orderModel.find({ userId });

    res.json({ success: true, orders });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── UPDATE STATUS ──────────────────────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (status === "Returned") {
      return res.json({
        success: false,
        message: "Use return API instead",
      });
    }

    await orderModel.findByIdAndUpdate(orderId, { status });

    res.json({ success: true, message: "Status Updated" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── REVENUE ────────────────────────────────────────────────────
const revenueOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    const result = [];

    for (const order of orders) {
      const amount = order.amount || 0;
      const refund = order.refundAmount || 0;

      const isRefund = order.returnStatus === "completed";

      let baseProfit = order.profit;

      if (baseProfit === undefined || baseProfit === null) {
        baseProfit = 0;

        for (const item of order.items) {
          const product = await productModel.findById(item._id);
          if (!product) continue;

          const qty = item.quantity || 1;

          const cost =
            product.costPrice > 0
              ? product.costPrice
              : product.price * 0.6;

    const price =
      getEffectiveProductPrice(product);

          baseProfit += (price - cost) * qty;
        }
      }

      baseProfit = Number(baseProfit.toFixed(2));

      // SALE
      result.push({
        ...order._doc,
        isRefund: false,
        amount: amount,
        profit: baseProfit,
      });

      // REFUND
      if (isRefund && refund > 0 && amount > 0) {
        const ratio = refund / amount;
        const refundProfit = baseProfit * ratio;

        result.push({
          ...order._doc,
          isRefund: true,
          amount: -Number(refund.toFixed(2)),
          profit: -Number(refundProfit.toFixed(2)),
        });
      }
    }

    res.json({ success: true, orders: result });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// ── EXPORT ─────────────────────────────────────────────────────
export {
  placeOrdder,
  placeOrdderStripe,
  placeOrdderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  revenueOrders,
};
