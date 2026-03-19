const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.flipkart.com/search?q=apple', { waitUntil: 'load', timeout: 60000 });
        await page.screenshot({ path: 'flipkart_current.png' });
        
        const data = await page.evaluate(() => {
            const results = [];
            // Just find something that looks like a product card
            document.querySelectorAll('div').forEach(div => {
                if (div.innerText.includes('iPhone') && div.className) {
                    results.push(div.className);
                }
            });
            return [...new Set(results)].slice(0, 50);
        });
        console.log('Classes containing iPhone:', results);
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
