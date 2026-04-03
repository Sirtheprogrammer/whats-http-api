# WhatsApp HTTP API

Full-featured WhatsApp HTTP API powered by [whatsapp-web.js](https://docs.wwebjs.dev/).

**Status:** Ready for production use.

## Features

- 🔐 **Session Management** — Create, list, destroy WhatsApp sessions with QR code support
- 💬 **Messages** — Send text, replies, reactions, polls, locations, buttons, lists
- 🖼️ **Media** — Send/download images, videos, audio, documents (file, URL, base64)
- 💬 **Chats** — List, archive, pin, mute, clear, fetch messages
- 👤 **Contacts** — Get, block, unblock, profile pictures
- 👥 **Groups** — Create, update, leave, add/remove participants, promote/demote
- 📱 **Status** — Post text and media statuses (stories)
- 🔗 **Webhooks** — Receive real-time events via HTTP callbacks
- 📡 **Rate Limiting** — Built-in request throttling
- 🔑 **API Key Auth** — Secure your endpoints

## Quick Start

```bash
git clone <repo>
cd whatsapp-api
npm install
cp .env.example .env
# Edit .env and set your API_KEY
npm start
```

## Configuration

Edit `.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `API_KEY` | (required) | Secret key for API auth |
| `SESSIONS_DIR` | ./sessions | Where session data is stored |
| `MEDIA_DIR` | ./media | Where downloaded media is saved |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (1 min) |

## Authentication

Include your API key in every request:

```
X-API-Key: your-secret-api-key-here
```

## API Reference

### Session Management

#### Create session
```http
POST /api/sessions
Content-Type: application/json

{ "sessionId": "my-session" }
```

#### Get QR code
```http
GET /api/sessions/:sessionId/qr
```

#### List sessions
```http
GET /api/sessions
```

#### Delete session
```http
DELETE /api/sessions/:sessionId
```

### Messages

#### Send text
```http
POST /api/sessions/:sessionId/messages/text
Content-Type: application/json

{ "chatId": "1234567890@c.us", "text": "Hello!" }
```

#### Send reply
```http
POST /api/sessions/:sessionId/messages/reply
Content-Type: application/json

{ "chatId": "1234567890@c.us", "text": "Nice!", "messageId": "<msg-id>" }
```

#### Send media (file upload)
```http
POST /api/sessions/:sessionId/media/send
Content-Type: multipart/form-data

file: <binary>
chatId: "1234567890@c.us"
caption: "Check this out!"
```

#### Send media (URL)
```http
POST /api/sessions/:sessionId/media/url
Content-Type: application/json

{ "chatId": "1234567890@c.us", "url": "https://example.com/image.jpg", "caption": "From URL" }
```

#### Send poll
```http
POST /api/sessions/:sessionId/messages/poll
Content-Type: application/json

{ "chatId": "1234567890@c.us", "title": "Lunch?", "options": ["Pizza", "Tacos", "Sushi"] }
```

### Chats

```http
GET  /api/sessions/:sessionId/chats
GET  /api/sessions/:sessionId/chats/:chatId
GET  /api/sessions/:sessionId/chats/:chatId/messages?limit=50
DELETE /api/sessions/:sessionId/chats/:chatId
POST  /api/sessions/:sessionId/chats/:chatId/archive
POST  /api/sessions/:sessionId/chats/:chatId/pin
POST  /api/sessions/:sessionId/chats/:chatId/mute
```

### Contacts

```http
GET  /api/sessions/:sessionId/contacts
GET  /api/sessions/:sessionId/contacts/:contactId
GET  /api/sessions/:sessionId/contacts/:contactId/profile-pic
POST  /api/sessions/:sessionId/contacts/:contactId/block
POST  /api/sessions/:sessionId/contacts/:contactId/unblock
```

### Groups

```http
GET    /api/sessions/:sessionId/groups
POST   /api/sessions/:sessionId/groups
GET    /api/sessions/:sessionId/groups/:groupId
PUT    /api/sessions/:sessionId/groups/:groupId
POST   /api/sessions/:sessionId/groups/:groupId/leave
POST   /api/sessions/:sessionId/groups/:groupId/participants/add
POST   /api/sessions/:sessionId/groups/:groupId/participants/remove
POST   /api/sessions/:sessionId/groups/:groupId/promote
POST   /api/sessions/:sessionId/groups/:groupId/demote
```

### Status (Stories)

```http
POST /api/sessions/:sessionId/status/text
{ "text": "My status!", "backgroundColor": "#25D366" }

POST /api/sessions/:sessionId/status/media
{ "url": "https://example.com/photo.jpg", "caption": "Caption" }
```

### Webhooks

```http
POST /api/sessions/:sessionId/webhooks
{ "url": "https://your-server.com/webhook", "events": ["message", "message_create"] }

GET  /api/sessions/:sessionId/webhooks
DELETE /api/sessions/:sessionId/webhooks
```

**Events:** `message`, `message_create`, `message_ack`, `group_join`, `group_leave`, `session_ready`, `session_disconnected`

## Process Manager

```bash
# Using PM2
npm run pm2:start   # Start in background
npm run pm2:logs    # View logs
npm run pm2:restart # Restart
npm run pm2:stop     # Stop
```

## Project Structure

```
whatsapp-api/
├── src/
│   ├── index.js          # Entry point
│   ├── config.js         # Configuration
│   ├── logger.js         # Pino logger
│   ├── sessions.js       # Session manager (whatsapp-web.js)
│   ├── routes/
│   │   ├── sessions.js   # Session endpoints
│   │   ├── messages.js   # Message endpoints
│   │   ├── chats.js     # Chat endpoints
│   │   ├── contacts.js  # Contact endpoints
│   │   ├── groups.js    # Group endpoints
│   │   ├── media.js     # Media endpoints
│   │   ├── status.js    # Status/story endpoints
│   │   └── webhooks.js  # Webhook endpoints
│   └── middleware/
│       ├── auth.js      # API key middleware
│       └── rateLimit.js # Rate limiter
├── sessions/             # WhatsApp session data (created at runtime)
├── media/                # Downloaded media (created at runtime)
├── .env.example
└── package.json
```

## License

MIT
