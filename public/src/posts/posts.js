// src/posts/posts.js
import { supabase } from '../config/supabase.js'

const postsFunctions = {
  async fetchPostsWithComments() {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          comments (
            id,
            content,
            author_name,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return posts || []
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw new Error('Gagal memuat postingan')
    }
  },

  async createNewPost(title, content) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu!')
      }

      // Get user profile for author name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const authorName = profile?.full_name || user.email || 'Anonim'

      const { data, error } = await supabase
        .from('posts')
        .insert([{
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          author_name: authorName
        }])
        .select()

      if (error) throw error

      return data[0]
    } catch (error) {
      console.error('Error creating post:', error)
      throw new Error(error.message || 'Gagal membuat postingan')
    }
  },

  async addCommentToPost(postId, content) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu!')
      }

      // Get user profile for author name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const authorName = profile?.full_name || user.email || 'Anonim'

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          content: content.trim(),
          author_id: user.id,
          author_name: authorName
        }])
        .select()

      if (error) throw error

      return data[0]
    } catch (error) {
      console.error('Error adding comment:', error)
      throw new Error(error.message || 'Gagal menambahkan komentar')
    }
  },

  async deletePost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu!')
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting post:', error)
      throw new Error('Gagal menghapus postingan')
    }
  }
}

// Make available globally
window.postsFunctions = postsFunctions

export default postsFunctions