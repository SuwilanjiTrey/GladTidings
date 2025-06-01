import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import axios from 'axios';
import '../style/AdminPage.css'; // Reuse existing styles
import courseImages from '../images.json';
import SettingsSection from './AdminSettings';
import FlagIcon from '../flagIcon';
import { useTranslation } from 'react-i18next';


function AdminCoursesPage() {
  // State for courses
  const [church, setChurch] = useState('');
  const [church_id, setChurchId] = useState('');
  const [admin, setAdmin] = useState(1);
    
  const [courses, setCourses] = useState([]);
  const [language, setLanguage] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    imageId: '',
    church: '' // Add church to new course state
  });
  const [selectedImage, setSelectedImage] = useState(null);  // Fixed this line
  const [editingCourse, setEditingCourse] = useState(null);
  const [passCriteria, setPassCriteria] = useState('');
  // State for quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [newQuiz, setNewQuiz] = useState({
    course_id: '',
    title: '',
    description: '',
    time:'',
    questions: []
  });

  // State for managing questions in quiz creation
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: [{ option_text: '', is_correct: false }]
  });

  const { t } = useTranslation();

    // Handle image selection
  const handleImageSelect = (imageId) => {
    setNewCourse(prev => ({ ...prev, imageId }));
    const selected = courseImages.images.find(img => img.id === imageId);
    console.log(selectedImage)
    setSelectedImage(selected);
  };


  const handleUpdatePassCriteria = async (courseId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/pass-criteria`,
        { passCriteria: parseInt(passCriteria) }
      );
      
      if (response.data.success) {
        fetchCourses();
        setEditingCourse(null);
        setPassCriteria('');
        alert(t('admin.course.Pass criteria updated successfully'));
      }
    } catch (error) {
      console.error('Error updating pass criteria:', error);
      alert(t('admin.course.Failed to update pass criteria'));
    }
  };


  // Initialize admin data
  useEffect(() => {
    const userdata = JSON.parse(localStorage.getItem('currentUser'));
    if (userdata) {
      setChurch(userdata.church || '');
      setAdmin(userdata.userId || 1);
    }
  }, []);

  useEffect(() => {
    if (church_id) { // Only fetch quizzes when church_id is available
      fetchQuizzesForChurch(church_id);
    }
  }, [church_id]); // Depend on church_id instead of church

  // Fetch courses when church changes
  useEffect(() => {
    if (church) {
      fetchCourses();
      fetchChurchId();
    }
  }, [church]);


  const languages = [
    { code: 'en', name: 'English' },
    {code: 'es', name: 'Español'},
    {code: 'fr', name: 'Français'},
    {code: 'de', name: 'Deutsch'},
    {code: 'it', name: 'Italiano'},
    {code: 'pt', name: 'Português'},
    {code: 'ar', name: 'العربية'},
    {code: 'ja', name: '日本語'},
    {code: 'ko', name: '한국어'}
  ];

  // Fetch courses
  async function fetchCourses() {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses?church=${church}`);
      const coursesWithImages = response.data.map(course => {
        // Add random imageId if not present
        if (!course.imageId) {
          const randomImageId = courseImages.images[Math.floor(Math.random() * courseImages.images.length)].id;
          return { ...course, imageId: randomImageId };
        }
        return course;
      });
      setCourses(coursesWithImages);
      
      // Log languages from all courses
      const languages = coursesWithImages.map(course => course.language);
      console.log("Languages of all courses:", languages);
      
      // If you want to see full course data with language
      coursesWithImages.forEach(course => {
        console.log(`Course "${course.title}" language:`, course.language);
      });
      
    } catch (error) {
      console.error('Error fetching courses', error);
    }
  }

  async function fetchChurchId() {
    try {
      const response = await axios.get(`http://localhost:5000/api/getChurchId/${admin}`);
      if (response.data && response.data.church_id) {
        const churchId = response.data.church_id; // Access the church_id
        console.log(`admin id = ${admin}, and church id = ${churchId}`);
        setChurchId(churchId);
      } else {
        console.log("Failed to fetch data or no church ID found");
      }
    } catch (error) {
      console.error('Error fetching church ID', error);
    }
  }

  // Fetch quizzes
  async function fetchQuizzesForChurch(church_Id) {
    if (!church_Id) return; // Add this guard clause
    
    try {
      const response = await axios.get('http://localhost:5000/api/allquizzes', {
        params: { church_Id: church_Id.toString() } // Ensure it's a string and the key matches exactly
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes', error);
    }
  }
  // Create a new course
  async function handleCreateCourse(e) {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/courses', {
        title: newCourse.title,
        description: newCourse.description,
        created_by: admin,
        language: language,
        church: church, // Add church to the request
        imgId: newCourse.imageId ? newCourse.imageId.replace('img', '') : null
      });

      if (response.data.success) {
        fetchCourses();
        setNewCourse({ title: '', description: '', imageId: '', church: '' });
        setSelectedImage(null);
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert(t('admin.course.Failed to create course'));
    }
  }
    // DELETE COURSE FUNCTIONALITY
    async function handleDeleteCourse(courseId) {
      // First check if the course belongs to the admin's church
      const courseToDelete = courses.find(course => course.course_id === courseId);
      if (courseToDelete.church !== church) {
        alert(t('admin.course.no permission'));
        return;
      }
  
      if (!window.confirm('Are you sure you want to delete this course?')) {
        return;
      }
  
      try {
        await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
          params: { church: church },
        });
       setCourses(courses.filter(course => course.course_id !== courseId));
        alert(t('admin.course.Course deleted successfully'));
      } catch (error) {
        console.error('Error deleting course:', error);
        alert(t('admin.course.Failed to delete course. Please try again.'));
      }
    }

  // Add option to a quiz question
  function addQuizOption() {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { option_text: '', is_correct: false }]
    }));
  }

  // Update quiz option
  function updateQuizOption(index, field, value) {
    const newOptions = [...currentQuestion.options];
    newOptions[index][field] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  }

  // Add question to quiz
  function addQuestionToQuiz() {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));
    
    // Reset current question
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: [{ option_text: '', is_correct: false }]
    });
  }

  // Create a new quiz
  async function handleCreateQuiz(e) {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/quizzes', {
        ...newQuiz,
        time: newQuiz.time ? parseInt(newQuiz.time) : null, // Convert to number or null
        created_by: admin // Hardcoded admin ID for now
      });
  
      if (response.data.success) {
        console.log("church_id for response:", church_id);
        fetchQuizzesForChurch(church_id);
        setNewQuiz({
          course_id: '',
          title: '',
          description: '',
          time: '', // Reset time field
          questions: []
        });
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(t('admin.course.Failed to create quiz'));
    }
  }

    // Only show courses that belong to the admin's church in the courses grid
    const filteredCourses = courses.filter(course => course.church === church);


  return (
    <div className="admin-container">
 <nav className="editor-nav">
          <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
          <Link to="/subscribers" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
          <Link to="/posts" className="nav-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
          <Link to="/courses" className="admin-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
          <Link to="/quiz-management" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
          <Link to="/certificate" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
          <Link to="/admin-settings" className="nav-link"><ChevronRight size={16} /> {t('settings')} </Link>
        </nav>
     
 
      <h1 className="admin-title">{t('admin.course.Admin Courses Management')}</h1>
      
      {/* Course Creation Form */}
      <div className="admin-form">
        <h2>{t('admin.course.Create New Course')}</h2>
        <form onSubmit={handleCreateCourse}>
          <input
            type="text"
            value={newCourse.title}
            onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
            placeholder={t('admin.course.Course Title')}
            className="admin-input"
            required
          />
          <textarea
            value={newCourse.description}
            onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('admin.course.Course Description')}
            className="admin-input"
            required
          />

          <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    required
                  >
                    <option value="">{t('signUp.selectLanguage')}</option>
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
          
          <div className="image-selection-container">
            <h3>{t('admin.course.image')}</h3>
            <div className="image-grid">
              {courseImages.images.map((image) => (
                <div 
                  key={image.id}
                  className={`image-option ${newCourse.imageId === image.id ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <img 
                    src={image.path} 
                    alt={image.description}
                    className="image-thumbnail"
                  />
                  <p>{image.name}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="admin-button"
            disabled={!newCourse.title || !newCourse.description}
          >
            {t('admin.course.Create Course')}
          </button>
        </form>
      </div>


      {/* Quiz Creation Form */}
      <div className="admin-form">
        <h2>{t('admin.course.Create New Quiz')}</h2>
        <form onSubmit={handleCreateQuiz}>
          <select
            value={newQuiz.course_id}
            onChange={(e) => setNewQuiz(prev => ({ ...prev, course_id: e.target.value }))}
            className="admin-input"
            required
          >
            <option value="">{t('admin.course.Select Course')}</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.title}
              </option>
            ))}
          </select>

          <div className="time-input-container">
            <input
              type="number"
              value={newQuiz.time}
              onChange={(e) => setNewQuiz(prev => ({ ...prev, time: e.target.value }))}
              placeholder={t('admin.course.time')}
              className="admin-time-input"
              min="0"
            />
            <small>{t('admin.course.empty')}</small>
          </div>

          <input
            type="text"
            value={newQuiz.title}
            onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
            placeholder={t('admin.course.Quiz Title')}
            className="admin-input"
            required
          />

          <textarea
            value={newQuiz.description}
            onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('admin.course.Quiz Description')}
            className="admin-input"
          />

          {/* Question Creation Section */}
          <div className="question-creator">
            <h3>{t('admin.course.Add Questions')}</h3>
            <select
              value={currentQuestion.question_type}
              onChange={(e) => setCurrentQuestion(prev => ({ 
                ...prev, 
                question_type: e.target.value,
                options: e.target.value === 'multiple_choice' 
                  ? [{ option_text: '', is_correct: false }]
                  : [] 
              }))}
              className="admin-input"
            >
              <option value="multiple_choice">{t('admin.course.Multiple Choice')}</option>
              
            </select>

            <input
              type="text"
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder={t('admin.course.Enter Question Text')}
              className="admin-input"
            />

            {currentQuestion.question_type === 'multiple_choice' && (
              <div>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="quiz-option">
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => updateQuizOption(index, 'option_text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="admin-input"
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) => updateQuizOption(index, 'is_correct', e.target.checked)}
                      />
                      {t('admin.course.Correct Answer')}
                    </label>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addQuizOption} 
                  className="admin-button"
                >
                  {t('admin.course.Add Option')}
                </button>
              </div>
            )}

            <button 
              type="button" 
              onClick={addQuestionToQuiz} 
              className="admin-button"
              disabled={!currentQuestion.question_text}
            >
              {t('admin.course.Add Question to Quiz')}
            </button>
          </div>

          <div>
            <h4>{t('admin.course.Questions in this Quiz')}:</h4>
            {newQuiz.questions.map((q, index) => (
              <div key={index} className="quiz-question-preview">
                <p>{q.question_text}</p>
                
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            className="admin-button"
            disabled={newQuiz.questions.length === 0}
          >
            {t('admin.course.Create Quiz')}
          </button>
        </form>
      </div>

      {/* Existing Courses Display */}
      <div className="courses-section">
        <h2>{t('admin.course.Existing Courses')}</h2>
        <div className="courses-grid">
        {filteredCourses.map(course => {
            const imageNumber = course.imageId ? `img${course.imageId}` : null;
            const courseImage = imageNumber ? courseImages.images.find(img => img.id === imageNumber) : null;
            
            return (
              <div 
                key={course.course_id} 
                className="course-item"
                style={{
                  backgroundImage: courseImage ? `url(${courseImage.path})` : 'none',
                  backgroundColor: !courseImage ? '#f0f0f0' : 'transparent',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}
              >
                <div className="course-content-overlay">
                  <h3>{course.title} {course && <FlagIcon language={course.language} size={28} />}</h3>
                  <p>{course.description}</p>
                  <p>{t('admin.course.Pass Criteria')}: {course.pass_criteria}%</p>
            
            {editingCourse === course.course_id ? (
              <div className="pass-criteria-editor">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passCriteria}
                  onChange={(e) => setPassCriteria(e.target.value)}
                  placeholder="New pass criteria"
                  className="admin-course-input"
                />
                <button
                  onClick={() => handleUpdatePassCriteria(course.course_id)}
                  className="admin-button"
                >
                  {t('admin.course.Save')}
                </button>
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setPassCriteria('');
                  }}
                  className="admin-button"
                >
                  {t('admin.course.Cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingCourse(course.course_id);
                  setPassCriteria(course.pass_criteria?.toString() || '');
                }}
                className="pass-button"
              >
                {t('admin.course.Edit Pass Criteria')}
              </button>
            )}
                  <button
                    onClick={() => handleDeleteCourse(course.course_id)}
                    className="delete-button"
                  >
                    {t('admin.course.Delete Course')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="quizzes-section">
          <h2>{t('admin.course.Existing Quizzes')}</h2>
          {quizzes.map(quiz => (
            <div key={quiz.quiz_id} className="quiz-item">
              <h3>{quiz.quiz_title}</h3>
              <p>{t('admin.course.Course')}: {courses.find(c => c.course_id === quiz.course_id)?.title}</p>
              <p>{quiz.quiz_description}</p>
              <p>{t('admin.course.Time limit')} {quiz.time ? `: ${quiz.time} ` : t('admin.course.No time limit')}</p>
            </div>
          ))}
        </div>
    </div>
  );
}

export default AdminCoursesPage;