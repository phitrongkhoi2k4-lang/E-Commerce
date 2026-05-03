// frontend/src/components/ReviewList.jsx
import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'

// ── Static stars display ──────────────────────────────────────────────────────
const Stars = ({ rating, size = 'sm' }) => (
    <span className={size === 'lg' ? 'text-2xl' : 'text-sm'}>
        {[1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
        ))}
    </span>
)

// ── Rating distribution bar ───────────────────────────────────────────────────
const RatingBar = ({ star, count, total }) => (
    <div className='flex items-center gap-2 text-xs text-gray-500'>
        <span className='w-2'>{star}</span>
        <span style={{ color: '#f59e0b' }}>★</span>
        <div className='flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden'>
            <div
                className='h-full rounded-full transition-all'
                style={{
                    width: total ? `${(count / total) * 100}%` : '0%',
                    background: '#f59e0b'
                }}
            />
        </div>
        <span className='w-4 text-right'>{count}</span>
    </div>
)

// ── Image / video lightbox ────────────────────────────────────────────────────
const Lightbox = ({ images, videos, startIndex, onClose }) => (
    <div
        className='fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4'
        onClick={onClose}
    >
        <div className='flex flex-wrap gap-3 max-w-3xl justify-center' onClick={e => e.stopPropagation()}>
            {images.map((url, i) => (
                <img key={i} src={url} alt='' className='max-h-[75vh] rounded object-contain' loading='lazy' />
            ))}
            {videos.map((url, i) => (
                <video key={i} src={url} controls className='max-h-[75vh] rounded' />
            ))}
        </div>
        <button onClick={onClose} className='absolute top-4 right-5 text-white text-4xl leading-none'>&times;</button>
    </div>
)

// ── Single review card ────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
    const [lightbox, setLightbox] = useState(false)
    const hasMedia = review.images?.length > 0 || review.videos?.length > 0

    return (
        <div className='py-5 border-b border-gray-100 last:border-0'>
            <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                    {/* Avatar circle */}
                    <div className='w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0'>
                        {(review.userName || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                        <p className='text-sm font-medium'>{review.userName || 'Anonymous'}</p>
                        <p className='text-xs text-gray-400'>{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <Stars rating={review.rating} />
            </div>

            <p className='mt-3 text-sm text-gray-600 leading-relaxed'>{review.comment}</p>

            {/* Media thumbnails */}
            {hasMedia && (
                <div className='flex flex-wrap gap-2 mt-3'>
                    {review.images?.map((url, i) => (
                        <img
                            key={i} src={url} alt=''
                            loading='lazy'
                            onClick={() => setLightbox(true)}
                            className='w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity'
                        />
                    ))}
                    {review.videos?.map((url, i) => (
                        <div
                            key={i}
                            onClick={() => setLightbox(true)}
                            className='w-16 h-16 rounded border border-gray-200 cursor-pointer hover:opacity-80 bg-gray-100 flex items-center justify-center'
                        >
                            <span className='text-gray-500 text-xl'>▶</span>
                        </div>
                    ))}
                </div>
            )}

            {lightbox && (
                <Lightbox
                    images={review.images || []}
                    videos={review.videos || []}
                    onClose={() => setLightbox(false)}
                />
            )}
        </div>
    )
}

// ── Main ReviewList ───────────────────────────────────────────────────────────
const ReviewList = ({ productId, backendUrl, refreshTrigger, onCountChange }) => {
    const [reviews, setReviews] = useState([])
    const [sort,    setSort]    = useState('newest')  // newest | highest | lowest
    const [loading, setLoading] = useState(true)

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${backendUrl}/api/review/product/${productId}`)
            if (res.data.success) {
                const revs = res.data.reviews
                setReviews(revs)
                const avg = revs.length
                    ? revs.reduce((s, r) => s + r.rating, 0) / revs.length
                    : 0
                onCountChange?.(revs.length, avg)  // tell Product page count + average
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [productId, backendUrl])

    // Refetch whenever parent increments refreshTrigger (new review submitted)
    useEffect(() => { fetchReviews() }, [fetchReviews, refreshTrigger])

    const sorted = [...reviews].sort((a, b) => {
        if (sort === 'newest')  return b.date - a.date
        if (sort === 'highest') return b.rating - a.rating
        if (sort === 'lowest')  return a.rating - b.rating
        return 0
    })

    const total = reviews.length
    const avg   = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0
    const dist  = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }))

    return (
        <div>
            <div className='flex items-center justify-between mb-4'>
                <h3 className='text-base font-medium'>
                    Customer Reviews
                    {total > 0 && <span className='text-gray-400 font-normal text-sm ml-2'>({total})</span>}
                </h3>

                {/* Sort control */}
                {total > 1 && (
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className='text-sm border border-gray-300 rounded px-3 py-1 outline-none'
                    >
                        <option value='newest'>Newest</option>
                        <option value='highest'>Highest rating</option>
                        <option value='lowest'>Lowest rating</option>
                    </select>
                )}
            </div>

            {/* Rating summary — only shown when there are reviews */}
            {total > 0 && (
                <div className='flex flex-col sm:flex-row gap-5 mb-6 p-4 bg-gray-50 rounded-lg'>
                    <div className='flex flex-col items-center justify-center min-w-[80px]'>
                        <p className='text-4xl font-semibold leading-none'>{avg}</p>
                        <Stars rating={Math.round(avg)} size='lg' />
                        <p className='text-xs text-gray-400 mt-1'>{total} review{total !== 1 ? 's' : ''}</p>
                    </div>
                    <div className='flex-1 flex flex-col gap-1.5 justify-center'>
                        {dist.map(({ star, count }) => (
                            <RatingBar key={star} star={star} count={count} total={total} />
                        ))}
                    </div>
                </div>
            )}

            {/* Review cards */}
            {loading ? (
                <p className='text-sm text-gray-400 py-4'>Loading reviews…</p>
            ) : sorted.length === 0 ? (
                <p className='text-sm text-gray-400 py-4'>No reviews yet. Be the first to review this product!</p>
            ) : (
                sorted.map(r => <ReviewCard key={r._id} review={r} />)
            )}
        </div>
    )
}

export default ReviewList