import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const ChartIcon = () => (
  <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <line x1='18' y1='20' x2='18' y2='10' />
    <line x1='12' y1='20' x2='12' y2='4' />
    <line x1='6' y1='20' x2='6' y2='14' />
  </svg>
)

const ReturnIcon = () => (
  <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <polyline points='1 4 1 10 7 10' />
    <path d='M3.51 15a9 9 0 1 0 .49-3.86' />
  </svg>
)

const StarIcon = () => (
  <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
  </svg>
)

const DiscountIcon = () => (
  <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
    <circle cx='8.5' cy='8.5' r='1.5' />
    <circle cx='15.5' cy='15.5' r='1.5' />
    <path d='M7 17L17 7' />
    <path d='M21 12.5V7a2 2 0 0 0-2-2h-5.5a2 2 0 0 0-1.41.59l-6.5 6.5a2 2 0 0 0 0 2.82l3.5 3.5a2 2 0 0 0 2.82 0l6.5-6.5A2 2 0 0 0 21 12.5z' />
  </svg>
)

const Sidebar = () => {
  const linkClass = 'flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1'

  return (
    <div className='w-[18%] min-h-screen border-r-2'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
        <NavLink className={linkClass} to='/add'>
          <img className='w-5 h-5' src={assets.add_icon} alt='' />
          <p className='hidden md:block'>Add Items</p>
        </NavLink>

        <NavLink className={linkClass} to='/list'>
          <img className='w-5 h-5' src={assets.order_icon} alt='' />
          <p className='hidden md:block'>List Items</p>
        </NavLink>

        <NavLink className={linkClass} to='/order'>
          <img className='w-5 h-5' src={assets.order_icon} alt='' />
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        <NavLink className={linkClass} to='/revenue'>
          <ChartIcon />
          <p className='hidden md:block'>Revenue</p>
        </NavLink>

        <NavLink className={linkClass} to='/reviews'>
          <StarIcon />
          <p className='hidden md:block'>Reviews</p>
        </NavLink>

        <NavLink className={linkClass} to='/returns'>
          <ReturnIcon />
          <p className='hidden md:block'>Returns</p>
        </NavLink>

        <NavLink className={linkClass} to='/discounts'>
          <DiscountIcon />
          <p className='hidden md:block'>Discounts</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
