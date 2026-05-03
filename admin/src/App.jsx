import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AdminChat from './components/AdminChat'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Revenue from './pages/Revenue'
import Reviews from './pages/Reviews'
import Returns from './pages/Returns'
import Discounts from './pages/Discounts'
import Login from './components/Login'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '$'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === '' ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/order' element={<Orders token={token} />} />
                <Route path='/revenue' element={<Revenue token={token} />} />
                <Route path='/reviews' element={<Reviews token={token} />} />
                <Route path='/returns' element={<Returns token={token} />} />
                <Route path='/discounts' element={<Discounts token={token} />} />
              </Routes>
            </div>
          </div>
          <AdminChat token={token} />
        </>
      )}
    </div>
  )
}

export default App
