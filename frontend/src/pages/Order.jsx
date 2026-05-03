// frontend/src/pages/Order.jsx
import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import ReviewModal from '../components/ReviewModal'
import axios from 'axios'
import { toast } from 'react-toastify'

// ── Return status badge ───────────────────────────────────────
const ReturnBadge = ({ status }) => {
  const styles = {
    pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved:  'bg-green-100 text-green-700 border-green-200',
    rejected:  'bg-red-100 text-red-600 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  const labels = {
    pending:   'Return Pending',
    approved:  'Return Approved',
    rejected:  'Return Rejected',
    completed: 'Return Completed',
  }

  if (!status || status === 'none') return null

  return (
    <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

// ── Return Modal (GIỮ NGUYÊN) ─────────────────────────────────
const ReturnModal = ({ order, onClose, onSubmitted }) => {
  const { backendUrl, token } = useContext(ShopContext)

  const [reason, setReason] = useState('')
  const [selectedItems, setSelectedItems] = useState(
    new Set(order.items.map((_, i) => i))
  )

  const toggleItem = (i) => {
    const next = new Set(selectedItems)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelectedItems(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (selectedItems.size === 0) return toast.error('Select item')
    if (!reason.trim()) return toast.error('Enter reason')

    const returnItems = order.items
      .filter((_, i) => selectedItems.has(i))
      .map(item => ({
        _id: item._id,
        name: item.name,
        size: item.size,
        quantity: item.quantity
      }))

    try {
      const res = await axios.post(
        backendUrl + '/api/return/request',
        { orderId: order._id, reason, returnItems },
        { headers: { token } }
      )

      if (res.data.success) {
        toast.success('Return requested')
        onSubmitted()
        onClose()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl'
        onClick={e => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 py-4 border-b'>
          <div>
            <p className='font-medium text-base'>Request Return</p>
            <p className='text-xs text-gray-400 mt-0.5'>
              Select the item(s) you want to return and tell us the reason.
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4'
          >
            &times;
          </button>
        </div>

        <div className='px-6 py-3 bg-gray-50 border-b'>
          <p className='text-xs font-medium uppercase tracking-wide text-gray-400 mb-3'>
            Items In This Order
          </p>
          <div className='flex flex-col gap-3'>
            {order.items.map((item, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                  selectedItems.has(i)
                    ? 'border-black bg-white'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type='checkbox'
                  checked={selectedItems.has(i)}
                  onChange={() => toggleItem(i)}
                  className='accent-black'
                />
                <img
                  src={item.image?.[0]}
                  alt={item.name}
                  className='w-14 h-14 object-cover rounded border border-gray-200'
                />
                <div className='min-w-0'>
                  <p className='text-sm font-medium text-gray-700 line-clamp-1'>{item.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    Size: {item.size} | Quantity: {item.quantity}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-5 flex flex-col gap-5'>
          <div>
            <p className='text-sm text-gray-600 mb-2 font-medium'>
              Reason <span className='text-red-400'>*</span>
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={5}
              placeholder='Tell us why you want to return this item...'
              className='w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none outline-none focus:border-gray-500'
            />
          </div>

          <div className='flex justify-end gap-3 pt-2 border-t'>
            <button
              type='button'
              onClick={onClose}
              className='px-5 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-6 py-2 text-sm bg-black text-white rounded hover:bg-gray-800'
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────
const Order = () => {
  const { backendUrl, token, currency } = useContext(ShopContext)

  const [orderData, setOrderData] = useState([])
  const [reviewProduct, setReviewProduct] = useState(null)
  const [reviewedItems, setReviewedItems] = useState({})
  const [returnOrder, setReturnOrder] = useState(null)

  const loadOrderData = async () => {
    try {
      const res = await axios.post(
        backendUrl + '/api/order/userorders',
        {},
        { headers: { token } }
      )

      if (res.data.success) {
        let items = []

        res.data.orders.forEach(order => {
          order.items.forEach(item => {

            const isReturned = order.returnItems?.some(
              r => r._id === item._id && r.size === item.size
            )

            items.push({
              ...item,
              status: order.status,
              paymentMethod: order.paymentMethod,
              date: order.date,
              orderRef: order,
              isReturned,
              returnStatus: isReturned ? order.returnStatus : 'none'
            })
          })
        })

        setOrderData(items.reverse())
      }
    } catch (err) {
      console.log(err)
    }
  }

  const checkReviewed = async (items) => {
    try {
      const results = await Promise.all(
        items.map(i =>
          axios.post(
            backendUrl + '/api/review/checked/' + i._id,
            {},
            { headers: { token } }
          )
        )
      )

      const map = {}
      results.forEach((r, i) => {
        map[items[i]._id] = r.data.reviewed
      })

      setReviewedItems(map)
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    loadOrderData()
  }, [token])

  useEffect(() => {
    if (orderData.length) {
      const unique = Array.from(new Map(orderData.map(i => [i._id, i])).values())
      checkReviewed(unique)
    }
  }, [orderData])

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={' ORDER'} />
      </div>

      <div>
        {orderData.map((item, index) => {

          const isReviewed = reviewedItems[item._id]
          const isReturned = item.isReturned

          // FIX LOGIC ONLY (KHÔNG ĐỤNG UI)
          const canReview =
            item.status === 'Delivered' &&
            !isReviewed

          const canReturn =
            item.status === 'Delivered' &&
            !isReturned

          return (
            <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>

              {/* LEFT */}
              <div className='flex items-start gap-6 text-sm'>
                <img className='w-16 sm:w-20' src={item.image[0]} alt="" />

                <div>
                  <p className='sm:text-base font-medium'>{item.name}</p>

                  <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                    <p>{currency}{item.price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Size: {item.size}</p>
                  </div>

                  <p className='mt-1'>
                    Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span>
                  </p>

                  {item.returnStatus !== 'none' && (
                    <div className='mt-2'>
                      <ReturnBadge status={item.returnStatus} />
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className='md:w-1/2 flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                  <p>{item.status}</p>
                </div>

                <div className='flex gap-2'>

                  <button onClick={loadOrderData} className='border px-4 py-2 text-sm'>
                    Track Order
                  </button>

                  {/* REVIEW */}
                  {isReviewed ? (
                    <button disabled className='text-gray-400 border px-4 py-2 text-sm'>
                      Reviewed
                    </button>
                  ) : canReview ? (
                    <button
                      onClick={() => setReviewProduct(item)}
                      className='border px-4 py-2 text-sm'
                    >
                      Review
                    </button>
                  ) : (
                    <button disabled className='text-gray-300 border px-4 py-2 text-sm'>
                      Review
                    </button>
                  )}

                  {/* RETURN */}
                  {canReturn && (
                    <button
                      onClick={() => setReturnOrder(item.orderRef)}
                      className='border border-red-300 text-red-500 px-4 py-2 text-sm'
                    >
                      Return
                    </button>
                  )}

                </div>
              </div>

            </div>
          )
        })}
      </div>

      {reviewProduct && (
        <ReviewModal
    product={reviewProduct}
    onClose={() => setReviewProduct(null)}
    onSubmitted={() => {
      loadOrderData()
  }}
/>
      )}

      {returnOrder && (
        <ReturnModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSubmitted={loadOrderData}
        />
      )}
    </div>
  )
}

export default Order
