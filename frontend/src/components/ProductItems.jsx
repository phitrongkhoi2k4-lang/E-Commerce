import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const ProductItems = ({ id, image, name, price, quantity, product }) => {
  const { currency, getProductPrice, isDiscountActive } = useContext(ShopContext)

  const isSoldOut = quantity !== undefined && quantity === 0
  const finalPrice = product ? getProductPrice(product) : price
  const showDiscount = product ? isDiscountActive(product) : false

  return (
    <Link
      className={`text-gray-700 cursor-pointer relative block ${isSoldOut ? 'pointer-events-none' : ''}`}
      to={`/product/${id}`}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div className='overflow-hidden relative'>
        <img
          className={`hover:scale-110 transition ease-in-out w-full ${isSoldOut ? 'grayscale opacity-60' : ''}`}
          src={image[0]}
          alt={name}
        />

        {isSoldOut && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='bg-black/70 text-white text-xs font-semibold px-4 py-1.5 tracking-widest uppercase'>
              Sold Out
            </span>
          </div>
        )}

        {showDiscount && !isSoldOut && (
          <div className='absolute top-3 left-3'>
            <span className='bg-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide'>
              Sale
            </span>
          </div>
        )}
      </div>

      <p className={`pt-3 pb-1 text-sm line-clamp-2 flex-1 ${isSoldOut ? 'text-gray-400' : ''}`}>{name}</p>

      {isSoldOut ? (
        <p className='text-sm font-medium text-red-500'>Sold Out</p>
      ) : (
        <div className='flex items-center gap-2 flex-wrap'>
          <p className='text-sm font-medium'>{currency}{finalPrice}</p>
          {showDiscount && (
            <p className='text-xs text-gray-400 line-through'>{currency}{price}</p>
          )}
        </div>
      )}
    </Link>
  )
}

export default ProductItems
