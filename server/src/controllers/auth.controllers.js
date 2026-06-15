const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    isValidEmail,
    isValidUsername,
    isValidPassword,
} = require("../utils/validators");

function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
        maxAge: 15 * 24 * 60 * 60 * 1000,
    };
}

function buildSafeUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        isOnline: Boolean(user.isOnline),
        lastSeen: user.lastSeen || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function getServerBaseUrl(req) {
    const baseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;

    return baseUrl.replace(/\/$/, "");
}

async function registerUser(req,res){
    try{
                const {username,email,password} = req.body;

                const normalizedUsername = typeof username === "string" ? username.trim() : "";
                const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

                if (!isValidUsername(normalizedUsername)) {
                        return res.status(400).json({
                                message:'Username must be 3-24 characters and can only include letters, numbers, dot, underscore, and dash'
                        });
                }

                if (!isValidEmail(normalizedEmail)) {
                        return res.status(400).json({
                                message:'Valid email is required'
                        });
                }

                if (!isValidPassword(password)) {
                        return res.status(400).json({
                                message:'Password must be at least 8 characters long'
                        });
                }

        // Check if user already exists
        const isAlreadyRegistered = await userModel.findOne({
            $or:[
                                {email: normalizedEmail},
                                {username: normalizedUsername}
            ]

        });

        if(isAlreadyRegistered){
            return res.status(400).json({
                message:'User with this email or username already exists'
            });
        }   

        const hash = await bcrypt.hash(password,10);

        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password:hash
        });

        const token = jwt.sign(
            {
                id:user._id,
                username:user.username
            },process.env.JWT_SECRET,
            {
                expiresIn:'15d'
            }   
        );
        res.cookie('token',token, getCookieOptions());
        return res.status(201).json({
            message:'User registered successfully',
            user: buildSafeUser(user),
        });
    }catch(error){
        console.error(error);
        
        return res.status(500).json({
            message: error.message
        })
        }
    }


async function loginUser(req,res){

    try{
        const {email,password} = req.body;
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message:"Valid email is required"
            });
        }

        if (typeof password !== "string" || !password) {
            return res.status(400).json({
                message:"Password is required"
            });
        }

        const user = await userModel.findOne({ email: normalizedEmail});
        if(!user){
            return res.status(400).json({
                message:"Invalid Credentials"
            })
        }
    
        const isPasswordValid = await bcrypt.compare(password,user.password);

        if(!isPasswordValid){
            return res.status(400).json({
                message:"Invalid Credentials"
            })
        }
        const token = jwt.sign(
            {
                id:user._id,
                username:user.username
            },process.env.JWT_SECRET,
            {
                expiresIn:'15d'
            }
        )
        res.cookie('token',token, getCookieOptions());
        return res.status(200).json({
            message:'User logged in successfully',
            user: buildSafeUser(user),
        });
    } catch (err) {

    return res.status(500).json({
      message: err.message
    });
  }
}

async function logoutUser(req, res) {
    try {
        res.clearCookie("token", getCookieOptions());

        return res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message,
        });
    }
}

async function updateAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Profile image is required",
            });
        }

        const avatarUrl = `${getServerBaseUrl(req)}/uploads/${req.file.filename}`;

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { avatarUrl },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.json({
            message: "Profile photo updated",
            user: buildSafeUser(user),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}


    module.exports = {
        registerUser,
        loginUser,
                logoutUser,
        updateAvatar,
    }