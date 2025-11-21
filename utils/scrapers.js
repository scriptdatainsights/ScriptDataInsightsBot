const puppeteer = require('puppeteer');

/**
 * Scrapes the latest post from a public Facebook or Instagram page.
 * @param {string} url - The URL of the public page (e.g., https://www.facebook.com/pageID).
 * @param {string} platform - 'facebook' or 'instagram'.
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
            // Facebook logic: Look for the first post container
            // Note: Selectors are fragile and change often. This is a best-effort attempt.
            try {
                // Wait for any post content to load
                await page.waitForSelector('div[role="article"]', { timeout: 5000 });

                result = await page.evaluate(() => {
                    const firstPost = document.querySelector('div[role="article"]');
                    if (!firstPost) return null;

                    // Try to find the post text
                    const textElement = firstPost.querySelector('div[dir="auto"]');
                    const title = textElement ? textElement.innerText.split('\n')[0] : 'New Facebook Post';

                    // Try to find the post link (usually the timestamp link)
                    const linkElement = firstPost.querySelector('a[href*="/posts/"], a[href*="/permalink/"]');
                    let link = linkElement ? linkElement.href : null;

                    // Clean up link
                    if (link && link.includes('?')) link = link.split('?')[0];

                    return link ? { title, link, date: new Date() } : null;
                });
            } catch (e) {
                console.log('Facebook selector failed, trying fallback...');
            }
        } else if (platform === 'instagram') {
            // Instagram logic
            try {
                await page.waitForSelector('article a[href^="/p/"]', { timeout: 5000 });

                result = await page.evaluate(() => {
                    const firstPostLink = document.querySelector('article a[href^="/p/"]');
                    if (!firstPostLink) return null;

                    const link = firstPostLink.href;
                    // Instagram doesn't easily show text in the grid view, so we use a generic title
                    const title = 'New Instagram Post';

                    return { title, link, date: new Date() };
                });
            } catch (e) {
                console.log('Instagram selector failed.');
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
