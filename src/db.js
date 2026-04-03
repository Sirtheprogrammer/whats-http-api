import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('Unexpected DB error:', err));

// Initialize schema
pool.query(`
  CREATE TABLE IF NOT EXISTS wa_sessions (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'pending',
    phone_number TEXT,
    name TEXT,
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS wa_messages (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES wa_sessions(id) ON DELETE CASCADE,
    message_id TEXT,
    chat_id TEXT,
    from_me BOOLEAN,
    body TEXT,
    has_media BOOLEAN DEFAULT FALSE,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON wa_messages(session_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON wa_messages(chat_id, timestamp DESC);

  CREATE TABLE IF NOT EXISTS wa_contacts (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES wa_sessions(id) ON DELETE CASCADE,
    wid TEXT NOT NULL,
    name TEXT,
    pushname TEXT,
    is_business BOOLEAN DEFAULT FALSE,
    is_group BOOLEAN DEFAULT FALSE,
    profile_pic_url TEXT,
    last_seen TIMESTAMPTZ,
    block_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, wid)
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_session ON wa_contacts(session_id);

  CREATE TABLE IF NOT EXISTS wa_groups (
    id SERIAL PRIMARY KEY,
    session_id TEXT REFERENCES wa_sessions(id) ON DELETE CASCADE,
    gid TEXT NOT NULL,
    name TEXT,
    description TEXT,
    participants_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, gid)
  );

  CREATE INDEX IF NOT EXISTS idx_groups_session ON wa_groups(session_id);
`).catch(console.error);

export default pool;
