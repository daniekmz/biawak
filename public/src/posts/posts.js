// Posts functions untuk Biawak Foundation
const postsFunctions = {
  // Fetch posts with comments
  async fetchPostsWithComments() {
      try {
          console.log('Fetching posts...');
          
          // First, get all posts
          const { data: posts, error: postsError } = await supabase
              .from('posts')
              .select(`
                  id,
                  title,
                  content,
                  created_at,
                  user_id
              `)
              .order('created_at', { ascending: false });
          
          if (postsError) {
              console.error('Posts error:', postsError);
              throw postsError;
          }
          
          if (!posts || posts.length === 0) {
              console.log('No posts found');
              return [];
          }
          
          console.log(`Found ${posts.length} posts`);
          
          // Get author information for posts
          const postsWithAuthors = await Promise.all(posts.map(async post => {
              try {
                  // Get author profile
                  const { data: profile, error: profileError } = await supabase
                      .from('profiles')
                      .select('full_name')
                      .eq('id', post.user_id)
                      .single();
                  
                  const authorName = profile?.full_name || 'Pengguna Anonim';
                  
                  // Get comments for this post
                  const { data: comments, error: commentsError } = await supabase
                      .from('comments')
                      .select(`
                          id,
                          content,
                          created_at,
                          user_id
                      `)
                      .eq('post_id', post.id)
                      .order('created_at', { ascending: true });
                  
                  let commentsWithAuthors = [];
                  
                  if (comments && comments.length > 0) {
                      // Get author information for comments
                      commentsWithAuthors = await Promise.all(comments.map(async comment => {
                          try {
                              const { data: commentProfile } = await supabase
                                  .from('profiles')
                                  .select('full_name')
                                  .eq('id', comment.user_id)
                                  .single();
                              
                              return {
                                  ...comment,
                                  author_name: commentProfile?.full_name || 'Pengguna Anonim'
                              };
                          } catch (error) {
                              console.warn('Error fetching comment author:', error);
                              return {
                                  ...comment,
                                  author_name: 'Pengguna Anonim'
                              };
                          }
                      }));
                  }
                  
                  return {
                      ...post,
                      author_name: authorName,
                      comments: commentsWithAuthors
                  };
              } catch (error) {
                  console.warn('Error processing post:', error);
                  return {
                      ...post,
                      author_name: 'Pengguna Anonim',
                      comments: []
                  };
              }
          }));
          
          console.log('Posts with comments loaded successfully');
          return postsWithAuthors;
          
      } catch (error) {
          console.error('Error in fetchPostsWithComments:', error);
          
          // Return fallback posts for demonstration
          return this.getFallbackPosts();
      }
  },

  // Create new post
  async createNewPost(title, content) {
      try {
          console.log('Creating new post...');
          
          // Check authentication
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
              throw new Error('Anda harus login terlebih dahulu');
          }
          
          // Validate input
          if (!title.trim() || !content.trim()) {
              throw new Error('Judul dan konten tidak boleh kosong');
          }
          
          if (title.length > 100) {
              throw new Error('Judul terlalu panjang (maksimal 100 karakter)');
          }
          
          if (content.length > 2000) {
              throw new Error('Konten terlalu panjang (maksimal 2000 karakter)');
          }
          
          // Create post
          const { data, error } = await supabase
              .from('posts')
              .insert([
                  { 
                      title: title.trim(), 
                      content: content.trim(), 
                      user_id: user.id 
                  }
              ])
              .select();
          
          if (error) {
              console.error('Error creating post:', error);
              throw new Error('Gagal membuat postingan: ' + error.message);
          }
          
          console.log('Post created successfully:', data);
          return data[0];
          
      } catch (error) {
          console.error('Error in createNewPost:', error);
          throw error;
      }
  },

  // Add comment to post
  async addCommentToPost(postId, content) {
      try {
          console.log('Adding comment to post:', postId);
          
          // Check authentication
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
              throw new Error('Anda harus login terlebih dahulu');
          }
          
          // Validate input
          if (!content.trim()) {
              throw new Error('Komentar tidak boleh kosong');
          }
          
          if (content.length > 1000) {
              throw new Error('Komentar terlalu panjang (maksimal 1000 karakter)');
          }
          
          // Check if post exists
          const { data: post, error: postError } = await supabase
              .from('posts')
              .select('id')
              .eq('id', postId)
              .single();
          
          if (postError || !post) {
              throw new Error('Postingan tidak ditemukan');
          }
          
          // Add comment
          const { data, error } = await supabase
              .from('comments')
              .insert([
                  { 
                      post_id: postId, 
                      content: content.trim(), 
                      user_id: user.id 
                  }
              ])
              .select();
          
          if (error) {
              console.error('Error adding comment:', error);
              throw new Error('Gagal menambahkan komentar: ' + error.message);
          }
          
          console.log('Comment added successfully:', data);
          return data[0];
          
      } catch (error) {
          console.error('Error in addCommentToPost:', error);
          throw error;
      }
  },

  // Get fallback posts for demonstration
  getFallbackPosts() {
      const now = new Date();
      return [
          {
              id: 'demo-1',
              title: 'Selamat Datang di Biawak Foundation!',
              content: 'Selamat datang di komunitas blockchain dan cryptocurrency Indonesia. Mari kita belajar dan berbagi pengetahuan bersama!',
              author_name: 'Admin Biawak',
              created_at: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
              user_id: 'demo-user-1',
              comments: [
                  {
                      id: 'demo-comment-1',
                      content: 'Terima kasih! Senang bisa bergabung dengan komunitas ini.',
                      author_name: 'Pengguna Demo',
                      created_at: new Date(now.getTime() - 43200000).toISOString(), // 12 hours ago
                      user_id: 'demo-user-2'
                  }
              ]
          },
          {
              id: 'demo-2',
              title: 'Memahami Dasar-Dasar Blockchain',
              content: 'Blockchain adalah teknologi yang mendasari cryptocurrency. Mari kita pelajari konsep dasar blockchain dan bagaimana cara kerjanya.\n\nBlockchain pada dasarnya adalah buku besar digital yang tersebar di banyak komputer. Setiap blok berisi informasi transaksi yang telah diverifikasi dan dikaitkan dengan blok sebelumnya.',
              author_name: 'Edukator Crypto',
              created_at: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
              user_id: 'demo-user-3',
              comments: [
                  {
                      id: 'demo-comment-2',
                      content: 'Penjelasan yang sangat bagus! Saya jadi lebih mengerti tentang blockchain.',
                      author_name: 'Pemula Crypto',
                      created_at: new Date(now.getTime() - 86400000).toISOString(),
                      user_id: 'demo-user-4'
                  },
                  {
                      id: 'demo-comment-3',
                      content: 'Apakah ada rekomendasi resource lain untuk belajar blockchain?',
                      author_name: 'Pengguna Baru',
                      created_at: new Date(now.getTime() - 21600000).toISOString(), // 6 hours ago
                      user_id: 'demo-user-5'
                  }
              ]
          },
          {
              id: 'demo-3',
              title: 'Tips Keamanan Cryptocurrency',
              content: 'Keamanan adalah hal yang sangat penting dalam dunia cryptocurrency. Berikut beberapa tips untuk menjaga keamanan aset crypto Anda:\n\n1. Gunakan hardware wallet untuk penyimpanan jangka panjang\n2. Aktifkan 2FA di semua exchange\n3. Jangan pernah share private key\n4. Selalu verifikasi alamat wallet sebelum mengirim\n5. Buat backup seed phrase dan simpan di tempat yang aman',
              author_name: 'Security Expert',
              created_at: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
              user_id: 'demo-user-6',
              comments: []
          }
      ];
  },

  // Initialize posts (create tables if needed)
  async initializePosts() {
      try {
          console.log('Initializing posts system...');
          
          // This would typically be handled by database migrations
          // For now, we'll just check if we can access the tables
          const { data, error } = await supabase
              .from('posts')
              .select('id')
              .limit(1);
          
          if (error && error.code === '42P01') { // Table doesn't exist
              console.warn('Posts table not found. Using fallback mode.');
              return false;
          }
          
          console.log('Posts system initialized successfully');
          return true;
          
      } catch (error) {
          console.error('Error initializing posts:', error);
          return false;
      }
  },

  // Utility function to format posts for display
  formatPostsForDisplay(posts) {
      if (!Array.isArray(posts)) return [];
      
      return posts.map(post => ({
          ...post,
          title: this.sanitizeText(post.title || ''),
          content: this.sanitizeText(post.content || ''),
          author_name: this.sanitizeText(post.author_name || 'Anonim'),
          created_at: post.created_at || new Date().toISOString(),
          comments: Array.isArray(post.comments) ? post.comments.map(comment => ({
              ...comment,
              content: this.sanitizeText(comment.content || ''),
              author_name: this.sanitizeText(comment.author_name || 'Anonim'),
              created_at: comment.created_at || new Date().toISOString()
          })) : []
      }));
  },

  // Sanitize text for display
  sanitizeText(text) {
      if (typeof text !== 'string') return '';
      return text.trim().substring(0, 2000); // Limit length
  }
};

// Initialize posts system when script loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
      // Wait a bit for supabase to initialize
      setTimeout(async () => {
          if (typeof supabase !== 'undefined') {
              await postsFunctions.initializePosts();
          }
      }, 1000);
  } catch (error) {
      console.error('Error during posts initialization:', error);
  }
});

// Expose posts functions to window for global access
window.postsFunctions = postsFunctions;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = postsFunctions;
}