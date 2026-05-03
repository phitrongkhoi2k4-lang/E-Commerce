// frontend/src/pages/Cart.jsx
import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';

const Cart = () => {
  const {
    products, currency, cartItems, updateQuantity, navigate, getProductPrice, isDiscountActive,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({ _id: items, size: item, quantity: cartItems[items][item] })
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products])

  const getMaxStock = (productId, size) => {
    const product = products.find(p => p._id === productId)
    if (!product) return 99
    const sizeQty = product.sizeQuantities
    if (sizeQty && Object.keys(sizeQty).length > 0) {
      return Number(sizeQty[size] ?? 0)
    }
    return product.quantity ?? 99
  }

  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-3'>
        <Title text1={'YOUR'} text2={' CART'} />
      </div>
      <div>
        {cartData.map((item, index) => {
          const productData  = products.find(p => p._id === item._id);
          if (!productData) return null   // guard: product not loaded yet
          const maxStock     = getMaxStock(item._id, item.size)
          const activePrice  = getProductPrice(productData)
          const showDiscount = isDiscountActive(productData)

          return (
            <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
              <div className='flex items-start gap-6'>
                <img className='w-16 sm:w-20' src={productData.image[0]} alt="" />
                <div>
                  <p className='text-sm sm:text-lg font-medium'>{productData.name}</p>
                  <div className='flex items-center gap-5 mt-2'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p>{currency}{activePrice}</p>
                      {showDiscount && (
                        <p className='text-xs text-gray-400 line-through'>{currency}{productData.price}</p>
                      )}
                    </div>
                    <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                  </div>
                </div>
              </div>

              <input
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (!val || val < 1) return
                  const capped = Math.min(val, maxStock)
                  updateQuantity(item._id, item.size, capped)
                }}
                className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1'
                type="number" min={1} max={maxStock} defaultValue={item.quantity}
              />

              <img
                onClick={() => updateQuantity(item._id, item.size, 0)}
                className='w-4 mr-4 sm:w-5 cursor-pointer'
                src={assets.bin_icon} alt=""
              />
            </div>
          )
        })}
      </div>

      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end'>
            <button onClick={() => navigate('/place-order')} className='bg-black text-white text-sm my-8 px-8 py-3'>
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart