// Learning Module JavaScript

let currentModules = [];
let currentModule = null;
let currentSection = 0;
let userProgress = {
    completedModules: [],
    totalTime: 0,
    safetyScore: 0
};

document.addEventListener('DOMContentLoaded', function() {
    initializeLearningPage();
});

function initializeLearningPage() {
    loadUserProgress();
    loadLearningModules();
    setupFilters();
    updateProgressDisplay();
}

// Load user progress from localStorage
function loadUserProgress() {
    const saved = localStorage.getItem('safenet-learning-progress');
    if (saved) {
        try {
            userProgress = { ...userProgress, ...JSON.parse(saved) };
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

// Save user progress to localStorage
function saveUserProgress() {
    localStorage.setItem('safenet-learning-progress', JSON.stringify(userProgress));
}

// Load learning modules from API
async function loadLearningModules() {
    try {
        const response = await fetch('/api/modules');
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            // Map API data to our format
            currentModules = data.data.map(module => ({
                id: module._id || module.id,
                title: module.title,
                description: module.description,
                category: module.category || 'general',
                difficulty: module.difficulty || 'beginner',
                estimatedTime: module.duration || 15,
                sections: module.sections?.length || 4,
                completed: userProgress.completedModules.includes(module._id || module.id)
            }));
        } else {
            // Use sample modules if API returns no data
            currentModules = getSampleModules();
        }
        
        displayModules(currentModules);
    } catch (error) {
        console.error('Error loading modules:', error);
        // Use sample modules on error
        currentModules = getSampleModules();
        displayModules(currentModules);
    } finally {
        const loadingEl = document.getElementById('loading-modules');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

// Get sample modules for demo
function getSampleModules() {
    return [
        {
            id: '1',
            title: 'Digital Safety Basics',
            description: 'Learn the fundamentals of staying safe online, including password security and privacy basics.',
            category: 'digital-safety-basics',
            difficulty: 'beginner',
            estimatedTime: 15,
            sections: 4,
            completed: userProgress.completedModules.includes('1')
        },
        {
            id: '2',
            title: 'Social Media Privacy Settings',
            description: 'Master privacy controls on Facebook, Instagram, Twitter, and other popular platforms.',
            category: 'social-media-privacy',
            difficulty: 'beginner',
            estimatedTime: 20,
            sections: 5,
            completed: userProgress.completedModules.includes('2')
        },
        {
            id: '3',
            title: 'Recognizing Online Harassment',
            description: 'Identify different forms of online harassment and learn how to respond effectively.',
            category: 'online-harassment',
            difficulty: 'intermediate',
            estimatedTime: 25,
            sections: 6,
            completed: userProgress.completedModules.includes('3')
        },
        {
            id: '4',
            title: 'Protecting Children Online',
            description: 'Essential strategies for keeping children safe from online predators and inappropriate content.',
            category: 'child-protection',
            difficulty: 'intermediate',
            estimatedTime: 30,
            sections: 7,
            completed: userProgress.completedModules.includes('4')
        },
        {
            id: '5',
            title: 'Advanced Password Security',
            description: 'Create unbreakable passwords and use password managers effectively.',
            category: 'password-security',
            difficulty: 'advanced',
            estimatedTime: 18,
            sections: 4,
            completed: userProgress.completedModules.includes('5')
        },
        {
            id: '6',
            title: 'Safe Online Communication',
            description: 'Communicate safely on messaging apps, dating platforms, and professional networks.',
            category: 'safe-communication',
            difficulty: 'intermediate',
            estimatedTime: 22,
            sections: 5,
            completed: userProgress.completedModules.includes('6')
        }
    ];
}

// Display modules in grid
function displayModules(modules) {
    const grid = document.getElementById('modules-grid');
    grid.innerHTML = '';
    
    modules.forEach(module => {
        const moduleCard = createModuleCard(module);
        grid.appendChild(moduleCard);
    });
}

// Create module card element
function createModuleCard(module) {
    const div = document.createElement('div');
    div.className = `card hover:shadow-xl transition duration-300 cursor-pointer ${module.completed ? 'border-green-500' : ''}`;
    div.onclick = () => openModule(module);
    
    const difficultyColors = {
        beginner: 'bg-green-100 text-green-800',
        intermediate: 'bg-blue-100 text-blue-800',
        advanced: 'bg-purple-100 text-purple-800'
    };
    
    div.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${module.title}</h3>
                <p class="text-gray-600 text-sm mb-3">${module.description}</p>
            </div>
            ${module.completed ? '<i class="fas fa-check-circle text-green-500 text-xl ml-2"></i>' : ''}
        </div>
        
        <div class="flex justify-between items-center text-sm">
            <div class="flex items-center space-x-3">
                <span class="badge ${difficultyColors[module.difficulty]}">${module.difficulty}</span>
                <span class="text-gray-500">
                    <i class="fas fa-clock mr-1"></i>${module.estimatedTime} min
                </span>
                <span class="text-gray-500">
                    <i class="fas fa-list mr-1"></i>${module.sections} sections
                </span>
            </div>
        </div>
        
        <div class="mt-4">
            <div class="bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                     style="width: ${module.completed ? '100%' : '0%'}"></div>
            </div>
        </div>
    `;
    
    return div;
}

// Setup filter functionality
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    
    categoryFilter.addEventListener('change', applyFilters);
    difficultyFilter.addEventListener('change', applyFilters);
}

// Apply filters to modules
function applyFilters() {
    const categoryFilter = document.getElementById('category-filter').value;
    const difficultyFilter = document.getElementById('difficulty-filter').value;
    
    let filteredModules = currentModules;
    
    if (categoryFilter) {
        filteredModules = filteredModules.filter(module => module.category === categoryFilter);
    }
    
    if (difficultyFilter) {
        filteredModules = filteredModules.filter(module => module.difficulty === difficultyFilter);
    }
    
    displayModules(filteredModules);
}

// Filter modules by difficulty
function filterModules(difficulty) {
    document.getElementById('difficulty-filter').value = difficulty;
    applyFilters();
    scrollToModules();
}

// Scroll to modules section
function scrollToModules() {
    document.getElementById('learning-modules').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Show quick tips modal
function showQuickTips() {
    document.getElementById('quick-tips-modal').classList.remove('hidden');
}

// Close quick tips modal
function closeQuickTips() {
    document.getElementById('quick-tips-modal').classList.add('hidden');
}

// Open learning module
async function openModule(module) {
    currentModule = module;
    currentSection = 0;
    
    try {
        // Load module content
        const content = await loadModuleContent(module.id);
        displayModuleContent(content);
        
        document.getElementById('module-modal').classList.remove('hidden');
        updateSectionNavigation();
    } catch (error) {
        console.error('Error opening module:', error);
        SafeNetShield.showAlert('error', 'Failed to load module content');
    }
}

// Load module content
async function loadModuleContent(moduleId) {
    // In a real implementation, this would fetch from API
    // For demo, return sample content
    return getSampleModuleContent(moduleId);
}

// Get sample module content
function getSampleModuleContent(moduleId) {
    const contents = {
        '1': {
            title: 'Digital Safety Basics',
            sections: [
                {
                    title: 'Introduction to Digital Safety',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Why Digital Safety Matters</h4>
                        <p class="mb-4">In today's connected world, digital safety is as important as physical safety. Every day, millions of people face online threats including:</p>
                        <ul class="list-disc list-inside mb-4 space-y-1">
                            <li>Identity theft and financial fraud</li>
                            <li>Cyberbullying and harassment</li>
                            <li>Privacy violations</li>
                            <li>Malware and phishing attacks</li>
                        </ul>
                        <p class="mb-4">This module will teach you the fundamental skills to protect yourself online.</p>
                    `
                },
                {
                    title: 'Creating Strong Passwords',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Password Best Practices</h4>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h5 class="font-semibold text-green-800 mb-2">✓ Do This:</h5>
                            <ul class="list-disc list-inside text-green-700 space-y-1">
                                <li>Use at least 12 characters</li>
                                <li>Mix uppercase, lowercase, numbers, and symbols</li>
                                <li>Use unique passwords for each account</li>
                                <li>Consider using a password manager</li>
                            </ul>
                        </div>
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <h5 class="font-semibold text-red-800 mb-2">✗ Avoid This:</h5>
                            <ul class="list-disc list-inside text-red-700 space-y-1">
                                <li>Using personal information (birthdays, names)</li>
                                <li>Common passwords like "password123"</li>
                                <li>Reusing passwords across multiple sites</li>
                                <li>Sharing passwords with others</li>
                            </ul>
                        </div>
                    `
                },
                {
                    title: 'Two-Factor Authentication',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Adding an Extra Layer of Security</h4>
                        <p class="mb-4">Two-factor authentication (2FA) adds an extra step to your login process, making your accounts much more secure.</p>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h5 class="font-semibold text-blue-800 mb-2">How 2FA Works:</h5>
                            <ol class="list-decimal list-inside text-blue-700 space-y-1">
                                <li>Enter your username and password</li>
                                <li>Receive a code on your phone or authenticator app</li>
                                <li>Enter the code to complete login</li>
                            </ol>
                        </div>
                        <p class="mb-4">Enable 2FA on all important accounts, especially email, banking, and social media.</p>
                    `
                },
                {
                    title: 'Safe Browsing Habits',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Staying Safe While Browsing</h4>
                        <p class="mb-4">Develop these habits to protect yourself while browsing the internet:</p>
                        <div class="space-y-4">
                            <div class="flex items-start">
                                <i class="fas fa-shield-alt text-green-500 text-xl mr-3 mt-1"></i>
                                <div>
                                    <h5 class="font-semibold">Look for HTTPS</h5>
                                    <p class="text-gray-600 text-sm">Always check for the lock icon and "https://" in the address bar</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-eye text-blue-500 text-xl mr-3 mt-1"></i>
                                <div>
                                    <h5 class="font-semibold">Verify Website URLs</h5>
                                    <p class="text-gray-600 text-sm">Be careful of misspelled domains and suspicious links</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-download text-purple-500 text-xl mr-3 mt-1"></i>
                                <div>
                                    <h5 class="font-semibold">Be Cautious with Downloads</h5>
                                    <p class="text-gray-600 text-sm">Only download software from official sources</p>
                                </div>
                            </div>
                        </div>
                    `
                }
            ]
        },
        '2': {
            title: 'Social Media Privacy Settings',
            sections: [
                {
                    title: 'Understanding Privacy on Social Media',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Why Privacy Settings Matter</h4>
                        <p class="mb-4">Social media platforms collect vast amounts of personal data. Proper privacy settings help you:</p>
                        <ul class="list-disc list-inside mb-4 space-y-1">
                            <li>Control who sees your posts and personal information</li>
                            <li>Limit data collection by the platform</li>
                            <li>Prevent unwanted contact from strangers</li>
                            <li>Protect your reputation and safety</li>
                        </ul>
                    `
                },
                {
                    title: 'Facebook Privacy Settings',
                    content: `
                        <h4 class="text-lg font-semibold mb-3">Securing Your Facebook Account</h4>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h5 class="font-semibold text-blue-800 mb-2">Key Settings to Check:</h5>
                            <ul class="list-disc list-inside text-blue-700 space-y-1">
                                <li>Who can see your posts (Friends only recommended)</li>
                                <li>Who can find you using email/phone number</li>
                                <li>Timeline and tagging settings</li>
                                <li>App permissions and data sharing</li>
                            </ul>
                        </div>
                        <p class="text-sm text-gray-600">Navigate to Settings & Privacy > Privacy to access these controls.</p>
                    `
                }
            ]
        }
    };
    
    return contents[moduleId] || contents['1'];
}

// Display module content
function displayModuleContent(content) {
    document.getElementById('module-title').textContent = content.title;
    currentModule.content = content;
    showSection(0);
}

// Show specific section
function showSection(sectionIndex) {
    const content = currentModule.content;
    if (!content || !content.sections || sectionIndex >= content.sections.length) return;
    
    currentSection = sectionIndex;
    const section = content.sections[sectionIndex];
    
    document.getElementById('module-content').innerHTML = `
        <div class="mb-6">
            <h4 class="text-xl font-semibold text-gray-800 mb-4">${section.title}</h4>
            <div class="prose max-w-none">${section.content}</div>
        </div>
        
        ${sectionIndex === content.sections.length - 1 ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <i class="fas fa-trophy text-green-600 text-3xl mb-3"></i>
                <h5 class="text-lg font-semibold text-green-800 mb-2">Congratulations!</h5>
                <p class="text-green-700 mb-4">You've completed this module. Your safety knowledge has improved!</p>
                <button onclick="completeModule()" class="btn-success">
                    <i class="fas fa-check mr-2"></i>Mark as Complete
                </button>
            </div>
        ` : ''}
    `;
    
    updateSectionNavigation();
}

// Update section navigation
function updateSectionNavigation() {
    const content = currentModule.content;
    const prevBtn = document.getElementById('prev-section');
    const nextBtn = document.getElementById('next-section');
    const indicator = document.getElementById('section-indicator');
    
    prevBtn.disabled = currentSection === 0;
    nextBtn.disabled = currentSection === content.sections.length - 1;
    
    if (currentSection === content.sections.length - 1) {
        nextBtn.innerHTML = '<i class="fas fa-flag-checkered mr-2"></i>Finish';
    } else {
        nextBtn.innerHTML = 'Next<i class="fas fa-chevron-right ml-2"></i>';
    }
    
    indicator.textContent = `Section ${currentSection + 1} of ${content.sections.length}`;
}

// Navigate to previous section
function previousSection() {
    if (currentSection > 0) {
        showSection(currentSection - 1);
    }
}

// Navigate to next section
function nextSection() {
    const content = currentModule.content;
    if (currentSection < content.sections.length - 1) {
        showSection(currentSection + 1);
    } else {
        completeModule();
    }
}

// Complete module
function completeModule() {
    if (!userProgress.completedModules.includes(currentModule.id)) {
        userProgress.completedModules.push(currentModule.id);
        userProgress.totalTime += currentModule.estimatedTime;
        userProgress.safetyScore = Math.min(100, userProgress.completedModules.length * 15);
        
        saveUserProgress();
        updateProgressDisplay();
        
        SafeNetShield.showAlert('success', `
            <div class="text-center">
                <i class="fas fa-trophy text-yellow-500 text-2xl mb-2"></i>
                <div class="font-semibold">Module Completed!</div>
                <div class="text-sm">You've earned ${currentModule.estimatedTime} learning minutes</div>
            </div>
        `);
        
        // Update module card
        currentModule.completed = true;
        displayModules(currentModules);
    }
    
    closeModuleModal();
}

// Close module modal
function closeModuleModal() {
    document.getElementById('module-modal').classList.add('hidden');
    currentModule = null;
    currentSection = 0;
}

// Update progress display
function updateProgressDisplay() {
    document.getElementById('completed-modules').textContent = userProgress.completedModules.length;
    document.getElementById('learning-time').textContent = userProgress.totalTime;
    document.getElementById('safety-score').textContent = userProgress.safetyScore + '%';
    
    const totalModules = currentModules.length;
    const progressPercentage = (userProgress.completedModules.length / totalModules) * 100;
    document.getElementById('progress-bar').style.width = progressPercentage + '%';
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('module-modal');
    if (!modal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            previousSection();
        } else if (e.key === 'ArrowRight') {
            nextSection();
        } else if (e.key === 'Escape') {
            closeModuleModal();
        }
    }
    
    const tipsModal = document.getElementById('quick-tips-modal');
    if (!tipsModal.classList.contains('hidden') && e.key === 'Escape') {
        closeQuickTips();
    }
});

// Export functions for global access
window.filterModules = filterModules;
window.scrollToModules = scrollToModules;
window.showQuickTips = showQuickTips;
window.closeQuickTips = closeQuickTips;
window.openModule = openModule;
window.closeModuleModal = closeModuleModal;
window.previousSection = previousSection;
window.nextSection = nextSection;
window.completeModule = completeModule;
// Make functions globally accessible
window.scrollToModules = scrollToModules;
window.showQuickTips = showQuickTips;
window.closeQuickTips = closeQuickTips;
window.closeModuleModal = closeModuleModal;
window.openModule = openModule;
window.filterModules = filterModules;
window.resetFilters = resetFilters;
