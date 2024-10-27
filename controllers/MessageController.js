import mongoose from "mongoose";
import Message from "../models/MessageModel.js"
import { mkdirSync, renameSync } from "fs"

export const getMessages = async (request, response, next) => {
    try {
        const user1 = request.userId;
        const user2 = request.body.id;

        if (!user1 || !user2) {
            return response.status(400).send("Both user ID's are required.");
        }

        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 },
            ],
        }).sort({ timestamp: 1 });

        return response.status(200).json({ messages });

    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal Server Error");
    }
};

export const getContactsForDMList = async (request, response, next) => {
    try {
        let { userId } = request;
        userId = new mongoose.Types.ObjectId(userId);
        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }],
                },
            },
            {
                $sort: { timestamp: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$recipient",
                            else: "$sender",
                        },
                    },
                    lastMessageTime: { $first: "$timestamp" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contactInfo",
                },
            },
            {
                $unwind: "$contactInfo",
            },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                    email: "$contactInfo.email",
                    firstName: "$contactInfo.firstName",
                    lastName: "$contactInfo. lastName",
                    image: "$contactInfo.image",
                    color: "$contactInfo.color",
                },
            },
            {
                $sort: { lastMessageTime: -1 },
            },
        ]);

        return response.status(200).json({ contacts })
    }
    catch (error) {
        console.log({ error });
        return response.status(500).send("Internal Server Error");
    }
}


export const uploadFile = async (request, response, next) => {
    try {
        if (!request.file) {
            return response.status(400).send("File is required");
        }

        const date = new Date().toISOString().replace(/:/g, "-");
        let fileDir = `uploads/files/${date}`;
        let fileName = `${fileDir}/${request.file.originalname}`;

        mkdirSync(fileDir, { recursive: true });
        renameSync(request.file.path, fileName);

        return response.status(200).json({ filePath: fileName })
    }
    catch (error) {
        console.log({ error });
        return response.status(500).send("Internal Server Error");
    }
}

