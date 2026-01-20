# Supabase Database Setup

The following SQL script is required to set up the database schema for the Unreal Studio CMS, including the **Blog Posts** functionality which is not yet initialized.

Please run this script in your Supabase Project's **SQL Editor**.

```sql
-- =====================================================
-- SUPABASE SETUP SCRIPT FOR UNREAL STUDIO CMS
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BLOG POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    category TEXT,
    published BOOLEAN DEFAULT false,
    author TEXT DEFAULT 'Unreal Studio',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security for Blog Posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published blog posts
CREATE POLICY "Public can view published blog posts"
    ON blog_posts FOR SELECT
    USING (published = true);

-- Authenticated users can manage blog posts
CREATE POLICY "Authenticated users can manage blog posts"
    ON blog_posts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. STORAGE BUCKETS (If not already present)
-- =====================================================

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-images', 'project-images', true),
    ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES FOR BLOG IMAGES

-- Public Read Access for blog-images
CREATE POLICY "Public Access blog-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-images' );

-- Authenticated Insert Access for blog-images
CREATE POLICY "Auth Insert blog-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );

-- Authenticated Update Access for blog-images
CREATE POLICY "Auth Update blog-images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'blog-images' );

-- Authenticated Delete Access for blog-images
CREATE POLICY "Auth Delete blog-images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );
```
