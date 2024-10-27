import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;

    if(!token) return res.status(401).send("You are not authenticated");

    jwt.verify(token, process.env.SECRET_KEY, async(err, payload)=>{
        if(err) return res.status(403).send("token is not valid");
        req.userId = payload.userId;
        next();
    })
};