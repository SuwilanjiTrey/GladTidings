import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ChapterView = ({ 
  post, 
  courseId, 
  onNext, 
  totalPosts, 
  currentPostIndex,
  onComplete,
  isCompleted: initialIsCompleted 
}) => {
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleChapterCompletion = useCallback(async () => {
    if (loading || isCompleted) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/update-progress', {
        userId: JSON.parse(localStorage.getItem('currentUser')).userId,
        courseId: courseId,
        postId: post.id,
        completed: true,
      });

      setIsCompleted(true);
      onComplete(); // Call the parent handler
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, post.id, loading, isCompleted, onComplete]);

  // Track scrolling progress
  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('chapter-content');
      if (element) {
        const scrollPosition = element.scrollTop;
        const totalHeight = element.scrollHeight - element.clientHeight;
        const progress = (scrollPosition / totalHeight) * 100;
        setReadingProgress(Math.min(progress, 100));

        // Mark as completed when user reaches bottom (95% threshold)
        if (progress > 95 && !isCompleted) {
          handleChapterCompletion();
        }
      }
    };

    const contentElement = document.getElementById('chapter-content');
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [isCompleted, handleChapterCompletion]);

  // Reset scroll position to the top when a new chapter is loaded
  useEffect(() => {
    const contentElement = document.getElementById('chapter-content');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
    setReadingProgress(0); // Reset reading progress for the new chapter
    setIsCompleted(false); // Reset completion status for the new chapter
  }, [post]);

  // Check if chapter was previously completed
  useEffect(() => {
    const checkCompletion = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/chapter-status', {
          params: {
            userId: JSON.parse(localStorage.getItem('currentUser')).userId,
            postId: post.id,
          },
        });
        setIsCompleted(data.completed);
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    };

    checkCompletion();
  }, [post.id]);

  return (
    <div className="chapter-view">
      <div className="progress-header">
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
        <span className="progress-text">{Math.round(readingProgress)}% {t('client.Complete')}</span>
      </div>

      <div
        id="chapter-content"
        className="chapter-content"
        style={{ height: '70vh', overflowY: 'auto' }}
      >
        <h2>{post.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      <div className="chapter-navigation">
        {isCompleted && currentPostIndex < totalPosts - 1 && (
          <button onClick={onNext} className="next-chapter-button">
            {t('client.Next_Chapter')}
          </button>
        )}
        {isCompleted && currentPostIndex === totalPosts - 1 && (
          <div className="completion-message">
            {t('client.congratulations')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterView;
