// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '51499726574-938u73klifk6kvc44f62ibolqkg27rgq.apps.googleusercontent.com';

// Check if Google OAuth is properly configured
function isGoogleOAuthConfigured() {
    return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';
}

// Initialize Google OAuth
function initializeGoogleAuth() {
    // Check if OAuth is configured
    if (!isGoogleOAuthConfigured()) {
        console.warn('Google OAuth not configured. Please update GOOGLE_CLIENT_ID in auth.js');
        showConfigurationWarning();
        return;
    }

    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = function() {
        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            // Render the Google Sign-In button
            google.accounts.id.renderButton(
                document.getElementById('google-login-btn'),
                { 
                    theme: 'outline', 
                    size: 'large',
                    type: 'standard',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left',
                }
            );
        } catch (error) {
            console.error('Error initializing Google OAuth:', error);
            showConfigurationWarning();
        }
    };

    script.onerror = function() {
        console.error('Failed to load Google OAuth script');
        showConfigurationWarning();
    };
}

// Show configuration warning
function showConfigurationWarning() {
    const loginBtn = document.getElementById('google-login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '⚠️ OAuth Not Configured';
        loginBtn.style.background = '#ffc107';
        loginBtn.style.color = '#000';
        loginBtn.onclick = function() {
            alert('Please configure Google OAuth first. See GOOGLE_OAUTH_SETUP.md for instructions.');
        };
    }
}

// Handle Google OAuth response
function handleCredentialResponse(response) {
    // Decode the JWT token
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    // Store user info in localStorage
    const userInfo = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        loginTime: new Date().toISOString(),
        token: response.credential
    };
    
    localStorage.setItem('genaiatlas_user', JSON.stringify(userInfo));
    
    // Update UI
    showAuthenticatedUser(userInfo);
    
    // Track login (you can send this to your analytics)
    trackUserLogin(userInfo);
}

// Show authenticated user
function showAuthenticatedUser(userInfo) {
    const loginSection = document.getElementById('login-section');
    const contentSection = document.getElementById('content-section');
    const loginRequired = document.getElementById('login-required');
    
    if (loginSection) loginSection.style.display = 'none';
    if (contentSection) contentSection.style.display = 'block';
    if (loginRequired) loginRequired.style.display = 'none';
    
    // Update user info display
    const userName = document.getElementById('user-name');
    const userInfoDiv = document.getElementById('user-info');
    
    if (userName) userName.textContent = userInfo.name;
    if (userInfoDiv) userInfoDiv.style.display = 'block';
    
    // Show navigation tabs
    showNavigationTabs();
}

// Hide navigation tabs for unauthenticated users
function hideNavigationTabs() {
    // Try multiple selectors for different themes
    const selectors = [
        '.md-tabs__link',
        '.md-tabs__item',
        '.md-tabs a',
        '.md-header__tabs a',
        'nav a[href*="/"]',
        '.md-nav__link'
    ];
    
    selectors.forEach(selector => {
        const navTabs = document.querySelectorAll(selector);
        navTabs.forEach(tab => {
            const text = tab.textContent || tab.innerText || '';
            if (!text.toLowerCase().includes('home')) {
                tab.style.display = 'none';
                tab.style.visibility = 'hidden';
                tab.style.opacity = '0';
            }
        });
    });
    
    // Also hide the entire tabs container if possible
    const tabsContainer = document.querySelector('.md-tabs');
    if (tabsContainer) {
        const homeTab = tabsContainer.querySelector('a[href="/"]') || tabsContainer.querySelector('a[href*="index"]');
        if (homeTab) {
            // Hide all tabs except home
            const allTabs = tabsContainer.querySelectorAll('a');
            allTabs.forEach(tab => {
                if (tab !== homeTab) {
                    tab.style.display = 'none';
                }
            });
        }
    }
}

// Show navigation tabs for authenticated users
function showNavigationTabs() {
    // Show all navigation tabs
    const selectors = [
        '.md-tabs__link',
        '.md-tabs__item',
        '.md-tabs a',
        '.md-header__tabs a',
        'nav a[href*="/"]',
        '.md-nav__link'
    ];
    
    selectors.forEach(selector => {
        const navTabs = document.querySelectorAll(selector);
        navTabs.forEach(tab => {
            tab.style.display = 'block';
            tab.style.visibility = 'visible';
            tab.style.opacity = '1';
        });
    });
    
    // Show the entire tabs container
    const tabsContainer = document.querySelector('.md-tabs');
    if (tabsContainer) {
        const allTabs = tabsContainer.querySelectorAll('a');
        allTabs.forEach(tab => {
            tab.style.display = 'block';
        });
    }
}

// Logout function
function logout() {
    // Clear user data
    localStorage.removeItem('genaiatlas_user');
    
    // Update UI
    const loginSection = document.getElementById('login-section');
    const contentSection = document.getElementById('content-section');
    const loginRequired = document.getElementById('login-required');
    const userInfoDiv = document.getElementById('user-info');
    
    if (loginSection) loginSection.style.display = 'block';
    if (contentSection) contentSection.style.display = 'none';
    if (loginRequired) loginRequired.style.display = 'block';
    if (userInfoDiv) userInfoDiv.style.display = 'none';
    
    // Hide navigation tabs
    hideNavigationTabs();
    
    // Track logout
    trackUserLogout();
    
    // Redirect to home page
    window.location.href = '/';
}

// Track user login (you can implement analytics here)
function trackUserLogin(userInfo) {
    console.log('User logged in:', userInfo.email);
    
    // You can send this data to Google Analytics, your own analytics, etc.
    // Example: gtag('event', 'login', { user_email: userInfo.email });
    
    // For now, we'll just log it
    const loginData = {
        email: userInfo.email,
        timestamp: new Date().toISOString(),
        action: 'login'
    };
    
    // Store in localStorage for tracking (you can send this to a server later)
    const trackingData = JSON.parse(localStorage.getItem('genaiatlas_tracking') || '[]');
    trackingData.push(loginData);
    localStorage.setItem('genaiatlas_tracking', JSON.stringify(trackingData));
}

// Track user logout
function trackUserLogout() {
    console.log('User logged out');
    
    const logoutData = {
        timestamp: new Date().toISOString(),
        action: 'logout'
    };
    
    const trackingData = JSON.parse(localStorage.getItem('genaiatlas_tracking') || '[]');
    trackingData.push(logoutData);
    localStorage.setItem('genaiatlas_tracking', JSON.stringify(trackingData));
}

// Check if user is authenticated
function checkAuthentication() {
    const userInfo = localStorage.getItem('genaiatlas_user');
    
    if (userInfo) {
        const user = JSON.parse(userInfo);
        showAuthenticatedUser(user);
    } else {
        // Hide content for unauthenticated users
        const contentSection = document.getElementById('content-section');
        const loginRequired = document.getElementById('login-required');
        
        if (contentSection) contentSection.style.display = 'none';
        if (loginRequired) loginRequired.style.display = 'block';
        hideNavigationTabs();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth script loaded');
    
    // Check authentication status
    checkAuthentication();
    
    // Initialize Google Auth
    initializeGoogleAuth();
    
    // Add logout button event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Add manual login button event listener (fallback)
    const loginBtn = document.getElementById('google-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            // This will be handled by Google's OAuth flow
            console.log('Google login button clicked');
        });
    }
    
    // Force hide navigation tabs on page load for unauthenticated users
    setTimeout(() => {
        const userInfo = localStorage.getItem('genaiatlas_user');
        if (!userInfo) {
            hideNavigationTabs();
        }
    }, 100);
});

// Export functions for use in other scripts
window.GenAIAtlasAuth = {
    logout,
    checkAuthentication,
    trackUserLogin,
    trackUserLogout
};
