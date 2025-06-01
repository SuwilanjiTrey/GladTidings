import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, ChevronUp, Edit, Trash2, ChevronRight } from 'lucide-react';
import '../style/AdminPage.css';
import RichTextEditor from '../RichTextEditor/RTE.tsx';
import FlagIcon from '../flagIcon.js';
import { useTranslation } from 'react-i18next';

function AdminPage() {
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [title, setTitle] = useState('');
  const [church, setChurch] = useState('');
  const [language, setLanguage] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showPosts, setShowPosts] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [admin, setAdmin] = useState(null);
  const { t } = useTranslation();



  useEffect(() => {
    const userdata = JSON.parse(localStorage.getItem('currentUser'));
    if (userdata) {
      setChurch(userdata.church || '');
      setLanguage(userdata.language || '');
      setAdmin(userdata.userId || 1);
    }
  }, []);



  useEffect(() => {
    if (church) {
      fetchPosts();
      fetchCourses();
    }
  }, [church]);


  // Existing fetch functions remain the same
  async function fetchPosts() {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts`, {
        params: { church }
      });
      setPosts(response.data);
      console.log("posts: ", response.data);
    } catch (error) {
      console.error('Error fetching posts', error);
    }
  }
  async function fetchCourses() {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses`, {
        params: { church }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses', error);
    }
  }
  // Existing handleSubmit, handleDelete, and handleEdit functions
  async function handleSubmit(processedContent) {
    try {
      if (!selectedCourse) {
        const alertmessage = t('admin.posts.select course')
        alert(alertmessage);
        return;
      }

      if (editingId) {
        const response = await axios.put(`http://localhost:5000/api/posts/${editingId}`, {
          title,
          content: processedContent,
          course_id: selectedCourse,
        });

        if (response.data.success) {
          setEditingId(null);
          setTitle('');
          setContent('');
        }
      } else {
        const response = await axios.post('http://localhost:5000/api/posts', {
          title,
          content: processedContent,
          language: language,
          church: church,
          course_id: selectedCourse,
          createdBy: admin, 
        });

        if (response.data.success) {
          setTitle('');
          setContent('');
          setSelectedCourse(null);
        }
      }

      fetchPosts();
    } catch (error) {
      console.error('Error saving/updating post:', error);
      const failed = t('admin.posts.failed')
      alert(failed);
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  function handleEdit(post) {
    setTitle(post.title);
    setContent(post.content);
    setEditingId(post.id);
    setSelectedCourse(post.course_id);
    setShowPosts(false);
  }

  // Group posts by course
  const postsByCourse = posts.reduce((acc, post) => {
    const courseId = post.course_id;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(post);
    return acc;
  }, {});

  const toggleCourse = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  return (
    <div className="admin-container">
   <header className="admin-header">
        <div className="church-info">
          {church && <h2 className="church-name">{church}</h2>}
          {language && <FlagIcon language={language} size={28} />}
        </div>
      </header>
 <nav className="editor-nav">
          <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
          <Link to="/subscribers" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
          <Link to="/posts" className="admin-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
          <Link to="/courses" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
          <Link to="/quiz-management" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
          <Link to="/certificate" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
          <Link to="/admin-settings" className="nav-link"><ChevronRight size={16} /> {t('settings')} </Link>
        </nav>
      <h1 className="admin-title">{t('admin.posts.Admin Dashboard')}</h1>

      <div className="admin-form-card">
        <h2 className="form-title">{t('admin.posts.Create/Edit Post')}</h2>
        <div className="form-content">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.posts.Title')}
            className="admin-input"
          />

          <select 
            value={selectedCourse || ""}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="admin-select"
          >
            <option value="">{t('admin.posts.Select Course')}</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.title}
              </option>
            ))}
          </select>

          <div className="editor-container">
            <RichTextEditor
              value={content}
              onChange={setContent}
              onSubmit={(processedContent) => handleSubmit(processedContent)}
            />
          </div>

          <button 
            onClick={() => handleSubmit(content)}
            className="admin-button"
          >
            {editingId ? t('admin.posts.Update') : t('admin.posts.Create')} {t('admin.posts.Post')}
          </button>
        </div>
      </div>

      <div className="posts-management-card">
        <div className="posts-header">
          <h2 className="posts-title">{t('admin.posts.Posts Management')}</h2>
          <button
            onClick={() => setShowPosts(!showPosts)}
            className="toggle-posts-button"
          >
            {showPosts ? (
              <>{t('admin.posts.Hide Posts')}<ChevronUp size={16} /></>
            ) : (
              <>{t('admin.posts.Show Posts')} <ChevronDown size={16} /></>
            )}
          </button>
        </div>
        
        {showPosts && (
          <div className="posts-accordion">
            {courses.map(course => {
              const coursePosts = postsByCourse[course.course_id] || [];
              if (coursePosts.length === 0) return null;

              return (
                <div key={course.course_id} className="course-section">
                  <button 
                    className="course-header"
                    onClick={() => toggleCourse(course.course_id)}
                  >
                    <span>{course.title} ({coursePosts.length} {t('admin.posts.posts')})</span>
                    {expandedCourse === course.course_id ? 
                      <ChevronUp size={16} /> : 
                      <ChevronDown size={16} />
                    }
                  </button>
                  
                  {expandedCourse === course.course_id && (
                    <div className="course-posts">
                      {coursePosts.map((post) => (
                        <div key={post.id} className="post-item">
                          <div className="post-header">
                            <h3 className="post-title">{post.title}</h3>
                            <div className="post-actions">
                              <button
                                onClick={() => handleEdit(post)}
                                className="action-button edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="action-button delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {expandedPost === post.id ? (
                            <div className="post-content">
                              <div
                                dangerouslySetInnerHTML={{ __html: post.content }}
                              />
                              <button
                                onClick={() => setExpandedPost(null)}
                                className="toggle-content-button"
                              >
                                {t('admin.posts.Show Less')}
                              </button>
                            </div>
                          ) : (
                            <div className="post-content-preview">
                              <div>
                                {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </div>
                              <button
                                onClick={() => setExpandedPost(post.id)}
                                className="toggle-content-button"
                              >
                                {t('admin.posts.Show More')}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;