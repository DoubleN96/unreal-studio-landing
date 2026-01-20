
document.addEventListener('DOMContentLoaded', async () => {
    const blogGrid = document.getElementById('blog-grid');

    async function loadPosts() {
        try {
            // Check if blog_posts table exists first by trying to fetch
            const { data: posts, error } = await supabase.select('blog_posts', {
                order: 'created_at.desc',
                filter: { published: true }
            });

            if (error) {
                console.error('Error fetching posts:', error);
                
                // Fallback for demo if table doesn't exist
                if (error.message.includes('relation "public.blog_posts" does not exist')) {
                    renderFallbackPosts();
                    return;
                }
                
                blogGrid.innerHTML = '<p>No se pudieron cargar los artículos.</p>';
                return;
            }

            if (!posts || posts.length === 0) {
                // If no posts in DB, show empty state or fallback
                renderFallbackPosts(); // Using fallback for demo purposes if DB is empty
                return;
            }

            renderPosts(posts);

        } catch (err) {
            console.error('Unexpected error:', err);
            renderFallbackPosts();
        }
    }

    function renderPosts(posts) {
        blogGrid.innerHTML = posts.map(post => `
            <article class="blog-card">
                <div class="blog-image">
                    <img src="${post.featured_image || 'https://via.placeholder.com/600x400'}" alt="${post.title}" loading="lazy">
                </div>
                <div class="blog-content">
                    <span class="blog-category">${post.category || 'General'}</span>
                    <h3 class="blog-title">
                        <a href="blog-post.html?slug=${post.slug}">${post.title}</a>
                    </h3>
                    <p class="blog-excerpt">${post.excerpt || ''}</p>
                    <div class="blog-meta">
                        <span>${new Date(post.created_at).toLocaleDateString()}</span>
                        <span>${post.author || 'Admin'}</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function renderFallbackPosts() {
        // Static data if DB is empty or table missing (for demo continuity)
        const staticPosts = [
            {
                title: 'Por qué Bali sigue siendo el rey del ROI en 2024',
                slug: 'bali-roi-2024',
                category: 'Mercado',
                excerpt: 'Análisis detallado de la ocupación turística y precios del suelo en Canggu y Uluwatu.',
                featured_image: 'https://images.unsplash.com/photo-1715755455989-76413081ad10?w=600&q=80',
                created_at: new Date().toISOString(),
                author: 'Unreal Team'
            },
            {
                title: 'Guía legal para extranjeros invirtiendo en Indonesia',
                slug: 'guia-legal-indonesia',
                category: 'Guía',
                excerpt: 'Todo sobre el Leasehold vs Freehold y cómo proteger tu patrimonio.',
                featured_image: 'https://images.unsplash.com/photo-1736259762444-d00ed881872f?w=600&q=80',
                created_at: new Date().toISOString(),
                author: 'Legal Team'
            },
            {
                title: 'La arquitectura sostenible incrementa el valor de reventa',
                slug: 'arquitectura-sostenible',
                category: 'Tendencias',
                excerpt: 'Cómo los materiales locales y el diseño pasivo reducen costes y atraen compradores.',
                featured_image: 'https://images.unsplash.com/photo-1721222204314-46922f2aada0?w=600&q=80',
                created_at: new Date().toISOString(),
                author: 'Design Team'
            }
        ];
        renderPosts(staticPosts);
        
        // Add a note about DB
        const note = document.createElement('div');
        note.style.gridColumn = '1/-1';
        note.style.textAlign = 'center';
        note.style.fontSize = '12px';
        note.style.color = '#999';
        note.style.marginTop = '20px';
        note.innerText = 'Mostrando contenido estático (Demo Mode)';
        blogGrid.appendChild(note);
    }

    loadPosts();
});
