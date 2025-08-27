ALTER TABLE messages
ADD COLUMN source VARCHAR(50) DEFAULT 'internal',
ADD COLUMN session_id UUID,
ADD COLUMN conversation_id UUID;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
