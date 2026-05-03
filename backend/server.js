// backend/server.js
import express        from 'express'
import cors           from 'cors'
import 'dotenv/config'
import { createServer } from 'http'
import { Server }       from 'socket.io'
import jwt              from 'jsonwebtoken'
import connectDB        from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRoute        from './routes/userRoute.js'
import productRouter    from './routes/productRoute.js'
import cartRoute        from './routes/cartRoute.js'
import orderRoute       from './routes/oderRoute.js'
import reviewRouter     from './routes/reviewRoute.js'
import returnRouter     from './routes/returnRoute.js'   // ← NEW
import chatModel        from './models/chatModel.js'
import userModel        from './models/userModel.js'

const app  = express()
const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

app.use(express.json())
app.use(cors())

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/user',    userRoute)
app.use('/api/product', productRouter)
app.use('/api/cart',    cartRoute)
app.use('/api/order',   orderRoute)
app.use('/api/review',  reviewRouter)
app.use('/api/return',  returnRouter)   // ← NEW

app.get('/', (req, res) => res.send('API Working'))

// ── HTTP server ───────────────────────────────────────────────────────────────
const httpServer = createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
})

const customerSockets = {}
const adminSockets    = new Set()

io.on('connection', (socket) => {

    socket.on('authenticate', async ({ token, role }) => {
        try {
            if (role === 'admin') {
                const decoded  = jwt.verify(token, process.env.JWT_SECRET)
                const expected = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD
                if (decoded !== expected) { socket.emit('auth_error', 'Not authorized as admin'); return }
                adminSockets.add(socket.id)
                socket.role = 'admin'
                const threads = await chatModel.find({}).sort({ updatedAt: -1 })
                socket.emit('all_threads', threads)
            } else {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                const userId  = decoded.id
                socket.userId = userId
                socket.role   = 'customer'
                customerSockets[userId] = socket.id
                const user   = await userModel.findById(userId)
                let thread   = await chatModel.findOne({ userId })
                if (!thread) thread = await chatModel.create({ userId, userName: user?.name || 'Customer' })
                socket.emit('chat_history', thread.messages)
                await chatModel.findOneAndUpdate({ userId }, { unreadAdmin: 0 }, { returnDocument: 'after' })
            }
        } catch (err) {
            console.log('Auth error:', err.message)
            socket.emit('auth_error', err.message)
        }
    })

    socket.on('customer_message', async ({ text }) => {
        if (!socket.userId || !text?.trim()) return
        try {
            const msg    = { sender: 'customer', text: text.trim(), date: Date.now() }
            const thread = await chatModel.findOneAndUpdate(
                { userId: socket.userId },
                { $push: { messages: msg }, $inc: { unreadAdmin: 1 }, $set: { updatedAt: Date.now() } },
                { returnDocument: 'after', upsert: true }
            )
            socket.emit('new_message', msg)
            adminSockets.forEach(id => io.to(id).emit('customer_message', {
                userId: socket.userId, userName: thread.userName,
                message: msg, unreadAdmin: thread.unreadAdmin,
            }))
        } catch (err) { console.log(err) }
    })

    socket.on('admin_message', async ({ userId, text }) => {
        if (socket.role !== 'admin' || !userId || !text?.trim()) return
        try {
            const msg = { sender: 'admin', text: text.trim(), date: Date.now() }
            await chatModel.findOneAndUpdate({ userId }, { $push: { messages: msg }, $set: { updatedAt: Date.now() } })
            const cSock = customerSockets[userId]
            if (cSock) io.to(cSock).emit('new_message', msg)
            adminSockets.forEach(id => io.to(id).emit('admin_message_sent', { userId, message: msg }))
        } catch (err) { console.log(err) }
    })

    socket.on('get_thread', async ({ userId }) => {
        if (socket.role !== 'admin') return
        try {
            const thread = await chatModel.findOne({ userId })
            socket.emit('thread_history', { userId, messages: thread?.messages || [] })
            await chatModel.findOneAndUpdate({ userId }, { unreadAdmin: 0 })
        } catch (err) { console.log(err) }
    })

    socket.on('disconnect', () => {
        if (socket.role === 'admin') adminSockets.delete(socket.id)
        else if (socket.userId) delete customerSockets[socket.userId]
    })
})

httpServer.listen(port, () => console.log('Server started on PORT: ' + port))