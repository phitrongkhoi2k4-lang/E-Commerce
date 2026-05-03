// frontend/src/components/ChatWidget.jsx
import React, { useEffect, useRef, useState, useContext } from 'react'
import { io } from 'socket.io-client'
import { ShopContext } from '../context/ShopContext'

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChatIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
)
const CloseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
)
const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
)

const ChatWidget = () => {
    const { backendUrl, token } = useContext(ShopContext)

    const [open,     setOpen]     = useState(false)
    const [messages, setMessages] = useState([])
    const [input,    setInput]    = useState('')
    const [connected,setConnected]= useState(false)
    const [unread,   setUnread]   = useState(0)

    const socketRef  = useRef(null)
    const bottomRef  = useRef(null)
    const inputRef   = useRef(null)

    // Only mount socket when user is logged in
    useEffect(() => {
        if (!token || !backendUrl) return

        const socket = io(backendUrl, { transports: ['websocket'] })
        socketRef.current = socket

        socket.on('connect', () => {
            setConnected(true)
            socket.emit('authenticate', { token, role: 'customer' })
        })

        socket.on('disconnect', () => setConnected(false))

        // Load history on open
        socket.on('chat_history', (msgs) => setMessages(msgs))

        // New message (own echo or admin reply)
        socket.on('new_message', (msg) => {
            setMessages(prev => [...prev, msg])
            if (msg.sender === 'admin' && !open) {
                setUnread(n => n + 1)
            }
        })

        socket.on('auth_error', (err) => console.warn('Chat auth error:', err))

        return () => socket.disconnect()
    }, [token, backendUrl])

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, open])

    // Clear unread when opening
    useEffect(() => {
        if (open) { setUnread(0); inputRef.current?.focus() }
    }, [open])

    const sendMessage = () => {
        const text = input.trim()
        if (!text || !socketRef.current) return
        socketRef.current.emit('customer_message', { text })
        setInput('')
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    // Don't render if not logged in
    if (!token) return null

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

            {/* Chat window */}
            {open && (
                <div style={{
                    position:      'absolute',
                    bottom:        '64px',
                    right:         0,
                    width:         '320px',
                    maxHeight:     '480px',
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
                        background:  '#111827',
                        color:       '#fff',
                        padding:     '12px 16px',
                        display:     'flex',
                        alignItems:  'center',
                        justifyContent: 'space-between',
                        flexShrink:  0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: connected ? '#4ade80' : '#9ca3af'
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Support Chat</span>
                        </div>
                        <button onClick={() => setOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex:       1,
                        overflowY:  'auto',
                        padding:    '12px',
                        display:    'flex',
                        flexDirection: 'column',
                        gap:        '8px',
                        minHeight:  '200px',
                    }}>
                        {messages.length === 0 && (
                            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginTop: '32px' }}>
                                👋 Hi! How can we help you today?
                            </p>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display:       'flex',
                                justifyContent: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                            }}>
                                <div style={{
                                    maxWidth:     '75%',
                                    padding:      '8px 12px',
                                    borderRadius: msg.sender === 'customer' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                    background:   msg.sender === 'customer' ? '#111827' : '#f3f4f6',
                                    color:        msg.sender === 'customer' ? '#fff' : '#111827',
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

                    {/* Input */}
                    <div style={{
                        padding:        '10px 12px',
                        borderTop:      '1px solid #e5e7eb',
                        display:        'flex',
                        gap:            '8px',
                        alignItems:     'flex-end',
                        flexShrink:     0,
                        background:     '#fff',
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder='Type a message…'
                            rows={1}
                            style={{
                                flex:         1,
                                border:       '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding:      '8px 10px',
                                fontSize:     '13px',
                                resize:       'none',
                                outline:      'none',
                                lineHeight:   '1.5',
                                maxHeight:    '80px',
                                overflowY:    'auto',
                                fontFamily:   'inherit',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim()}
                            style={{
                                background:   input.trim() ? '#111827' : '#e5e7eb',
                                color:        input.trim() ? '#fff' : '#9ca3af',
                                border:       'none',
                                borderRadius: '8px',
                                padding:      '8px 10px',
                                cursor:       input.trim() ? 'pointer' : 'default',
                                flexShrink:   0,
                                display:      'flex',
                                alignItems:   'center',
                            }}
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating button */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width:        '52px',
                    height:       '52px',
                    borderRadius: '50%',
                    background:   '#111827',
                    color:        '#fff',
                    border:       'none',
                    cursor:       'pointer',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    boxShadow:    '0 4px 16px rgba(0,0,0,0.25)',
                    position:     'relative',
                    transition:   'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {open ? <CloseIcon /> : <ChatIcon />}

                {/* Unread badge */}
                {!open && unread > 0 && (
                    <div style={{
                        position:     'absolute',
                        top:          '-2px',
                        right:        '-2px',
                        background:   '#ef4444',
                        color:        '#fff',
                        borderRadius: '50%',
                        width:        '18px',
                        height:       '18px',
                        fontSize:     '10px',
                        fontWeight:   700,
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'center',
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </div>
                )}
            </button>
        </div>
    )
}

export default ChatWidget