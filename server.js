const express = require('express');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const cors = require('cors');
const path = require('path');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
    console.log('PROCESS EXITING WITH CODE:', code);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

/**
 * Scrape Amazon India
 */
async function scrapeAmazon(query) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280 + Math.floor(Math.random() * 100), height: 720 + Math.floor(Math.random() * 100) }
    });
    const page = await context.newPage();
    await page.waitForTimeout(1000 + Math.random() * 2000); // Random delay
    
    try {
        await page.goto(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000); 
        
        // Check for CAPTCHA
        const isCaptcha = await page.evaluate(() => document.body.innerText.includes('Type the characters you see in this image'));
        if (isCaptcha) {
            console.log('[AMAZON] CAPTCHA detected. Request may fail.');
            await page.screenshot({ path: 'amazon_captcha.png' });
        }

        try {
            await page.waitForSelector('div[data-asin], div.s-result-item', { timeout: 10000 });
        } catch (e) {
            console.log('[DEBUG] Amazon data-asin selector not found');
        }

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div[data-asin], div.s-result-item, div[data-component-type="s-search-result"]'));
            return items.map(item => {
                const titleEl = item.querySelector('h2, .a-size-medium, .a-size-base-plus');
                // ... (rest remains same)
                const priceEl = item.querySelector('.a-price-whole');
                const imageEl = item.querySelector('img.s-image');
                const linkEl = item.querySelector('a.a-link-normal');

                if (!titleEl || !priceEl) return null;

                const priceText = priceEl.innerText.replace(/,/g, '');
                if (isNaN(parseInt(priceText))) return null;

                return {
                    title: titleEl.innerText.trim(),
                    price: parseInt(priceText),
                    image: imageEl ? imageEl.src : '',
                    rating: '4.5', 
                    url: linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : 'https://www.amazon.in' + linkEl.getAttribute('href')) : 'https://www.amazon.in'
                };
            }).filter(p => p !== null && p.title.length > 5).slice(0, 10);
        });

        if (products.length === 0) {
            await page.screenshot({ path: 'amazon_debug.png' });
        }

        return products;
    } catch (err) {
        console.error('Amazon scrape error:', err);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Scrape Flipkart
 */
async function scrapeFlipkart(query) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1280 + Math.floor(Math.random() * 100), height: 720 + Math.floor(Math.random() * 100) }
    });
    const page = await context.newPage();
    await page.waitForTimeout(1000 + Math.random() * 2000); // Random delay

    try {
        await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
        try {
            // Wait for any common product container or wait 10s as fallback
            await page.waitForSelector('div[data-id], div._1AtVbE, div.cPHS70, div.sl-so-m, div._2kHMvA', { timeout: 15000 });
        } catch (e) {
            console.log('[DEBUG] Flipkart wait timeout, searching for existing elements.');
        }

        const products = await page.evaluate(() => {
            // Broad search for search result containers
            const items = Array.from(document.querySelectorAll('div[data-id], div._1AtVbE, div.cPHS70, div.sl-so-m, div._2kHMvA, div._1fQ96Z, div._2N9f_R, div.row'));
            
            return items.map(item => {
                // Try multiple title/price classes - including newer 2026 ones like RG5Slk and oFEPlD
                const titleEl = item.querySelector('div.RG5Slk, div.KzDlHZ, div._4rR01T, a.s1Q9rs, a._2WkVRV, a.IRpwTe, div._2N9f_R, h2');
                const priceEl = item.querySelector('div.oFEPlD, div.hZ3P6w, div.Nx9W0j, div._30jeq3, ._30jeq3, div._30jeq3._1_WHN1');
                const imageEl = item.querySelector('img');
                const linkEl = item.querySelector('a');

                if (!titleEl || !priceEl) return null;

                const priceText = priceEl.innerText.replace(/[₹,]/g, '');
                if (isNaN(parseInt(priceText))) return null;

                return {
                    title: titleEl.innerText.trim(),
                    price: parseInt(priceText),
                    image: imageEl ? (imageEl.src || imageEl.getAttribute('data-src')) : '',
                    rating: '4.4',
                    url: linkEl ? (linkEl.href.startsWith('http') ? linkEl.href : 'https://www.flipkart.com' + linkEl.getAttribute('href')) : 'https://flipkart.com'
                };
            }).filter(p => p !== null && p.title.length > 5).slice(0, 10);
        });

        if (products.length === 0) {
            await page.screenshot({ path: 'flipkart_debug.png' });
        }

        return products;
    } catch (err) {
        console.error('Flipkart scrape error:', err);
        return [];
    } finally {
        await browser.close();
    }
}

const fs = require('fs');
const LOG_FILE = path.join(__dirname, 'server.log');
function logToFile(msg) {
    const time = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${time}] ${msg}\n`);
    console.log(msg);
}

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query parameter' });

    logToFile(`[SERVER] Searching for: ${query}`);

    try {
        const [amazon, flipkart] = await Promise.all([
            scrapeAmazon(query).catch(e => { logToFile(`[AMAZON ERROR] ${e}`); return []; }),
            scrapeFlipkart(query).catch(e => { logToFile(`[FLIPKART ERROR] ${e}`); return []; })
        ]);

        logToFile(`[SERVER] Found ${amazon.length} from Amazon and ${flipkart.length} from Flipkart.`);
        res.json({ amazon, flipkart });
    } catch (error) {
        logToFile(`[SERVER ERROR] ${error}`);
        res.status(500).json({ error: 'Scraping failed' });
    }
});

app.get('/api/debug', (req, res) => {
    const amazonPath = path.join(__dirname, 'amazon_debug.png');
    const flipkartPath = path.join(__dirname, 'flipkart_debug.png');
    
    if (fs.existsSync(amazonPath)) return res.sendFile(amazonPath);
    if (fs.existsSync(flipkartPath)) return res.sendFile(flipkartPath);
    
    res.send('No debug screenshots available. Trigger a search first.');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});

// To keep the process alive in environments where app.listen might not block
setInterval(() => {}, 60000);
