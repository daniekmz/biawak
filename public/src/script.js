// Main application state
const AppState = {
    currentUser: null,
    isInitialized: false
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (AppState.isInitialized) return;
        
        // Set current year in footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Setup event listeners
        setupEventListeners();
        
        // Check auth state - tambahkan pengecekan jika authFunctions sudah terdefinisi
        if (typeof authFunctions !== 'undefined') {
            await checkAuthState();
            
            // Load posts - hanya jika postsFunctions sudah terdefinisi
            if (typeof postsFunctions !== 'undefined') {
                await loadPosts();
            }
        }
        
        AppState.isInitialized = true;
    } catch (error) {
        console.error('Initialization error:', error);
        showFallbackUI();
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Navigation
    document.addEventListener('click', function(e) {
        if (e.target.matches('.nav-link')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            scrollToSection(targetId);
            toggleMobileMenu(false);
        }
    });

    // Modal close on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            e.target.querySelector('form')?.reset();
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', helpers.throttle(handleNavbarScroll, 100));

    // Auth state changes
    window.addEventListener('authStateChange', handleAuthStateChange);
}

// Check authentication state
async function checkAuthState() {
    try {
        const session = await authFunctions.getSession();
        if (session) {
            AppState.currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || 'Pengguna'
            };
            console.log('User authenticated:', AppState.currentUser.name);
        }
    } catch (error) {
        console.error('Auth state check error:', error);
        throw error;
    }
}

// Handle auth state changes
function handleAuthStateChange(event) {
    const { event: authEvent, session } = event.detail;
    
    if (authEvent === 'SIGNED_IN' || authEvent === 'USER_UPDATED') {
        AppState.currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || 'Pengguna'
        };
        notifications.show('Berhasil login!', 'success');
    } else if (authEvent === 'SIGNED_OUT') {
        AppState.currentUser = null;
        notifications.show('Berhasil logout!', 'success');
    }
    
    updateUIBasedOnAuth();
    loadPosts().catch(console.error);
}

// Update UI based on authentication state
function updateUIBasedOnAuth() {
    const authButtons = document.querySelector('.nav-auth');
    const createPostBtn = document.getElementById('create-post-btn');
    
    if (!authButtons) return;
    
    if (AppState.currentUser) {
        authButtons.innerHTML = `
            <span class="user-greeting">Halo, ${helpers.escapeHtml(AppState.currentUser.name)}!</span>
            <button class="btn-secondary" onclick="handleLogout()">Keluar</button>
        `;
        if (createPostBtn) createPostBtn.style.display = 'block';
    } else {
        authButtons.innerHTML = `
            <button class="btn-secondary" onclick="showLoginModal()">Masuk</button>
            <button class="btn-primary" onclick="showRegisterModal()">Daftar</button>
        `;
        if (createPostBtn) createPostBtn.style.display = 'none';
    }
}

// Handle navbar scroll effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.background = window.scrollY > 50 
            ? 'rgba(255, 255, 255, 0.98)' 
            : 'rgba(255, 255, 255, 0.95)';
    }
}

// Show fallback UI when initialization fails
function showFallbackUI() {
    // Pastikan hanya mengeksekusi jika elemen ada
    const authButtons = document.querySelector('.nav-auth');
    const createPostBtn = document.getElementById('create-post-btn');
    
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-secondary" onclick="showLoginModal()">Masuk</button>
            <button class="btn-primary" onclick="showRegisterModal()">Daftar</button>
        `;
    }
    
    if (createPostBtn) {
        createPostBtn.style.display = 'none';
    }
    
    showFallbackPosts();
    notifications.show('Terjadi masalah saat memuat aplikasi. Silakan refresh halaman.', 'error');
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.querySelector('input')?.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.querySelector('form')?.reset();
    }
}

function showLoginModal() { showModal('loginModal'); }
function showRegisterModal() { showModal('registerModal'); }

function showCreatePostModal() {
    if (!AppState.currentUser) {
        notifications.show('Silakan login terlebih dahulu!', 'error');
        showLoginModal();
        return;
    }
    showModal('createPostModal');
}

function switchToRegister() {
    closeModal('loginModal');
    showRegisterModal();
}

function switchToLogin() {
    closeModal('registerModal');
    showLoginModal();
}

// Authentication handlers
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Set loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validation
        if (!email || !password) {
            throw new Error('Email dan password harus diisi!');
        }
        
        await authFunctions.signInWithEmail(email, password);
        closeModal('loginModal');
    } catch (error) {
        notifications.show(error.message || 'Terjadi kesalahan saat login', 'error');
        console.error('Login error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Set loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            throw new Error('Semua field harus diisi!');
        }
        
        if (password !== confirmPassword) {
            throw new Error('Password tidak cocok!');
        }
        
        if (password.length < 6) {
            throw new Error('Password minimal 6 karakter!');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Format email tidak valid!');
        }
        
        const result = await authFunctions.signUpWithEmail(email, password, name);
        
        if (result.user) {
            closeModal('registerModal');
            notifications.show('Registrasi berhasil! Selamat datang!', 'success');
        } else {
            closeModal('registerModal');
            notifications.show(result.message || 'Registrasi berhasil! Silakan cek email untuk verifikasi', 'success');
        }
    } catch (error) {
        notifications.show(error.message || 'Terjadi kesalahan saat registrasi', 'error');
        console.error('Registration error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleLogout() {
    try {
        await authFunctions.signOut();
    } catch (error) {
        notifications.show(error.message || 'Terjadi kesalahan saat logout', 'error');
        console.error('Logout error:', error);
    }
}

// Post functions
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    // Show loading state
    postsContainer.innerHTML = `
        <div class="no-posts">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memuat postingan...</p>
        </div>
    `;
    
    try {
        const posts = await postsFunctions.fetchPostsWithComments();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        showFallbackPosts();
    }
}

function showFallbackPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = `
        <div class="no-posts">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Gagal memuat postingan. Silakan refresh halaman.</p>
            <button class="btn-primary" onclick="location.reload()">Refresh Halaman</button>
        </div>
    `;
}

function renderPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-comments"></i>
                <p>${AppState.currentUser ? 'Belum ada postingan. Buat postingan pertama!' : 'Silakan login untuk membuat postingan!'}</p>
            </div>
        `;
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${helpers.escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        Oleh ${helpers.escapeHtml(post.author_name)} • ${helpers.formatDate(post.created_at)}
                    </div>
                </div>
            </div>
            <div class="post-content">
                ${helpers.escapeHtml(post.content).replace(/\n/g, '<br>')}
            </div>
            <div class="post-actions">
                <button onclick="toggleComments('${post.id}')">
                    <i class="fas fa-comments"></i> 
                    Komentar (${post.comments.length})
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-list">
                    ${renderComments(post.comments)}
                </div>
                ${AppState.currentUser ? `
                    <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                        <textarea placeholder="Tulis komentar..." required></textarea>
                        <button type="submit" class="btn-primary">Kirim Komentar</button>
                    </form>
                ` : '<p>Login untuk berkomentar</p>'}
            </div>
        </div>
    `).join('');
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p>Belum ada komentar</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-author">${helpers.escapeHtml(comment.author_name)}</div>
            <div class="comment-content">${helpers.escapeHtml(comment.content)}</div>
            <div class="comment-date">${helpers.formatDate(comment.created_at)}</div>
        </div>
    `).join('');
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    }
}

async function handleAddComment(event, postId) {
    event.preventDefault();
    
    if (!AppState.currentUser) {
        notifications.show('Silakan login terlebih dahulu!', 'error');
        showLoginModal();
        return;
    }
    
    const textarea = event.target.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        notifications.show('Komentar tidak boleh kosong!', 'error');
        return;
    }
    
    try {
        await postsFunctions.addCommentToPost(postId, content);
        textarea.value = '';
        notifications.show('Komentar berhasil ditambahkan!', 'success');
        await loadPosts();
        
        // Re-open comments section
        setTimeout(() => toggleComments(postId), 100);
    } catch (error) {
        notifications.show(error.message || 'Gagal menambahkan komentar', 'error');
        console.error('Error adding comment:', error);
    }
}

async function handleCreatePost(event) {
    event.preventDefault();
    
    if (!AppState.currentUser) {
        notifications.show('Silakan login terlebih dahulu!', 'error');
        showLoginModal();
        return;
    }
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        notifications.show('Judul dan konten harus diisi!', 'error');
        return;
    }
    
    try {
        await postsFunctions.createNewPost(title, content);
        closeModal('createPostModal');
        notifications.show('Postingan berhasil dibuat!', 'success');
        await loadPosts();
    } catch (error) {
        notifications.show(error.message || 'Gagal membuat postingan', 'error');
        console.error('Error creating post:', error);
    }
}

// Navigation functions
function toggleMobileMenu(forceClose = false) {
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active', !forceClose);
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Expose functions to window for HTML onclick attributes
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showCreatePostModal = showCreatePostModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.handleCreatePost = handleCreatePost;
window.toggleComments = toggleComments;
window.handleAddComment = handleAddComment;
window.scrollToSection = scrollToSection;
window.toggleMobileMenu = toggleMobileMenu;