import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Orders = ({ token }) => {

  const [orders,        setOrders]        = useState([])
  const [loading,       setLoading]       = useState(false)
  const [sort,          setSort]          = useState('newest')
  const [returnModal,   setReturnModal]   = useState(null)
  const [selectedItems, setSelectedItems] = useState([])

  const fetchAllOrders = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await axios.get(backendUrl + '/api/order/list', { headers: { token } })
      if (res.data.success) setOrders(res.data.orders)
      else toast.error(res.data.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isItemReturned = (order, item) =>
    order.returnItems?.some(r => r._id === item._id && r.size === item.size)

  const statusHandler = async (e, order) => {
    const value = e.target.value
    if (value === 'Return') {
      setReturnModal(order)
      setSelectedItems([])
      return
    }
    try {
      const res = await axios.post(
        backendUrl + '/api/order/status',
        { orderId: order._id, status: value },
        { headers: { token } }
      )
      if (res.data.success) { toast.success('Status updated'); fetchAllOrders() }
      else toast.error(res.data.message)
    } catch { toast.error('Update failed') }
  }

  const toggleItem = (item) => {
    const exist = selectedItems.find(i => i._id === item._id && i.size === item.size)
    if (exist) setSelectedItems(prev => prev.filter(i => !(i._id === item._id && i.size === item.size)))
    else       setSelectedItems(prev => [...prev, item])
  }

  const submitReturn = async () => {
    if (!returnModal) return
    if (selectedItems.length === 0) { toast.error('Select at least 1 item'); return }
    try {
      const res = await axios.post(
        backendUrl + '/api/return/quick',
        { orderId: returnModal._id, returnItems: selectedItems },
        { headers: { token } }
      )
      if (res.data.success) { toast.success('Return completed'); setReturnModal(null); fetchAllOrders() }
      else toast.error(res.data.message)
    } catch (err) { toast.error(err.message) }
  }

  useEffect(() => { fetchAllOrders() }, [token])

  const sortedOrders = [...orders].sort((a, b) =>
    sort === 'newest' ? b.date - a.date : a.date - b.date
  )

  // Return status style helper
  const returnStatusStyle = (s) => ({
    pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved:  'bg-green-50  text-green-700  border-green-200',
    rejected:  'bg-red-50    text-red-600    border-red-200',
    completed: 'bg-blue-50   text-blue-700   border-blue-200',
  }[s] || '')

  return (
    <div className='flex flex-col gap-4'>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <h3 className='text-xl font-medium text-gray-700'>Order Page</h3>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className='border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 bg-white'
        >
          <option value='newest'>Latest to Oldest</option>
          <option value='oldest'>Oldest to Latest</option>
        </select>
      </div>

      {loading && <p className='text-gray-400 text-sm'>Loading...</p>}

      {/* ── Order rows ─────────────────────────────────────────────────────── */}
      <div>
        {sortedOrders.map((order, index) => {
          const hasReturnableItems = order.items.some(item => !isItemReturned(order, item))
          const rs = order.returnStatus

          return (
            <div
              key={index}
              className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border border-gray-200 p-5 md:p-8 my-3 text-xs sm:text-sm text-gray-700 hover:border-gray-300 transition-colors'
            >
              <img className='w-12' src={assets.parcel_icon} alt="" />

              {/* Items + Address */}
              <div>
                <div className='mb-3'>
                  {order.items.map((item, i) => {
                    const returned = isItemReturned(order, item)
                    return (
                      <div key={i} className='flex items-center gap-2 py-0.5'>
                        <p className={returned ? 'line-through text-gray-400' : ''}>
                          {item.name} x {item.quantity} <span className='text-gray-500'>{item.size}</span>
                          {i !== order.items.length - 1 && ','}
                        </p>
                        {returned && (
                          <span className='text-[10px] font-medium bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded-full'>
                            Returned
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <p className='font-medium text-gray-800'>
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p className='text-gray-500 mt-0.5'>{order.address.street}</p>
                <p className='text-gray-500'>{order.address.city}</p>
                <p className='text-gray-500'>{order.address.phone}</p>
              </div>

              {/* Order info */}
              <div className='flex flex-col gap-1'>
                <p>Items: <span className='font-medium'>{order.items.length}</span></p>
                <p>Method: <span className='font-medium'>{order.paymentMethod}</span></p>
                <p>Payment: <span className={`font-medium ${order.payment ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment ? 'Done' : 'Pending'}</span></p>
                <p>Date: <span className='font-medium'>{new Date(order.date).toLocaleDateString()}</span></p>

                {/* Return status badge */}
                {rs && rs !== 'none' && (
                  <span className={`mt-1 self-start text-[11px] font-semibold border px-2 py-0.5 rounded-full capitalize ${returnStatusStyle(rs)}`}>
                    Return: {rs}
                  </span>
                )}
              </div>

              {/* Amount */}
              <p className='text-sm font-semibold text-gray-800'>{currency} {order.amount}</p>

              {/* Actions */}
              <div className='flex flex-col gap-2'>
                <select
                  onChange={e => statusHandler(e, order)}
                  value={order.status}
                  className='p-2 border border-gray-300 rounded font-semibold text-sm bg-white'
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                  {hasReturnableItems && (
                    <option value="Return">↩ Return</option>
                  )}
                </select>
              </div>

            </div>
          )
        })}
      </div>

      {/* ── Return Modal ────────────────────────────────────────────────────── */}
      {returnModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>

            {/* Modal header */}
            <div className='flex items-center justify-between px-6 py-4 border-b'>
              <h3 className='font-semibold text-base text-gray-800'>Select Items to Return</h3>
              <button
                onClick={() => setReturnModal(null)}
                className='text-gray-400 hover:text-gray-600 text-2xl leading-none'
              >&times;</button>
            </div>

            {/* Order mini info */}
            <div className='px-6 py-3 bg-gray-50 border-b text-xs text-gray-500'>
              <span className='font-medium text-gray-700'>
                {returnModal.address.firstName} {returnModal.address.lastName}
              </span>
              {' · '}{new Date(returnModal.date).toLocaleDateString()}
              {' · '}{currency}{returnModal.amount}
            </div>

            {/* Item checkboxes */}
            <div className='px-6 py-4 divide-y divide-gray-100'>
              {returnModal.items.map((item, i) => {
                const returned  = isItemReturned(returnModal, item)
                const isChecked = selectedItems.some(s => s._id === item._id && s.size === item.size)

                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 py-3 cursor-pointer ${returned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type='checkbox'
                      disabled={returned}
                      checked={isChecked}
                      onChange={() => toggleItem(item)}
                      className='w-4 h-4 accent-pink-400 cursor-pointer flex-shrink-0'
                    />
                    <div className='flex-1'>
                      <p className={`text-sm font-medium ${returned ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {item.name}
                      </p>
                      <p className='text-xs text-gray-400 mt-0.5'>
                        Size: {item.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    {returned && (
                      <span className='text-[10px] font-semibold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full'>
                        Already returned
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {/* Modal footer */}
            <div className='flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-lg'>
              <p className='text-xs text-gray-400'>
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={() => setReturnModal(null)}
                  className='px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  disabled={selectedItems.length === 0}
                  className='px-5 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                >
                  Confirm Return
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Orders