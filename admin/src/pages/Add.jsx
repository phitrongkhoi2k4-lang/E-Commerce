import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const [name,           setName]           = useState('')
  const [description,    setDescription]    = useState('')
  const [category,       setCategory]       = useState('Men')
  const [subCategory,    setSubCategory]    = useState('Topwear')
  const [bestseller,     setBestseller]     = useState(false)
  const [sizes,          setSizes]          = useState([])
  const [costPrice,      setCostPrice]      = useState('')
  const [sellingPrice,   setSellingPrice]   = useState('')
  const [sizeQuantities, setSizeQuantities] = useState({})

  const resetForm = () => {
    setName('')
    setDescription('')
    setCostPrice('')
    setSellingPrice('')
    setImage1(false); setImage2(false); setImage3(false); setImage4(false)
    setSizes([])
    setBestseller(false)
    setSizeQuantities({})
  }

  const toggleSize = (size) => {
    setSizes(prev => {
      if (prev.includes(size)) {
        setSizeQuantities(current => { const next = { ...current }; delete next[size]; return next })
        return prev.filter(item => item !== size)
      }
      setSizeQuantities(current => ({ ...current, [size]: '' }))
      return [...prev, size]
    })
  }

  const updateSizeQty = (size, value) => {
    setSizeQuantities(prev => ({ ...prev, [size]: value }))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (Number(sellingPrice) < Number(costPrice)) {
      toast.error('Selling Price must be greater than or equal to Cost Price')
      return
    }

    for (const size of sizes) {
      if (sizeQuantities[size] === '' || sizeQuantities[size] === undefined) {
        toast.error(`Please enter quantity for size ${size}`)
        return
      }
    }

    try {
      const formData = new FormData()
      formData.append('name',           name)
      formData.append('description',    description)
      formData.append('price',          sellingPrice)
      formData.append('category',       category)
      formData.append('subCategory',    subCategory)
      formData.append('bestseller',     bestseller)
      formData.append('sizes',          JSON.stringify(sizes))
      formData.append('costPrice',      costPrice)
      formData.append('sellingPrice',   sellingPrice)
      formData.append('sizeQuantities', JSON.stringify(sizeQuantities))

      image1 && formData.append('image1', image1)
      image2 && formData.append('image2', image2)
      image3 && formData.append('image3', image3)
      image4 && formData.append('image4', image4)

      const response = await axios.post(backendUrl + '/api/product/add', formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        resetForm()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const totalQty = Object.values(sizeQuantities).reduce((sum, value) => sum + Number(value || 0), 0)

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>

      {/* Images */}
      <div>
        <p className='mb-2'>Upload Image</p>
        <div className='flex gap-2'>
          {[[image1,setImage1,'image1'],[image2,setImage2,'image2'],[image3,setImage3,'image3'],[image4,setImage4,'image4']].map(([img,setImg,id]) => (
            <label key={id} htmlFor={id}>
              <img className='w-20' src={!img ? assets.upload_area : URL.createObjectURL(img)} alt='' />
              <input onChange={e => setImg(e.target.files[0])} type='file' id={id} hidden />
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className='w-full'>
        <p className='mb-2'>Product name</p>
        <input onChange={e => setName(e.target.value)} value={name}
          className='w-full max-w-[500px] px-3 py-2' type='text' placeholder='Type here' required />
      </div>

      {/* Description */}
      <div className='w-full'>
        <p className='mb-2'>Product description</p>
        <textarea onChange={e => setDescription(e.target.value)} value={description}
          className='w-full max-w-[500px] px-3 py-2' placeholder='Write content here' required />
      </div>

      {/* Category / SubCategory */}
      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product category</p>
          <select onChange={e => setCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value='Men'>Men</option>
            <option value='Woman'>Woman</option>
            <option value='Kids'>Kids</option>
          </select>
        </div>
        <div>
          <p className='mb-2'>Sub category</p>
          <select onChange={e => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value='Topwear'>Topwear</option>
            <option value='Bottomwear'>Bottomwear</option>
            <option value='Winterwear'>Winterwear</option>
          </select>
        </div>
      </div>

      {/* Cost & Selling Price */}
      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Cost Price <span className='text-xs text-gray-400'>(import price)</span></p>
          <input onChange={e => setCostPrice(e.target.value)} value={costPrice}
            className='w-full px-3 py-2 sm:w-[160px]' type='number' min='0' step='0.01' placeholder='e.g. 30' required />
        </div>
        <div>
          <p className='mb-2'>Selling Price <span className='text-xs text-gray-400'>(regular price)</span></p>
          <input onChange={e => setSellingPrice(e.target.value)} value={sellingPrice}
            className='w-full px-3 py-2 sm:w-[160px]' type='number' min='0' step='0.01' placeholder='e.g. 50' required />
        </div>
        {costPrice && sellingPrice && (
          <div className='flex items-end pb-2'>
            <p className='text-sm text-gray-500'>
              Margin:{' '}
              <span className={`font-medium ${Number(sellingPrice) >= Number(costPrice) ? 'text-green-600' : 'text-red-500'}`}>
                ${(Number(sellingPrice) - Number(costPrice)).toFixed(2)}
                {Number(costPrice) > 0 && ` (${(((Number(sellingPrice) - Number(costPrice)) / Number(costPrice)) * 100).toFixed(1)}%)`}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Sizes & Quantities */}
      <div className='w-full'>
        <p className='mb-2'>Product Sizes & Stock Quantity</p>
        <div className='flex gap-3 mb-3'>
          {ALL_SIZES.map(size => (
            <div key={size} onClick={() => toggleSize(size)}>
              <p className={`${sizes.includes(size) ? 'bg-pink-100 border border-pink-300' : 'bg-slate-200'} px-3 py-1 cursor-pointer text-sm font-medium rounded`}>
                {size}
              </p>
            </div>
          ))}
        </div>
        {sizes.length > 0 && (
          <div className='flex flex-wrap gap-3 p-3 bg-gray-50 rounded border border-gray-200'>
            {sizes.map(size => (
              <div key={size} className='flex flex-col items-center gap-1'>
                <label className='text-xs font-semibold text-gray-600'>{size}</label>
                <input type='number' min='0' value={sizeQuantities[size] ?? ''}
                  onChange={e => updateSizeQty(size, e.target.value)} placeholder='0'
                  className='w-16 text-center border rounded px-2 py-1 text-sm outline-none focus:border-pink-400' required />
              </div>
            ))}
            <div className='flex flex-col items-center justify-end gap-1 ml-auto'>
              <p className='text-xs text-gray-400'>Total</p>
              <p className='text-sm font-semibold text-gray-700'>{totalQty}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bestseller */}
      <div className='flex gap-2 mt-2'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type='checkbox' id='bestseller' />
        <label className='cursor-pointer' htmlFor='bestseller'>Add to bestseller</label>
      </div>

      <button type='submit' className='w-28 py-3 mt-4 bg-black text-white'>ADD</button>
    </form>
  )
}

export default Add