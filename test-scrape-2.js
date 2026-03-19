const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.flipkart.com/search?q=apple', { waitUntil: 'load', timeout: 60000 });
        await page.waitForSelector('div._1AtVbE, div.cPHS70, div.sl-so-m, div._2kHMvA', { timeout: 10000 }).catch(e => console.log('Wait timeout'));
        
        const data = await page.evaluate(() => {
            const item = document.querySelector('div._1AtVbE, div._2kHMvA, div.cPHS70');
            if (!item) return 'NO ITEM FOUND';
            return {
                html: item.innerHTML.substring(0, 1000),
                classes: item.className
            };
        });
        console.log('Sample item:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
