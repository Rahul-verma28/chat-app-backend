import { Server as SocketIoServer } from "socket.io";
import Message from "./models/MessageModel.js";
import dotenv from "dotenv";

dotenv.config();

const setupSocket = (server) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const userSocketMap = new Map();
    const socketToUserMap = new Map();

    const sendMessage = async (message) => {
        try {
            const senderSocketId = userSocketMap.get(message.sender);
            const recipientSocketId = userSocketMap.get(message.recipient);

            const createdMessage = await Message.create(message);
            const messageData = await Message.findById(createdMessage._id)
                .populate("sender", "id email firstName lastName image color")
                .populate("recipient", "id email firstName lastName image color");

            if (recipientSocketId) {
                io.to(recipientSocketId).emit("recieveMessage", messageData);
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit("recieveMessage", messageData);
            }
        } catch (error) {
            console.error("Error in sendMessage:", error);
        }
    };

    const disconnect = (socket) => {
        console.log(`Client Disconnected: ${socket.id}`);
        const userId = socketToUserMap.get(socket.id);
        if (userId) {
            userSocketMap.delete(userId);
            socketToUserMap.delete(socket.id);
        }
    };

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap.set(userId, socket.id);
            socketToUserMap.set(socket.id, userId);
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        } else {
            console.log("User ID not provided during connection.");
        }

        socket.on("sendMessage", async (message) => {
            await sendMessage(message);
        });
        socket.on("disconnect", () => disconnect(socket));
    });
};

export default setupSocket;
