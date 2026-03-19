/**
 * SmartShopper AI - Frontend Logic
 * Version: 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const amazonResults = document.getElementById('amazonResults');
    const flipkartResults = document.getElementById('flipkartResults');
    const bestDealBanner = document.getElementById('best-deal-banner');
    const topDealContent = document.getElementById('topDealContent');
    const productTemplate = document.getElementById('product-card-template');

    // Store search state
    let searchActive = false;

    // Handle Search
    const handleSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        // Show loading state
        showLoading(true);
        results.classList.add('hidden');
        bestDealBanner.classList.add('hidden');
        
        // Clear previous results
        amazonResults.innerHTML = '';
        flipkartResults.innerHTML = '';

        try {
            // Call the backend API
            const data = await searchProducts(query);
            
            // Handle zero results gracefully
            if ((!data.amazon || data.amazon.length === 0) && (!data.flipkart || data.flipkart.length === 0)) {
                amazonResults.innerHTML = '<div class="no-results-card">No Amazon matches found. <br><small><a href="/api/debug" target="_blank" style="color:#66fcf1">View Server Screenshot</a></small></div>';
                flipkartResults.innerHTML = '<div class="no-results-card">No Flipkart matches found.</div>';
                bestDealBanner.classList.add('hidden');
            } else {
                renderResults(data);
                findBestDeal(data);
            }
            
            results.classList.remove('hidden');
        } catch (error) {
            console.error('Search failed:', error);
            const errorMessage = `Search failed: ${error.message}. \n\nTIP: Ensure "node server.js" is running and access via http://localhost:3000 for best results.`;
            alert(errorMessage);
        } finally {
            showLoading(false);
        }
    };

    // Attach Event Listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    /**
     * Helper to show/hide loading spinner
     */
    function showLoading(show) {
        if (show) {
            loading.classList.remove('hidden');
            searchButton.disabled = true;
            searchButton.innerText = 'Searching...';
        } else {
            loading.classList.add('hidden');
            searchButton.disabled = false;
            searchButton.innerText = 'Compare Now';
        }
    }

    /**
     * Render results to the DOM
     */
    function renderResults(data) {
        // Render Amazon
        data.amazon.forEach(product => {
            const card = createProductCard(product, 'amazon');
            amazonResults.appendChild(card);
        });

        // Render Flipkart
        data.flipkart.forEach(product => {
            const card = createProductCard(product, 'flipkart');
            flipkartResults.appendChild(card);
        });
    }

    /**
     * Create a product card from template
     */
    function createProductCard(product, store) {
        const clone = productTemplate.content.cloneNode(true);
        const card = clone.querySelector('.product-card');
        
        card.querySelector('.product-image').src = product.image;
        card.querySelector('.product-image').alt = product.title;
        card.querySelector('.product-title').textContent = product.title;
        card.querySelector('.price').textContent = `₹${product.price.toLocaleString()}`;
        card.querySelector('.rating').textContent = `★ ${product.rating}`;
        card.querySelector('.buy-button').href = product.url;

        // Add store tag for visibility
        const badge = card.querySelector('.price-badge');
        badge.textContent = store.toUpperCase();
        badge.style.background = store === 'amazon' ? '#FF9900' : '#2874F0';

        return card;
    }

    /**
     * Identifies the best price among all returned products
     */
    function findBestDeal(data) {
        const allProducts = [...data.amazon, ...data.flipkart];
        if (allProducts.length === 0) return;

        // Sort by price ascending
        const sorted = allProducts.sort((a, b) => a.price - b.price);
        const topDeal = sorted[0];

        // Update UI
        bestDealBanner.classList.remove('hidden');
        topDealContent.innerHTML = `
            <div class="product-image-container" style="width: 150px; height: 150px;">
                <img src="${topDeal.image}" class="product-image">
            </div>
            <div class="deal-info">
                <h2 style="font-size: 1.8rem; color: #fff; margin-bottom: 0.5rem;">${topDeal.title}</h2>
                <div style="font-size: 2.5rem; color: #66fcf1; font-weight: 800; margin-bottom: 1rem;">₹${topDeal.price.toLocaleString()}</div>
                <a href="${topDeal.url}" target="_blank" class="buy-button" style="padding: 12px 30px; font-size: 1.1rem; background: #66fcf1; color: #000;">GRAB THIS DEAL</a>
            </div>
        `;
    }

    /**
     * Call the backend API for real-time scraping
     */
    async function searchProducts(query) {
        // If the file is opened directly (file://), it won't be able to reach the API with a relative path.
        // We use an absolute URL directed at the local server to compensate.
        const origin = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
        const url = `${origin}/api/search?q=${encodeURIComponent(query)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch failed:', error);
            // Re-throw and let handleSearch catch it with a nicer alert
            throw error;
        }
    }
});
