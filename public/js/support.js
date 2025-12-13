// Support Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeSupportPage();
});

function initializeSupportPage() {
    setupLocationSelectors();
    setupContactForm();
    loadSupportResources();
}

// Setup location selectors
function setupLocationSelectors() {
    const countrySelect = document.getElementById('country-select');
    const stateSelect = document.getElementById('state-select');
    
    if (countrySelect && stateSelect) {
        countrySelect.addEventListener('change', function() {
            populateStates(this.value);
        });
        
        // Initialize with US states
        populateStates('US');
    }
}

// Populate states based on country
function populateStates(country) {
    const stateSelect = document.getElementById('state-select');
    stateSelect.innerHTML = '<option value="">Select State/Province</option>';
    
    const states = {
        'US': [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
            'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
            'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
            'Wisconsin', 'Wyoming'
        ],
        'CA': [
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
            'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
            'Quebec', 'Saskatchewan', 'Yukon'
        ],
        'UK': [
            'England', 'Scotland', 'Wales', 'Northern Ireland'
        ],
        'AU': [
            'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
            'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
        ]
    };
    
    const countryStates = states[country] || [];
    countryStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Setup contact form
function setupContactForm() {
    const form = document.getElementById('support-contact-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitSupportRequest();
        });
        
        // Handle urgency changes
        const urgencySelect = document.getElementById('urgency');
        urgencySelect.addEventListener('change', function() {
            if (this.value === 'emergency') {
                showEmergencyWarning();
            }
        });
    }
}

// Show emergency warning
function showEmergencyWarning() {
    SafeNetShield.showAlert('warning', `
        <div class="text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
            <div class="font-semibold text-red-800">Emergency Situation Detected</div>
            <div class="text-sm text-red-700 mt-2">
                If you're in immediate danger, please call 911 or your local emergency services right now.
            </div>
            <div class="mt-3">
                <a href="tel:911" class="bg-red-600 text-white px-4 py-2 rounded font-semibold">Call 911</a>
            </div>
        </div>
    `, 10000);
}

// Submit support request
async function submitSupportRequest() {
    const form = document.getElementById('support-contact-form');
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/support/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                supportType: formData.get('supportType'),
                urgency: formData.get('urgency'),
                message: formData.get('message')
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            SafeNetShield.showAlert('success', `
                <div>
                    <div class="font-semibold">Support Request Sent</div>
                    <div class="text-sm mt-1">We'll respond within 24 hours. Check your email for confirmation.</div>
                </div>
            `);
            form.reset();
        } else {
            throw new Error(result.message || 'Failed to send support request');
        }
        
    } catch (error) {
        console.error('Support request error:', error);
        SafeNetShield.showAlert('error', 'Failed to send support request. Please try again or call our hotline.');
    }
}

// Load support resources
async function loadSupportResources() {
    try {
        // In a real implementation, this would fetch from API
        // For demo, we'll use static data
        console.log('Support resources loaded');
    } catch (error) {
        console.error('Error loading support resources:', error);
    }
}

// Show crisis hotlines modal
function showCrisisHotlines() {
    document.getElementById('crisis-hotlines-modal').classList.remove('hidden');
}

// Close crisis hotlines modal
function closeCrisisHotlines() {
    document.getElementById('crisis-hotlines-modal').classList.add('hidden');
}

// Scroll to resources section
function scrollToResources() {
    document.getElementById('support-resources').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Show legal resources
function showLegalResources() {
    const content = `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-blue-800 mb-3">Free Legal Aid Organizations</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-gavel text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Legal Aid Society</h5>
                            <p class="text-sm text-gray-600">Free legal services for low-income individuals</p>
                            <p class="text-sm text-blue-600">Call: 1-800-LEGAL-AID</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-balance-scale text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">National Domestic Violence Legal Helpline</h5>
                            <p class="text-sm text-gray-600">Legal advice for domestic violence survivors</p>
                            <p class="text-sm text-blue-600">Call: 1-800-799-7233</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-green-800 mb-3">Understanding Your Rights</h4>
                <ul class="list-disc list-inside space-y-2 text-sm text-green-700">
                    <li>Right to file restraining orders against harassers</li>
                    <li>Right to privacy and protection from stalking</li>
                    <li>Right to report crimes to law enforcement</li>
                    <li>Right to legal representation in court proceedings</li>
                    <li>Right to victim compensation in some cases</li>
                </ul>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-yellow-800 mb-3">Legal Documentation Tips</h4>
                <ul class="list-disc list-inside space-y-2 text-sm text-yellow-700">
                    <li>Keep detailed records of all incidents</li>
                    <li>Save screenshots and digital evidence</li>
                    <li>Document dates, times, and witnesses</li>
                    <li>Report incidents to platforms and authorities</li>
                    <li>Consult with a lawyer before taking legal action</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Legal Support Resources', content);
}

// Show counseling services
function showCounselingServices() {
    const content = `
        <div class="space-y-6">
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-green-800 mb-3">Mental Health Hotlines</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-heart text-green-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">National Suicide Prevention Lifeline</h5>
                            <p class="text-sm text-gray-600">24/7 crisis counseling and suicide prevention</p>
                            <p class="text-sm text-green-600">Call: 988</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-comments text-green-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Crisis Text Line</h5>
                            <p class="text-sm text-gray-600">Text-based crisis counseling</p>
                            <p class="text-sm text-green-600">Text HOME to 741741</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-blue-800 mb-3">Finding a Therapist</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-search text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Psychology Today</h5>
                            <p class="text-sm text-gray-600">Directory of therapists and counselors</p>
                            <p class="text-sm text-blue-600">Website: psychologytoday.com</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-laptop text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Online Therapy Platforms</h5>
                            <p class="text-sm text-gray-600">BetterHelp, Talkspace, and other online options</p>
                            <p class="text-sm text-blue-600">Often more affordable and accessible</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-purple-800 mb-3">Specialized Support</h4>
                <ul class="list-disc list-inside space-y-2 text-sm text-purple-700">
                    <li>Trauma-informed therapy for abuse survivors</li>
                    <li>EMDR therapy for PTSD and trauma</li>
                    <li>Group therapy for shared experiences</li>
                    <li>Family counseling for relationship issues</li>
                    <li>Art and music therapy for expression</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Counseling & Therapy Services', content);
}

// Show safety planning
function showSafetyPlanning() {
    const content = `
        <div class="space-y-6">
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-purple-800 mb-3">Digital Safety Plan</h4>
                <div class="space-y-4">
                    <div>
                        <h5 class="font-semibold text-purple-700 mb-2">Secure Your Accounts</h5>
                        <ul class="list-disc list-inside text-sm text-purple-600 space-y-1">
                            <li>Change all passwords immediately</li>
                            <li>Enable two-factor authentication</li>
                            <li>Review and revoke app permissions</li>
                            <li>Check for unknown devices in account settings</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h5 class="font-semibold text-purple-700 mb-2">Privacy Settings</h5>
                        <ul class="list-disc list-inside text-sm text-purple-600 space-y-1">
                            <li>Make all social media profiles private</li>
                            <li>Limit who can contact you</li>
                            <li>Turn off location sharing</li>
                            <li>Disable read receipts and online status</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-orange-800 mb-3">Emergency Contacts</h4>
                <div class="space-y-2">
                    <p class="text-sm text-orange-700">Keep these numbers easily accessible:</p>
                    <ul class="list-disc list-inside text-sm text-orange-600 space-y-1">
                        <li>Emergency services: 911</li>
                        <li>Local police non-emergency line</li>
                        <li>Trusted friend or family member</li>
                        <li>Domestic violence hotline: 1-800-799-7233</li>
                        <li>Crisis text line: Text HOME to 741741</li>
                    </ul>
                </div>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-red-800 mb-3">If You're in Immediate Danger</h4>
                <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>Call 911 immediately</li>
                    <li>Go to a safe location (friend, family, shelter)</li>
                    <li>Document everything with photos/screenshots</li>
                    <li>Contact a domestic violence advocate</li>
                    <li>Consider a restraining order</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Safety Planning Guide', content);
}

// Show technical support
function showTechnicalSupport() {
    const content = `
        <div class="space-y-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-blue-800 mb-3">Privacy Settings Help</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-facebook text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Facebook Privacy</h5>
                            <p class="text-sm text-gray-600">Settings → Privacy → Who can see your posts</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-instagram text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Instagram Privacy</h5>
                            <p class="text-sm text-gray-600">Settings → Privacy → Account Privacy</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-twitter text-blue-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Twitter/X Privacy</h5>
                            <p class="text-sm text-gray-600">Settings → Privacy and Safety</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-green-800 mb-3">Security Tools</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-key text-green-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Password Managers</h5>
                            <p class="text-sm text-gray-600">1Password, Bitwarden, LastPass</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-shield-alt text-green-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">VPN Services</h5>
                            <p class="text-sm text-gray-600">NordVPN, ExpressVPN, Surfshark</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-mobile-alt text-green-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Secure Messaging</h5>
                            <p class="text-sm text-gray-600">Signal, Wire, Telegram (secret chats)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-yellow-800 mb-3">Evidence Collection</h4>
                <ul class="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>Take screenshots of threatening messages</li>
                    <li>Save URLs and timestamps</li>
                    <li>Use screen recording for video evidence</li>
                    <li>Keep original files, don't edit them</li>
                    <li>Store evidence in multiple secure locations</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Technical Support Resources', content);
}

// Show emergency services
function showEmergencyServices() {
    const content = `
        <div class="space-y-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-red-800 mb-3">Immediate Emergency Help</h4>
                <div class="space-y-3">
                    <div class="flex items-center p-3 bg-red-100 rounded">
                        <i class="fas fa-phone text-red-600 text-xl mr-3"></i>
                        <div>
                            <h5 class="font-bold text-red-800">Emergency Services</h5>
                            <a href="tel:911" class="text-red-600 font-bold text-lg">Call 911</a>
                        </div>
                    </div>
                    <div class="flex items-center p-3 bg-red-100 rounded">
                        <i class="fas fa-home text-red-600 text-xl mr-3"></i>
                        <div>
                            <h5 class="font-bold text-red-800">Emergency Shelters</h5>
                            <p class="text-sm text-red-600">Call 211 for local shelter information</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-orange-800 mb-3">Crisis Intervention</h4>
                <div class="space-y-2">
                    <div class="flex items-start">
                        <i class="fas fa-ambulance text-orange-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Mobile Crisis Teams</h5>
                            <p class="text-sm text-gray-600">Mental health crisis response teams</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-hospital text-orange-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">Emergency Rooms</h5>
                            <p class="text-sm text-gray-600">24/7 medical and psychiatric emergency care</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-blue-800 mb-3">Safety Planning</h4>
                <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>Have a bag packed with essentials</li>
                    <li>Keep important documents accessible</li>
                    <li>Plan safe routes and locations</li>
                    <li>Inform trusted contacts of your situation</li>
                    <li>Know your local emergency resources</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Emergency Services', content);
}

// Show support groups
function showSupportGroups() {
    const content = `
        <div class="space-y-6">
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-teal-800 mb-3">Online Support Communities</h4>
                <div class="space-y-3">
                    <div class="flex items-start">
                        <i class="fas fa-users text-teal-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">RAINN Online Hotline</h5>
                            <p class="text-sm text-gray-600">Chat-based support for sexual assault survivors</p>
                            <p class="text-sm text-teal-600">Visit: rainn.org</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-heart text-teal-600 mr-3 mt-1"></i>
                        <div>
                            <h5 class="font-semibold">7 Cups</h5>
                            <p class="text-sm text-gray-600">Free emotional support and counseling</p>
                            <p class="text-sm text-teal-600">Visit: 7cups.com</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-purple-800 mb-3">Local Support Groups</h4>
                <div class="space-y-2">
                    <p class="text-sm text-purple-700 mb-3">Find in-person support groups in your area:</p>
                    <ul class="list-disc list-inside text-sm text-purple-600 space-y-1">
                        <li>Domestic violence survivor groups</li>
                        <li>Sexual assault survivor groups</li>
                        <li>PTSD and trauma support groups</li>
                        <li>Women's empowerment groups</li>
                        <li>Teen and young adult support groups</li>
                    </ul>
                </div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-green-800 mb-3">Peer Support Benefits</h4>
                <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                    <li>Connect with others who understand your experience</li>
                    <li>Share coping strategies and resources</li>
                    <li>Reduce feelings of isolation and shame</li>
                    <li>Build confidence and self-esteem</li>
                    <li>Learn from others' recovery journeys</li>
                </ul>
            </div>
        </div>
    `;
    
    showResourceModal('Support Groups & Communities', content);
}

// Search local resources
async function searchLocalResources() {
    const country = document.getElementById('country-select').value;
    const state = document.getElementById('state-select').value;
    const resourcesDiv = document.getElementById('local-resources');
    
    if (!country) {
        SafeNetShield.showAlert('warning', 'Please select a country first');
        return;
    }
    
    try {
        // Show loading
        resourcesDiv.innerHTML = '<div class="text-center py-4"><div class="spinner mx-auto mb-2"></div><p class="text-gray-600">Searching local resources...</p></div>';
        resourcesDiv.classList.remove('hidden');
        
        // In a real implementation, this would call the API
        // For demo, show sample local resources
        setTimeout(() => {
            const sampleResources = getSampleLocalResources(country, state);
            displayLocalResources(sampleResources);
        }, 1500);
        
    } catch (error) {
        console.error('Error searching local resources:', error);
        SafeNetShield.showAlert('error', 'Failed to search local resources');
    }
}

// Get sample local resources
function getSampleLocalResources(country, state) {
    return [
        {
            name: 'Local Women\'s Shelter',
            type: 'Emergency Housing',
            phone: '(555) 123-4567',
            address: '123 Safe Haven St',
            services: ['Emergency shelter', '24/7 hotline', 'Counseling', 'Legal advocacy']
        },
        {
            name: 'Community Legal Aid',
            type: 'Legal Services',
            phone: '(555) 234-5678',
            address: '456 Justice Ave',
            services: ['Free legal consultation', 'Restraining orders', 'Court advocacy']
        },
        {
            name: 'Crisis Counseling Center',
            type: 'Mental Health',
            phone: '(555) 345-6789',
            address: '789 Healing Blvd',
            services: ['Individual therapy', 'Group counseling', 'Crisis intervention']
        }
    ];
}

// Display local resources
function displayLocalResources(resources) {
    const resourcesDiv = document.getElementById('local-resources');
    
    const html = `
        <h4 class="text-lg font-semibold text-gray-800 mb-4">Local Resources Found</h4>
        <div class="space-y-4">
            ${resources.map(resource => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h5 class="font-semibold text-gray-800">${resource.name}</h5>
                        <span class="badge badge-primary">${resource.type}</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        <i class="fas fa-phone mr-2"></i>${resource.phone}
                    </div>
                    <div class="text-sm text-gray-600 mb-3">
                        <i class="fas fa-map-marker-alt mr-2"></i>${resource.address}
                    </div>
                    <div class="text-sm">
                        <strong>Services:</strong> ${resource.services.join(', ')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    resourcesDiv.innerHTML = html;
}

// Show resource modal
function showResourceModal(title, content) {
    document.getElementById('resource-modal-title').textContent = title;
    document.getElementById('resource-modal-content').innerHTML = content;
    document.getElementById('resource-modal').classList.remove('hidden');
}

// Close resource modal
function closeResourceModal() {
    document.getElementById('resource-modal').classList.add('hidden');
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = [
            'crisis-hotlines-modal',
            'resource-modal'
        ];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
            }
        });
    }
});

// Export functions for global access
window.showCrisisHotlines = showCrisisHotlines;
window.closeCrisisHotlines = closeCrisisHotlines;
window.scrollToResources = scrollToResources;
window.showLegalResources = showLegalResources;
window.showCounselingServices = showCounselingServices;
window.showSafetyPlanning = showSafetyPlanning;
window.showTechnicalSupport = showTechnicalSupport;
window.showEmergencyServices = showEmergencyServices;
window.showSupportGroups = showSupportGroups;
window.searchLocalResources = searchLocalResources;
window.closeResourceModal = closeResourceModal;