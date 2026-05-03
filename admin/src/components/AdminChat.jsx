// admin/src/components/AdminChat.jsx
import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { backendUrl } from '../App'

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
)
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
)
const SendIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
)
const BackIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
)

const AdminChat = ({ token }) => {
    const [open,           setOpen]           = useState(false)
    const [threads,        setThreads]        = useState([])   // all customer chats
    const [activeUserId,   setActiveUserId]   = useState(null) // selected thread
    const [messages,       setMessages]       = useState([])
    const [input,          setInput]          = useState('')
    const [connected,      setConnected]      = useState(false)
    const [totalUnread,    setTotalUnread]    = useState(0)

    const socketRef = useRef(null)
    const bottomRef = useRef(null)
    const inputRef  = useRef(null)

    useEffect(() => {
        if (!token || !backendUrl) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        socketRef.current = socket

        socket.on('connect', () => {
            setConnected(true)
            socket.emit('authenticate', { token, role: 'admin' })
        })
        socket.on('disconnect',    () => setConnected(false))
        socket.on('connect_error', (err) => console.error('Admin socket error:', err.message))
        socket.on('auth_error',    (err) => console.error('Admin auth error:', err))
        socket.on('connect_error', (err) => console.error('Socket connect error:', err))

        // Receive all threads on connect
        socket.on('all_threads', (data) => {
            setThreads(data)
            setTotalUnread(data.reduce((s, t) => s + (t.unreadAdmin || 0), 0))
        })

        // New message from a customer
        socket.on('customer_message', ({ userId, userName, message, unreadAdmin }) => {
            // Update thread list
            setThreads(prev => {
                const exists = prev.find(t => t.userId === userId)
                if (exists) {
                    return prev.map(t => t.userId === userId
                        ? { ...t, messages: [...t.messages, message], unreadAdmin, updatedAt: Date.now() }
                        : t
                    ).sort((a, b) => b.updatedAt - a.updatedAt)
                }
                return [{ userId, userName, messages: [message], unreadAdmin, updatedAt: Date.now() }, ...prev]
            })

            // If this thread is active, append message directly
            if (activeUserId === userId) {
                setMessages(prev => [...prev, message])
            }

            // Update total unread
            setTotalUnread(n => n + 1)
        })

        // Admin reply echoed to other admin tabs
        socket.on('admin_message_sent', ({ userId, message }) => {
            setThreads(prev => prev.map(t =>
                t.userId === userId
                    ? { ...t, messages: [...t.messages, message], updatedAt: Date.now() }
                    : t
            ))
            if (activeUserId === userId) {
                setMessages(prev => [...prev, message])
            }
        })

        // Thread history when admin opens a conversation
        socket.on('thread_history', ({ userId, messages: msgs }) => {
            if (activeUserId === userId || !activeUserId) {
                setMessages(msgs)
            }
        })

        return () => socket.disconnect()
    }, [token, backendUrl])

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when thread opens
    useEffect(() => {
        if (activeUserId) inputRef.current?.focus()
    }, [activeUserId])

    const openThread = (userId) => {
        setActiveUserId(userId)
        socketRef.current?.emit('get_thread', { userId })
        // Clear unread locally
        setThreads(prev => prev.map(t => t.userId === userId ? { ...t, unreadAdmin: 0 } : t))
        setTotalUnread(prev => {
            const thread = threads.find(t => t.userId === userId)
            return Math.max(0, prev - (thread?.unreadAdmin || 0))
        })
    }

    const sendReply = () => {
        const text = input.trim()
        if (!text || !activeUserId || !socketRef.current) return
        socketRef.current.emit('admin_message', { userId: activeUserId, text })
        setInput('')
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
    }

    const activeThread = threads.find(t => t.userId === activeUserId)

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

            {open && (
                <div style={{
                    position:      'absolute',
                    bottom:        '64px',
                    right:         0,
                    width:         '340px',
                    height:        '500px',
                    background:    '#fff',
                    borderRadius:  '12px',
                    boxShadow:     '0 8px 32px rgba(0,0,0,0.18)',
                    display:       'flex',
                    flexDirection: 'column',
                    overflow:      'hidden',
                    border:        '1px solid #e5e7eb',
                }}>

                    {/* Header */}
                    <div style={{
                        background:     '#111827',
                        color:          '#fff',
                        padding:        '12px 16px',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'space-between',
                        flexShrink:     0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {activeUserId && (
                                <button onClick={() => { setActiveUserId(null); setMessages([]) }}
                                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                    <BackIcon />
                                </button>
                            )}
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#4ade80' : '#9ca3af' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                {activeThread ? activeThread.userName : 'Customer Support'}
                            </span>
                        </div>
                        <button onClick={() => { setOpen(false); setActiveUserId(null); setMessages([]) }}
                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Thread list OR message view */}
                    {!activeUserId ? (
                        // ── Thread list ───────────────────────────────────────
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {threads.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>
                                    No conversations yet
                                </p>
                            ) : threads.map(thread => (
                                <div
                                    key={thread.userId}
                                    onClick={() => openThread(thread.userId)}
                                    style={{
                                        padding:       '12px 16px',
                                        borderBottom:  '1px solid #f3f4f6',
                                        cursor:        'pointer',
                                        display:       'flex',
                                        alignItems:    'center',
                                        gap:           '10px',
                                        background:    '#fff',
                                        transition:    'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: '#e5e7eb', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '14px', fontWeight: 600,
                                        color: '#374151', flexShrink: 0,
                                    }}>
                                        {(thread.userName || 'C')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{thread.userName}</p>
                                            {thread.unreadAdmin > 0 && (
                                                <span style={{
                                                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                                                    width: '18px', height: '18px', fontSize: '10px', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {thread.unreadAdmin > 9 ? '9+' : thread.unreadAdmin}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{
                                            fontSize: '12px', color: '#6b7280',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {thread.messages?.slice(-1)[0]?.text || 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // ── Message view ──────────────────────────────────────
                        <>
                            <div style={{
                                flex: 1, overflowY: 'auto', padding: '12px',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                            }}>
                                {messages.length === 0 && (
                                    <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginTop: '32px' }}>
                                        No messages yet
                                    </p>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                                    }}>
                                        <div style={{
                                            maxWidth:     '75%',
                                            padding:      '8px 12px',
                                            borderRadius: msg.sender === 'admin' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                            background:   msg.sender === 'admin' ? '#111827' : '#f3f4f6',
                                            color:        msg.sender === 'admin' ? '#fff' : '#111827',
                                            fontSize:     '13px',
                                            lineHeight:   '1.5',
                                            wordBreak:    'break-word',
                                        }}>
                                            {msg.text}
                                            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '3px', textAlign: 'right' }}>
                                                {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Reply input */}
                            <div style={{
                                padding: '10px 12px', borderTop: '1px solid #e5e7eb',
                                display: 'flex', gap: '8px', alignItems: 'flex-end',
                                flexShrink: 0, background: '#fff',
                            }}>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder='Reply…'
                                    rows={1}
                                    style={{
                                        flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px',
                                        padding: '8px 10px', fontSize: '13px', resize: 'none',
                                        outline: 'none', lineHeight: '1.5', maxHeight: '80px',
                                        overflowY: 'auto', fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={sendReply}
                                    disabled={!input.trim()}
                                    style={{
                                        background:   input.trim() ? '#111827' : '#e5e7eb',
                                        color:        input.trim() ? '#fff' : '#9ca3af',
                                        border:       'none', borderRadius: '8px',
                                        padding:      '8px 10px', cursor: input.trim() ? 'pointer' : 'default',
                                        flexShrink:   0, display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: '#111827', color: '#fff', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    position: 'relative', transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {open ? <CloseIcon /> : <ChatIcon />}
                {!open && totalUnread > 0 && (
                    <div style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        background: '#ef4444', color: '#fff', borderRadius: '50%',
                        width: '18px', height: '18px', fontSize: '10px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </div>
                )}
            </button>
        </div>
    )
}

export default AdminChat