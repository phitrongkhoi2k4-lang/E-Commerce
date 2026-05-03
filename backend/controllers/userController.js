import userModel from "../models/userModel.js";
import validator from "validator";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt";

// ── CREATE TOKEN ─────────────────────────
const createToken = (user) => {
    return jwt.sign(
        { id: user._id.toString() },   // 🔥 FIX QUAN TRỌNG
        process.env.JWT_SECRET,
        { expiresIn: '7d' }            // 🔥 BEST PRACTICE
    )
}

// ── LOGIN ───────────────────────────────
const loginUser = async (req,res)=>{
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if(!user){
            return res.json({ success:false, message:"User doesn't exist" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch){
            const token = createToken(user)  // 🔥 FIX
            res.json({ success:true, token })
        } else {
            res.json({ success:false, message:'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success:false, message:error.message })
    }
}

// ── REGISTER ────────────────────────────
const registerUser = async(req,res)=>{
    try {
        const { name, email, password } = req.body;

        const exists = await userModel.findOne({ email });
        if(exists){
            return res.json({ success:false, message:"User already exists" });
        }
        
        if (!validator.isEmail(email)){
            return res.json({ success:false, message:"Invalid email" });
        }

        if (password.length < 8){
            return res.json({ success:false, message:"Password too short" });
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user)  // 🔥 FIX

        res.json({ success:true, token })

    } catch (error) {
        console.log(error);
        res.json({ success:false, message:error.message })
    }
}

// ── ADMIN LOGIN ─────────────────────────
const adminLogin = async (req,res)=>{
    try {
        const { email, password } = req.body

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            
            // 🔥 FIX: token phải là object
            const token = jwt.sign(
                { role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({ success:true, token })
        } else {
            res.json({ success:false, message:"Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success:false, message:error.message })
    }
}

export { loginUser, registerUser, adminLogin }