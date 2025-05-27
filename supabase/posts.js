// posts.js - Updated version
const getSupabaseClient = async () => {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }
    
    // Wait for supabase client to be available
    return new Promise((resolve) => {
        const checkClient = () => {
            if (window.supabaseClient) {
                resolve(window.supabaseClient);
            } else {
                setTimeout(checkClient, 50);
            }
        };
        checkClient();
    });
};

// Fetch all posts with their comments
window.fetchPostsWithComments = async function() {
    try {
        const supabase = await getSupabaseClient();
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                *,
                user:user_id (
                    id,
                    email,
                    raw_user_meta_data->full_name as name
                ),
                comments (
                    *,
                    user:user_id (
                        id,
                        email,
                        raw_user_meta_data->full_name as name
                    )
                )
            `)
            .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        
        // Format the data for easier use in the frontend
        return posts.map(post => ({
            ...post,
            author_name: post.user?.name || 'Anonim',
            comments: post.comments.map(comment => ({
                ...comment,
                author_name: comment.user?.name || 'Anonim'
            }))
        }));
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

// Create a new post
window.createNewPost = async function(title, content) {
    try {
        const supabase = await getSupabaseClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('posts')
            .insert([
                { 
                    title, 
                    content, 
                    user_id: session.session.user.id 
                }
            ]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

// Add a comment to a post
window.addCommentToPost = async function(postId, content) {
    try {
        const supabase = await getSupabaseClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('comments')
            .insert([
                { 
                    post_id: postId, 
                    content, 
                    user_id: session.session.user.id 
                }
            ]);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};