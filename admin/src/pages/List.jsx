import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const CATEGORIES = ['Men', 'Women', 'Kids']
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear']

const STOCK_OUT = 0
const STOCK_LOW = 10

const WarnIcon = () => (
  <svg width='13' height='13' viewBox='0 0 24 24' fill='none'
    stroke='#d97706' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' style={{ flexShrink: 0 }}>
    <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
    <line x1='12' y1='9' x2='12' y2='13' /><line x1='12' y1='17' x2='12.01' y2='17' />
  </svg>
)

const SizeStockBadge = ({ size, qty }) => {
  const count = Number(qty || 0)
  const color = count === 0
    ? 'bg-red-100 text-red-600 border-red-200'
    : count < STOCK_LOW
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium border px-1.5 py-0.5 rounded ${color}`}>
      <span className='font-semibold'>{size}</span>
      <span className='opacity-60'>:</span>
      <span>{count}</span>
    </span>
  )
}

const StockCell = ({ item }) => {
  const qty = item.quantity ?? 0
  const sizeQty = item.sizeQuantities || {}
  const hasSizeData = Object.keys(sizeQty).length > 0

  if (!hasSizeData) {
    if (qty === STOCK_OUT) return <span className='text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full'>Out of Stock</span>
    if (qty < STOCK_LOW) {
      return (
        <span className='inline-flex items-center gap-1 text-[11px] font-medium text-yellow-700' title='Low stock'>
          <WarnIcon />
          {qty}
          <span className='text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full'>Low</span>
        </span>
      )
    }
    return <span className='text-gray-700 text-sm'>{qty}</span>
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {item.sizes?.map(size => (
        <SizeStockBadge key={size} size={size} qty={sizeQty[size] ?? 0} />
      ))}
    </div>
  )
}

const isDiscountConfigured = (item) => {
  const regularPrice = Number(item.sellingPrice ?? item.price ?? 0)
  const discountPrice = Number(item.discountPrice)
  return Boolean(
    !Number.isNaN(discountPrice) &&
    discountPrice >= 0 &&
    regularPrice > 0 &&
    discountPrice < regularPrice &&
    item.discountStartDate &&
    item.discountEndDate
  )
}

const isDiscountActive = (item) => {
  if (!isDiscountConfigured(item)) return false
  const now = Date.now()
  return now >= Number(item.discountStartDate) && now <= Number(item.discountEndDate)
}

const formatDateTimeInput = (value) => (
  value ? new Date(value).toISOString().slice(0, 16) : ''
)

const formatDiscountWindow = (item) => {
  if (!isDiscountConfigured(item)) return 'No sale'
  const start = new Date(item.discountStartDate).toLocaleString()
  const end = new Date(item.discountEndDate).toLocaleString()
  return `${start} - ${end}`
}

const List = ({ token }) => {
  const [list, setList] = useState([])

  const [editItem, setEditItem] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editSubCategory, setEditSubCategory] = useState('')
  const [editImage, setEditImage] = useState(null)
  const [editPreview, setEditPreview] = useState('')
  const [editBestseller, setEditBestseller] = useState(false)
  const [editCostPrice, setEditCostPrice] = useState('')
  const [editSellingPrice, setEditSellingPrice] = useState('')
  const [editDiscountPrice, setEditDiscountPrice] = useState('')
  const [editDiscountStart, setEditDiscountStart] = useState('')
  const [editDiscountEnd, setEditDiscountEnd] = useState('')
  const [editSizeQty, setEditSizeQty] = useState({})
  const [updating, setUpdating] = useState(false)

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) setList(response.data.products)
      else toast.error(response.data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => { fetchList() }, [])

  const openEdit = (item) => {
    setEditItem(item)
    setEditName(item.name)
    setEditCategory(item.category)
    setEditSubCategory(item.subCategory ?? '')
    setEditImage(null)
    setEditPreview(item.image[0])
    setEditBestseller(item.bestseller ?? false)
    setEditCostPrice(item.costPrice ?? 0)
    setEditSellingPrice(item.sellingPrice ?? item.price ?? 0)
    setEditDiscountPrice(item.discountPrice ?? '')
    setEditDiscountStart(formatDateTimeInput(item.discountStartDate))
    setEditDiscountEnd(formatDateTimeInput(item.discountEndDate))

    const existing = item.sizeQuantities || {}
    const initQty = {}
    ;(item.sizes || []).forEach(size => {
      initQty[size] = existing[size] ?? 0
    })
    setEditSizeQty(initQty)
  }

  const closeEdit = () => {
    setEditItem(null)
    setEditImage(null)
    setEditPreview('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setEditImage(file)
    setEditPreview(URL.createObjectURL(file))
  }

  const totalEditQty = Object.values(editSizeQty).reduce((sum, value) => sum + Number(value || 0), 0)

  const submitUpdate = async () => {
    if (Number(editSellingPrice) < Number(editCostPrice)) {
      toast.error('Selling Price must be greater than or equal to Cost Price')
      return
    }

    if (editDiscountPrice || editDiscountStart || editDiscountEnd) {
      if (!editDiscountPrice || !editDiscountStart || !editDiscountEnd) {
        toast.error('Please complete all discount fields')
        return
      }
      if (Number(editDiscountPrice) >= Number(editSellingPrice)) {
        toast.error('Discount price must be lower than selling price')
        return
      }
      if (new Date(editDiscountStart).getTime() >= new Date(editDiscountEnd).getTime()) {
        toast.error('Discount end time must be after start time')
        return
      }
    }

    try {
      setUpdating(true)
      const formData = new FormData()
      formData.append('id', editItem._id)
      formData.append('name', editName)
      formData.append('category', editCategory)
      formData.append('subCategory', editSubCategory)
      formData.append('price', editSellingPrice)
      formData.append('bestseller', editBestseller ? 'true' : 'false')
      formData.append('costPrice', Number(editCostPrice))
      formData.append('sellingPrice', Number(editSellingPrice))
      formData.append('discountPrice', editDiscountPrice)
      formData.append('discountStartDate', editDiscountStart)
      formData.append('discountEndDate', editDiscountEnd)
      formData.append('sizeQuantities', JSON.stringify(editSizeQty))
      if (editImage) formData.append('image', editImage)

      const response = await axios.post(backendUrl + '/api/product/update', formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        closeEdit()
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <p className='mb-2'>All Product List</p>
      <div className='flex flex-col gap-2'>
        <div className='hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_2fr_0.8fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Cost</b>
          <b>Selling</b>
          <b>Sale</b>
          <b>Stock by Size</b>
          <b>Best.</b>
          <b className='text-center'>Action</b>
        </div>

        {list.map((item, index) => {
          const qty = item.quantity ?? 0
          const isOut = qty === STOCK_OUT && (item.sizeQuantities ? Object.keys(item.sizeQuantities).length === 0 : true)
          const isLow = !isOut && qty > 0 && qty < STOCK_LOW

          const rowClass = isOut ? 'bg-red-50 border-red-200' : isLow ? 'bg-yellow-50 border-yellow-100' : ''
          const hasSale = isDiscountConfigured(item)
          const activeSale = isDiscountActive(item)

          return (
            <div
              key={index}
              className={`grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_2fr_0.8fr_1fr] items-center gap-2 py-2 px-2 border text-sm transition-colors ${rowClass}`}
            >
              <img className={`w-12 ${isOut ? 'opacity-40 grayscale' : ''}`} src={item.image[0]} alt='' />
              <p className={`truncate ${isOut ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
              <p>{item.category}</p>
              <p className='text-gray-500'>{currency}{item.costPrice ?? 0}</p>
              <p className='font-medium'>{currency}{item.sellingPrice ?? item.price ?? 0}</p>

              <div>
                {hasSale ? (
                  <div className='flex flex-col gap-1'>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold w-fit ${activeSale ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                      {activeSale ? 'Active Sale' : 'Scheduled Sale'}
                    </span>
                    <p className='text-xs text-gray-600'>{currency}{item.discountPrice}</p>
                  </div>
                ) : (
                  <span className='text-gray-300 text-xs'>No sale</span>
                )}
              </div>

              <div><StockCell item={item} /></div>

              <p>
                {item.bestseller
                  ? <span className='text-[10px] bg-pink-100 text-pink-500 px-1.5 py-0.5 rounded-full font-medium'>Yes</span>
                  : <span className='text-gray-300 text-xs'>-</span>}
              </p>

              <div className='flex items-center justify-end md:justify-center gap-3'>
                <span onClick={() => openEdit(item)} className='cursor-pointer text-blue-500 hover:text-blue-700 text-sm font-medium'>Edit</span>
                <span onClick={() => removeProduct(item._id)} className='cursor-pointer text-lg leading-none'>X</span>
              </div>
            </div>
          )
        })}
      </div>

      {editItem && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-xl mx-4 p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='font-semibold text-base'>Edit Product</h2>
              <button onClick={closeEdit} className='text-gray-400 hover:text-gray-600 text-xl leading-none'>&times;</button>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-gray-500 mb-1'>Image</p>
              <label className='cursor-pointer block'>
                <img src={editPreview} alt='preview' className='w-24 h-24 object-cover border rounded mb-1' />
                <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
                <span className='text-xs text-blue-500 hover:underline'>Click image to change</span>
              </label>
            </div>

            <div className='mb-3'>
              <p className='text-sm text-gray-500 mb-1'>Name</p>
              <input type='text' value={editName} onChange={e => setEditName(e.target.value)}
                className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400' />
            </div>

            <div className='mb-3'>
              <p className='text-sm text-gray-500 mb-1'>Category</p>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400'>
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>

            <div className='mb-3'>
              <p className='text-sm text-gray-500 mb-1'>Sub Category</p>
              <select value={editSubCategory} onChange={e => setEditSubCategory(e.target.value)}
                className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400'>
                {SUB_CATEGORIES.map(subCategory => <option key={subCategory} value={subCategory}>{subCategory}</option>)}
              </select>
            </div>

            <div className='grid sm:grid-cols-2 gap-3 mb-3'>
              <div>
                <p className='text-sm text-gray-500 mb-1'>Cost Price</p>
                <input type='number' min='0' step='0.01' value={editCostPrice}
                  onChange={e => setEditCostPrice(e.target.value)}
                  className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400' />
              </div>
              <div>
                <p className='text-sm text-gray-500 mb-1'>Selling Price</p>
                <input type='number' min='0' step='0.01' value={editSellingPrice}
                  onChange={e => setEditSellingPrice(e.target.value)}
                  className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400' />
              </div>
            </div>

            {editCostPrice !== '' && editSellingPrice !== '' && (
              <p className='text-xs text-gray-400 mb-3'>
                Margin:{' '}
                <span className={`font-medium ${Number(editSellingPrice) >= Number(editCostPrice) ? 'text-green-600' : 'text-red-500'}`}>
                  {currency}{(Number(editSellingPrice) - Number(editCostPrice)).toFixed(2)}
                </span>
              </p>
            )}

            <div className='mb-4 border border-rose-100 bg-rose-50/40 rounded-lg p-4'>
              <div className='flex items-center justify-between gap-3 mb-3'>
                <p className='text-sm font-medium text-rose-700'>Scheduled Discount</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${editDiscountPrice && editDiscountStart && editDiscountEnd ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                  {editDiscountPrice && editDiscountStart && editDiscountEnd ? 'Configured' : 'Off'}
                </span>
              </div>
              <div className='grid sm:grid-cols-3 gap-3'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Discount Price</p>
                  <input type='number' min='0' step='0.01' value={editDiscountPrice}
                    onChange={e => setEditDiscountPrice(e.target.value)}
                    className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-rose-300' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Start Time</p>
                  <input type='datetime-local' value={editDiscountStart}
                    onChange={e => setEditDiscountStart(e.target.value)}
                    className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-rose-300' />
                </div>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>End Time</p>
                  <input type='datetime-local' value={editDiscountEnd}
                    onChange={e => setEditDiscountEnd(e.target.value)}
                    className='w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-rose-300' />
                </div>
              </div>
              <p className='mt-3 text-xs text-gray-500'>{formatDiscountWindow(editItem)}</p>
            </div>

            <div className='mb-3'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-gray-500'>Stock by Size</p>
                <p className='text-xs text-gray-400'>Total: <span className='font-semibold text-gray-600'>{totalEditQty}</span></p>
              </div>
              <div className='grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded border border-gray-200'>
                {(editItem.sizes || []).map(size => {
                  const count = Number(editSizeQty[size] || 0)
                  return (
                    <div key={size} className='flex flex-col items-center gap-1'>
                      <label className='text-xs font-semibold text-gray-600'>{size}</label>
                      <input
                        type='number'
                        min='0'
                        value={editSizeQty[size] ?? 0}
                        onChange={e => setEditSizeQty(prev => ({ ...prev, [size]: e.target.value }))}
                        className={`w-full text-center border rounded px-1 py-1 text-sm outline-none focus:border-pink-400 ${count === 0 ? 'border-red-300 bg-red-50' : count < STOCK_LOW ? 'border-yellow-300 bg-yellow-50' : ''}`}
                      />
                      {count === 0 && <span className='text-[9px] text-red-500'>Out</span>}
                      {count > 0 && count < STOCK_LOW && <span className='text-[9px] text-yellow-600'>Low</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='mb-5 flex items-center gap-3'>
              <input type='checkbox' id='editBestseller' checked={editBestseller}
                onChange={e => setEditBestseller(e.target.checked)}
                className='w-4 h-4 cursor-pointer accent-pink-400' />
              <label htmlFor='editBestseller' className='text-sm text-gray-500 cursor-pointer select-none'>Bestseller</label>
              {editBestseller && <span className='text-[10px] bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full font-medium'>Active</span>}
            </div>

            <div className='flex justify-end gap-3'>
              <button onClick={closeEdit} className='px-4 py-1.5 text-sm border rounded hover:bg-gray-50'>Cancel</button>
              <button onClick={submitUpdate} disabled={updating}
                className='px-4 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50'>
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default List
