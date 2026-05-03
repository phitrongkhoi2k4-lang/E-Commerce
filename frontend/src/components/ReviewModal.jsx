import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const MAX_IMAGES   = 5
const MAX_VIDEO_MB = 50

// ── Star selector ─────────────────────────────────────────────────────────────
const StarSelector = ({ value, onChange }) => (
    <div className='flex gap-2'>
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type='button'
                onClick={() => onChange(star)}
                className='text-3xl transition-transform hover:scale-110 focus:outline-none leading-none'
                style={{ color: star <= value ? '#f59e0b' : '#d1d5db' }}
            >
                ★
            </button>
        ))}
    </div>
)

// ── Media thumbnail with remove button ───────────────────────────────────────
const MediaThumb = ({ file, onRemove }) => {
    const url      = URL.createObjectURL(file)
    const isVideo  = file.type.startsWith('video/')
    return (
        <div className='relative w-20 h-20 rounded overflow-hidden border border-gray-200 flex-shrink-0'>
            {isVideo
                ? <video src={url} className='w-full h-full object-cover' />
                : <img   src={url} alt='' className='w-full h-full object-cover' />
            }
            <button
                type='button'
                onClick={onRemove}
                className='absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none'
            >
                ✕
            </button>
        </div>
    )
}

// ── Main modal ────────────────────────────────────────────────────────────────
const ReviewModal = ({ product, onClose, onSubmitted }) => {
    const { backendUrl, token } = useContext(ShopContext)

    const [rating,     setRating]     = useState(0)
    const [comment,    setComment]    = useState('')
    const [images,     setImages]     = useState([])
    const [videos,     setVideos]     = useState([])
    const [submitting, setSubmitting] = useState(false)

    // ✅ FIX: lấy userId từ token (KHÔNG ĐỤNG UI)
    const getUserIdFromToken = () => {
        try {
            if (!token) return null
            const payload = JSON.parse(atob(token.split('.')[1]))
            return payload.id
        } catch {
            return null
        }
    }

    const handleImages = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'))
        const combined = [...images, ...files].slice(0, MAX_IMAGES)
        if (images.length + files.length > MAX_IMAGES) toast.error(`Max ${MAX_IMAGES} images`)
        setImages(combined)
    }

    const handleVideos = (e) => {
        const files = Array.from(e.target.files).filter(f => {
            if (!f.type.startsWith('video/')) return false
            if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
                toast.error(`"${f.name}" exceeds ${MAX_VIDEO_MB}MB`)
                return false
            }
            return true
        })
        const combined = [...videos, ...files].slice(0, 2)
        if (videos.length + files.length > 2) toast.error('Max 2 videos')
        setVideos(combined)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const userId = getUserIdFromToken()

        // ❌ giữ nguyên UI → chỉ validate logic
        if (!product?._id) {
            toast.error('Missing product')
            return
        }

        if (!userId) {
            toast.error('User error')
            return
        }

        if (rating === 0) {
            toast.error('Please select a star rating')
            return
        }

        if (!comment.trim()) {
            toast.error('Please write a comment')
            return
        }

        if (comment.length > 1000) {
            toast.error('Comment too long (max 1000 chars)')
            return
        }

        try {
            setSubmitting(true)

            const fd = new FormData()
            fd.append('productId', product._id)
            fd.append('rating', rating)
            fd.append('comment', comment.trim())

            images.forEach(f => fd.append('images', f))
            videos.forEach(f => fd.append('videos', f))

            const res = await axios.post(
                backendUrl + '/api/review/add',
                fd,
                { headers: { token } }
            )

            if (res.data.success) {
                toast.success('Review submitted!')
                onSubmitted && onSubmitted()
                onClose()
            } else {
                toast.error(res.data.message)
            }

        } catch (err) {
            toast.error(err.response?.data?.message || err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        // Backdrop
        <div
            className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={onClose}
        >
            {/* Modal box — stop click bubbling */}
            <div
                className='bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl'
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-4 border-b'>
                    <div>
                        <p className='font-medium text-base'>Write a Review</p>
                        <p className='text-xs text-gray-400 mt-0.5 truncate max-w-[280px]'>{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4'
                    >
                        &times;
                    </button>
                </div>

                {/* Product mini-card */}
                <div className='flex items-center gap-3 px-6 py-3 bg-gray-50 border-b'>
                    <img src={product.image?.[0]} alt='' className='w-14 h-14 object-cover rounded border' />
                    <div>
                        <p className='text-sm font-medium text-gray-700 line-clamp-1'>{product.name}</p>
                        <p className='text-xs text-gray-400'>Size: {product.size}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='px-6 py-5 flex flex-col gap-5'>

                    {/* Star rating */}
                    <div>
                        <p className='text-sm text-gray-600 mb-2 font-medium'>
                            Your Rating <span className='text-red-400'>*</span>
                        </p>
                        <StarSelector value={rating} onChange={setRating} />
                        {rating > 0 && (
                            <p className='text-xs text-gray-400 mt-1'>
                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <p className='text-sm text-gray-600 mb-2 font-medium'>
                            Comment <span className='text-red-400'>*</span>
                            <span className='font-normal text-gray-400 ml-1'>({comment.length}/1000)</span>
                        </p>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder='Share your experience with this product…'
                            className='w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none outline-none focus:border-gray-500'
                        />
                    </div>

                    {/* Image upload */}
                    <div>
                        <p className='text-sm text-gray-600 mb-2 font-medium'>
                            Photos
                            <span className='font-normal text-gray-400 ml-1'>(up to {MAX_IMAGES}, optional)</span>
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            {images.map((f, i) => (
                                <MediaThumb
                                    key={i} file={f}
                                    onRemove={() => setImages(prev => prev.filter((_, j) => j !== i))}
                                />
                            ))}
                            {images.length < MAX_IMAGES && (
                                <label className='w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer text-gray-400 hover:border-gray-400 text-2xl flex-shrink-0'>
                                    +
                                    <input type='file' accept='image/*' multiple hidden onChange={handleImages} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Video upload */}
                    <div>
                        <p className='text-sm text-gray-600 mb-2 font-medium'>
                            Videos
                            <span className='font-normal text-gray-400 ml-1'>(up to 2, max {MAX_VIDEO_MB}MB, optional)</span>
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            {videos.map((f, i) => (
                                <MediaThumb
                                    key={i} file={f}
                                    onRemove={() => setVideos(prev => prev.filter((_, j) => j !== i))}
                                />
                            ))}
                            {videos.length < 2 && (
                                <label className='w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer text-gray-400 hover:border-gray-400 text-2xl flex-shrink-0'>
                                    ▶
                                    <input type='file' accept='video/*' multiple hidden onChange={handleVideos} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Footer buttons */}
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
                            disabled={submitting}
                            className='px-6 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50'
                        >
                            {submitting ? 'Submitting…' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReviewModal