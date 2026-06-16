document.addEventListener('DOMContentLoaded', () => {
    // App State
    let releasesData = [];
    let activeFilter = 'all';
    let selectedUpdateId = null;

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const totalUpdatesCount = document.getElementById('total-updates-count');
    const skeletonContainer = document.getElementById('skeleton-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const feedList = document.getElementById('feed-list');
    const filterPills = document.querySelectorAll('.filter-pill');

    // Tweet Panel Elements
    const tweetEmptyState = document.getElementById('tweet-empty-state');
    const tweetEditorContainer = document.getElementById('tweet-editor-container');
    const contextTag = document.getElementById('context-tag');
    const contextDate = document.getElementById('context-date');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tweetLivePreview = document.getElementById('tweet-live-preview');
    const tweetSubmitBtn = document.getElementById('tweet-submit-btn');

    // Toast Elements
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);

    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.getAttribute('data-filter');
            renderFeed();
        });
    });

    tweetTextarea.addEventListener('input', updateTweetPreview);
    tweetSubmitBtn.addEventListener('click', handleTweetSubmit);

    // Initialization
    fetchReleases();

    // Functions
    async function fetchReleases() {
        showLoadingState();
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                releasesData = data.entries;
                updateMeta(data);
                renderFeed();
                showSuccessState();
                showToast("Feed refreshed successfully!");
            } else {
                throw new Error(data.error || "Unknown error occurred while parsing the feed.");
            }
        } catch (error) {
            console.error("Error fetching release notes:", error);
            showErrorState(error.message);
        }
    }

    function showLoadingState() {
        refreshIcon.classList.add('spinning');
        refreshBtn.disabled = true;
        skeletonContainer.classList.remove('hidden');
        feedList.classList.add('hidden');
        errorContainer.classList.add('hidden');
    }

    function showSuccessState() {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
        skeletonContainer.classList.add('hidden');
        feedList.classList.remove('hidden');
    }

    function showErrorState(msg) {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
        skeletonContainer.classList.add('hidden');
        feedList.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        errorMessage.textContent = msg || "Could not fetch release notes. Check your network connection.";
    }

    function updateMeta(data) {
        // Update last updated string
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastUpdatedText.textContent = `Sync Live (${timeString})`;

        // Calculate total individual updates
        let total = 0;
        data.entries.forEach(entry => {
            total += entry.updates.length;
        });
        totalUpdatesCount.textContent = total;
    }

    function renderFeed() {
        feedList.innerHTML = '';
        let visibleCount = 0;

        if (releasesData.length === 0) {
            feedList.innerHTML = `
                <div class="error-container" style="border-color: var(--border-subtle); background: transparent;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; color: var(--text-muted);"></i>
                    <h3>No Release Notes Found</h3>
                    <p>The BigQuery release notes feed seems to be empty.</p>
                </div>
            `;
            return;
        }

        releasesData.forEach(entry => {
            // Filter updates within the entry
            const filteredUpdates = entry.updates.filter(update => {
                if (activeFilter === 'all') return true;
                return update.type.toLowerCase() === activeFilter.toLowerCase();
            });

            if (filteredUpdates.length === 0) return;

            // Create Date Group
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            const divider = document.createElement('div');
            divider.className = 'date-divider';
            divider.textContent = entry.date;
            dateGroup.appendChild(divider);

            filteredUpdates.forEach(update => {
                visibleCount++;
                const card = createReleaseCard(entry, update);
                dateGroup.appendChild(card);
            });

            feedList.appendChild(dateGroup);
        });

        if (visibleCount === 0) {
            feedList.innerHTML = `
                <div class="error-container" style="border-color: var(--border-subtle); background: transparent; padding: 3rem 1rem;">
                    <i class="fa-solid fa-filter" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
                    <h3>No items match filter</h3>
                    <p>No updates classified as "${activeFilter}" found in the recent release notes.</p>
                </div>
            `;
        }
    }

    function createReleaseCard(entry, update) {
        const card = document.createElement('div');
        card.className = `release-card ${selectedUpdateId === update.id ? 'selected' : ''}`;
        
        // Define styles for category tags
        const category = update.type.toLowerCase();
        let badgeColor = 'var(--accent-unknown)';
        let badgeBg = 'var(--accent-unknown-bg)';
        let badgeIcon = 'fa-solid fa-circle-question';

        if (category.includes('feature')) {
            badgeColor = 'var(--accent-feature)';
            badgeBg = 'var(--accent-feature-bg)';
            badgeIcon = 'fa-solid fa-circle-plus';
        } else if (category.includes('change')) {
            badgeColor = 'var(--accent-change)';
            badgeBg = 'var(--accent-change-bg)';
            badgeIcon = 'fa-solid fa-clock-rotate-left';
        } else if (category.includes('issue')) {
            badgeColor = 'var(--accent-issue)';
            badgeBg = 'var(--accent-issue-bg)';
            badgeIcon = 'fa-solid fa-circle-exclamation';
        } else if (category.includes('deprecation')) {
            badgeColor = 'var(--accent-deprecation)';
            badgeBg = 'var(--accent-deprecation-bg)';
            badgeIcon = 'fa-solid fa-ban';
        }

        card.style.setProperty('--badge-color', badgeColor);
        card.style.setProperty('--badge-bg', badgeBg);

        card.innerHTML = `
            <div class="card-header">
                <span class="badge-tag">
                    <i class="${badgeIcon}"></i>
                    ${update.type}
                </span>
                <a href="${entry.link}" target="_blank" class="card-link" title="Open official documentation" onclick="event.stopPropagation()">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
            <div class="card-content">
                ${update.html}
            </div>
            <div class="card-footer">
                <button class="btn-card-action">
                    <i class="fa-solid fa-feather-pointed"></i>
                    <span>Draft Tweet</span>
                </button>
            </div>
        `;

        card.addEventListener('click', () => {
            // Select card
            document.querySelectorAll('.release-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedUpdateId = update.id;
            
            // Populate Tweet Studio
            loadTweetComposer(entry, update);
        });

        return card;
    }

    function loadTweetComposer(entry, update) {
        tweetEmptyState.classList.add('hidden');
        tweetEditorContainer.classList.remove('hidden');

        // Context details
        contextTag.textContent = update.type;
        contextDate.textContent = entry.date;

        // Custom styling for context tag
        const category = update.type.toLowerCase();
        let badgeColor = 'var(--accent-unknown)';
        if (category.includes('feature')) badgeColor = 'var(--accent-feature)';
        else if (category.includes('change')) badgeColor = 'var(--accent-change)';
        else if (category.includes('issue')) badgeColor = 'var(--accent-issue)';
        else if (category.includes('deprecation')) badgeColor = 'var(--accent-deprecation)';
        contextTag.style.color = badgeColor;

        // Populate text
        tweetTextarea.value = update.tweet_text;
        updateTweetPreview();

        // Scroll tweet studio into view on small screens
        if (window.innerWidth <= 992) {
            tweetEditorContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function updateTweetPreview() {
        const text = tweetTextarea.value;
        const charCount = text.length;
        
        charCounter.textContent = `${charCount} / 280`;
        tweetLivePreview.textContent = text || "What's happening?";

        // Manage validation classes and buttons
        charCounter.classList.remove('warning', 'danger');
        if (charCount > 250 && charCount <= 280) {
            charCounter.classList.add('warning');
            tweetSubmitBtn.disabled = false;
        } else if (charCount > 280) {
            charCounter.classList.add('danger');
            tweetSubmitBtn.disabled = true;
        } else if (charCount === 0) {
            tweetSubmitBtn.disabled = true;
        } else {
            tweetSubmitBtn.disabled = false;
        }
    }

    function handleTweetSubmit() {
        const text = tweetTextarea.value;
        if (text.length === 0 || text.length > 280) return;

        // Encode tweet URL and launch X / Twitter intent
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        showToast("Opened Twitter Web Intent!");
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
});
