import { Router } from "express";
import { addProfileImage, getUserInfo, login, logOut, removeProfileImage, signup, updateProfile } from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";

const authRoutes = Router();
const upload = multer({dest: "uploads/profiles/"})

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logOut);
authRoutes.get("/userinfo", verifyToken, getUserInfo);
authRoutes.post("/updateProfile", verifyToken, updateProfile);
authRoutes.post("/addProfileImage", verifyToken, upload.single("profile-image"), addProfileImage);
authRoutes.delete("/removeProfileImage", verifyToken, removeProfileImage);

export default authRoutes;