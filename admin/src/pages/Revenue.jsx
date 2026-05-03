// admin/src/pages/Revenue.jsx
import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  LineChart, Line,
  BarChart,  Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ── Aggregation helper ────────────────────────────────────────────────────────
// Groups orders by day / month / quarter and sums both revenue and profit.
// Returns: [{ label, revenue, profit }, ...] sorted chronologically
const aggregate = (orders, filter) => {
  const map = {}

  orders.forEach(order => {
    const d = new Date(order.date)
    let key
    let sortValue

    if (filter === 'day') {
      key = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
      sortValue = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    } else if (filter === 'month') {
      key = `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    } else {
      const q = Math.ceil((d.getMonth() + 1) / 3)
      key = `Q${q} ${d.getFullYear()}`
      sortValue = new Date(d.getFullYear(), (q - 1) * 3, 1).getTime()
    }

    if (!map[key]) map[key] = { revenue: 0, profit: 0, sortValue }
    map[key].revenue += order.amount  || 0
    map[key].profit  += order.profit  || 0
  })

  return Object.entries(map)
    .map(([label, vals]) => ({
      label,
      revenue: parseFloat(vals.revenue.toFixed(2)),
      profit:  parseFloat(vals.profit.toFixed(2)),
      sortValue: vals.sortValue,
    }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .map(({ sortValue, ...item }) => item)
}

// ── Table aggregation — keeps refund rows as separate labelled entries ───────────
const aggregateTable = (orders, filter) => {
  const salesMap  = {}
  const refundMap = {}
  const sortMap = {}

  orders.forEach(order => {
    const d = new Date(order.date)
    let key
    let sortValue

    if (filter === 'day') {
      key = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
      sortValue = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    } else if (filter === 'month') {
      key = `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      sortValue = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
    } else {
      const q = Math.ceil((d.getMonth() + 1) / 3)
      key = `Q${q} ${d.getFullYear()}`
      sortValue = new Date(d.getFullYear(), (q - 1) * 3, 1).getTime()
    }

    sortMap[key] = sortValue

    if (order.isRefund) {
      if (!refundMap[key]) refundMap[key] = { revenue: 0, profit: 0 }
      refundMap[key].revenue += order.amount || 0
      refundMap[key].profit  += order.profit || 0
    } else {
      if (!salesMap[key]) salesMap[key] = { revenue: 0, profit: 0 }
      salesMap[key].revenue += order.amount || 0
      salesMap[key].profit  += order.profit || 0
    }
  })

  // Merge: for each label, push a sales row then optionally a refund row
  const allKeys = new Set([...Object.keys(salesMap), ...Object.keys(refundMap)])
  const rows = []

  Array.from(allKeys).sort((a, b) => (sortMap[a] || 0) - (sortMap[b] || 0)).forEach(label => {
    if (salesMap[label]) {
      rows.push({
        label,
        revenue:  parseFloat(salesMap[label].revenue.toFixed(2)),
        profit:   parseFloat(salesMap[label].profit.toFixed(2)),
        isRefund: false,
      })
    }
    if (refundMap[label]) {
      rows.push({
        label,
        revenue:  parseFloat(refundMap[label].revenue.toFixed(2)),  // negative
        profit:   parseFloat(refundMap[label].profit.toFixed(2)),   // negative
        isRefund: true,
      })
    }
  })

  return rows
}

// ── Summary card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color = 'text-gray-800' }) => (
  <div className='bg-white border border-gray-200 rounded-lg px-6 py-4 flex flex-col gap-1 min-w-[160px]'>
    <p className='text-xs text-gray-400 uppercase tracking-wide'>{label}</p>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    {sub && <p className='text-xs text-gray-400'>{sub}</p>}
  </div>
)

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null
  const val = payload.find(p => p.dataKey === metric)
  return (
    <div className='bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm text-sm'>
      <p className='font-medium text-gray-700 mb-1'>{label}</p>
      {val && <p style={{ color: val.color }}>{currency}{val.value.toLocaleString()}</p>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const Revenue = ({ token }) => {
  const [orders,    setOrders]    = useState([])
  const [filter,    setFilter]    = useState('day')   // 'day' | 'month' | 'quarter'
  const [chartType, setChartType] = useState('line')    // 'line' | 'bar'
  const [metric,    setMetric]    = useState('revenue') // 'revenue' | 'profit'  ← NEW
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!token) return
      try {
        setLoading(true)
        const res = await axios.get(backendUrl + '/api/order/revenue', { headers: { token } })
        if (res.data.success) setOrders(res.data.orders)
        else toast.error(res.data.message)
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token])

  const chartData  = useMemo(() => aggregate(orders, filter),      [orders, filter])
  const tableData  = useMemo(() => aggregateTable(orders, filter), [orders, filter])

  // Summary totals
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (o.amount  || 0), 0), [orders])
  const totalProfit  = useMemo(() => orders.reduce((s, o) => s + (o.profit  || 0), 0), [orders])
  const totalOrders  = orders.filter(o => !o.isRefund).length
  const margin       = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

  // Chart config per metric
  const COLORS = { revenue: '#C586A5', profit: '#4ade80' }
  const LABELS = {
    revenue: 'Revenue Over Time',
    profit:  'Profit Over Time',
  }

  const activeColor = COLORS[metric]

  return (
    <div className='flex flex-col gap-6'>

      {/* Header */}
      <div>
        <h2 className='text-2xl font-medium text-gray-700'>Revenue & Profit Dashboard</h2>
        <p className='text-sm text-gray-400 mt-1'>Calculated from all placed orders</p>
      </div>

      {/* Summary cards */}
      <div className='flex flex-wrap gap-4'>
        <StatCard label='Total Revenue'   value={`${currency}${totalRevenue.toLocaleString()}`} />
        <StatCard
          label='Total Profit'
          value={`${currency}${totalProfit.toLocaleString()}`}
          sub={`${margin}% margin`}
          color={totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}
        />
        <StatCard label='Total Orders'    value={totalOrders} />
        <StatCard label='Avg Order Value' value={`${currency}${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0}`} />
      </div>

      {/* Controls row */}
      <div className='flex flex-wrap items-end gap-4'>

        {/* Metric toggle — Revenue vs Profit */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400 uppercase tracking-wide'>Show</label>
          <div className='flex border border-gray-300 rounded overflow-hidden text-sm'>
            {['revenue','profit'].map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-1.5 capitalize transition-colors ${metric === m ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Filter dropdown */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400 uppercase tracking-wide'>Group by</label>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className='border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 bg-white'
          >
            <option value='day'>Day</option>
            <option value='month'>Month</option>
            <option value='quarter'>Quarter</option>
          </select>
        </div>

        {/* Chart type toggle */}
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-400 uppercase tracking-wide'>Chart type</label>
          <div className='flex border border-gray-300 rounded overflow-hidden text-sm'>
            {['line','bar'].map(ct => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                className={`px-4 py-1.5 capitalize transition-colors ${chartType === ct ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Chart card */}
      <div className='bg-white border border-gray-200 rounded-lg p-4'>
        <p className='text-sm font-medium text-gray-500 mb-3'>{LABELS[metric]}</p>

        {loading ? (
          <div className='flex items-center justify-center h-64 text-gray-400 text-sm'>Loading data…</div>
        ) : chartData.length === 0 ? (
          <div className='flex items-center justify-center h-64 text-gray-400 text-sm'>No order data found.</div>
        ) : (
          <ResponsiveContainer width='100%' height={320}>
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='label' tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={v => `${currency}${v.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip metric={metric} />} />
                <Legend />
                <Line
                  type='monotone' dataKey={metric} stroke={activeColor}
                  strokeWidth={2} dot={{ r: 4, fill: activeColor }}
                  activeDot={{ r: 6 }} name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis dataKey='label' tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={v => `${currency}${v.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip metric={metric} />} />
                <Legend />
                <Bar
                  dataKey={metric} fill={activeColor} radius={[4,4,0,0]}
                  name={metric.charAt(0).toUpperCase() + metric.slice(1)}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Data table */}
      {!loading && tableData.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
          <div className='hidden md:grid grid-cols-4 bg-gray-50 px-4 py-2 text-xs text-gray-400 uppercase tracking-wide'>
            <span>Period</span>
            <span>Revenue</span>
            <span>Profit</span>
            <span>Margin</span>
          </div>
          {tableData.map((row, i) => {
            const absRevenue = Math.abs(row.revenue)
            const absProfit  = Math.abs(row.profit)
            const rowMargin  = absRevenue > 0 ? ((absProfit / absRevenue) * 100).toFixed(1) : '—'
            return (
              <div key={i} className={`grid grid-cols-2 md:grid-cols-4 px-4 py-2.5 border-t border-gray-100 text-sm text-gray-700 ${row.isRefund ? 'bg-red-50' : ''}`}>
                {/* Period label + Refund badge */}
                <span className='font-medium flex items-center gap-1.5'>
                  {row.label}
                  {row.isRefund && (
                    <span className='text-[10px] bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold'>Refund</span>
                  )}
                </span>
                {/* Revenue — show (-$X) for refunds */}
                <span className={row.isRefund ? 'text-red-500 font-medium' : ''}>
                  {row.isRefund ? `(-${currency}${absRevenue.toLocaleString()})` : `${currency}${row.revenue.toLocaleString()}`}
                </span>
                {/* Profit */}
                <span className={row.profit >= 0 ? 'text-green-600' : 'text-red-500 font-medium'}>
                  {row.isRefund ? `(-${currency}${absProfit.toLocaleString()})` : `${currency}${row.profit.toLocaleString()}`}
                </span>
                <span className='hidden md:block text-gray-400'>{rowMargin}{rowMargin !== '—' ? '%' : ''}</span>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

export default Revenue
