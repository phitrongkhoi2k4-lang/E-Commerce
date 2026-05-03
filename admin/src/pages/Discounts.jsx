import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../App'

const toInputDateTime = (value) => (
  value ? new Date(value).toISOString().slice(0, 16) : ''
)

const isSaleConfigured = (product) => {
  const discountPrice = Number(product.discountPrice)
  const regularPrice = Number(product.sellingPrice ?? product.price ?? 0)

  return Boolean(
    !Number.isNaN(discountPrice) &&
    discountPrice >= 0 &&
    regularPrice > 0 &&
    discountPrice < regularPrice &&
    product.discountStartDate &&
    product.discountEndDate
  )
}

const isSaleActive = (product) => {
  if (!isSaleConfigured(product)) return false
  const now = Date.now()
  return now >= Number(product.discountStartDate) && now <= Number(product.discountEndDate)
}

const Discounts = ({ token }) => {
  const [products, setProducts] = useState([])
  const [savingId, setSavingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [discountForms, setDiscountForms] = useState({})

  const fetchProducts = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (!response.data.success) {
        toast.error(response.data.message)
        return
      }

      const items = response.data.products || []
      setProducts(items)

      const mapped = {}
      items.forEach((product) => {
        mapped[product._id] = {
          discountPrice: product.discountPrice ?? '',
          discountStartDate: toInputDateTime(product.discountStartDate),
          discountEndDate: toInputDateTime(product.discountEndDate),
        }
      })
      setDiscountForms(mapped)
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const setFormValue = (productId, field, value) => {
    setDiscountForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      }
    }))
  }

  const saveDiscount = async (product) => {
    const form = discountForms[product._id] || {}

    if (!form.discountPrice || !form.discountStartDate || !form.discountEndDate) {
      toast.error('Please complete all discount fields')
      return
    }

    if (Number(form.discountPrice) >= Number(product.sellingPrice ?? product.price ?? 0)) {
      toast.error('Discount price must be lower than selling price')
      return
    }

    if (new Date(form.discountStartDate).getTime() >= new Date(form.discountEndDate).getTime()) {
      toast.error('Discount end time must be after start time')
      return
    }

    try {
      setSavingId(product._id)
      const payload = new FormData()
      payload.append('id', product._id)
      payload.append('name', product.name)
      payload.append('category', product.category)
      payload.append('subCategory', product.subCategory)
      payload.append('price', product.sellingPrice ?? product.price ?? 0)
      payload.append('bestseller', product.bestseller ? 'true' : 'false')
      payload.append('costPrice', Number(product.costPrice ?? 0))
      payload.append('sellingPrice', Number(product.sellingPrice ?? product.price ?? 0))
      payload.append('discountPrice', form.discountPrice)
      payload.append('discountStartDate', form.discountStartDate)
      payload.append('discountEndDate', form.discountEndDate)
      payload.append('sizeQuantities', JSON.stringify(product.sizeQuantities || {}))

      const response = await axios.post(backendUrl + '/api/product/update', payload, { headers: { token } })
      if (response.data.success) {
        toast.success('Discount saved')
        await fetchProducts()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingId('')
    }
  }

  const clearDiscount = async (product) => {
    try {
      setSavingId(product._id)
      const payload = new FormData()
      payload.append('id', product._id)
      payload.append('name', product.name)
      payload.append('category', product.category)
      payload.append('subCategory', product.subCategory)
      payload.append('price', product.sellingPrice ?? product.price ?? 0)
      payload.append('bestseller', product.bestseller ? 'true' : 'false')
      payload.append('costPrice', Number(product.costPrice ?? 0))
      payload.append('sellingPrice', Number(product.sellingPrice ?? product.price ?? 0))
      payload.append('discountPrice', '')
      payload.append('discountStartDate', '')
      payload.append('discountEndDate', '')
      payload.append('sizeQuantities', JSON.stringify(product.sizeQuantities || {}))

      const response = await axios.post(backendUrl + '/api/product/update', payload, { headers: { token } })
      if (response.data.success) {
        toast.success('Discount removed')
        await fetchProducts()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingId('')
    }
  }

  const filteredProducts = products.filter((product) => {
    if (filter === 'sale') return isSaleConfigured(product)
    if (filter === 'active') return isSaleActive(product)
    if (filter === 'no-sale') return !isSaleConfigured(product)
    return true
  })

  return (
    <div className='flex flex-col gap-5'>
      <div>
        <h2 className='text-2xl font-medium text-gray-700'>Discounts</h2>
        <p className='text-sm text-gray-400 mt-1'>Choose which products go on sale and control the sale time window.</p>
      </div>

      <div className='flex flex-wrap gap-2'>
        {[
          ['all', 'All Products'],
          ['sale', 'Has Discount'],
          ['active', 'Active Now'],
          ['no-sale', 'No Discount']
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              filter === key ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className='flex flex-col gap-4'>
        {filteredProducts.map((product) => {
          const form = discountForms[product._id] || {}
          const configured = isSaleConfigured(product)
          const active = isSaleActive(product)

          return (
            <div key={product._id} className='bg-white border border-gray-200 rounded-2xl p-5 shadow-sm'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                <div className='flex items-center gap-4 min-w-0'>
                  <img
                    src={product.image?.[0]}
                    alt={product.name}
                    className='w-20 h-20 rounded-xl object-cover border border-gray-200'
                  />
                  <div className='min-w-0'>
                    <p className='font-semibold text-gray-800 truncate'>{product.name}</p>
                    <p className='text-sm text-gray-400 mt-1'>{product.category} / {product.subCategory}</p>
                    <div className='flex items-center gap-2 mt-2 flex-wrap'>
                      <span className='text-sm font-medium text-gray-700'>
                        Regular: {currency}{Number(product.sellingPrice ?? product.price ?? 0).toFixed(2)}
                      </span>
                      {configured && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${active ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                          {active ? 'Active Sale' : 'Scheduled'}
                        </span>
                      )}
                    </div>
                    {configured && (
                      <p className='text-xs text-gray-500 mt-1'>
                        Sale: {currency}{Number(product.discountPrice).toFixed(2)} | {new Date(product.discountStartDate).toLocaleString()} - {new Date(product.discountEndDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className='grid sm:grid-cols-3 gap-3 lg:min-w-[520px]'>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={form.discountPrice ?? ''}
                    onChange={(e) => setFormValue(product._id, 'discountPrice', e.target.value)}
                    placeholder='Discount price'
                    className='border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300'
                  />
                  <input
                    type='datetime-local'
                    value={form.discountStartDate ?? ''}
                    onChange={(e) => setFormValue(product._id, 'discountStartDate', e.target.value)}
                    className='border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300'
                  />
                  <input
                    type='datetime-local'
                    value={form.discountEndDate ?? ''}
                    onChange={(e) => setFormValue(product._id, 'discountEndDate', e.target.value)}
                    className='border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-300'
                  />
                </div>
              </div>

              <div className='flex gap-3 mt-4'>
                <button
                  onClick={() => saveDiscount(product)}
                  disabled={savingId === product._id}
                  className='rounded-full bg-black text-white px-5 py-2 text-sm disabled:opacity-50'
                >
                  {savingId === product._id ? 'Saving...' : 'Save Discount'}
                </button>
                <button
                  onClick={() => clearDiscount(product)}
                  disabled={savingId === product._id}
                  className='rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-600 disabled:opacity-50'
                >
                  Remove Discount
                </button>
              </div>
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className='bg-white border border-dashed border-gray-300 rounded-2xl px-5 py-10 text-center text-sm text-gray-400'>
            No products found for this filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default Discounts
