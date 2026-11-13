# Chat Backend (MySQL + Sequelize + Firebase Firestore)

A scalable chat backend application built with **Node.js**, **TypeScript**, **MySQL** (using **Sequelize ORM**), and **Firebase Firestore** (via the **Firebase Admin SDK**).

---

## 🏛️ Architecture Overview

The system uses a **hybrid data storage architecture**:
1. **Relational Database (MySQL via Sequelize)**:
   - Stores users, chats, and chat memberships.
   - Enforces relational integrity, unique constraints, and handles 1:1 chat idempotency.
2. **Document Database (Firebase Firestore)**:
   - Stores messages in chronological subcollections (`chats/{chatId}/messages/{messageId}`).
   - Handles real-time message streams, read receipt tracking (`readBy`), and last seen pointers (`chats/{chatId}/lastSeen/{userId}`).

---

## 📁 Project Structure

```text
├── src/
│   ├── config/
│   │   ├── database.ts        # MySQL connection & Sequelize initialization
│   │   └── firebase.ts        # Firebase Admin SDK & Firestore initialization
│   ├── controllers/
│   │   ├── chat.controller.ts # Handlers for chat, messages, read status, and last seen
│   │   └── user.controller.ts # Handlers for user chats and user creation
│   ├── models/
│   │   ├── User.ts            # Sequelize User model
│   │   ├── Chat.ts            # Sequelize Chat model
│   │   ├── ChatMember.ts      # Sequelize ChatMember join model
│   │   └── index.ts           # Model associations
│   ├── routes/
│   │   ├── chat.routes.ts     # /chat/* endpoints
│   │   ├── user.routes.ts     # /user/* endpoints
│   │   └── index.ts           # Root router
│   ├── services/
│   │   ├── chat.service.ts    # MySQL queries and transactions
│   │   └── firestore.service.ts # Firestore messages, read receipts, and last seen
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces & DTOs
│   └── index.ts               # Main Express application entry point
├── .env                       # Local environment variables
├── .env.example               # Template environment configuration
├── package.json
└── tsconfig.json
```

---

## ⚙️ Configuration (.env)

Open `.env` and fill in your connection details:

```env
# Server
PORT=3000

# MySQL (Sequelize)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chatapp_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_LOGGING=false

# Firebase Firestore (Pure Environment Variables - No JSON file needed)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Where to get your 3 Firebase variables:**
> 1. Go to [Firebase Console](https://console.firebase.google.com/) ➔ **Project settings** (gear icon) ➔ **Service accounts**.
> 2. Click **Generate new private key** (downloads a temporary key file).
> 3. Copy `project_id`, `client_email`, and `private_key` directly into your `.env` file.
> 4. You can now delete the downloaded file — no extra files are needed in your repository.

---

## 🚀 Running the Project

```bash
# Run in development mode (hot reloading)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start the compiled production build
npm start
```

---

## 📡 API Endpoints

### 1. Create or Get 1:1 Chat
- **Route:** `POST /chat/create`
- **Description:** Idempotently finds an existing 1:1 chat between two users, or creates a new one.
- **Request Body:**
  ```json
  {
    "userAId": "user_1",
    "userBId": "user_2"
  }
  ```
- **Response (200/201):**
  ```json
  {
    "chatId": "e305e7b2-cb95-46aa-bd61-12c5b0583b28"
  }
  ```

---

### 2. Send Message
- **Route:** `POST /chat/:chatId/message/send`
- **Description:** Validates chat membership in MySQL, then stores the message in Firestore with a server timestamp.
- **Request Body:**
  ```json
  {
    "senderId": "user_1",
    "text": "Hello, how are you?"
  }
  ```
- **Response (201):**
  ```json
  {
    "id": "firestore_message_id_123",
    "chatId": "e305e7b2-cb95-46aa-bd61-12c5b0583b28",
    "senderId": "user_1",
    "text": "Hello, how are you?",
    "timestamp": "2026-11-13T15:30:00.000Z",
    "readBy": ["user_1"]
  }
  ```

---

### 3. Get Messages
- **Route:** `GET /chat/:chatId/messages?limit=50`
- **Description:** Retrieves messages for a chat from Firestore, chronologically sorted by timestamp.
- **Query Params:**
  - `limit` *(optional, default 50, max 100)*
- **Response (200):**
  ```json
  [
    {
      "id": "firestore_message_id_123",
      "chatId": "e305e7b2-cb95-46aa-bd61-12c5b0583b28",
      "senderId": "user_1",
      "text": "Hello, how are you?",
      "timestamp": "2026-11-13T15:30:00.000Z",
      "readBy": ["user_1"]
    }
  ]
  ```

---

### 4. Mark Message as Read
- **Route:** `POST /chat/:chatId/message/:messageId/read`
- **Description:** Adds the user's ID to the message's `readBy` array in Firestore.
- **Request Body:**
  ```json
  {
    "userId": "user_2"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "messageId": "firestore_message_id_123",
    "userId": "user_2"
  }
  ```

---

### 5. Update Last Seen Message
- **Route:** `POST /chat/:chatId/lastseen`
- **Description:** Updates the user's last seen message pointer in Firestore.
- **Request Body:**
  ```json
  {
    "userId": "user_2",
    "messageId": "firestore_message_id_123"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "chatId": "e305e7b2-cb95-46aa-bd61-12c5b0583b28",
    "userId": "user_2",
    "messageId": "firestore_message_id_123",
    "updatedAt": "2026-11-13T15:30:05.000Z"
  }
  ```

---

### 6. List User Chats
- **Route:** `GET /user/:userId/chats`
- **Description:** Fetches all chats a user belongs to from MySQL, including other participants' information.
- **Response (200):**
  ```json
  [
    {
      "chatId": "e305e7b2-cb95-46aa-bd61-12c5b0583b28",
      "createdAt": "2026-11-13T15:28:00.000Z",
      "isGroup": false,
      "members": [
        {
          "id": "user_1",
          "name": "Alice",
          "email": "alice@example.com",
          "joinedAt": "2026-11-13T15:28:00.000Z"
        },
        {
          "id": "user_2",
          "name": "Bob",
          "email": "bob@example.com",
          "joinedAt": "2026-11-13T15:28:00.000Z"
        }
      ]
    }
  ]
  ```

---

### 7. Helper: Create User (Optional)
- **Route:** `POST /user/create`
- **Description:** Convenient endpoint to seed users in MySQL for testing.
- **Request Body:**
  ```json
  {
    "id": "user_1",
    "name": "Alice",
    "email": "alice@example.com"
  }
  ```
