import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 60;

const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.SECRET_KEY, { expiresIn: maxAge });
};

export const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: 'Email and Password both are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: 'Email already exists.' });
        }

        const user = await User.create({ email, password });
        res.cookie("jwt", createToken(email, user._id), {
            maxAge,
            secure: true,
            sameSite: "None"
        });
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            }
        });
    } catch (error) {
        console.log("AuthController error", error);
        return res.status(400).send("Internal server error");
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ message: 'Email and Password both are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'Email not found' });
        }

        // Compare provided password with the stored hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).send({ message: 'Incorrect password' });
        }

        res.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: "None"
        });
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
                firstName: user.firstName,
                lastName: user.lastName,
                color: user.color,
                image: user.image
            }
        });
    } catch (error) {
        console.log("AuthController error", error);
        return res.status(400).send("Internal server error");
    }
};

export const getUserInfo = async (req, res, next) => {
    try {
        const userData = await User.findById(req.userId);
        if (!userData) return res.status(400).send('User with the given id is not found');
        return res.status(200).json({
            id: userData.id,
            email: userData.email,
            profileSetup: userData.profileSetup,
            firstName: userData.firstName,
            lastName: userData.lastName,
            color: userData.color,
            image: userData.image
        })
    } catch (error) {
        console.log("AuthController error", error);
        return res.status(400).send("Internal server error")
    }
}


export const updateProfile = async (req, res, next) => {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;
    if (!firstName || !lastName) {
        return res
            .status(400)
            .send("Firstname and lastname is required.");
    }
    try {
        const userData = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                color,
                profileSetup: true,
            },
            { new: true, runValidators: true }
        );
        return res.status(200).json({
            id: userData.id,
            email: userData.email,
            profileSetup: userData.profileSetup,
            firstName: userData.firstName,
            lastName: userData.lastName,
            color: userData.color,
        });
    } catch (error) {
        console.log({ error });
        return res.status(500).send("Internal Server Error");
    }
};

export const addProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).send("File is required");
        }

        const date = Date.now();
        
        // Ensure both file path and originalname are available
        if (!req.file.path || !req.file.originalname) {
            return res.status(500).send("File upload failed");
        }

        // Construct the file path and rename the uploaded file
        const fileName = `uploads/profiles/${date}_${req.file.originalname}`;
        renameSync(req.file.path, fileName);

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { image: fileName },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            image: updatedUser.image,
        });
    }
    catch (error) {
        console.log({ error });
        return res.status(500).send("Internal Server Error");
    }
};

export const removeProfileImage = async (req, res, next) => {

    try {
        const {userId} = req;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send("User not found.")
        }

        if(user.image){
            unlinkSync(user.image);
        }

        user.image = null;
        await user.save();

        return res.status(200).send("Profile removed successfully");
    }
    catch (error) {
        console.log({ error });
        return res.status(500).send("Internal Server Error");
    }
}


export const logOut = async (req, res, next) => {

    try {
        res.cookie("jwt", "", {maxAge:1, secure : true, sameSite: "None"})

        return res.status(200).send("Logged out successfully");
    }
    catch (error) {
        console.log({ error });
        return res.status(500).send("Internal Server Error");
    }
}