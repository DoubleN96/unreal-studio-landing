-- =====================================================
-- SUPABASE SETUP SCRIPT FOR UNREAL STUDIO CMS
-- Run this SQL in Supabase Studio SQL Editor
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    area TEXT CHECK (area IN ('ULUWATU', 'CANGGU', 'UBUD')),
    main_image TEXT,
    gallery TEXT[],
    status TEXT CHECK (status IN ('PRE_SALE', 'IN_CONSTRUCTION', 'COMPLETED')) DEFAULT 'PRE_SALE',
    price_from DECIMAL(12,2),
    currency TEXT DEFAULT 'EUR',
    roi_projected DECIMAL(5,2),
    bedrooms INT,
    bathrooms INT,
    area_m2 DECIMAL(10,2),
    published BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_area ON projects(area);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =====================================================
-- 2. METRICS TABLE (Singleton)
-- =====================================================
CREATE TABLE IF NOT EXISTS metrics (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    units_designed INT DEFAULT 120,
    capital_managed DECIMAL(14,2) DEFAULT 12000000,
    average_roi DECIMAL(5,2) DEFAULT 18.0,
    failed_projects INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default metrics (singleton row)
INSERT INTO metrics (id, units_designed, capital_managed, average_roi, failed_projects)
VALUES (1, 120, 12000000, 18.0, 0)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    phone TEXT,
    name TEXT,
    message TEXT,
    source TEXT DEFAULT 'WEBSITE',
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- =====================================================
-- 4. BLOG POSTS TABLE (Optional)
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

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (for landing page)
-- Anyone can read published projects
CREATE POLICY "Public can view published projects"
    ON projects FOR SELECT
    USING (published = true);

-- Anyone can read metrics
CREATE POLICY "Public can view metrics"
    ON metrics FOR SELECT
    USING (true);

-- Anyone can read published blog posts
CREATE POLICY "Public can view published blog posts"
    ON blog_posts FOR SELECT
    USING (published = true);

-- PUBLIC INSERT POLICY (for leads)
-- Anyone can submit a lead
CREATE POLICY "Anyone can submit leads"
    ON leads FOR INSERT
    WITH CHECK (true);

-- AUTHENTICATED USER POLICIES (for admin panel)
-- Authenticated users can do everything on projects
CREATE POLICY "Authenticated users can manage projects"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can update metrics
CREATE POLICY "Authenticated users can manage metrics"
    ON metrics FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can manage leads
CREATE POLICY "Authenticated users can manage leads"
    ON leads FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can manage blog posts
CREATE POLICY "Authenticated users can manage blog posts"
    ON blog_posts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 6. SAMPLE DATA (Optional - Remove in production)
-- =====================================================

-- Insert sample projects
INSERT INTO projects (name, slug, location, area, main_image, status, price_from, roi_projected, bedrooms, bathrooms, area_m2, published, sort_order)
VALUES
    ('Golf Bay Lofts - 1bd', 'golf-bay-lofts-1bd', 'Balangan, Uluwatu, Bali', 'ULUWATU', 'https://images.unsplash.com/photo-1728049006363-f8e583040180?w=800&q=80', 'IN_CONSTRUCTION', 96907, 18.5, 1, 1, 65, true, 1),
    ('Golf Bay Villa - 3bd', 'golf-bay-villa-3bd', 'Balangan, Uluwatu, Bali', 'ULUWATU', 'https://images.unsplash.com/photo-1728048756779-ed7f123d371f?w=800&q=80', 'IN_CONSTRUCTION', 167973, 20.0, 3, 2, 150, true, 2),
    ('Mambo Villas - 3bd', 'mambo-villas-3bd', 'Melasti, Uluwatu, Bali', 'ULUWATU', 'https://images.unsplash.com/photo-1728049006343-9ee0187643d5?w=800&q=80', 'PRE_SALE', 153329, 22.0, 3, 3, 180, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metrics_updated_at ON metrics;
CREATE TRIGGER update_metrics_updated_at
    BEFORE UPDATE ON metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Create an admin user in Supabase Auth
-- 2. Storage buckets configured below
-- 3. Test API endpoints with the anon key

-- =====================================================
-- 8. STORAGE BUCKETS
-- =====================================================

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('project-images', 'project-images', true),
    ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES

-- Public Read Access for project-images
CREATE POLICY "Public Access project-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'project-images' );

-- Authenticated Insert Access for project-images
CREATE POLICY "Auth Insert project-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'project-images' );

-- Authenticated Update Access for project-images
CREATE POLICY "Auth Update project-images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'project-images' );

-- Authenticated Delete Access for project-images
CREATE POLICY "Auth Delete project-images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'project-images' );

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

