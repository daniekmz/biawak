// Main application state
const AppState = {
    currentUser: null,
    isInitialized: false,
    initializationAttempts: 0,
    maxInitializationAttempts: 3
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (AppState.isInitialized) return;
        
        console.log('Starting app initialization...');
        
        // Set current year in footer
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Wait for auth functions to be available with retry logic
        await waitForAuthFunctions();
        
        AppState.isInitialized = true;
        console.log('App initialization completed successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showFallbackUI();
    }
});

// Wait for auth functions to be available with retry logic
async function waitForAuthFunctions() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 500; // 500ms

        const checkAuth = async () => {
            attempts++;
            console.log(`Checking for auth functions (attempt ${attempts}/${maxAttempts})`);
            
            if (typeof window.authFunctions !== 'undefined') {
                try {
                    await checkAuthState();
                    await loadPosts();
                    resolve();
                } catch (error) {
                    console.error('Error during auth/posts initialization:', error);
                    showFallbackUI();
                    resolve(); // Resolve anyway to not block the app
                }
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('Auth functions not available after maximum attempts');
                showFallbackUI();
                reject(new Error('Auth functions not available'));
                return;
            }
            
            setTimeout(checkAuth, checkInterval);
        };
        
        checkAuth();
    });
}

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
            const form = e.target.querySelector('form');
            if (form) form.reset();
        }
    });

    // Navbar scroll effect
    if (typeof helpers !== 'undefined' && helpers.throttle) {
        window.addEventListener('scroll', helpers.throttle(handleNavbarScroll, 100));
    } else {
        window.addEventListener('scroll', handleNavbarScroll);
    }

    // Auth state changes
    window.addEventListener('authStateChange', handleAuthStateChange);
}

// Navigation functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function toggleMobileMenu(force = null) {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (!navMenu || !hamburger) return;
    
    if (force !== null) {
        navMenu.classList.toggle('active', force);
        hamburger.classList.toggle('active', force);
    } else {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

// Check authentication state
async function checkAuthState() {
    try {
        if (typeof window.authFunctions === 'undefined') {
            console.log('Auth functions not available, skipping auth check');
            return;
        }

        const session = await window.authFunctions.getSession();
        if (session) {
            AppState.currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || 'Pengguna'
            };
            console.log('User authenticated:', AppState.currentUser.name);
        } else {
            console.log('No active session found');
        }
        
        updateUIBasedOnAuth();
    } catch (error) {
        console.error('Auth state check error:', error);
        // Don't throw - let the app continue with fallback UI
    }
}

// Handle auth state changes
function handleAuthStateChange(event) {
    const { event: authEvent, session } = event.detail;
    
    console.log('Auth state change:', authEvent);
    
    if (authEvent === 'SIGNED_IN' || authEvent === 'USER_UPDATED') {
        AppState.currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || 'Pengguna'
        };
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Berhasil login!', 'success');
        }
    } else if (authEvent === 'SIGNED_OUT') {
        AppState.currentUser = null;
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Berhasil logout!', 'success');
        }
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
        const userName = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(AppState.currentUser.name)
            : AppState.currentUser.name;
            
        authButtons.innerHTML = `
            <span class="user-greeting">Halo, ${userName}!</span>
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
    console.log('Showing fallback UI');
    
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
    
    if (typeof window.notifications !== 'undefined') {
        window.notifications.show('Terjadi masalah saat memuat aplikasi. Silakan refresh halaman.', 'error');
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        const input = modal.querySelector('input');
        if (input) input.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function showLoginModal() { showModal('loginModal'); }
function showRegisterModal() { showModal('registerModal'); }

function showCreatePostModal() {
    if (!AppState.currentUser) {
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Silakan login terlebih dahulu!', 'error');
        }
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
        
        if (typeof window.authFunctions === 'undefined') {
            throw new Error('Sistem autentikasi tidak tersedia. Silakan refresh halaman.');
        }
        
        await window.authFunctions.signInWithEmail(email, password);
        closeModal('loginModal');
    } catch (error) {
        const message = error.message || 'Terjadi kesalahan saat login';
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'error');
        } else {
            alert(message);
        }
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
        
        if (typeof window.authFunctions === 'undefined') {
            throw new Error('Sistem autentikasi tidak tersedia. Silakan refresh halaman.');
        }
        
        const result = await window.authFunctions.signUpWithEmail(email, password, name);
        
        closeModal('registerModal');
        const message = result.user 
            ? 'Registrasi berhasil! Selamat datang!' 
            : (result.message || 'Registrasi berhasil! Silakan cek email untuk verifikasi');
            
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'success');
        } else {
            alert(message);
        }
    } catch (error) {
        const message = error.message || 'Terjadi kesalahan saat registrasi';
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'error');
        } else {
            alert(message);
        }
        console.error('Registration error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleLogout() {
    try {
        if (typeof window.authFunctions === 'undefined') {
            throw new Error('Sistem autentikasi tidak tersedia. Silakan refresh halaman.');
        }
        
        await window.authFunctions.signOut();
    } catch (error) {
        const message = error.message || 'Terjadi kesalahan saat logout';
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'error');
        } else {
            alert(message);
        }
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
        if (typeof window.postsFunctions === 'undefined') {
            console.log('Posts functions not available, showing fallback');
            showFallbackPosts();
            return;
        }

        const posts = await window.postsFunctions.fetchPostsWithComments();
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
    
    postsContainer.innerHTML = posts.map(post => {
        const title = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(post.title) 
            : post.title;
        const authorName = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(post.author_name) 
            : post.author_name;
        const content = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(post.content).replace(/\n/g, '<br>') 
            : post.content.replace(/\n/g, '<br>');
        const formattedDate = typeof window.helpers !== 'undefined' 
            ? window.helpers.formatDate(post.created_at) 
            : new Date(post.created_at).toLocaleDateString('id-ID');

        return `
            <div class="post-card">
                <div class="post-header">
                    <div>
                        <h3 class="post-title">${title}</h3>
                        <div class="post-meta">
                            Oleh ${authorName} • ${formattedDate}
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    ${content}
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
        `;
    }).join('');
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p>Belum ada komentar</p>';
    }
    
    return comments.map(comment => {
        const authorName = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(comment.author_name) 
            : comment.author_name;
        const content = typeof window.helpers !== 'undefined' 
            ? window.helpers.escapeHtml(comment.content) 
            : comment.content;
        const formattedDate = typeof window.helpers !== 'undefined' 
            ? window.helpers.formatDate(comment.created_at) 
            : new Date(comment.created_at).toLocaleDateString('id-ID');

        return `
            <div class="comment">
                <div class="comment-author">${authorName}</div>
                <div class="comment-content">${content}</div>
                <div class="comment-date">${formattedDate}</div>
            </div>
        `;
    }).join('');
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
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Silakan login terlebih dahulu!', 'error');
        }
        showLoginModal();
        return;
    }
    
    const textarea = event.target.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Komentar tidak boleh kosong!', 'error');
        }
        return;
    }
    
    try {
        if (typeof window.postsFunctions === 'undefined') {
            throw new Error('Sistem posting tidak tersedia. Silakan refresh halaman.');
        }

        await window.postsFunctions.addCommentToPost(postId, content);
        textarea.value = '';
        
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Komentar berhasil ditambahkan!', 'success');
        }
        
        await loadPosts();
        
        // Re-open comments section
        setTimeout(() => toggleComments(postId), 100);
    } catch (error) {
        const message = error.message || 'Gagal menambahkan komentar';
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'error');
        }
        console.error('Error adding comment:', error);
    }
}

async function handleCreatePost(event) {
    event.preventDefault();
    
    if (!AppState.currentUser) {
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Silakan login terlebih dahulu!', 'error');
        }
        showLoginModal();
        return;
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Set loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        
        // Validation
        if (!title || !content) {
            throw new Error('Judul dan konten harus diisi!');
        }
        
        if (title.length > 100) {
            throw new Error('Judul terlalu panjang (maksimal 100 karakter)!');
        }
        
        if (content.length > 2000) {
            throw new Error('Konten terlalu panjang (maksimal 2000 karakter)!');
        }
        
        if (typeof window.postsFunctions === 'undefined') {
            throw new Error('Sistem posting tidak tersedia. Silakan refresh halaman.');
        }
        
        await window.postsFunctions.createNewPost(title, content);
        
        closeModal('createPostModal');
        
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show('Postingan berhasil dibuat!', 'success');
        }
        
        await loadPosts();
        
    } catch (error) {
        const message = error.message || 'Gagal membuat postingan';
        if (typeof window.notifications !== 'undefined') {
            window.notifications.show(message, 'error');
        } else {
            alert(message);
        }
        console.error('Error creating post:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}