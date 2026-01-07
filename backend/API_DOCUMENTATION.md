# Polls API Documentation

## Overview
This API allows authenticated users to create, manage, and view polls with options and image uploads.

## Base URL
`http://localhost:8080/api/polls`

## Authentication
Most endpoints require authentication via JWT token stored in cookies. Include credentials in requests.

---

## Endpoints

### 1. Get All Polls
**GET** `/api/polls`

**Description:** Retrieve all polls with their options and creator information.

**Authentication:** Not required

**Response:**
```json
{
  "polls": [
    {
      "id": 1,
      "title": "Best Programming Language",
      "description": "Which language do you prefer?",
      "status": "open",
      "closeDate": "2024-12-31T23:59:59.000Z",
      "imageUrl": "/uploads/1234567890-image.png",
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "creator": {
        "id": 1,
        "username": "john_doe"
      },
      "options": [
        {
          "id": 1,
          "text": "JavaScript",
          "imageUrl": "/uploads/1234567891-option.png",
          "order": 0,
          "pollId": 1
        }
      ]
    }
  ]
}
```

---

### 2. Get Single Poll
**GET** `/api/polls/:id`

**Description:** Retrieve a specific poll by ID.

**Authentication:** Not required

**Parameters:**
- `id` (path parameter) - Poll ID

**Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Best Programming Language",
    ...
  }
}
```

**Error Responses:**
- `404` - Poll not found

---

### 3. Create Poll
**POST** `/api/polls`

**Description:** Create a new poll. Requires authentication.

**Authentication:** Required

**Content-Type:** `multipart/form-data` (for image upload) or `application/json`

**Request Body (Form Data):**
- `title` (string, required) - Poll title
- `description` (string, optional) - Poll description
- `closeDate` (string, optional) - ISO date string for automatic closing
- `options` (string or JSON array, required) - Array of option texts (min 2)
- `image` (file, optional) - Poll image (max 5MB, jpeg/jpg/png/gif/webp)

**Example (Form Data):**
```
title: "Favorite Pizza Topping"
description: "What's your favorite?"
closeDate: "2024-12-31T23:59:59.000Z"
options: ["Pepperoni", "Mushrooms", "Extra Cheese"]
image: [file]
```

**Example (JSON - without image):**
```json
{
  "title": "Favorite Pizza Topping",
  "description": "What's your favorite?",
  "closeDate": "2024-12-31T23:59:59.000Z",
  "options": ["Pepperoni", "Mushrooms", "Extra Cheese"]
}
```

**Response:** `201 Created`
```json
{
  "poll": {
    "id": 1,
    "title": "Favorite Pizza Topping",
    "status": "open",
    ...
  }
}
```

**Error Responses:**
- `400` - Missing title or insufficient options
- `401` - Not authenticated

---

### 4. Update Poll
**PUT** `/api/polls/:id`

**Description:** Update an existing poll. Only the creator can update their poll.

**Authentication:** Required (creator only)

**Content-Type:** `multipart/form-data` (for image upload) or `application/json`

**Request Body:**
- `title` (string, optional) - Poll title
- `description` (string, optional) - Poll description
- `status` (string, optional) - "open" or "closed"
- `closeDate` (string, optional) - ISO date string
- `image` (file, optional) - New poll image (replaces old one)

**Response:**
```json
{
  "poll": {
    "id": 1,
    "title": "Updated Title",
    ...
  }
}
```

**Error Responses:**
- `403` - Not the poll creator
- `404` - Poll not found

---

### 5. Close Poll Manually
**POST** `/api/polls/:id/close`

**Description:** Manually close a poll. Only the creator can close their poll.

**Authentication:** Required (creator only)

**Response:**
```json
{
  "poll": {
    "id": 1,
    "status": "closed",
    ...
  }
}
```

**Error Responses:**
- `403` - Not the poll creator
- `404` - Poll not found

---

### 6. Add Option to Poll
**POST** `/api/polls/:id/options`

**Description:** Add a new option to an existing poll. Only the creator can add options.

**Authentication:** Required (creator only)

**Content-Type:** `multipart/form-data` (for image) or `application/json`

**Request Body:**
- `text` (string, required) - Option text
- `image` (file, optional) - Option image

**Response:** `201 Created`
```json
{
  "option": {
    "id": 5,
    "text": "New Option",
    "imageUrl": "/uploads/1234567892-option.png",
    "order": 3,
    "pollId": 1
  }
}
```

**Error Responses:**
- `400` - Missing option text
- `403` - Not the poll creator
- `404` - Poll not found

---

### 7. Update Option
**PUT** `/api/polls/:id/options/:optionId`

**Description:** Update an existing option. Only the poll creator can update options.

**Authentication:** Required (creator only)

**Content-Type:** `multipart/form-data` (for image) or `application/json`

**Request Body:**
- `text` (string, optional) - Option text
- `order` (integer, optional) - Display order
- `image` (file, optional) - New option image (replaces old one)

**Response:**
```json
{
  "option": {
    "id": 5,
    "text": "Updated Option",
    ...
  }
}
```

**Error Responses:**
- `403` - Not the poll creator
- `404` - Option not found

---

### 8. Delete Option
**DELETE** `/api/polls/:id/options/:optionId`

**Description:** Delete an option from a poll. Only the creator can delete options.

**Authentication:** Required (creator only)

**Response:**
```json
{
  "message": "Option deleted successfully"
}
```

**Error Responses:**
- `403` - Not the poll creator
- `404` - Option not found

---

### 9. Delete Poll
**DELETE** `/api/polls/:id`

**Description:** Delete a poll and all its options. Only the creator can delete their poll.

**Authentication:** Required (creator only)

**Response:**
```json
{
  "message": "Poll deleted successfully"
}
```

**Error Responses:**
- `403` - Not the poll creator
- `404` - Poll not found

---

## Image Upload

### Supported Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### File Size Limit
- Maximum: 5MB per image

### Image Storage
- Poll images: Stored in `backend/public/uploads/`
- Option images: Stored in `backend/public/uploads/`
- Images are accessible at: `http://localhost:8080/uploads/{filename}`

### Image Deletion
- When updating a poll/option with a new image, the old image is automatically deleted
- When deleting a poll or option, associated images are automatically deleted

---

## Database Schema

### Poll Model
- `id` (integer, primary key)
- `title` (string, required, max 200 chars)
- `description` (text, optional)
- `status` (enum: "open" | "closed", default: "open")
- `closeDate` (datetime, optional)
- `imageUrl` (string, optional)
- `userId` (integer, foreign key to User)
- `createdAt` (datetime)
- `updatedAt` (datetime)

### Option Model
- `id` (integer, primary key)
- `text` (string, required, max 200 chars)
- `imageUrl` (string, optional)
- `order` (integer, default: 0)
- `pollId` (integer, foreign key to Poll)
- `createdAt` (datetime)
- `updatedAt` (datetime)

---

## Example Usage (JavaScript/Fetch)

### Create Poll with Image
```javascript
const formData = new FormData();
formData.append('title', 'Favorite Color');
formData.append('description', 'Which color do you like?');
formData.append('options', JSON.stringify(['Red', 'Blue', 'Green']));
formData.append('image', imageFile);

const response = await fetch('http://localhost:8080/api/polls', {
  method: 'POST',
  credentials: 'include', // Important for cookies
  body: formData
});

const data = await response.json();
```

### Get All Polls
```javascript
const response = await fetch('http://localhost:8080/api/polls', {
  credentials: 'include'
});

const data = await response.json();
console.log(data.polls);
```

### Close Poll
```javascript
const response = await fetch('http://localhost:8080/api/polls/1/close', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

