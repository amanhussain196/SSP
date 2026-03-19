const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.flipkart.com/search?q=apple', { waitUntil: 'load', timeout: 60000 });
        const info = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('*')).find(x => x.innerText && x.innerText.includes('iPhone 17'));
            if (!el) return 'NOT FOUND';
            let curr = el;
            let path = [];
            for (let i = 0; i < 5; i++) {
                path.push({ tag: curr.tagName, class: curr.className });
                if (curr.parentElement) curr = curr.parentElement;
                else break;
            }
            return path;
        });
        console.log('Path:', JSON.stringify(info, null, 2));
    } finally { await browser.close(); }
})();
