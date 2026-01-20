// Main Logic for Unreal Studio Landing
// Dependencies: supabase-config.js must be loaded first

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('Unreal Studio Initializing...');
    
    // 1. Fetch & Render Dynamic Content
    await Promise.all([
        fetchAndRenderMetrics(),
        fetchAndRenderProjects()
    ]);

    // 2. Setup Event Listeners
    setupLeadForm();
}

// ==========================================
// 1. METRICS
// ==========================================
async function fetchAndRenderMetrics() {
    try {
        const data = await supabase.select('metrics', { filter: { id: 1 } });
        if (data && data.length > 0) {
            const metrics = data[0];
            updateText('metric-units', `${metrics.units_designed}+`);
            updateText('metric-capital', `€${(metrics.capital_managed / 1000000).toFixed(0)}M`);
            updateText('metric-roi', `${metrics.average_roi}%`);
            // updateText('metric-failed', metrics.failed_projects); // If we wanted to show this dynamically
        }
    } catch (error) {
        console.error('Error fetching metrics:', error);
        // Fallback to hardcoded values if fetch fails (HTML already has them)
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ==========================================
// 2. PROJECTS
// ==========================================
async function fetchAndRenderProjects() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    try {
        const projects = await supabase.select('projects', {
            filter: { published: true },
            order: 'sort_order.asc'
        });

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-center col-span-full">No hay proyectos activos en este momento.</p>';
            return;
        }

        container.innerHTML = projects.map(renderProjectCard).join('');
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        // Keep hardcoded HTML as fallback or show error
    }
}

function renderProjectCard(project) {
    const statusLabel = {
        'PRE_SALE': 'Pre-Venta',
        'IN_CONSTRUCTION': 'En Construcción',
        'COMPLETED': 'Completado'
    }[project.status] || project.status;

    const statusClass = project.status === 'PRE_SALE' ? 'pre-sale' : '';

    return `
    <article class="project-card">
        <div class="project-image">
            <img src="${project.main_image}" alt="${project.name}" loading="lazy">
            <span class="project-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="project-content">
            <div class="project-location">
                <span class="material-icons-outlined">location_on</span>
                ${project.location}
            </div>
            <h3 class="project-title">${project.name}</h3>
            <div class="project-price-label">Inversión desde</div>
            <div class="project-price">${formatCurrency(project.price_from)}</div>
            <div class="project-cta">
                <a href="#" class="project-link">
                    Ver Proyecto
                    <span class="material-icons-outlined">arrow_forward</span>
                </a>
                <button class="project-expand">
                    <span class="material-icons-outlined">add</span>
                </button>
            </div>
        </div>
    </article>
    `;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// ==========================================
// 3. LEAD FORM
// ==========================================
function setupLeadForm() {
    const form = document.getElementById('lead-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value;

        // Visual Feedback - Loading
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            await supabase.insert('leads', { 
                email: email,
                source: 'LANDING_HOME'
            });

            // Success
            btn.style.background = 'var(--success)';
            btn.textContent = '¡Recibido!';
            emailInput.value = '';
            
            // Show toast or alert
            showToast('¡Gracias! Te contactaremos pronto.');

            // Reset button after 3 seconds
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.style.background = '';
            }, 3000);

        } catch (error) {
            console.error('Error submitting lead:', error);
            btn.textContent = 'Error';
            btn.style.background = 'var(--danger)'; // Assuming you have a danger var or use red
            showToast('Hubo un error. Por favor intenta de nuevo.', true);
            
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.style.background = '';
            }, 3000);
        }
    });
}

function showToast(message, isError = false) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#ef4444' : '#22c55e'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: fadeUp 0.3s ease forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add animation style if not exists
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes fadeUp {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
