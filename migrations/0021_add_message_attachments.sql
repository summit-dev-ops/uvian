ALTER TABLE messages ADD COLUMN attachments JSONB DEFAULT '[]';
CREATE INDEX idx_messages_attachments ON messages USING gin (attachments jsonb_path_ops);