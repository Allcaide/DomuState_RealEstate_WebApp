// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 20;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Utility functions
function validateImageFile(file) {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`File "${file.name}" is not a valid image type. Only JPEG, PNG and WebP are allowed.`);
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" is too large. Maximum size is 5MB.`);
    }
    
    return true;
}

// Preview functions
function createImagePreview(file, previewContainer, onRemove) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imgPreview = document.createElement('div');
        imgPreview.classList.add('relative', 'w-24', 'h-24');
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.classList.add('w-full', 'h-full', 'object-cover', 'rounded');
        imgPreview.appendChild(img);
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.classList.add(
            'absolute', 'top-0', 'right-0',
            'bg-red-500', 'text-white',
            'rounded-full', 'w-5', 'h-5',
            'flex', 'items-center', 'justify-center',
            'text-xs', 'hover:bg-red-600',
            'transition-colors'
        );
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => {
            imgPreview.remove();
            if (onRemove) onRemove();
        };
        
        imgPreview.appendChild(removeBtn);
        previewContainer.appendChild(imgPreview);
    };
    
    reader.readAsDataURL(file);
}

// Update upload status
function updateUploadStatus(status, message, isError = false) {
    const uploadStatus = document.getElementById('upload-status');
    const uploadMessage = document.getElementById('upload-message');
    const uploadSpinner = document.getElementById('upload-spinner');
    
    if (!uploadStatus || !uploadMessage || !uploadSpinner) return;
    
    uploadStatus.classList.remove('hidden', 'bg-blue-100', 'bg-green-100', 'bg-red-100');
    uploadStatus.classList.remove('text-blue-700', 'text-green-700', 'text-red-700');
    
    if (status === 'loading') {
        uploadStatus.classList.add('bg-blue-100', 'text-blue-700');
        uploadSpinner.classList.remove('hidden');
    } else if (status === 'success') {
        uploadStatus.classList.add('bg-green-100', 'text-green-700');
        uploadSpinner.classList.add('hidden');
    } else if (status === 'error') {
        uploadStatus.classList.add('bg-red-100', 'text-red-700');
        uploadSpinner.classList.add('hidden');
    }
    
    uploadMessage.textContent = message;
}

// Export functions for use in other scripts
window.imageUpload = {
    validateImageFile,
    createImagePreview,
    updateUploadStatus,
    constants: {
        MAX_FILE_SIZE,
        MAX_FILES,
        ALLOWED_TYPES
    }
};