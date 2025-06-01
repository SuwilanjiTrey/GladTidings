import React, { useState, useRef, useEffect, createContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Upload, 
  Type, 
  X, 
  Settings, 
  Move, 
  ImageIcon,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import '../style/certificate.css';
import { useTranslation } from 'react-i18next';


// Create context for global font state
const FontContext = createContext();

const ImageEditor = ({ name }) => {
  const [currentFont, setCurrentFont] = useState('Playfair Display');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [courses, setCourses] = useState([]);
  const [userId, setUserId ] = useState('');
  const [church, setChurch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [existingCertificates, setExistingCertificates] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();


    useEffect(() => {
      const userdata = JSON.parse(localStorage.getItem('currentUser'));
      if (userdata) {
        setChurch(userdata.church || '');
        setUserId(userdata.userId || '');
      }
    }, []);

    // Add another useEffect to fetch certificates when userId changes
useEffect(() => {
  if (userId) {
    fetchCertificates();
  }
}, [userId]);
  // Fetch existing certificates
  const fetchCertificates = async () => {
    try {
      console.log("user is trying to access:", userId);
      const response = await axios.get('http://localhost:5000/api/certificates/list', {
        params: { id: userId }
      });
      
      const certificates = response.data.map(cert => ({
        ...cert,
        certificateUrl: `http://localhost:5000/${cert.certificateUrl.replace(/\\/g, '/')}`
      }));
      setExistingCertificates(certificates);
      console.log("Processed certificates:", certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };
  



  // Edit certificate function
  const editCertificate = (certificate) => {
    setSelectedCourse(certificate.course_id);
    const img = new Image();
    img.src = certificate.templateUrl;
    img.onload = () => {
      setImage(img);
      // Load other certificate metadata if available
      if (certificate.metadata) {
        setCurrentFont(certificate.metadata.font || currentFont);
        setFontSize(certificate.metadata.fontSize || fontSize);
        setCurrentColor(certificate.metadata.color || currentColor);
        setPosition(certificate.metadata.position || position);
      }
    };
  };

  // Delete certificate function
  const deleteCertificate = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/certificates/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExistingCertificates(prev => 
          prev.filter(cert => cert.course_id !== courseId)
        );
        alert('Certificate deleted successfully');
      } else {
        alert('Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Error deleting certificate');
    }
  };

  async function fetchCourses() {
    try {
      console.log("church name: ", church)
      const response = await axios.get(`http://localhost:5000/api/courses`, {
        params: { church }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses', error);
    }
  }

  // Enhanced font selection with more elegant options
  const fonts = [
    'Georgia',
    'Garamond',
    'Baskerville',
    'Times New Roman',
    'Palatino',
    'Didot',
    'Bell MT',
    'Goudy Old Style',
    'Cambria',
    'Hoefler Text'
  ];

  // Load Google Fonts
  useEffect(() => {
    const loadFonts = async () => {
      const WebFont = await import('webfontloader');
      WebFont.load({
        google: {
          families: [
            'Playfair Display',
            'Cormorant Garamond',
            'Cinzel',
            'Pinyon Script',
            'Great Vibes',
            'Dancing Script',
            'Petit Formal Script',
            'Alex Brush',
            'Carattere',
            'Tangerine'
          ]
        }
      });
    };
    loadFonts();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          setImage(img);
        };
      };
      reader.readAsDataURL(file);
      console.log("file data: ", file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
  
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  
    if (text) {
      ctx.font = `${fontSize}px "${currentFont}"`;
      ctx.fillStyle = currentColor;
      ctx.textAlign = 'center'; // Set text alignment to center
      
      // Get text metrics for vertical centering
      const textMetrics = ctx.measureText(text);
      const textHeight = fontSize;
      
      // Draw text using the center-aligned position
      ctx.fillText(text, position.x + (textMetrics.width / 2), position.y);
      
      // Debug: draw centerpoint (optional, remove in production)
      
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(position.x + (textMetrics.width / 2), position.y - (textHeight / 2), 3, 0, 2 * Math.PI);
      ctx.fill();
      
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
  
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px "${currentFont}"`;
    const textMetrics = ctx.measureText(text);
    
    // Calculate text dimensions
    const textWidth = textMetrics.width;
    const textHeight = fontSize; // Approximate height using fontSize
    
    // Calculate text box center
    const textCenterX = position.x + (textWidth / 2);
    const textCenterY = position.y - (textHeight / 2);
  
    // Check if click is within text bounds (now using center-based calculation)
    const clickRadius = Math.max(textWidth, textHeight) / 2 + 20; // Added padding for easier selection
    const distanceFromCenter = Math.sqrt(
      Math.pow(mouseX - textCenterX, 2) + 
      Math.pow(mouseY - textCenterY, 2)
    );
  
    if (distanceFromCenter <= clickRadius) {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - textCenterX,
        y: mouseY - textCenterY
      });
    }
  };


  const handleMouseMove = (e) => {
    if (!isDragging) return;
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
  
    // Get text dimensions
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px "${currentFont}"`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
  
    // Calculate new position based on center point
    setPosition({
      x: mouseX - dragOffset.x - (textWidth / 2),
      y: mouseY - dragOffset.y + (textHeight / 2)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

   useEffect(() => {
     if (church) {
       fetchCourses();
     }
   }, [church]);


  useEffect(() => {
    drawCanvas();
    fetchCertificates();
  }, [image, text, fontSize, position, currentFont, currentColor]);

  const onSave = async (templateUrl) => {
    try {
      // Handle the saved template URL
      console.log('Template saved successfully:', templateUrl);
     
      // You can add additional logic here, such as showing a success message
      // or updating the UI to reflect the saved state
    } catch (error) {
      console.error('Error handling saved template:', error);
    }
  };

  const debug = () => {
    const storedData = JSON.parse(localStorage.getItem('formdata'));
    if (storedData) {
      console.log(
        "stored data: ",
        storedData.metadata.font,
        storedData.metadata.position,
        storedData.metadata.color,
        //storedData.metadata.text
      );
    } else {
      console.log("No data found in localStorage.");
    }
  };
  

  const saveTemplate = async (params) => {
    const { courseId } = params;
    if (!canvasRef.current || !image) return;
  
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
      // Calculate center position before saving
  const textMetrics = ctx.measureText(text);
  const centerPosition = {
    x: position.x + (textMetrics.width / 2),
    y: position.y - (fontSize / 2)
  };

    // Redraw the template without text
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.drawImage(image, 0, 0); // Draw the base image again
  
    const templateData = canvas.toDataURL('image/jpeg'); // Export the canvas
  
    // Reapply text (optional: if needed for display after saving)
    if (text) {
      ctx.font = `${fontSize}px "${currentFont}"`;
      ctx.fillStyle = currentColor;
      ctx.fillText(text, position.x, position.y);
    }
  
    // Prepare FormData
    const formData = new FormData();
    formData.append('courseId', courseId);
    formData.append('template', dataURLtoFile(templateData, 'certificate-template.jpg')); // File version of template
    formData.append('metadata', JSON.stringify({
      color: currentColor,
      position: centerPosition, // Save the center position
    }));
  
    // Debugging FormData
    console.log("Form image data:", formData);
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  
    // Save to LocalStorage
    const formDataObject = {
      courseId: params.courseId,
      template: templateData, // Base64 template
      metadata: {
        font: currentFont,
        fontSize,
        color: currentColor,
        position,
      },
    };
    localStorage.setItem('formdata', JSON.stringify(formDataObject));
  
    // Send to the server
    try {
      const response = await fetch('http://localhost:5000/api/certificates/update-certificate-template', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Template saved successfully:", data.templateUrl);
        onSave(data.templateUrl);
      } else {
        console.error("Failed to save template:", response.statusText);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };
  
  // Helper function to convert Data URL to File
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };


  return (
    <FontContext.Provider value={{ currentFont, setCurrentFont }}>
      <div className="editor-containers">
 <nav className="editor-nav">
          <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
          <Link to="/subscribers" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
          <Link to="/posts" className="nav-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
          <Link to="/courses" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
          <Link to="/quiz-management" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
          <Link to="/certificate" className="admin-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
          <Link to="/admin-settings" className="nav-link"><ChevronRight size={16} /> {t('settings')}</Link>
        </nav>

        <div className="editor-main">
          <div className="editor-control">
            <h1 className="editor-title">{t('admin.cert.Certificate Editor')}</h1>
            
            <div className="control-section">
              <h2 className="section-titles">{t('admin.cert.Course Selection')}</h2>
              <select 
                className="control-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">{t('admin.cert.Select Course')}</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-section">
              <h2 className="section-title">{t('admin.cert.Template')}</h2>
              <div className="upload-zone">
                <label className="upload-label">
                  {!image ? (
                    <>
                      <ImageIcon size={32} />
                      <span>{t('admin.cert.Select Template Image')}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>{t('admin.cert.Change Template')}</span>
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="upload-input"
                  />
                </label>
              </div>
            </div>

            <div className="control-section">
              <h2 className="section-title">{t('admin.cert.Text Settings')}</h2>
              <div className="text-controls">
                <div className="control-group">
                  <Type size={16} />
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter certificate text"
                    className="control-input"
                  />
                </div>

                <div className="control-group">
                  <Move size={16} />
                  <select
                    value={currentFont}
                    onChange={(e) => setCurrentFont(e.target.value)}
                    className="control-select"
                  >
                    {fonts.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <Settings size={16} />
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="control-range"
                  />
                  <span className="range-value">{fontSize}px</span>
                </div>

                <div className="control-group">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="control-color"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => saveTemplate({ courseId: selectedCourse })}
              disabled={!image}
              className="save-button"
            >
              <Download size={20} />
              {t('admin.cert.Save Certificate')}
            </button>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="editor-canvas"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            />
          </div>
        </div>

        <div className={`certificate-drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <h2>{t('admin.cert.Saved Certificates')}</h2>
            <button onClick={() => setIsDrawerOpen(false)} className="drawer-close">
              <X size={20} />
            </button>
          </div>
          
          <div className="drawer-content">
            {courses.map(course => (
              <div key={course.course_id} className="certificate-card">
                <h3>{course.title}</h3>
                {existingCertificates
                  .filter(cert => cert.course_id === course.course_id)
                  .map(certificate => (
                    <div key={certificate.id} className="certificate-item">
                      <img 
                        src={certificate.certificateUrl}
                        alt={`Certificate for ${course.title}`}
                        className="certificate-preview"
                      />
                      <div className="certificate-actions">
                        <button onClick={() => editCertificate(certificate)} className="action-button edit">
                          {t('admin.cert.Edit')}
                        </button>
                        <button onClick={() => deleteCertificate(certificate.course_id)} className="action-button delete">
                          {t('admin.cert.Delete')}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="drawer-toggle">
          {isDrawerOpen ? <X size={20} /> : <Type size={20} />}
        </button>
      </div>
    </FontContext.Provider>
  );
};

export default ImageEditor;