// admin/src/pages/Returns.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Returns = ({ token }) => {

  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')

  const fetchReturns = async () => {
    if (!token) return null
    try {
      const res = await axios.get(backendUrl + '/api/return/admin', { headers: { token } })
      if (res.data.success) {
        const returnOrders = (res.data.orders || []).filter(order =>
          order.returnRequested ||
          ['pending', 'approved', 'rejected', 'completed'].includes(order.returnStatus)
        )
        setOrders(returnOrders)
      }
      else toast.error(res.data.message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      const res = await axios.post(
        backendUrl + '/api/return/update',
        { orderId, status },
        { headers: { token } }
      )
      if (res.data.success) {
        toast.success(res.data.message)
        await fetchReturns()
      } else {
        toast.error(res.data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReturns() }, [token])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.returnStatus === filter)

  const badgeStyle = {
    pending:   'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-600',
    completed: 'bg-blue-100 text-blue-700',
  }

  return (
    <div>
      <h3>Return Requests</h3>

      {/* Filter tabs */}
      <div className='flex flex-wrap gap-2 my-4'>
        {['all', 'pending', 'approved', 'rejected', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded border capitalize transition-colors ${
              filter === f
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {f}
            <span className='ml-1.5 text-xs opacity-60'>
              ({f === 'all' ? orders.length : orders.filter(o => o.returnStatus === f).length})
            </span>
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 && (
          <p className='text-sm text-gray-400 py-4'>No return requests found.</p>
        )}

        {filtered.map((order, index) => (
          <div
            key={index}
            className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700'
          >
            {/* Parcel icon — same as Orders */}
            <img className='w-12' src={assets.parcel_icon} alt="" />

            {/* Customer info + items */}
            <div>
              <div>
                {/* Show return items if customer selected specific ones, else show all */}
                {(order.returnItems?.length > 0 ? order.returnItems : order.items).map((item, i, arr) => (
                  <p className='py-0.5' key={i}>
                    {order.returnItems?.length > 0 && <span className='text-pink-400 mr-1'>↩</span>}
                    {item.name} x {item.quantity}
                    <span> {item.size} </span>
                    {i < arr.length - 1 && ','}
                  </p>
                ))}
                {order.returnItems?.length > 0 && order.returnItems.length < order.items?.length && (
                  <p className='text-[10px] text-gray-400'>
                    ({order.returnItems.length} of {order.items.length} items)
                  </p>
                )}
              </div>
              <p className='mt-3 mb-2 font-medium'>
                {order.address.firstName + ' ' + order.address.lastName}
              </p>
              <div>
                <p>{order.address.street + ','}</p>
                <p>{order.address.city + ', ' + order.address.state + ', ' + order.address.country + ', ' + order.address.zipcode}</p>
              </div>
              <p>{order.address.phone}</p>

              {/* Return reason shown below address */}
              {order.returnReason && (
                <div className='mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600'>
                  <span className='font-medium text-gray-700'>Reason: </span>
                  {order.returnReason}
                </div>
              )}
            </div>

            {/* Order meta — same as Orders */}
            <div>
              <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
              <p className='mt-3'>Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              {order.returnDate && (
                <p className='mt-1 text-yellow-700'>
                  Returned: {new Date(order.returnDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Amount */}
            <p className='text-sm sm:text-[15px]'>{currency} {order.amount}</p>

            {/* Return status + action buttons — replaces order status dropdown */}
            <div className='flex flex-col gap-2'>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize self-start ${badgeStyle[order.returnStatus] || 'bg-gray-100 text-gray-500'}`}>
                {order.returnStatus}
              </span>

              {order.returnStatus === 'pending' && (
                <div className='flex gap-2 flex-wrap'>
                  <button
                    onClick={() => updateStatus(order._id, 'approved')}
                    className='text-xs text-green-600 border border-green-200 px-2.5 py-1 rounded hover:bg-green-50'
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(order._id, 'rejected')}
                    className='text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded hover:bg-red-50'
                  >
                    Reject
                  </button>
                </div>
              )}
              {order.returnStatus === 'approved' && (
                <button
                  onClick={() => updateStatus(order._id, 'completed')}
                  className='text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded hover:bg-blue-50 self-start'
                >
                  Mark Completed
                </button>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default Returns
