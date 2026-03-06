ALTER TABLE posts ADD COLUMN attachments JSONB DEFAULT '[]';
CREATE INDEX idx_posts_attachments ON posts USING gin (attachments jsonb_path_ops);
