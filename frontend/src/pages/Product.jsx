// frontend/src/pages/Product.jsx
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import RelatedProducts from '../components/RelatedProducts'
import ReviewList from '../components/ReviewList'

const Product = () => {
  const { productId }                                   = useParams()
  const { products, currency, addToCart, backendUrl, getProductPrice, isDiscountActive } = useContext(ShopContext)
  const [productData,    setProductData]    = useState(false)
  const [image,          setImage]          = useState('')
  const [size,           setSize]           = useState('')
  const [qty,            setQty]            = useState(1)      // ← how many to add
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab,      setActiveTab]      = useState('description')
  const [reviewCount,    setReviewCount]    = useState(0)
  const [reviewAvg,      setReviewAvg]      = useState(0)
  const [timeLeft,       setTimeLeft]       = useState('')

  useEffect(() => {
    const found = products.find(item => item._id === productId)
    if (found) { setProductData(found); setImage(found.image[0]) }
  }, [productId, products])

  // Reset quantity to 1 whenever size changes
  useEffect(() => { setQty(1) }, [size])

  // ── Discount countdown timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!productData) { setTimeLeft(''); return }
    const discountActive = productData.discountPrice != null &&
      productData.discountEndDate &&
      Date.now() >= Number(productData.discountStartDate) &&
      Date.now() <= Number(productData.discountEndDate)

    if (!discountActive) { setTimeLeft(''); return }

    const end = Number(productData.discountEndDate)
    const tick = () => {
      const diff = end - Date.now()
      if (diff <= 0) { setTimeLeft(''); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000)  / 60000)
      const s = Math.floor((diff % 60000)    / 1000)
      const parts = []
      if (d > 0) parts.push(`${d}d`)
      parts.push(`${String(h).padStart(2,'0')}h`)
      parts.push(`${String(m).padStart(2,'0')}m`)
      parts.push(`${String(s).padStart(2,'0')}s`)
      setTimeLeft(parts.join(' '))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [productData])
  // ─────────────────────────────────────────────────────────────────────────

  const totalQty   = productData ? (productData.quantity ?? 1) : 1
  const isSoldOut  = totalQty === 0

  // Get available stock for selected size
  const getSizeStock = (s) => {
    if (!productData) return 0
    const sizeQty = productData.sizeQuantities
    if (!sizeQty || Object.keys(sizeQty).length === 0) return productData.quantity ?? 99
    return Number(sizeQty[s] ?? 0)
  }

  const selectedStock = size ? getSizeStock(size) : 0
  const activePrice   = productData ? getProductPrice(productData) : 0
  const showDiscount  = productData ? isDiscountActive(productData) : false

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/* Images */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {productData.image.map((item, index) => (
              <img onClick={() => setImage(item)} src={item} key={index}
                className={`w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer ${isSoldOut ? 'grayscale opacity-60' : ''}`} alt="" />
            ))}
          </div>
          <div className='w-full sm:w-[80%] relative'>
            <img className={`w-full h-auto ${isSoldOut ? 'grayscale opacity-60' : ''}`} src={image} alt="" />
            {isSoldOut && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/10'>
                <span className='bg-black/75 text-white text-base font-semibold px-8 py-3 tracking-widest uppercase'>Sold Out</span>
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>

          {/* Dynamic star rating */}
          <div className='flex items-center gap-1 mt-2'>
            {reviewCount > 0 ? (
              <>
                {[1,2,3,4,5].map(s => (
                  <span key={s} className='text-base leading-none' style={{ color: s <= Math.round(reviewAvg) ? '#f59e0b' : '#d1d5db' }}>★</span>
                ))}
                <p className='pl-1 text-sm text-gray-500'>{reviewAvg.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</p>
              </>
            ) : (
              <p className='text-sm text-gray-400'>No reviews yet</p>
            )}
          </div>

          <div className='mt-5 flex items-end gap-3 flex-wrap'>
            <p className='text-3xl font-medium'>{currency}{activePrice}</p>
            {showDiscount && (
              <>
                <p className='text-lg text-gray-400 line-through'>{currency}{productData.price}</p>
                <span className='bg-rose-100 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide'>Sale</span>
              </>
            )}
          </div>

          {/* ── Discount countdown ─────────────────────────────────────── */}
          {showDiscount && timeLeft && timeLeft !== 'Expired' && (
            <div className='mt-3 inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-3 py-1.5 rounded-lg'>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Sale ends in: <span className='font-mono font-semibold'>{timeLeft}</span>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────────── */}

          {/* Stock banners */}
          {isSoldOut && (
            <div className='mt-3 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg'>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              This product is currently out of stock
            </div>
          )}


          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>

          {/* ── Size selector with per-size stock warnings ─────────────────── */}
          <div className='flex flex-col gap-4 my-8'>
            <p>Select Size</p>
            <div className='flex gap-2 flex-wrap'>
              {productData.sizes.map((s, index) => {
                const stock      = getSizeStock(s)
                const outOfStock = stock === 0
                const lowStock   = stock > 0 && stock < 10
                const isSelected = s === size

                return (
                  <div key={index} className='relative group'>
                    <button
                      onClick={() => !isSoldOut && !outOfStock && setSize(s)}
                      disabled={isSoldOut || outOfStock}
                      className={`py-2 px-4 text-sm transition-all
                        ${outOfStock || isSoldOut ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      style={
                        outOfStock || isSoldOut
                          ? { border: '2px solid #e5e7eb', color: '#d1d5db', background: '#f9fafb', textDecoration: 'line-through' }
                          : isSelected
                            ? { border: '2px solid #C586A5', color: '#C586A5', background: '#fff0f6' }
                            : { border: '2px solid #d1d5db' }
                      }
                    >
                      {s}

                    </button>

                    {/* Tooltip — shows on hover */}
                    <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none'>
                      <div className='bg-gray-800 text-white text-xs rounded px-2.5 py-1.5 whitespace-nowrap text-center'>
                        {outOfStock
                          ? 'Out of stock'
                          : lowStock
                            ? `Only ${stock} left`
                            : `${stock} in stock`
                        }
                      </div>
                      <div className='w-2 h-2 bg-gray-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1' />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* ─────────────────────────────────────────────────────────────────── */}

          {/* ── Quantity selector — always visible, keyboard + buttons ─────── */}
          <div className='flex items-center gap-3 mb-6'>
            <p className='text-sm text-gray-600'>Quantity:</p>
            <div className='flex items-center border border-gray-300 rounded overflow-hidden'>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={isSoldOut}
                className='px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-lg leading-none transition-colors disabled:opacity-30'
              >−</button>
              <input
                type='number'
                min={1}
                max={size ? selectedStock : undefined}
                value={qty}
                onChange={e => {
                  const val = Number(e.target.value)
                  if (!val || val < 1) { setQty(1); return }
                  if (size && val > selectedStock) { setQty(selectedStock); return }
                  setQty(val)
                }}
                className='w-12 text-center text-sm font-medium border-x border-gray-300 py-1.5 outline-none'
                disabled={isSoldOut}
              />
              <button
                onClick={() => setQty(q => size ? Math.min(selectedStock, q + 1) : q + 1)}
                disabled={isSoldOut || (size ? qty >= selectedStock : false)}
                className='px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-lg leading-none transition-colors disabled:opacity-30'
              >+</button>
            </div>
          </div>
          {/* ─────────────────────────────────────────────────────────────────── */}

          {/* Add to Cart */}
          {isSoldOut ? (
            <button disabled className='bg-gray-200 text-gray-400 px-8 py-3 text-sm cursor-not-allowed'>
              OUT OF STOCK
            </button>
          ) : (
            <button
              onClick={() => addToCart(productData._id, size, qty)}
              className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'
            >
              ADD TO CART
            </button>
          )}

          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description & Reviews tabs */}
      <div className='mt-20'>
        <div className='flex'>
          <button onClick={() => setActiveTab('description')}
            className={`px-5 py-3 text-sm border transition-colors ${activeTab === 'description' ? 'font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            Description
          </button>
          <button onClick={() => setActiveTab('reviews')}
            className={`px-5 py-3 text-sm border transition-colors ${activeTab === 'reviews' ? 'font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            Reviews{reviewCount > 0 ? ` (${reviewCount})` : ''}
          </button>
        </div>
        <div className='border px-6 py-6 text-sm text-gray-500'>
          {activeTab === 'description' ? (
            <div className='flex flex-col gap-4'>
              <p>An e-commerce website is an online platform that facilitates the buying and selling of products or services over the internet. It serves as a virtual marketplace where businesses and individuals can showcase their products, interact with customers, and conduct transactions without the need for a physical presence.</p>
              <p>E-commerce websites typically display products or services along with detailed descriptions, images, prices, and any available variations (e.g., sizes, colors). Each product usually has its own dedicated page with relevant information.</p>
            </div>
          ) : (
            <ReviewList
              productId={productId}
              backendUrl={backendUrl}
              refreshTrigger={refreshTrigger}
              onCountChange={(count, avg) => { setReviewCount(count); setReviewAvg(avg) }}
            />
          )}
        </div>
      </div>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : <div className='opacity-0'></div>
}

export default Product