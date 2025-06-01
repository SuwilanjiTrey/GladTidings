// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const toolbar = document.getElementById('toolbar');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const loadingDiv = document.getElementById('loading');

    // Toolbar formatting
    toolbar.addEventListener('click', (e) => {
        if (e.target.dataset.command) {
            document.execCommand(e.target.dataset.command, false, null);
        }
    });

    // Drag and drop handling
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    async function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            .includes(file.type)) {
            alert('Please upload a PDF or Word document.');
            return;
        }

        loadingDiv.style.display = 'block';
        
        const formData = new FormData();
        formData.append('document', file);

        try {
            const response = await fetch('/upload-document', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Clear existing content
                editor.innerHTML = '';
                
                // Insert new content
                editor.innerHTML = data.content;
                
                // Ensure images are properly sized
                const images = editor.getElementsByTagName('img');
                Array.from(images).forEach(img => {
                    img.style.maxWidth = '100%';
                });
            } else {
                alert('Failed to process document. Please try again.');
            }
        } catch (error) {
            console.error('Document upload failed:', error);
            alert('Failed to upload document. Please try again.');
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    // Keep existing image reconstruction logic
    function reconstructImages() {
        const imageSpans = editor.querySelectorAll('span[data-image-id]');
        
        imageSpans.forEach(async (span) => {
            const imageId = span.dataset.imageId;
            
            try {
                const response = await fetch(`/get-image/${imageId}`);
                const data = await response.json();

                if (data.success) {
                    const img = document.createElement('img');
                    img.src = data.base64Image;
                    img.style.maxWidth = '100%';
                    span.parentNode.replaceChild(img, span);
                }
            } catch (error) {
                console.error('Image reconstruction failed:', error);
            }
        });
    }

    reconstructImages();
});