/**
 * Hello World - Interactive Application
 * Design Excellence: Smooth interactions, accessibility, and polished UX
 */

(function() {
    'use strict';

    // Color palette for the greeting
    const COLORS = [
        { name: 'default', value: '#1a202c' },
        { name: 'primary', value: '#667eea' },
        { name: 'secondary', value: '#764ba2' },
        { name: 'dark', value: '#1a202c' }
    ];
    let currentColorIndex = 0;

    /**
     * Format and display the current timestamp
     */
    function updateTimestamp() {
        const timestampEl = document.getElementById('timestamp');
        if (!timestampEl) return;

        const now = new Date();
        
        // Format: Weekday, Month Day, Year at HH:MM:SS AM/PM
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        const formattedDate = now.toLocaleDateString('en-US', options);
        timestampEl.textContent = `Page loaded at: ${formattedDate}`;
        
        // Add subtle animation to timestamp
        timestampEl.style.opacity = '0';
        timestampEl.style.transform = 'translateY(-4px)';
        
        requestAnimationFrame(() => {
            timestampEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
            timestampEl.style.opacity = '1';
            timestampEl.style.transform = 'translateY(0)';
        });
    }

    /**
     * Cycle through greeting colors on click
     */
    function initGreetingInteraction() {
        const greeting = document.getElementById('greeting');
        if (!greeting) return;

        greeting.addEventListener('click', function() {
            currentColorIndex = (currentColorIndex + 1) % COLORS.length;
            const nextColor = COLORS[currentColorIndex];
            
            // Smooth color transition
            this.style.transition = 'color 150ms ease';
            this.style.color = nextColor.value;
            
            // Add subtle scale animation
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });

        // Keyboard accessibility
        greeting.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    /**
     * Initialize the refresh button
     */
    function initRefreshButton() {
        const refreshBtn = document.getElementById('refresh-btn');
        if (!refreshBtn) return;

        refreshBtn.addEventListener('click', function() {
            // Update timestamp with animation
            const timestampEl = document.getElementById('timestamp');
            if (timestampEl) {
                timestampEl.style.opacity = '0';
                timestampEl.style.transform = 'translateY(-4px)';
                
                setTimeout(() => {
                    updateTimestamp();
                }, 150);
            }

            // Add spin animation to icon
            const icon = this.querySelector('.btn__icon');
            if (icon) {
                icon.style.transition = 'transform 300ms ease';
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                }, 300);
            }
        });
    }

    /**
     * Initialize all interactions when DOM is ready
     */
    function init() {
        updateTimestamp();
        initGreetingInteraction();
        initRefreshButton();
    }

    // Run when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
