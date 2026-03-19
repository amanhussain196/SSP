const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto('https://www.flipkart.com/search?q=apple', { waitUntil: 'load', timeout: 60000 });
        await page.waitForSelector('div._1AtVbE, div.cPHS70, div.sl-so-m', { timeout: 10000 }).catch(e => console.log('Wait timeout'));
        
        const data = await page.evaluate(() => {
            const results = [];
            document.querySelectorAll('div').forEach(div => {
                if (div.innerText.includes('₹') && div.innerText.length < 20) {
                   results.push({
                       class: div.className,
                       text: div.innerText,
                       parentClass: div.parentElement.className
                   });
                }
            });
            return results.slice(0, 10);
        });
        console.log('Price elements found:', JSON.stringify(data, null, 2));
        
        const titles = await page.evaluate(() => {
           return Array.from(document.querySelectorAll('a, div')).filter(el => {
               return el.innerText && el.innerText.toLowerCase().includes('iphone') && el.innerText.length < 100;
           }).map(el => ({ class: el.className, text: el.innerText.trim() })).slice(0, 10);
        });
        console.log('Title elements found:', JSON.stringify(titles, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
