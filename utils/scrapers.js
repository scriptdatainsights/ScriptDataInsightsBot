const puppeteer = require('puppeteer');

/**
 * Scrapes the latest post from a public Facebook or Instagram page.
 * @param {string} url - The URL of the public page (e.g., https://www.facebook.com/pageID).
 * @param {string} platform - 'facebook', 'instagram', 'x', 'linkedin', 'threads'.
 * @returns {Promise<{title: string, link: string, date: Date}|null>}
 */
const scrapeSocial = async (url, platform) => {
    console.log(`Scraping ${platform} at ${url}...`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();

        // Set a realistic User-Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        let result = null;

        if (platform === 'facebook') {
            // Facebook logic
            try {
                await page.waitForSelector('div[role="article"]', { timeout: 5000 });
                result = await page.evaluate(() => {
                    const firstPost = document.querySelector('div[role="article"]');
                    if (!firstPost) return null;
                    const textElement = firstPost.querySelector('div[dir="auto"]');
                    const title = textElement ? textElement.innerText.split('\n')[0] : 'New Facebook Post';
                    const linkElement = firstPost.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
                    let link = linkElement ? linkElement.href : null;
                    if (link && link.includes('?')) link = link.split('?')[0];
                    return link ? { title, link, date: new Date() } : null;
                });
            } catch (e) {
                console.log('Facebook selector failed.');
            }
        } else if (platform === 'instagram') {
            // Instagram logic
            try {
                await page.waitForSelector('article a[href^="/p/"]', { timeout: 5000 });
                result = await page.evaluate(() => {
                    const firstPostLink = document.querySelector('article a[href^="/p/"]');
                    if (!firstPostLink) return null;
                    const link = firstPostLink.href;
                    const title = 'New Instagram Post';
                    return { title, link, date: new Date() };
                });
            } catch (e) {
                console.log('Instagram selector failed.');
            }
        } else if (platform === 'x') {
            // X (Twitter) logic
            try {
                await page.waitForSelector('article[data-testid="tweet"]', { timeout: 5000 });
                result = await page.evaluate(() => {
                    const tweet = document.querySelector('article[data-testid="tweet"]');
                    if (!tweet) return null;
                    const text = tweet.innerText.split('\n').join(' ').substring(0, 100);
                    const timeElement = tweet.querySelector('time');
                    const linkElement = timeElement ? timeElement.closest('a') : null;
                    const link = linkElement ? linkElement.href : null;
                    return link ? { title: text, link, date: new Date() } : null;
                });
            } catch (e) {
                console.log('X selector failed.');
            }
        } else if (platform === 'linkedin') {
            // LinkedIn logic
            try {
                await page.waitForSelector('.main-content', { timeout: 5000 });
                result = await page.evaluate(() => {
                    const post = document.querySelector('.profile-creator-shared-feed-update__container');
                    if (!post) return null;
                    const text = post.innerText.split('\n')[0];
                    const linkElement = post.querySelector('a.app-aware-link');
                    const link = linkElement ? linkElement.href : window.location.href;
                    return { title: text || 'New LinkedIn Post', link, date: new Date() };
                });
            } catch (e) {
                console.log('LinkedIn selector failed.');
            }
        } else if (platform === 'threads') {
            // Threads logic
            try {
                await page.waitForSelector('div[data-pressable-container="true"]', { timeout: 5000 });
                result = await page.evaluate(() => {
                    const post = document.querySelector('div[data-pressable-container="true"]');
                    if (!post) return null;
                    const text = post.innerText.split('\n')[0];
                    return { title: text || 'New Threads Post', link: window.location.href, date: new Date() };
                });
            } catch (e) {
                console.log('Threads selector failed.');
            }
        }

        return result;

    } catch (error) {
        console.error(`Scraper error for ${platform}:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { scrapeSocial };
