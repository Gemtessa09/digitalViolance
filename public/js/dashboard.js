// Admin Dashboard JavaScript

// Global state
let currentSection = 'dashboard';
let allReports = [];
let allUsers = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  checkAuthentication();
});

// Check if user is authenticated
async function checkAuthentication() {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    // No token, redirect to login
    window.location.href = '/login.html';
    return;
  }
  
  try {
    // Verify token with backend
    const response = await fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && (data.user.role === 'admin' || data.user.role === 'moderator')) {
        // Store user info
        localStorage.setItem('adminName', data.user.name);
        localStorage.setItem('adminEmail', data.user.email);
        localStorage.setItem('adminRole', data.user.role);
        
        // User is authenticated and authorized
        initializeDashboard(data.user);
        setupEventListeners();
        loadDashboardData();
      } else {
        // Not authorized
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminRole');
        window.location.href = '/login.html';
      }
    } else {
      // Token is invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminName');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminRole');
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Authentication error:', error);
    window.location.href = '/login.html';
  }
}

// Initialize dashboard
function initializeDashboard(user) {
  // Get admin info from user object or localStorage
  const adminName = user?.name || localStorage.getItem('adminName') || 'Admin User';
  const adminEmail = user?.email || localStorage.getItem('adminEmail') || 'admin@safenetshield.org';
  const adminRole = user?.role || localStorage.getItem('adminRole') || 'admin';
  
  // Get initials for avatar
  const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  // Update all admin name displays
  const adminNameBtn = document.getElementById('admin-name-btn');
  const adminNameMenu = document.getElementById('admin-name-menu');
  const adminEmailMenu = document.getElementById('admin-email-menu');
  const adminRoleBtn = document.getElementById('admin-role-btn');
  const userAvatarBtn = document.getElementById('user-avatar-btn');
  const userAvatarMenu = document.getElementById('user-avatar-menu');
  
  if (adminNameBtn) adminNameBtn.textContent = adminName;
  if (adminNameMenu) adminNameMenu.textContent = adminName;
  if (adminEmailMenu) adminEmailMenu.textContent = adminEmail;
  if (adminRoleBtn) adminRoleBtn.textContent = adminRole.charAt(0).toUpperCase() + adminRole.slice(1);
  if (userAvatarBtn) userAvatarBtn.textContent = initials;
  if (userAvatarMenu) userAvatarMenu.textContent = initials;
  
  // Show dashboard section by default
  showSection('dashboard');
}

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  // User menu toggle
  const userMenuBtn = document.getElementById('user-menu-btn');
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', toggleUserMenu);
  }

  // Notifications button
  const notificationsBtn = document.getElementById('notifications-btn');
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', showNotifications);
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('#user-menu-btn')) {
      document.getElementById('user-menu')?.classList.add('hidden');
    }
  });
}

// Toggle mobile menu
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.classList.toggle('hidden');
  }
}

// Toggle user menu
function toggleUserMenu(event) {
  event.stopPropagation();
  const userMenu = document.getElementById('user-menu');
  if (userMenu) {
    userMenu.classList.toggle('hidden');
  }
}

// Show notifications
function showNotifications() {
  alert('No new notifications');
  // You can implement a proper notification dropdown here
}

// Show specific section
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll('.dashboard-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  const selectedSection = document.getElementById(`${sectionName}-section`);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }

  // Update navigation active state
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('onclick')?.includes(sectionName)) {
      link.classList.add('active');
    }
  });

  currentSection = sectionName;

  // Load section-specific data
  loadSectionData(sectionName);
}

// Load section-specific data
function loadSectionData(sectionName) {
  switch(sectionName) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'reports':
      loadReportsData();
      break;
    case 'users':
      loadUsersData();
      break;
    case 'analytics':
      loadAnalyticsData();
      break;
    case 'modules':
      loadModulesData();
      break;
    case 'settings':
      // Settings don't need to load data
      break;
  }
}

// Load dashboard data
async function loadDashboardData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    // Load statistics
    const statsResponse = await fetch('/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (statsResponse.ok) {
      const data = await statsResponse.json();
      updateDashboardStats(data.data);
    } else {
      // Use mock data if API fails
      updateDashboardStats({
        stats: {
          totalReports: 0,
          pendingReports: 0,
          resolvedReports: 0,
          activeUsers: 0
        },
        recentReports: [],
        priorityCases: []
      });
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Use mock data
    updateDashboardStats({
      stats: {
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        activeUsers: 0
      },
      recentReports: [],
      priorityCases: []
    });
  }
}

// Update dashboard statistics
function updateDashboardStats(data) {
  // Update stat cards
  document.getElementById('total-reports').textContent = data.stats.totalReports || 0;
  document.getElementById('pending-reports').textContent = data.stats.pendingReports || 0;
  document.getElementById('resolved-reports').textContent = data.stats.resolvedReports || 0;
  document.getElementById('active-users').textContent = data.stats.activeUsers || 0;

  // Update recent reports
  const recentReportsContainer = document.getElementById('recent-reports');
  if (recentReportsContainer) {
    if (data.recentReports && data.recentReports.length > 0) {
      recentReportsContainer.innerHTML = data.recentReports.map(report => `
        <div class="activity-item">
          <div class="activity-icon report">
            <i class="fas fa-flag"></i>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-800">${report.caseId}</p>
            <p class="text-sm text-gray-600">${report.type}</p>
            <p class="text-xs text-gray-500">${new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <span class="status-badge ${report.status}">${report.status}</span>
        </div>
      `).join('');
    } else {
      recentReportsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No recent reports</p>';
    }
  }

  // Update priority cases
  const priorityCasesContainer = document.getElementById('priority-cases');
  if (priorityCasesContainer) {
    if (data.priorityCases && data.priorityCases.length > 0) {
      priorityCasesContainer.innerHTML = data.priorityCases.map(report => `
        <div class="priority-case ${report.severity}">
          <div class="flex justify-between items-start mb-2">
            <span class="font-semibold text-gray-800">${report.caseId}</span>
            <span class="severity-badge ${report.severity}">${report.severity}</span>
          </div>
          <p class="text-sm text-gray-600">${report.type}</p>
          <p class="text-xs text-gray-500 mt-1">${new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
      `).join('');
    } else {
      priorityCasesContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No priority cases</p>';
    }
  }
}

// Load reports data
async function loadReportsData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('/api/admin/reports', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      allReports = data.data || [];
      displayReports(allReports);
    } else {
      console.error('Failed to load reports:', response.status);
      displayReports([]);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
    displayReports([]);
  }
}

// Display reports in table
function displayReports(reports) {
  const tbody = document.getElementById('reports-table-body');
  if (!tbody) return;

  if (reports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No reports found</td></tr>';
    return;
  }

  tbody.innerHTML = reports.map(report => {
    const incidentTypes = Array.isArray(report.incidentType) ? report.incidentType.join(', ') : (report.incidentType || 'N/A');
    const date = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A';
    
    return `
      <tr class="hover:bg-gray-50 transition-colors duration-150">
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="font-medium text-gray-900">${report.caseId || 'N/A'}</span>
        </td>
        <td class="px-6 py-4">
          <span class="text-sm text-gray-700">${incidentTypes}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="status-badge status-${report.status || 'pending'}">${report.status || 'pending'}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="severity-badge severity-${report.severity || 'low'}">${report.severity || 'low'}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${date}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button onclick="viewReport('${report._id}')" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
            <i class="fas fa-eye mr-1"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Apply report filters
function applyReportFilters() {
  const status = document.getElementById('status-filter')?.value;
  const severity = document.getElementById('severity-filter')?.value;
  const dateFrom = document.getElementById('date-from')?.value;
  const dateTo = document.getElementById('date-to')?.value;

  let filtered = [...allReports];

  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  if (severity) {
    filtered = filtered.filter(r => r.severity === severity);
  }
  if (dateFrom) {
    filtered = filtered.filter(r => new Date(r.createdAt) >= new Date(dateFrom));
  }
  if (dateTo) {
    filtered = filtered.filter(r => new Date(r.createdAt) <= new Date(dateTo));
  }

  displayReports(filtered);
}

// Clear report filters
function clearReportFilters() {
  document.getElementById('status-filter').value = '';
  document.getElementById('severity-filter').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  displayReports(allReports);
}

// View report details
async function viewReport(reportId) {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch(`/api/admin/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showReportModal(data.data);
    } else {
      alert('Failed to load report details');
    }
  } catch (error) {
    console.error('Error loading report:', error);
    alert('Error loading report details');
  }
}

// Show report modal
function showReportModal(report) {
  const incidentTypes = Array.isArray(report.incidentType) ? report.incidentType.join(', ') : report.incidentType;
  const platforms = Array.isArray(report.incident?.platform) ? report.incident.platform.join(', ') : report.incident?.platform;
  
  const modalHTML = `
    <div id="report-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onclick="closeReportModal(event)">
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Report Details</h2>
            <p class="text-sm text-gray-600 mt-1">Case ID: ${report.caseId}</p>
          </div>
          <button onclick="closeReportModal()" class="text-gray-400 hover:text-gray-600 p-2">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- Status and Severity -->
          <div class="flex gap-4">
            <div class="flex-1 bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Status</div>
              <span class="status-badge status-${report.status}">${report.status}</span>
            </div>
            <div class="flex-1 bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Severity</div>
              <span class="severity-badge severity-${report.severity}">${report.severity}</span>
            </div>
            <div class="flex-1 bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Priority</div>
              <span class="text-lg font-semibold text-gray-900">${report.priority || 'Normal'}</span>
            </div>
          </div>

          <!-- Incident Information -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Incident Information</h3>
            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium text-gray-600">Type</div>
                <div class="text-gray-900">${incidentTypes}</div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-600">Description</div>
                <div class="text-gray-900">${report.incident?.description || 'N/A'}</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-600">Date Occurred</div>
                  <div class="text-gray-900">${report.incident?.dateOccurred ? new Date(report.incident.dateOccurred).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-600">Time</div>
                  <div class="text-gray-900">${report.incident?.timeOccurred || 'N/A'}</div>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-600">Platform(s)</div>
                <div class="text-gray-900">${platforms || 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Suspect Information -->
          ${report.suspect ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Suspect Information</h3>
            <div class="space-y-3">
              ${report.suspect.name ? `
              <div>
                <div class="text-sm font-medium text-gray-600">Name</div>
                <div class="text-gray-900">${report.suspect.name}</div>
              </div>
              ` : ''}
              ${report.suspect.username ? `
              <div>
                <div class="text-sm font-medium text-gray-600">Username</div>
                <div class="text-gray-900">${report.suspect.username}</div>
              </div>
              ` : ''}
              ${report.suspect.relationship ? `
              <div>
                <div class="text-sm font-medium text-gray-600">Relationship</div>
                <div class="text-gray-900">${report.suspect.relationship}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Evidence -->
          ${report.evidence && report.evidence.length > 0 ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Evidence (${report.evidence.length} files)</h3>
            <div class="grid grid-cols-2 gap-3">
              ${report.evidence.map(ev => `
                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <i class="fas fa-file text-gray-400"></i>
                  <span class="text-sm text-gray-700">${ev.originalName || ev.filename}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Timestamps -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Submitted</span>
                <span class="text-sm font-medium text-gray-900">${new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Last Updated</span>
                <span class="text-sm font-medium text-gray-900">${new Date(report.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button onclick="closeReportModal()" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            Close
          </button>
          <button onclick="updateReportStatus('${report._id}')" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
            Update Status
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('report-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update report status
function updateReportStatus(reportId) {
  alert('Status update functionality coming soon');
  // Implement status update functionality
}

// Close report modal
function closeReportModal(event) {
  // If event is provided and it's not clicking the backdrop, don't close
  if (event && event.target.id !== 'report-modal') {
    return;
  }
  
  const modal = document.getElementById('report-modal');
  if (modal) {
    modal.remove();
  }
}

// Load users data
async function loadUsersData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      allUsers = data.data || [];
      displayUsers(allUsers);
    } else {
      console.error('Failed to load users:', response.status);
      displayUsers([]);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    displayUsers([]);
  }
}

// Display users in table
function displayUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => {
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
    const roleColors = {
      'admin': 'bg-red-100 text-red-800',
      'moderator': 'bg-purple-100 text-purple-800',
      'user': 'bg-blue-100 text-blue-800'
    };
    const roleColor = roleColors[user.role] || roleColors['user'];
    
    return `
      <tr class="hover:bg-gray-50 transition-colors duration-150">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
              ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span class="font-medium text-gray-900">${user.name || 'N/A'}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-700">${user.email || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${roleColor}">
            ${user.role || 'user'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
            ${user.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${lastLogin}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button onclick="viewUser('${user._id}')" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
            <i class="fas fa-eye mr-1"></i> View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// View user details
async function viewUser(userId) {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showUserModal(data.data);
    } else {
      alert('Failed to load user details');
    }
  } catch (error) {
    console.error('Error loading user:', error);
    alert('Error loading user details');
  }
}

// Show user modal
function showUserModal(data) {
  const user = data.user;
  const reports = data.reports || [];
  
  const modalHTML = `
    <div id="user-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onclick="closeUserModal(event)">
      <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div class="flex items-center">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
              ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">${user.name || 'Unknown User'}</h2>
              <p class="text-sm text-gray-600">${user.email}</p>
            </div>
          </div>
          <button onclick="closeUserModal()" class="text-gray-400 hover:text-gray-600 p-2">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- User Info -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Role</div>
              <div class="text-lg font-semibold text-gray-900 capitalize">${user.role || 'user'}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Status</div>
              <div class="text-lg font-semibold ${user.isActive !== false ? 'text-green-600' : 'text-gray-600'}">
                ${user.isActive !== false ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Verified</div>
              <div class="text-lg font-semibold ${user.isVerified ? 'text-green-600' : 'text-gray-600'}">
                ${user.isVerified ? 'Yes' : 'No'}
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Anonymous</div>
              <div class="text-lg font-semibold text-gray-900">
                ${user.isAnonymous ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          <!-- Profile Information -->
          ${user.profile && (user.profile.age || user.profile.gender) ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div class="grid grid-cols-2 gap-4">
              ${user.profile.age ? `
              <div>
                <div class="text-sm font-medium text-gray-600">Age</div>
                <div class="text-gray-900">${user.profile.age}</div>
              </div>
              ` : ''}
              ${user.profile.gender ? `
              <div>
                <div class="text-sm font-medium text-gray-600">Gender</div>
                <div class="text-gray-900 capitalize">${user.profile.gender}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Reports Submitted -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Reports Submitted (${reports.length})</h3>
            ${reports.length > 0 ? `
              <div class="space-y-2">
                ${reports.map(report => `
                  <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div class="font-medium text-gray-900">${report.caseId}</div>
                      <div class="text-sm text-gray-600">${Array.isArray(report.type) ? report.type.join(', ') : report.type}</div>
                    </div>
                    <span class="status-badge status-${report.status}">${report.status}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500 text-center py-4">No reports submitted</p>'}
          </div>

          <!-- Timestamps -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Joined</span>
                <span class="text-sm font-medium text-gray-900">${new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Last Login</span>
                <span class="text-sm font-medium text-gray-900">${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button onclick="closeUserModal()" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('user-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close user modal
function closeUserModal(event) {
  if (event && event.target.id !== 'user-modal') {
    return;
  }
  
  const modal = document.getElementById('user-modal');
  if (modal) {
    modal.remove();
  }
}

// Edit user (legacy function name kept for compatibility)
function editUser(userId) {
  viewUser(userId);
}

// Show add user modal
function showAddUserModal() {
  alert('Add user functionality coming soon');
  // Implement add user modal
}

// Load analytics data
async function loadAnalyticsData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('/api/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      displayAnalytics(data.data);
    } else {
      // Load basic stats if analytics endpoint fails
      loadBasicAnalytics();
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    loadBasicAnalytics();
  }
}

// Load basic analytics from existing data
async function loadBasicAnalytics() {
  const token = localStorage.getItem('adminToken');
  
  try {
    // Get counts from dashboard endpoint
    const dashResponse = await fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (dashResponse.ok) {
      const dashData = await dashResponse.json();
      const stats = dashData.data.stats;
      
      document.getElementById('analytics-total-reports').textContent = stats.totalReports || 0;
      document.getElementById('analytics-total-users').textContent = stats.activeUsers || 0;
    }
    
    // Get modules count
    const modulesResponse = await fetch('/api/modules', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (modulesResponse.ok) {
      const modulesData = await modulesResponse.json();
      document.getElementById('analytics-total-modules').textContent = modulesData.data?.length || 0;
    }
    
    document.getElementById('analytics-avg-response').textContent = '2.4h';
  } catch (error) {
    console.error('Error loading basic analytics:', error);
  }
}

// Display analytics
function displayAnalytics(data) {
  if (!data) return;
  
  // Update analytics displays
  if (data.reportsByType) {
    const totalReports = data.reportsByType.reduce((sum, item) => sum + item.count, 0);
    document.getElementById('analytics-total-reports').textContent = totalReports;
  }
  
  if (data.avgResponseTime) {
    document.getElementById('analytics-avg-response').textContent = data.avgResponseTime;
  }
  
  console.log('Analytics data loaded:', data);
}

// Load modules data
async function loadModulesData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('/api/modules', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      displayModules(data.data || []);
    } else {
      console.error('Failed to load modules:', response.status);
      displayModules([]);
    }
  } catch (error) {
    console.error('Error loading modules:', error);
    displayModules([]);
  }
}

// Display modules
function displayModules(modules) {
  const container = document.getElementById('modules-grid');
  if (!container) return;

  if (modules.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No modules found</p></div>';
    return;
  }

  const categoryIcons = {
    'cyberbullying': 'fa-user-shield',
    'online-safety': 'fa-shield-alt',
    'privacy': 'fa-lock',
    'digital-wellness': 'fa-heart',
    'reporting': 'fa-flag'
  };

  const difficultyColors = {
    'beginner': 'bg-green-100 text-green-800',
    'intermediate': 'bg-yellow-100 text-yellow-800',
    'advanced': 'bg-red-100 text-red-800'
  };

  container.innerHTML = modules.map(module => {
    const icon = categoryIcons[module.category] || 'fa-graduation-cap';
    const difficultyColor = difficultyColors[module.difficulty?.toLowerCase()] || difficultyColors['beginner'];
    
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <i class="fas ${icon} text-white text-xl"></i>
          </div>
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${difficultyColor}">
            ${module.difficulty || 'Beginner'}
          </span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">${module.title}</h3>
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">${module.description || 'No description available'}</p>
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <div class="flex items-center text-sm text-gray-500">
            <i class="fas fa-book-open mr-2"></i>
            <span>${module.content?.length || 0} lessons</span>
          </div>
          <button onclick="viewModuleDetails('${module._id}')" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
            <i class="fas fa-eye mr-1"></i> View
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// View module details
async function viewModuleDetails(moduleId) {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch(`/api/modules/${moduleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      showModuleModal(data.data);
    } else {
      alert('Failed to load module details');
    }
  } catch (error) {
    console.error('Error loading module:', error);
    alert('Error loading module details');
  }
}

// Show module modal
function showModuleModal(module) {
  const categoryIcons = {
    'cyberbullying': 'fa-user-shield',
    'online-safety': 'fa-shield-alt',
    'privacy': 'fa-lock',
    'digital-wellness': 'fa-heart',
    'reporting': 'fa-flag'
  };
  const icon = categoryIcons[module.category] || 'fa-graduation-cap';
  
  const modalHTML = `
    <div id="module-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onclick="closeModuleModal(event)">
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6 flex justify-between items-center">
          <div class="flex items-center text-white">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
              <i class="fas ${icon} text-3xl"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold">${module.title}</h2>
              <p class="text-blue-100 text-sm mt-1">${module.category || 'General'}</p>
            </div>
          </div>
          <button onclick="closeModuleModal()" class="text-white hover:text-gray-200 p-2">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- Module Info -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Difficulty</div>
              <div class="text-lg font-semibold text-gray-900">${module.difficulty || 'Beginner'}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Duration</div>
              <div class="text-lg font-semibold text-gray-900">${module.estimatedTime || 'N/A'}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="text-sm text-gray-600 mb-1">Lessons</div>
              <div class="text-lg font-semibold text-gray-900">${module.content?.length || 0}</div>
            </div>
          </div>

          <!-- Description -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p class="text-gray-700">${module.description || 'No description available'}</p>
          </div>

          <!-- Learning Objectives -->
          ${module.learningObjectives && module.learningObjectives.length > 0 ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
            <ul class="space-y-2">
              ${module.learningObjectives.map(obj => `
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                  <span class="text-gray-700">${obj}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Content Sections -->
          ${module.content && module.content.length > 0 ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Content Sections</h3>
            <div class="space-y-3">
              ${module.content.map((section, index) => `
                <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">
                    ${index + 1}
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">${section.title || `Section ${index + 1}`}</div>
                    <div class="text-sm text-gray-600">${section.type || 'Content'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Quiz Info -->
          ${module.quiz && module.quiz.questions && module.quiz.questions.length > 0 ? `
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Quiz</h3>
            <div class="flex items-center text-gray-700">
              <i class="fas fa-question-circle text-blue-500 mr-2"></i>
              <span>${module.quiz.questions.length} questions • Passing score: ${module.quiz.passingScore || 70}%</span>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button onclick="closeModuleModal()" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('module-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close module modal
function closeModuleModal(event) {
  if (event && event.target.id !== 'module-modal') {
    return;
  }
  
  const modal = document.getElementById('module-modal');
  if (modal) {
    modal.remove();
  }
}

// Edit module (legacy)
function editModule(moduleId) {
  viewModuleDetails(moduleId);
}

// Show add module modal
function showAddModuleModal() {
  alert('Add module functionality coming soon');
  // Implement add module modal
}

// Logout function
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear all admin data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminRole');
    
    // Redirect to login page
    window.location.href = '/login.html';
  }
}

// Export functions to global scope
window.showSection = showSection;
window.applyReportFilters = applyReportFilters;
window.clearReportFilters = clearReportFilters;
window.viewReport = viewReport;
window.closeReportModal = closeReportModal;
window.updateReportStatus = updateReportStatus;
window.viewUserDetails = viewUser;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.showAddUserModal = showAddUserModal;
window.viewModuleDetails = viewModuleDetails;
window.editModule = editModule;
window.closeModuleModal = closeModuleModal;
window.showAddModuleModal = showAddModuleModal;
window.logout = logout;
