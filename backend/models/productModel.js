import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:         { type: String,  required: true },
    description:  { type: String,  required: true },
    price:        { type: Number,  required: true },
    image:        { type: Array,   required: true },
    category:     { type: String,  required: true },
    subCategory:  { type: String,  required: true },
    sizes:        { type: Array,   required: true },
    bestseller:   { type: Boolean },
    date:         { type: Number,  required: true },

    // Total stock (sum of all sizes) — kept for backward compat & quick queries
    quantity:     { type: Number,  default: 0 },

    costPrice:    { type: Number,  default: 0 },
    sellingPrice: { type: Number,  default: 0 },
    discountPrice: { type: Number, default: null },
    discountStartDate: { type: Number, default: null },
    discountEndDate: { type: Number, default: null },

    // ── NEW: per-size stock breakdown ─────────────────────────────────────────
    // Stores quantity for each size, e.g. { S: 10, M: 25, L: 5, XL: 0, XXL: 3 }
    // Old products without this field will return {} safely (no migration needed)
    sizeQuantities: {
        type: Map,
        of:   Number,
        default: {},
    },
    // ─────────────────────────────────────────────────────────────────────────
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
