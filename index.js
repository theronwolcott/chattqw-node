require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const { v4: uuidv4 } = require('uuid');
const { get } = require("http");
const bcrypt = require('bcrypt');
const args = process.argv;
const port = process.env.PORT || args[2] || 3000;
const app = express();

const mongourl = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.iw8z5.mongodb.net/ChatTQW?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(mongourl)
    .then(() => console.log("connected"))
    .catch(error => console.log("did not connect: " + error));

const userChatsSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    chats: [
        {
            chatId: { type: String, required: true },
            label: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ],
});

const UserChats = mongoose.model("UserChats", userChatsSchema, "UserChats");

const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    chatId: { type: String, required: true },
    model: { type: String },
    createdAt: { type: Date, default: Date.now },
    messages: [
        {
            author: {
                firstName: { type: String },
                id: { type: String },
                role: { type: String }
            },
            createdAt: { type: Number },
            id: { type: String },
            type: { type: String },
            text: { type: String }
        }
    ],
});
// Create a compound index on userId and time, enforcing uniqueness
chatSchema.index({ userId: 1, chatId: 1 }, { unique: true });
const Chat = mongoose.model("Chat", chatSchema, "Chat");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema, "User");

// Now apply the JSON parser middleware
app.use(express.json());

async function upsertChat(userId, chatId, label, createdAt) {
    try {
        console.log(`🔍 Upserting chat for userId=${userId}, chatId=${chatId}, label=${label}`);

        // Step 1: Try to update only the label of an existing chat
        const result = await UserChats.findOneAndUpdate(
            { userId, "chats.chatId": chatId },
            { $set: { "chats.$.label": label } },
            { new: true }
        );

        console.log("🟢 Update result:", result);

        // Step 2: If no chat was updated, insert it (or create a new user document)
        if (!result) {
            console.log("⚠️ No existing chat found, inserting a new one...");

            const insertResult = await UserChats.findOneAndUpdate(
                { userId },
                {
                    $push: {  // ✅ Using $push ensures chatId is inserted correctly
                        chats: {
                            chatId: chatId,
                            label: label,
                            createdAt: createdAt
                        }
                    }
                },
                { upsert: true, new: true }
            );

            console.log("✅ Insert result:", insertResult);
        }
    } catch (error) {
        console.error(`Error upserting chat: ${error.message}`);
    }
}

async function upsertChatMessages(userId, chatId, model, createdAt, messages) {
    try {
        console.log(`🔍 Upserting messages for userId=${userId}, chatId=${chatId}, model=${model}`);
        console.log(`Messages received:`, messages);

        const updatedChat = await Chat.findOneAndUpdate(
            { userId, chatId }, // Match on userId and chatId
            { $set: { model, createdAt, messages } }, // Replace messages array entirely
            { upsert: true, new: true } // Create if missing, return updated doc
        );

        console.log("✅ Chat updated:", updatedChat);
        return updatedChat;
    } catch (error) {
        console.error(`❌ Error upserting chat messages: ${error.message}`);
    }
}


app.post("/chat/list",
    async (req, res) => {
        console.log("/chat/list", req.body);
        let { userId } = req.body;
        try {
            const userChats = await UserChats.findOne({ userId });
            const chats = userChats ? userChats.chats : [];
            res.json(chats);
        } catch (error) {
            console.error('Error fetching UserChats:', error);
            res.json([]);
        }
    });
app.post("/chat/get",
    async (req, res) => {
        console.log("/chat/get", req.body);
        let { chatId, userId } = req.body;
        try {
            const chat = await Chat.findOne({ chatId, userId });
            console.log(chat);
            res.json(chat);
        } catch (error) {
            console.error('Error fetching UserChats:', error);
            res.status(404).end();
        }
    });
app.post("/chat/update",
    async (req, res) => {
        console.log("/chat/update", req.body);
        let { chatId, label, createdAt, userId } = req.body;
        await upsertChat(userId, chatId, label, createdAt);
        res.status(200).end();
    });
app.post("/chat/save-messages",
    async (req, res) => {
        console.log("/chat/save-messages", req.body);
        let { chatId, model, createdAt, messages, userId } = req.body;
        await upsertChatMessages(userId, chatId, model, createdAt, messages);
        res.status(200).end();
    });
app.post("/user/create",
    async (req, res) => {
        console.log("/user/create", req.body);
        let { email, password, createdAt, userId } = req.body;
        await upsertChat(userId, chatId, label, createdAt);
        res.status(200).end();
    });
app.post("/user/get",
    async (req, res) => {
        console.log("/user/get", req.body);
        let { userId } = req.body;
        try {
            var user = await User.findOne({ userId });
            console.log(user);
            res.json(user);
        } catch (error) {
            console.error('Error fetching User:', error);
            res.status(404).end();
        }
    });
app.post("/user/login", async (req, res) => {
    console.log("/user/login", req.body);
    const { email, password } = req.body;
    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            // Do not reveal that the user doesn't exist
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare the password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Successful login
        // remove the password before sending the user object back
        const { password: pwd, ...userWithoutPassword } = user.toObject();
        console.log("Successful login", userWithoutPassword);
        return res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/user/signup",
    async (req, res) => {
        console.log("/user/signup", req.body);
        let { email, password, firstName, lastName, userId } = req.body;
        try {
            // Check if a user with the same email or userId already exists.
            const existingUser = await User.findOne({
                $or: [{ email }, { userId }]
            });
            if (existingUser) {
                return res.status(409).json({
                    error: 'A user with that email or userId already exists.'
                });
            }

            // Hash the password using bcrypt.
            const saltRounds = 5;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create a new user instance with the hashed password.
            const newUser = new User({
                userId,
                email,
                firstName,
                lastName,
                password: hashedPassword,
                createdAt: new Date()
            });

            // Save the new user to the database.
            await newUser.save();

            // Remove the password field before sending the response.
            const userObj = newUser.toObject();
            delete userObj.password;

            res.json(userObj);
        } catch (error) {
            console.error('Error signing up:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});