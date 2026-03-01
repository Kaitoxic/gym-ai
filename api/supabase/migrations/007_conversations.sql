-- Migration 007: conversations table + update chat_messages

-- 1. Add 'general' to allowed topics (drop old constraint, add new one)
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_topic_check;

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_topic_check
    CHECK (topic IN ('nutrition', 'cardio', 'general'));

-- 2. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Nouvelle conversation',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_user_id_idx
  ON conversations(user_id, updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add conversation_id to chat_messages (nullable for backward compat)
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid
    REFERENCES conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx
  ON chat_messages(conversation_id, created_at ASC);
