# ChatTQW Back-End (Node.js)

This repository contains the **Node.js API server** for [**ChatTQW**](https://github.com/theronwolcott/chattqw), a generative AI chatbot mobile app that supports multiple **LLM models** (GPT-4, Claude, DeepSeek, Gemini, LLaMA, etc.) and provides **real-time message streaming**, **persistent chat storage**, and **searchable chat history** using **MongoDB**.

## Features

- **RESTful API**: Exposes endpoints for managing chat history and storing user conversations.
- **User Authentication & Management**: Supports user sign-up, login, and retrieval using **bcrypt** for password hashing.
- **MongoDB Persistence**: Stores chat history efficiently using a structured document model.
- **Smart Chat Labeling**: Conversations are automatically labeled using an LLM summarization model.
- **User-Based Chat Storage**: Each user has their own chat history stored separately.
- **Stores All Messages**: All messages for every chat are stored so that the user can pick up where they left off at any time in the future.

## Tech Stack

### **Back-End**
- **Node.js** (JavaScript runtime)
- **Express.js** (Web framework)
- **MongoDB & Mongoose** (Database & ODM)
- **bcrypt** (Password hashing)
- **dotenv** (Environment variables)
- **uuid** (Chat ID management)

### **Database**
- **MongoDB** (Atlas Cloud Database)
- Stores **user accounts**, **chat history**, **conversation metadata**, and **user preferences**.

## API Endpoints

| Method | Endpoint                | Description                           |
|--------|-------------------------|---------------------------------------|
| `POST` | `/chat/list`            | Fetches the list of past user chats  |
| `POST` | `/chat/get`             | Retrieves a specific chat by ID      |
| `POST` | `/chat/update`          | Updates chat labels                  |
| `POST` | `/chat/save-messages`   | Saves new chat messages              |
| `POST` | `/user/signup`          | Creates a new user account           |
| `POST` | `/user/login`           | Authenticates a user                 |
| `POST` | `/user/get`             | Retrieves user details by userId     |

### **Example API Call** (Using Dart in Flutter)
```dart
final ApiService apiService = ApiService();
final chats = await apiService.fetchList<UserChatItem>(
  "/chat/list",
  UserChatItem.fromJson,
);
```

## **Database Schema**

### **User Collection**
Stores registered users with hashed passwords.
```json
{
  "userId": "123456",
  "email": "user@example.com",
  "password": "$2b$10$hashedpassword...",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-02-01T12:00:00Z"
}
```

### **UserChats Collection**
Stores a list of chats associated with each user.
```json
{
  "userId": "123456",
  "chats": [
    {
      "chatId": "abcd-efgh",
      "label": "Chat about AI",
      "createdAt": "2024-02-01T12:00:00Z"
    }
  ]
}
```

### **Chat Collection**
Stores individual chat sessions with all messages.
```json
{
  "userId": "123456",
  "chatId": "abcd-efgh",
  "model": "openai/gpt-4o",
  "createdAt": "2024-02-01T12:00:00Z",
  "messages": [
    {
      "author": { "id": "user-123", "role": "user" },
      "text": "Hello, how are you?",
      "createdAt": 1706784000000
    },
    {
      "author": { "id": "assistant-123", "role": "assistant" },
      "text": "I'm doing great! How can I help you?",
      "createdAt": 1706784010000
    }
  ]
}
```

## **Setup Instructions**

### **1. Clone the Repository**
```sh
git clone https://github.com/theronwolcott/chattqw-node.git
cd chattqw-node
```

### **2. Install Dependencies**
```sh
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file with your database credentials:
```
MONGO_DB_USERNAME=your_username
MONGO_DB_PASSWORD=your_password
PORT=[optional, defaults to 3000]
```

### **4. Start the Server**
```sh
node ./index.js
```

## **Architecture Overview**

The **index.js** file contains all core functionality, including:

- **Express Server Initialization**: Configures and starts the API server.
- **MongoDB Connection**: Uses Mongoose to connect to the database.
- **API Routing**: Defines endpoints for managing users, listing chats, retrieving, updating, and saving chat messages.
- **User Authentication**: Implements **bcrypt password hashing** and user sign-up/login.
- **Chat Upsert Logic**: Ensures chat histories are either created or updated correctly.
- **Message Storage**: Handles storing conversations with appropriate timestamps.

All logic is contained in a single file to keep the back-end lightweight and easy to maintain.

## **Future Enhancements**

- [ ] **WebSocket Support for Live Chat Updates**
- [ ] **AI Model Fine-Tuning for Smart Summarization**
- [ ] **Chat Exporting & Sharing Features**
- [ ] **OAuth or JWT-Based Authentication**

## Related Repositories

- [ChatTQW Mobile App](https://github.com/theronwolcott/chattqw): Front-end project for the mobile app.

## **Contact**

Theron Wolcott  
📧 Email: theronwolcott@gmail.com  
🔗 LinkedIn: [linkedin.com/in/theronwolcott](https://linkedin.com/in/theronwolcott)  
💻 GitHub: [github.com/theronwolcott](https://github.com/theronwolcott)