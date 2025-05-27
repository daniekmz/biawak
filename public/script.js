// script.js - Fixed version
// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
});

// Initialize application
async function initializeApp() {
    try {
        // Check auth state
        const session = await window.authFunctions.getSession();
        if (session) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || 'Pengguna'
            };
        }
        updateUIBasedOnAuth();
        await loadPosts();
    } catch (error) {
        console.error('Error initializing app:', error);
        updateUIBasedOnAuth();
        await loadPosts();
    }
}

// Global variables
let currentUser = null;

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function showCreatePostModal() {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    document.getElementById('createPostModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms when closing
    const forms = document.querySelectorAll(`#${modalId} form`);
    forms.forEach(form => form.reset());
}

function switchToRegister() {
    closeModal('loginModal');
    showRegisterModal();
}

function switchToLogin() {
    closeModal('registerModal');
    showLoginModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Update UI based on authentication state
function updateUIBasedOnAuth() {
    const authButtons = document.querySelector('.nav-auth');
    const createPostBtn = document.getElementById('create-post-btn');
    
    if (currentUser) {
        // User is logged in
        authButtons.innerHTML = `
            <span class="user-greeting">Halo, ${currentUser.name}!</span>
            <button class="btn-secondary" onclick="handleLogout()">Keluar</button>
        `;
        if (createPostBtn) createPostBtn.style.display = 'block';
    } else {
        // User is not logged in
        authButtons.innerHTML = `
            <button class="btn-secondary" onclick="showLoginModal()">Masuk</button>
            <button class="btn-primary" onclick="showRegisterModal()">Daftar</button>
        `;
        if (createPostBtn) createPostBtn.style.display = 'none';
    }
}

// Update authentication handlers to use window.authFunctions
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Email dan password harus diisi!', 'error');
        return;
    }
    
    try {
        const result = await window.authFunctions.signInWithEmail(email, password);
        
        currentUser = result.user;
        
        updateUIBasedOnAuth();
        closeModal('loginModal');
        showNotification('Login berhasil!', 'success');
        await loadPosts();
    } catch (error) {
        showNotification(error.message || 'Terjadi kesalahan saat login', 'error');
        console.error('Login error:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Semua field harus diisi!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Password tidak cocok!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password minimal 6 karakter!', 'error');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Format email tidak valid!', 'error');
        return;
    }
    
    try {
        const result = await window.authFunctions.signUpWithEmail(email, password, name);
        
        if (result.user) {
            currentUser = result.user;
            updateUIBasedOnAuth();
            closeModal('registerModal');
            showNotification('Registrasi berhasil! Selamat datang!', 'success');
            await loadPosts();
        } else {
            closeModal('registerModal');
            showNotification(result.message || 'Registrasi berhasil! Silakan cek email untuk verifikasi', 'success');
        }
    } catch (error) {
        showNotification(error.message || 'Terjadi kesalahan saat registrasi', 'error');
        console.error('Registration error:', error);
    }
}

async function handleLogout() {
    try {
        await window.authFunctions.signOut();
        currentUser = null;
        updateUIBasedOnAuth();
        showNotification('Logout berhasil!', 'success');
        await loadPosts();
    } catch (error) {
        showNotification('Terjadi kesalahan saat logout', 'error');
        console.error('Logout error:', error);
    }
}

// Post functions
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = `
        <div class="no-posts">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memuat postingan...</p>
        </div>
    `;
    
    try {
        const posts = await fetchPostsWithComments();
        renderPosts(posts);
    } catch (error) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gagal memuat postingan. Silakan coba lagi nanti.</p>
            </div>
        `;
        console.error('Error loading posts:', error);
    }
}

function renderPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-comments"></i>
                <p>Belum ada postingan. ${currentUser ? 'Buat postingan pertama!' : 'Silakan login untuk membuat postingan!'}</p>
            </div>
        `;
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        Oleh ${escapeHtml(post.author_name)} • ${formatDate(post.created_at)}
                    </div>
                </div>
            </div>
            <div class="post-content">
                ${escapeHtml(post.content).replace(/\n/g, '<br>')}
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
                ${currentUser ? `
                    <form class="comment-form" onsubmit="handleAddComment(event, '${post.id}')">
                        <textarea placeholder="Tulis komentar..." required></textarea>
                        <button type="submit" class="btn-primary" style="margin-top: 10px;">
                            Kirim Komentar
                        </button>
                    </form>
                ` : '<p style="text-align: center; color: #666; margin-top: 20px;">Login untuk berkomentar</p>'}
            </div>
        </div>
    `).join('');
}

function renderComments(comments) {
    if (comments.length === 0) {
        return '<p style="text-align: center; color: #666;">Belum ada komentar</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-author">${escapeHtml(comment.author_name)}</div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
            <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">
                ${formatDate(comment.created_at)}
            </div>
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
    
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    
    const textarea = event.target.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        showNotification('Komentar tidak boleh kosong!', 'error');
        return;
    }
    
    try {
        await addCommentToPost(postId, content);
        textarea.value = '';
        showNotification('Komentar berhasil ditambahkan!', 'success');
        await loadPosts();
        
        // Re-open comments section
        setTimeout(() => {
            const commentsSection = document.getElementById(`comments-${postId}`);
            if (commentsSection) {
                commentsSection.style.display = 'block';
            }
        }, 100);
    } catch (error) {
        showNotification('Gagal menambahkan komentar', 'error');
        console.error('Error adding comment:', error);
    }
}

async function handleCreatePost(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    if (!title || !content) {
        showNotification('Judul dan konten harus diisi!', 'error');
        return;
    }
    
    try {
        await createNewPost(title, content);
        closeModal('createPostModal');
        showNotification('Postingan berhasil dibuat!', 'success');
        await loadPosts();
    } catch (error) {
        showNotification('Gagal membuat postingan', 'error');
        console.error('Error creating post:', error);
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (error) {
        return 'Tanggal tidak valid';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 90px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 3000;
                animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
                animation-fill-mode: both;
            }
            .notification-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .notification-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .notification-info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Navigation functions
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu if open
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }
});