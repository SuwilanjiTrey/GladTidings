// RichTextEditor.tsx
import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import axios from 'axios';


const globalStyles = `
  .ql-toolbar.ql-snow {
    border: none !important;
    border-bottom: 1px solid #ccc !important;
  }
  
  .ql-snow.ql-toolbar button svg, .ql-snow .ql-toolbar button svg {
    float: left;
    height: 50% !important;
}
  .ql-container.ql-snow {
    border: none !important;
  }
  
  .ql-editor {
    font-size: 16px;
    line-height: 1.6;
    padding: 16px;
    height: 300px;
  }
  
  .ql-formats {
    margin-right: 15px !important;
  }
  
  .ql-snow .ql-picker {
    color: inherit !important;
  }
    .ql-container.ql-snow {
    border: 1px solid #ff000000 !important;
    height: 300px;
`;

// Add the styles to the document head
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = globalStyles;
document.head.appendChild(styleSheet);

const styles = {
  editorContainer: {
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  editor: {
    height: '400px',
    backgroundColor: '#fff',
  },
  toolbar: {
    borderBottom: '1px solid #ccc',
    padding: '8px',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
  },
  fileInput: {
    display: 'none',
  },
};
// Define props for the component
type RichTextEditorProps = {
  value: string;
  onChange: (content: string) => void;
  onSubmit: (processedContent: string) => void;
  placeholder?: string;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = "Start typing here..." 
}) => {
  const editorRef = useRef<ReactQuill | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [debugLog, setDebugLog] = useState<
    { timestamp: string; message: string; data?: string | null }[]
  >([]);

  // Debug logging function
  const addDebugLog = (message: string, data: any = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    console.log(`[${timestamp}] ${message}`, data || '');
    setDebugLog(prev => [...prev, logEntry]);
  };

  // Check if file exists in uploads folder
  const checkFileExists = async (filepath: string): Promise<boolean> => {
    try {
      const response = await axios.head(`http://localhost:5000${filepath}`);
      addDebugLog(`File check: ${filepath}`, { exists: response.status === 200 });
      return response.status === 200;
    } catch (error: any) {
      addDebugLog(`File check failed: ${filepath}`, { error: error.message });
      return false;
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      addDebugLog('No file selected for upload');
      return;
    }

    addDebugLog('Starting document upload', { 
      filename: file.name,
      type: file.type,
      size: file.size
    });

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addDebugLog('Document upload response received', response.data);

      if (response.data.success) {
        // Parse the returned content to check for images
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = response.data.content;
        const images = tempDiv.getElementsByTagName('img');
        
        addDebugLog('Found images in document', { 
          imageCount: images.length,
          imageSources: Array.from(images).map(img => img.src)
        });

        onChange(value + response.data.content);
      }
    } catch (error: any) {
      addDebugLog('Document upload error', { error: error.message });
      alert('Failed to upload document');
    }
  };

  const processContent = async (htmlContent: string): Promise<string> => {
    addDebugLog('Starting content processing');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const images = tempDiv.getElementsByTagName('img');
    addDebugLog('Found images in content', { 
      totalImages: images.length,
      imageSources: Array.from(images).map(img => img.src)
    });

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.getAttribute('src');

      addDebugLog(`Processing image ${i + 1}/${images.length}`, { src: src?.substring(0, 50) + '...' });

      if (src && src.startsWith('data:image')) {
        try {
          addDebugLog('Converting base64 to blob');
          const response = await fetch(src);
          const blob = await response.blob();

          addDebugLog('Created blob', { 
            size: blob.size,
            type: blob.type
          });

          const formData = new FormData();
          const filename = `image-${Date.now()}.png`;
          formData.append('images', new File([blob], filename, { type: 'image/png' }));

          addDebugLog('Uploading image', { filename });
          const uploadResponse = await axios.post('http://localhost:5000/api/upload-images', formData);
          
          addDebugLog('Upload response received', uploadResponse.data);

          if (uploadResponse.data.success) {
            const newPath = uploadResponse.data.files[0].path;
            addDebugLog('Setting new image path', { oldSrc: src?.substring(0, 50) + '...', newPath });
            console.log('New Image Path:', newPath);

            // Verify file exists in uploads folder
            const exists = await checkFileExists(newPath);
            addDebugLog('File existence check', { path: newPath, exists });

            img.setAttribute('src', newPath);
          }
        } catch (error: any) {
          addDebugLog('Image processing error', { error: error.message });
        }
      } else {
        addDebugLog('Skipping non-base64 image', { src: src?.substring(0, 50) + '...' });
      }
    }

    addDebugLog('Content processing complete');
    return tempDiv.innerHTML;
  };

  const handleSubmit = async () => {
    addDebugLog('Starting submission process');
    try {
      const processedContent = await processContent(value);
      addDebugLog('Content processed successfully', { 
        contentLength: processedContent.length,
        imageCount: (processedContent.match(/<img/g) || []).length
      });
      console.log('Processed Content:', processedContent);

      onSubmit(processedContent);
    } catch (error: any) {
      addDebugLog('Submission error', { error: error.message });
      alert('Failed to process content');
    }
  };

  const modules = {
    toolbar: [
      [
        { 'font': [] },
        { 'size': ['small', false, 'large', 'huge'] }
      ],
      [
        'bold', 
        'italic', 
        'underline', 
        'strike'
      ],
      [
        { 'color': [] }, 
        { 'background': [] }
      ],
      [
        { 'header': [1, 2, 3, 4, 5, 6, false] },
        { 'align': [] }
      ],
      [
        { 'list': 'ordered'}, 
        { 'list': 'bullet' },
        { 'indent': '-1'}, 
        { 'indent': '+1' }
      ],
      [
        'blockquote',
        'code-block'
      ],
      [
        'link', 
        'image', 
        'video',
        'formula'
      ],
      [
        'clean',
        { 'direction': 'rtl' }
      ],
      [
        { 'script': 'sub'}, 
        { 'script': 'super' }
      ],
    ]
  };

  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'header',
    'align',
    'list',
    'bullet',
    'indent',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
    'formula',
    'script',
    'direction'
  ];

  return (
    <div style={styles.editorContainer}>
      <div style={styles.editor}>
        <ReactQuill 
          ref={editorRef}
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ height: '100%' }}
        />
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleDocumentUpload}
        accept=".doc,.docx,.pdf"
        style={styles.fileInput}
      />
      
      <div style={styles.controls}>
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={styles.button}
        >
          📄 Upload Document
        </button>
      </div>
    </div>
  );
};

export default RichTextEditor;
