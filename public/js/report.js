// Report Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeReportForm();
});

function initializeReportForm() {
    setupFormInteractions();
    setupFormSubmission();
    setupFileUpload();
    setupValidation();
}

// Setup form interactions
function setupFormInteractions() {
    // Anonymous checkbox toggle
    const anonymousCheckbox = document.getElementById('anonymous-report');
    const contactDetails = document.getElementById('contact-details');
    
    if (anonymousCheckbox && contactDetails) {
        anonymousCheckbox.addEventListener('change', function() {
            if (this.checked) {
                contactDetails.style.display = 'none';
                // Clear contact form fields
                contactDetails.querySelectorAll('input, select').forEach(field => {
                    field.value = '';
                    field.removeAttribute('required');
                });
            } else {
                contactDetails.style.display = 'block';
                // Re-add required attributes where needed
                document.getElementById('reporter-name').setAttribute('required', '');
                document.getElementById('reporter-email').setAttribute('required', '');
            }
        });
    }
    
    // Known identity checkbox toggle
    const knownIdentityCheckbox = document.getElementById('known-identity');
    const suspectDetails = document.getElementById('suspect-details');
    
    if (knownIdentityCheckbox && suspectDetails) {
        knownIdentityCheckbox.addEventListener('change', function() {
            if (this.checked) {
                suspectDetails.classList.remove('hidden');
            } else {
                suspectDetails.classList.add('hidden');
                // Clear suspect form fields
                suspectDetails.querySelectorAll('input, select').forEach(field => {
                    field.value = '';
                });
            }
        });
    }
    
    // Emergency checkbox styling
    const emergencyCheckbox = document.querySelector('input[name="isEmergency"]');
    if (emergencyCheckbox) {
        emergencyCheckbox.addEventListener('change', function() {
            const parent = this.closest('.bg-red-50');
            if (this.checked) {
                parent.classList.add('ring-2', 'ring-red-500');
            } else {
                parent.classList.remove('ring-2', 'ring-red-500');
            }
        });
    }
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('report-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateReportForm()) {
                return;
            }
            
            await submitReport();
        });
    }
}

// Validate report form
function validateReportForm() {
    let isValid = true;
    const errors = [];
    
    // Check incident types
    const incidentTypes = document.querySelectorAll('input[name="incidentType"]:checked');
    if (incidentTypes.length === 0) {
        errors.push('Please select at least one incident type');
        isValid = false;
    }
    
    // Check description
    const description = document.querySelector('textarea[name="description"]');
    if (!description.value.trim() || description.value.trim().length < 10) {
        errors.push('Please provide a description of at least 10 characters');
        isValid = false;
    }
    
    // Check incident date
    const incidentDate = document.querySelector('input[name="incidentDate"]');
    if (!incidentDate.value) {
        errors.push('Please provide the incident date');
        isValid = false;
    }
    
    // Check platforms
    const platforms = document.querySelectorAll('input[name="platform"]:checked');
    if (platforms.length === 0) {
        errors.push('Please select at least one platform where the incident occurred');
        isValid = false;
    }
    
    // Check contact info if not anonymous
    const isAnonymous = document.getElementById('anonymous-report').checked;
    if (!isAnonymous) {
        const name = document.getElementById('reporter-name');
        const email = document.getElementById('reporter-email');
        
        if (!name.value.trim()) {
            errors.push('Please provide your name');
            isValid = false;
        }
        
        if (!email.value.trim() || !isValidEmail(email.value)) {
            errors.push('Please provide a valid email address');
            isValid = false;
        }
    }
    
    // Display errors if any
    if (!isValid) {
        showValidationErrors(errors);
    }
    
    return isValid;
}

// Show validation errors
function showValidationErrors(errors) {
    const errorHtml = errors.map(error => `<li>${error}</li>`).join('');
    
    SafeNetShield.showAlert('error', `
        <div>
            <strong>Please fix the following errors:</strong>
            <ul class="mt-2 list-disc list-inside">
                ${errorHtml}
            </ul>
        </div>
    `, 8000);
    
    // Scroll to first error
    const firstErrorField = document.querySelector('.border-red-500');
    if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Submit report
async function submitReport() {
    const loadingModal = document.getElementById('loading-modal');
    
    try {
        // Show loading modal
        loadingModal.classList.remove('hidden');
        
        // Prepare form data
        const formData = new FormData();
        const reportData = collectFormData();
        
        // Add form fields
        Object.entries(reportData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(item => formData.append(key, item));
            } else if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
        
        // Add files
        const fileInput = document.getElementById('evidence-files');
        if (fileInput.files.length > 0) {
            Array.from(fileInput.files).forEach(file => {
                formData.append('evidence', file);
            });
        }
        
        // Submit to API
        const response = await fetch('/api/reports', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Redirect to success page with case ID
            window.location.href = `/success.html?caseId=${result.caseId}`;
        } else {
            throw new Error(result.message || 'Failed to submit report');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        SafeNetShield.showAlert('error', `Failed to submit report: ${error.message}`);
    } finally {
        // Hide loading modal
        loadingModal.classList.add('hidden');
    }
}

// Collect form data
function collectFormData() {
    const form = document.getElementById('report-form');
    const formData = new FormData(form);
    
    const data = {
        incidentType: [],
        incident: {
            description: formData.get('description'),
            dateOccurred: formData.get('incidentDate'),
            timeOccurred: formData.get('incidentTime'),
            platform: [],
            otherPlatform: formData.get('otherPlatform')
        },
        suspect: {},
        supportNeeded: [],
        isAnonymous: formData.get('anonymous') === 'on',
        isEmergency: formData.get('isEmergency') === 'on',
        privacy: {
            shareWithPartners: formData.get('privacyNoDataShare') !== 'on',
            deleteAfterResolution: formData.get('privacyDeleteAfterResolution') === 'on'
        }
    };
    
    // Collect incident types
    document.querySelectorAll('input[name="incidentType"]:checked').forEach(checkbox => {
        data.incidentType.push(checkbox.value);
    });
    
    // Collect platforms
    document.querySelectorAll('input[name="platform"]:checked').forEach(checkbox => {
        data.incident.platform.push(checkbox.value);
    });
    
    // Collect support needed
    document.querySelectorAll('input[name="supportNeeded"]:checked').forEach(checkbox => {
        data.supportNeeded.push(checkbox.value);
    });
    
    // Collect suspect info if provided
    if (document.getElementById('known-identity').checked) {
        data.suspect = {
            knownIdentity: true,
            name: formData.get('suspectName'),
            username: formData.get('suspectUsername'),
            relationship: formData.get('suspectRelationship')
        };
    }
    
    // Collect reporter info if not anonymous
    if (!data.isAnonymous) {
        data.reporter = {
            name: formData.get('reporterName'),
            email: formData.get('reporterEmail'),
            phone: formData.get('reporterPhone'),
            contactPreference: formData.get('contactPreference')
        };
    }
    
    // Set severity based on incident type and emergency flag
    if (data.isEmergency || data.incidentType.includes('child-exploitation')) {
        data.severity = 'critical';
    } else if (data.incidentType.includes('online-threats') || data.incidentType.includes('stalking')) {
        data.severity = 'high';
    } else {
        data.severity = 'medium';
    }
    
    return data;
}

// Setup file upload
function setupFileUpload() {
    const fileInput = document.getElementById('evidence-files');
    const uploadArea = document.querySelector('.file-upload-area');
    const fileList = document.querySelector('.file-list');
    
    if (!fileInput || !uploadArea || !fileList) return;
    
    // File input change handler
    fileInput.addEventListener('change', function() {
        displaySelectedFiles(this.files);
    });
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        fileInput.files = files;
        displaySelectedFiles(files);
    });
}

// Display selected files
function displaySelectedFiles(files) {
    const fileList = document.querySelector('.file-list');
    fileList.innerHTML = '';
    
    if (files.length === 0) return;
    
    Array.from(files).forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        fileList.appendChild(fileItem);
    });
    
    // Validate files
    validateUploadedFiles(files);
}

// Create file item element
function createFileItem(file, index) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg border';
    
    const fileInfo = document.createElement('div');
    fileInfo.className = 'flex items-center flex-1';
    
    const icon = getFileIcon(file.type);
    const size = SafeNetShield.formatFileSize(file.size);
    
    fileInfo.innerHTML = `
        <i class="${icon} mr-3 text-lg"></i>
        <div>
            <div class="font-medium text-sm">${file.name}</div>
            <div class="text-xs text-gray-500">${size} • ${file.type}</div>
        </div>
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'text-red-500 hover:text-red-700 p-1';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => removeFile(index));
    
    div.appendChild(fileInfo);
    div.appendChild(removeBtn);
    
    return div;
}

// Get file icon
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'fas fa-image text-blue-500';
    if (mimeType.startsWith('video/')) return 'fas fa-video text-purple-500';
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    return 'fas fa-file text-gray-500';
}

// Remove file from selection
function removeFile(index) {
    const fileInput = document.getElementById('evidence-files');
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    fileInput.files = dt.files;
    displaySelectedFiles(fileInput.files);
}

// Validate uploaded files
function validateUploadedFiles(files) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const maxFiles = 10;
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'video/mp4', 'video/mov', 'video/avi',
        'application/pdf'
    ];
    
    const errors = [];
    
    if (files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
    }
    
    Array.from(files).forEach(file => {
        if (file.size > maxSize) {
            errors.push(`File "${file.name}" exceeds 50MB limit`);
        }
        
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type "${file.type}" not allowed for "${file.name}"`);
        }
    });
    
    if (errors.length > 0) {
        SafeNetShield.showAlert('warning', errors.join('<br>'));
    }
}

// Setup form validation
function setupValidation() {
    // Real-time validation for required fields
    const requiredFields = document.querySelectorAll('input[required], textarea[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        field.addEventListener('input', function() {
            // Clear error styling on input
            this.classList.remove('border-red-500');
            const errorMsg = this.parentNode.querySelector('.field-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    });
    
    // Validate checkboxes
    const checkboxGroups = ['incidentType', 'platform'];
    
    checkboxGroups.forEach(groupName => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                validateCheckboxGroup(groupName);
            });
        });
    });
}

// Validate checkbox group
function validateCheckboxGroup(groupName) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
    const container = document.querySelector(`input[name="${groupName}"]`).closest('.card');
    
    if (checkboxes.length === 0) {
        container.classList.add('border-red-300');
    } else {
        container.classList.remove('border-red-300');
    }
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (field.name === 'description' && value && value.length < 10) {
        isValid = false;
        errorMessage = 'Description must be at least 10 characters';
    }
    
    // Display validation result
    displayFieldValidation(field, isValid, errorMessage);
    
    return isValid;
}

// Display field validation
function displayFieldValidation(field, isValid, errorMessage) {
    // Remove existing error
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

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Auto-save form data (optional feature)
function setupAutoSave() {
    const form = document.getElementById('report-form');
    const saveKey = 'safenet-report-draft';
    
    // Load saved data
    const savedData = localStorage.getItem(saveKey);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            populateForm(data);
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
    
    // Save data on input
    const saveForm = SafeNetShield.debounce(() => {
        const formData = collectFormData();
        localStorage.setItem(saveKey, JSON.stringify(formData));
    }, 1000);
    
    form.addEventListener('input', saveForm);
    form.addEventListener('change', saveForm);
    
    // Clear saved data on successful submission
    form.addEventListener('submit', () => {
        localStorage.removeItem(saveKey);
    });
}

// Populate form with saved data
function populateForm(data) {
    // This would populate form fields with saved data
    // Implementation depends on specific requirements
}

// Initialize auto-save if needed
// setupAutoSave();