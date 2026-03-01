-- Migration 006: chat_messages table for AI conversation history

CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic       text        NOT NULL CHECK (topic IN ('nutrition', 'cardio')),
  role        text        NOT NULL CHECK (role IN ('user', 'ai')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_topic_idx
  ON chat_messages(user_id, topic, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
