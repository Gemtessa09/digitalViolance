// SafeNet Shield - Main JavaScript

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    setupMobileMenu();
    loadStatistics();
    checkAuthStatus();
    setupFormValidation();
    setupFileUploads();
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Load and display statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/reports/statistics');
        const data = await response.json();
        
        if (data.success) {
            updateStatisticsDisplay(data.statistics);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update statistics display with animation
function updateStatisticsDisplay(stats) {
    const elements = {
        'total-reports': stats.totalReports || 0,
        'resolved-reports': stats.resolvedReports || 0,
        'users-helped': Math.floor((stats.resolvedReports || 0) * 1.2), // Estimated
        'safety-modules': 12 // Static for now
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            animateCounter(element, value);
        }
    });
}

// Animate counter numbers
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 30);
}

// Check authentication status
async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                updateUIForAuthenticatedUser();
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                authToken = null;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }
}

// Update UI for authenticated users
function updateUIForAuthenticatedUser() {
    // Add user menu or update navigation
    // This would be implemented based on specific UI requirements
}

// Setup form validation
function setupFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(input);
            });
        });
    });
}

// Validate form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Password validation
    if (field.type === 'password' && value) {
        if (value.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters';
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }
    
    // Display validation result
    displayFieldValidation(field, isValid, errorMessage);
    
    return isValid;
}

// Display field validation result
function displayFieldValidation(field, isValid, errorMessage) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Update field styling
    if (isValid) {
        field.classList.remove('border-red-500');
        field.classList.add('border-green-500');
    } else {
        field.classList.remove('border-green-500');
        field.classList.add('border-red-500');
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.textContent = errorMessage;
        field.parentNode.appendChild(errorDiv);
    }
}

// Setup file upload functionality
function setupFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        const dropArea = input.closest('.file-upload-area');
        
        if (dropArea) {
            setupDragAndDrop(dropArea, input);
        }
        
        input.addEventListener('change', function() {
            handleFileSelection(input);
        });
    });
}

// Setup drag and drop for file uploads
function setupDragAndDrop(dropArea, input) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });
    
    dropArea.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        input.files = files;
        handleFileSelection(input);
    });
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Handle file selection
function handleFileSelection(input) {
    const files = Array.from(input.files);
    const fileList = input.parentNode.querySelector('.file-list');
    
    if (fileList) {
        fileList.innerHTML = '';
        
        files.forEach((file, index) => {
            const fileItem = createFileItem(file, index);
            fileList.appendChild(fileItem);
        });
    }
    
    // Validate file types and sizes
    validateFiles(files);
}

// Create file item display
function createFileItem(file, index) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded border';
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center';
    
    const icon = getFileIcon(file.type);
    const size = formatFileSize(file.size);
    
    fileInfo.innerHTML = `
        <i class="${icon} mr-2"></i>
        <span class="text-sm">${file.name}</span>
        <span class="text-xs text-gray-500 ml-2">(${size})</span>
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'text-red-500 hover:text-red-700';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => removeFile(index));
    
    div.appendChild(fileInfo);
    div.appendChild(removeBtn);
    
    return div;
}

// Get file icon based on type
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'fas fa-image text-blue-500';
    if (mimeType.startsWith('video/')) return 'fas fa-video text-purple-500';
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    return 'fas fa-file text-gray-500';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Remove file from selection
function removeFile(index) {
    // This would need to be implemented based on specific file input handling
    console.log('Remove file at index:', index);
}

// Validate uploaded files
function validateFiles(files) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'application/pdf'];
    
    files.forEach(file => {
        if (file.size > maxSize) {
            showAlert('error', `File "${file.name}" is too large. Maximum size is 50MB.`);
        }
        
        if (!allowedTypes.includes(file.type)) {
            showAlert('error', `File type "${file.type}" is not allowed.`);
        }
    });
}

// Show alert message
function showAlert(type, message, duration = 5000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-md`;
    alertDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg">&times;</button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duration);
}

// API helper functions
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for use in other scripts
window.SafeNetShield = {
    showAlert,
    apiRequest,
    validateForm,
    formatFileSize,
    debounce,
    throttle
};