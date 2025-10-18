import { useParams, useNavigate, useLocation, replace } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostUI from './ui/PostUI';
import { API_ENDPOINTS } from '../config';
import Footer from './ui/Footer';
import { motion, AnimatePresence } from 'framer-motion';

export default function Post() {
  const { id } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMarkdown, setNewMarkdown] = useState('');

  const navigate = useNavigate();
  
  const isNewPost = location.pathname === '/writing/new';

  const fetchPost =  async () => {
        try {
          const res = await fetch(API_ENDPOINTS.post(id));
          const postData = await res.json();
          setPost(postData);
          setLoading(false);
          console.log("Fetched post:", postData);
          sessionStorage.setItem(`lastVisitedPost_${id}`, JSON.stringify(postData));
        } catch (error) {
          console.error("Error fetching post:", error);
        }
    };
  

  useEffect(() => {
    if (isNewPost) {
      setPost({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        content: '# New Post\n\nStart writing your post here...'
      });
      setIsEditing(true); // Start in editing mode for new posts
      setLoading(false);
    } else {
      // Existing post logic
      const cachedPost = sessionStorage.getItem(`lastVisitedPost_${id}`);

      if (cachedPost) {
        setPost(JSON.parse(cachedPost));
        setLoading(false);
      } else {
        fetchPost(); 
        setNewMarkdown(post ? post.content : '');
      }
    }
  }, [id, isNewPost]);

  const handleBack = () => {
    sessionStorage.setItem('activeTab', 'writing');
    navigate("/");
    // set state to "writing"
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!post) return;
    
    if (isNewPost && !post.title.trim()) {
      alert('Please enter a title for your post.');
      return;
    }
    
    setSaving(true);
    try {
      const url = isNewPost ? API_ENDPOINTS.posts : API_ENDPOINTS.post(id);
      const token = localStorage.getItem('token') || '';
      const method = isNewPost ? 'POST' : 'PUT';
      console.log("token:", token);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: post.date,
          title: post.title,
          description: post.description,
          content: newMarkdown,
          
          ...(isNewPost && { type: 'Personal' }) 
        }),
      });
      
      console.log('Save response:', response);
      if (!response.ok) {
        throw new Error(`Failed to ${isNewPost ? 'create' : 'update'} post: ${response.status}`);
      }

      const updatedPost = await response.json();
      
      // Ensure the returned post has the correct structure
      const normalizedPost = {
        ...updatedPost,
        md: updatedPost.content || updatedPost.md || post.md // Use content from backend or fallback
      };
      
      if (isNewPost) {
        navigate(`/writing/${updatedPost.id}`, { replace: true });
        setPost(normalizedPost);
        setIsEditing(false);
      } else {
        // Update existing post
        setPost(normalizedPost);
        setIsEditing(false);
        
        // Update the cached version
        sessionStorage.setItem(`lastVisitedPost_${id}`, JSON.stringify(normalizedPost));
      }
      
      // Update the cached version
      sessionStorage.setItem(`lastVisitedPost_${id}`, JSON.stringify(normalizedPost));
      
      console.log('Post updated successfully:', normalizedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      
      alert('Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Refetch the original post to reset changes
    fetchPost();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!post || isNewPost) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await fetch(API_ENDPOINTS.post(id), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }

      // Remove cached post
      sessionStorage.removeItem(`lastVisitedPost_${id}`);
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  }

  sessionStorage.setItem('lastVisitedPost', id);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="p-8 text-center"
        >
        </motion.div>
      ) : (
        <motion.div
          key={post.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="mx-auto min-h-screen max-w-screen-lg px-6 py-12 md:px-12 md:py-16">
            <div className="mb-3 flex justify-between items-center">
              <button
                className="tab font-semibold relative pb-1 transition-colors duration-200 text-gray-700 hover:text-black"
                onClick={handleBack}
              >
                back to posts
                
              </button>
              
              {(isEditing || isNewPost) ? (
                <div className="flex gap-4">
                  {isEditing && !isNewPost && (
                    <button
                      onClick={handleDelete}
                      className="tab font-semibold relative pb-1 transition-colors duration-200 text-red-700 hover:text-red-900"
                    >
                      delete
                    </button>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`tab font-semibold relative pb-1 transition-colors duration-200 ${
                      saving 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    {saving ? (isNewPost ? 'creating...' : 'saving...') : (isNewPost ? 'create post' : 'save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="tab font-semibold relative pb-1 transition-colors duration-200 text-gray-700 hover:text-black"
                  >
                    cancel
                  </button>
                  
                  
                </div>
              ) : !isNewPost && (
                <button
                  onClick={handleEdit}
                  className="tab font-semibold relative pb-1 transition-colors duration-200 text-gray-700 hover:text-black"
                >
                  edit post
                </button>
              )}
            </div>

            <PostUI 
              post={post}
              mode={isNewPost ? 'new' : (isEditing ? 'editing' : 'render')}
              onUpdate={setPost}
              newMarkdown={setNewMarkdown}
            />
            
            <Footer />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}