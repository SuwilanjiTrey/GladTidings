import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import QuizSelector from './quizview';
import ChapterView from './CourseProgress';
import { Lock, Unlock, ChevronLeft  } from 'lucide-react';
import '../style/ClientPage.css';
import '../style/mobile.css';
import { useTranslation } from 'react-i18next';

function CourseDetails({ course, posts = [], onBack }) {
  const [isMobileContentView, setIsMobileContentView] = useState(false);
  // Ensure posts is an array and sort it
  const { t } = useTranslation();
  const sortedPosts = useMemo(() => {
    if (!Array.isArray(posts) || posts.length === 0) {
      return [];
    }
    return [...posts].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [posts]);

  const [state, setState] = useState({
    quizzes: [],
    selectedPost: null,
    viewMode: 'chapters',
    activeTab: 'details',
    completedChapters: new Set(),
    loading: true,
    error: null
  });

  // Set initial selected post when sortedPosts changes
  useEffect(() => {
    if (sortedPosts.length > 0 && !state.selectedPost) {
      setState(prev => ({
        ...prev,
        selectedPost: sortedPosts[0]
      }));
    }
  }, [sortedPosts]);

  const userId = useMemo(() => 
    JSON.parse(localStorage.getItem('currentUser'))?.userId,
    []
  );

  useEffect(() => {
    async function fetchInitialData() {
      if (!userId || !course?.course_id) return;

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const [quizzesResponse, completionResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/quizzes', {
            params: { course_id: course.course_id }
          }),
          axios.get('http://localhost:5000/api/user-progress', {
            params: {
              userId,
              courseId: course.course_id
            }
          })
        ]);

        const completedIds = new Set(
          completionResponse.data.completedChapters.map(chapter => chapter.post_id)
        );

        setState(prev => ({
          ...prev,
          quizzes: quizzesResponse.data,
          completedChapters: completedIds,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load course data. Please try again.'
        }));
        console.error('Error fetching initial data:', error);
      }
    }

    fetchInitialData();
  }, [course?.course_id, userId]);


  
  // Function to check if we're on mobile
  const isMobile = () => window.innerWidth <= 768;

 

  const handleBackToChapters = useCallback(() => {
    setIsMobileContentView(false);
  }, []);

  const isChapterAccessible = useCallback((post, index) => {
    if (index === 0) return true;
    const previousPost = sortedPosts[index - 1];
    return state.completedChapters.has(previousPost.id);
  }, [sortedPosts, state.completedChapters]);

  const handleChapterCompletion = useCallback((completedChapterId) => {
    setState(prev => ({
      ...prev,
      completedChapters: new Set([...prev.completedChapters, completedChapterId])
    }));
  }, []);

  const handlePostSelection = useCallback((post, index) => {
    if (isChapterAccessible(post, index)) {
      setState(prev => ({ ...prev, selectedPost: post }));
      if (isMobile()) {
        setIsMobileContentView(true);
      }
    }
  }, [isChapterAccessible]);

  const handleViewModeToggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'chapters' ? 'quizzes' : 'chapters'
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (!state.selectedPost) return;
    
    const currentIndex = sortedPosts.indexOf(state.selectedPost);
    const nextPost = sortedPosts[currentIndex + 1];
    if (nextPost && isChapterAccessible(nextPost, currentIndex + 1)) {
      setState(prev => ({ ...prev, selectedPost: nextPost }));
    }
  }, [sortedPosts, state.selectedPost, isChapterAccessible]);

  if (state.loading) {
    return <div className="loading-state">{t('loading_course')}</div>;
  }

  if (state.error) {
    return <div className="error-state">{state.error}</div>;
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    return <div className="error-state">{t('no_chapter')}</div>;
  }

  if (state.activeTab !== 'details') {
    return <div>Select a tab</div>;
  }

  if (!state.selectedPost) {
    return <div className="loading-state">{t('Loading_chapter_content')}</div>;
  }

  const renderChaptersList = () => (
    <div className={`chapters-list ${isMobileContentView ? 'content-active' : ''}`}>
      <h2>{t('chapters')}</h2>
      <ul>
        {sortedPosts.map((post, index) => {
          const isAccessible = isChapterAccessible(post, index);
          const isCompleted = state.completedChapters.has(post.id);

          return (
            <li
              key={post.id}
              className={`chapter-item ${
                state.selectedPost.id === post.id ? 'active' : ''
              } ${isCompleted ? 'completed' : ''} ${
                isAccessible ? 'accessible' : 'locked'
              }`}
              onClick={() => handlePostSelection(post, index)}
            >
              {post.title}
              {isAccessible ? (
                <Unlock size={18} className="chapter-icon unlock-icon" />
              ) : (
                <Lock size={18} className="chapter-icon lock-icon" />
              )}
              {isCompleted && <span className="completion-indicator">✓</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const renderChapterContent = () => (
    <div className={`selected-chapter ${isMobileContentView ? 'active' : ''}`}>
      {/* Mobile-only header */}
      <div className="mobile-chapter-header">
        <button className="back-to-chapters" onClick={handleBackToChapters}>
          <ChevronLeft size={20} />
          {t('back')}
        </button>
        <h2 className="chapter-title">{state.selectedPost?.title}</h2>
      </div>

      <ChapterView
        post={state.selectedPost}
        courseId={course.course_id}
        onNext={handleNext}
        totalPosts={sortedPosts.length}
        currentPostIndex={sortedPosts.indexOf(state.selectedPost)}
        onComplete={() => handleChapterCompletion(state.selectedPost.id)}
        isCompleted={state.completedChapters.has(state.selectedPost.id)}
      />
    </div>
  );


  return (
    <div className="course-details-container">
      <div className="course-header">
        <button onClick={onBack}>{t('backToCourses')}</button>
        <button onClick={handleViewModeToggle}>
          {state.viewMode === 'chapters' ? t('view_quizzes') : t('view_chapters')}
        </button>
      </div>

      <div className="course-details-layout">
        {state.viewMode === 'chapters' ? (
          <>
            {renderChapterContent()}
            {renderChaptersList()}
          </>
        ) : (
          <QuizSelector quizzes={state.quizzes} courseId={course.course_id} />
        )}
      </div>
    </div>
  );
}
export default CourseDetails;