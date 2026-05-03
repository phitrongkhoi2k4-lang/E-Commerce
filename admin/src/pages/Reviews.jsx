import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const formatReviewDate = (value) => {
  if (!value) return 'Unknown time'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'

  return date.toLocaleString()
}

const getInitial = (name = 'U') => name.trim().charAt(0).toUpperCase() || 'U'

const renderStars = (rating = 0) => (
  <div className='flex items-center gap-1'>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`text-sm ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
      >
        ★
      </span>
    ))}
  </div>
)

const Reviews = ({ token }) => {

  const [reviews, setReviews] = useState([])
  const [reply, setReply] = useState({})
  const [loading, setLoading] = useState(false)

  // ── FETCH REVIEWS ─────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)

      const res = await axios.get(
        backendUrl + '/api/review/all',
        { headers: { token } }
      )

      if (res.data.success) {
        setReviews(res.data.reviews || [])
      } else {
        toast.error(res.data.message)
      }

    } catch (err) {
      console.log(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  // ── REPLY ────────────────────────────────
  const handleReply = async (id) => {
    if (!reply[id]?.trim()) {
      return toast.error('Reply is empty')
    }

    try {
      const res = await axios.post(
        backendUrl + '/api/review/reply',
        { reviewId: id, message: reply[id] },
        { headers: { token } }
      )

      if (res.data.success) {
        toast.success('Replied')
        setReply(prev => ({ ...prev, [id]: '' }))
        fetchReviews()
      } else {
        toast.error(res.data.message)
      }

    } catch (err) {
      console.log(err)
      toast.error(err.message)
    }
  }

  // ── DELETE ───────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete review?')) return

    try {
      const res = await axios.post(
        backendUrl + '/api/review/delete',
        { reviewId: id },
        { headers: { token } }
      )

      if (res.data.success) {
        toast.success('Deleted')
        fetchReviews()
      } else {
        toast.error(res.data.message)
      }

    } catch (err) {
      console.log(err)
      toast.error(err.message)
    }
  }

  // ── INIT ────────────────────────────────
  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h3 className='text-2xl font-semibold text-gray-800'>Customer Reviews</h3>
          <p className='text-sm text-gray-400 mt-1'>Manage feedback, reply to customers, and moderate comments.</p>
        </div>
        {!loading && reviews.length > 0 && (
          <div className='rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-500 shadow-sm'>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {loading && (
        <div className='rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-400 shadow-sm'>
          Loading reviews...
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className='rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center text-sm text-gray-400'>
          No reviews found
        </div>
      )}

      {reviews.map(r => (
        <div key={r._id} className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3 min-w-0'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-500 border border-rose-100'>
                {getInitial(r.userName)}
              </div>
              <div className='min-w-0'>
                <p className='font-semibold text-gray-800'>{r.userName}</p>
                <div className='mt-1'>
                  {renderStars(r.rating)}
                </div>
              </div>
            </div>

            {r.product ? (
              <div className='flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 border border-gray-100 max-w-[360px]'>
                {r.product.image && (
                  <img
                    src={r.product.image}
                    alt={r.product.name}
                    className='w-14 h-14 object-cover rounded-lg border border-gray-200'
                  />
                )}
                <div className='min-w-0'>
                  <p className='text-xs uppercase tracking-[0.16em] text-gray-400'>Product</p>
                  <p className='text-sm font-medium text-gray-700 truncate'>{r.product.name}</p>
                </div>
              </div>
            ) : (
              <div className='rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-400 border border-gray-100'>
                Product unavailable
              </div>
            )}
          </div>

          <div className='mt-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100'>
            <p className='text-xs font-medium uppercase tracking-[0.14em] text-slate-400'>Reviewed At</p>
            <p className='text-sm text-slate-500 mt-1'>{formatReviewDate(r.date)}</p>
            <p className='text-xs font-medium uppercase tracking-[0.14em] text-slate-400 mt-3'>Comment</p>
            <p className='text-sm text-slate-700 mt-1 leading-6'>{r.comment}</p>
          </div>

          {/* ADMIN REPLY */}
          {r.adminReply && (
            <div className='mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3'>
              <p className='text-xs font-medium uppercase tracking-[0.14em] text-blue-400'>Admin Reply</p>
              <p className='mt-1 text-sm text-blue-700'>{r.adminReply.message}</p>
            </div>
          )}

          {/* INPUT */}
          <input
            value={reply[r._id] || ''}
            placeholder='Reply...'
            onChange={e =>
              setReply(prev => ({
                ...prev,
                [r._id]: e.target.value
              }))
            }
            className='mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-rose-300'
          />

          <div className='flex gap-3 mt-4'>
            <button
              onClick={() => handleReply(r._id)}
              className='rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600'
            >
              Reply
            </button>

            <button
              onClick={() => handleDelete(r._id)}
              className='rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50'
            >
              Delete
            </button>
          </div>

        </div>
      ))}

    </div>
  )
}

export default Reviews
