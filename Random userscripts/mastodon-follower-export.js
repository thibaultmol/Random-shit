# tbc, this is just a piece of javascript to run in the console.
# You navigate to a profile and then run the script, it'll give you a follower list of that profile.

(function() {
    // Extract bearer token from localStorage or sessionStorage
    function getBearerToken() {
        // Try common storage locations for Mastodon tokens
        const token = localStorage.getItem('mastodon_access_token') || 
                     sessionStorage.getItem('access_token') ||
                     localStorage.getItem('access_token');

        if (!token) {
            // Try to extract from page scripts or meta tags
            const scripts = document.querySelectorAll('script');
            for (let script of scripts) {
                const match = script.textContent.match(/access_token['"]\s*:\s*['"]([^'"]+)['"]/);
                if (match) return match[1];
            }
        }
        return token;
    }

    // Extract account ID from profile avatar URL
    function getAccountId() {
        const avatarImg = document.querySelector('.account__avatar img');
        if (avatarImg && avatarImg.src) {
            // Extract ID from avatar URL: /accounts/avatars/109/291/222/039/065/120/
            const match = avatarImg.src.match(/\/accounts\/avatars\/(\d+\/\d+\/\d+\/\d+\/\d+\/\d+)\//);
            if (match) {
                // Remove slashes to get the full ID
                return match[1].replace(/\//g, '');
            }
        }

        // Fallback: try URL path
        const urlMatch = window.location.pathname.match(/\/accounts\/(\d+)/);
        return urlMatch ? urlMatch[1] : null;
    }

    // Get instance domain
    function getInstanceDomain() {
        return window.location.origin;
    }

    // Get current date in YYYYMMDD format
    function getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    async function fetchAllFollowers() {
        const token = getBearerToken();
        const accountId = getAccountId();
        const domain = getInstanceDomain();

        if (!token) {
            alert('Bearer token not found. Please check browser storage or page source.');
            return;
        }

        if (!accountId) {
            alert('Account ID not found. Please navigate to a user profile page.');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        let url = `${domain}/api/v1/accounts/${accountId}/followers`;
        let followers = [];
        let pageCount = 1;

        try {
            while (url) {
                console.log(`Fetching page ${pageCount}...`);

                const response = await fetch(url, { headers });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                followers.push(...data);

                // Check for next page
                const linkHeader = response.headers.get('Link');
                if (linkHeader && linkHeader.includes('rel="next"')) {
                    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
                    url = nextMatch ? nextMatch[1] : null;
                    pageCount++;
                } else {
                    url = null;
                }
            }

            // Create JSON files and show popup
            showResults(followers, accountId);

        } catch (error) {
            alert(`Error fetching followers: ${error.message}`);
        }
    }

    function showResults(followers, accountId) {
        const dateString = getDateString();

        // Create JSON blob
        const jsonData = JSON.stringify(followers, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(blob);

        // Create CSV data
        const csvData = followers.map((f, i) => `${i + 1},${f.acct}`).join('\n');
        const csvBlob = new Blob([csvData], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);

        // Create popup
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: white !important;
            border: 2px solid #333 !important;
            border-radius: 8px !important;
            padding: 20px !important;
            z-index: 10000 !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            max-width: 400px !important;
            font-family: Arial, sans-serif !important;
            color: #000000 !important;
        `;

        popup.innerHTML = `
            <h3 style="color: #000000 !important; margin: 0 0 15px 0 !important; font-size: 18px !important;">Followers Export Complete</h3>
            <p style="color: #000000 !important; margin: 10px 0 !important;">Found ${followers.length} followers for account ${accountId}</p>
            <div style="margin: 15px 0 !important;">
                <a href="${jsonUrl}" download="followers_${accountId}_${dateString}.json" 
                   style="display: inline-block !important; margin: 5px !important; padding: 10px 15px !important; 
                          background: #007bff !important; color: white !important; text-decoration: none !important; 
                          border-radius: 4px !important; font-weight: normal !important;">Download JSON</a>
                <a href="${csvUrl}" download="followers_${accountId}_${dateString}.csv"
                   style="display: inline-block !important; margin: 5px !important; padding: 10px 15px !important; 
                          background: #28a745 !important; color: white !important; text-decoration: none !important; 
                          border-radius: 4px !important; font-weight: normal !important;">Download CSV</a>
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="padding: 8px 15px !important; background: #dc3545 !important; color: white !important; 
                           border: none !important; border-radius: 4px !important; cursor: pointer !important; 
                           font-weight: normal !important;">Close</button>
        `;

        document.body.appendChild(popup);
    }

    // Start the process
    fetchAllFollowers();
})();
