const puppeteer = require('puppeteer');

/**
 * Scrapes the latest post from a public Facebook or Instagram page.
 * @param {string} url - The URL of the public page (e.g., https://www.facebook.com/pageID).
 * @param {string} platform - 'facebook', 'instagram', 'x', 'linkedin', 'threads'.
 * @returns {Promise<{title: string, link: string, date: Date}|null>}
 */
const scrapeSocial = async (url, platform) => {
    // Wrapper for single scrape using the batch logic (inefficient but compatible)
    const results = await scrapeAll([{ url, platform }]);
    return results[0] || null;
};

/**
 * Scrapes multiple platforms using a single browser instance to save memory.
 * @param {Array<{url: string, platform: string}>} targets 
 * @returns {Promise<Array<{title: string, link: string, date: Date}|null>>}
 */
const scrapeAll = async (targets) => {
    console.log(`Starting batch scrape for ${targets.length} targets...`);
    let browser;
    const results = [];

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-notifications'
            ],
            ignoreHTTPSErrors: true
        });

        // Process sequentially to be safe on memory, but reuse the browser
        for (const target of targets) {
            const { url, platform } = target;
            console.log(`Scraping ${platform} at ${url}...`);

            let page;
            try {
                page = await browser.newPage();

                // Set a realistic User-Agent
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

                // Block heavy resources
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                const pageTitle = await page.title();
                console.log(`Page Title for ${platform}: ${pageTitle}`);

                let result = null;

                if (platform === 'facebook') {
                    try {
                        if (pageTitle.includes('Log In') || pageTitle.includes('Log into')) {
                            console.log('Facebook login wall detected.');
                        } else {
                            await new Promise(r => setTimeout(r, 2000));
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
                        }
                    } catch (e) { console.log('Facebook selector failed.'); }
                } else if (platform === 'instagram') {
                    try {
                        if (pageTitle.includes('Login')) {
                            console.log('Instagram login wall detected.');
                        } else {
                            await new Promise(r => setTimeout(r, 2000));
                            result = await page.evaluate(() => {
                                const firstPostLink = document.querySelector('article a[href^="/p/"]') || document.querySelector('main a[href^="/p/"]');
                                if (!firstPostLink) return null;
                                const link = firstPostLink.href;
                                const title = 'New Instagram Post';
                                return { title, link, date: new Date() };
                            });
                        }
                    } catch (e) { console.log('Instagram selector failed.'); }
                } else if (platform === 'x') {
                    try {
                        await new Promise(r => setTimeout(r, 2000));
                        result = await page.evaluate(() => {
                            const tweet = document.querySelector('article[data-testid="tweet"]');
                            if (!tweet) return null;
                            const text = tweet.innerText.split('\n').join(' ').substring(0, 100);
                            const timeElement = tweet.querySelector('time');
                            const linkElement = timeElement ? timeElement.closest('a') : null;
                            const link = linkElement ? linkElement.href : null;
                            return link ? { title: text, link, date: new Date() } : null;
                        });
                    } catch (e) { console.log('X selector failed.'); }
                } else if (platform === 'linkedin') {
                    try {
                        await new Promise(r => setTimeout(r, 2000));
                        result = await page.evaluate(() => {
                            const post = document.querySelector('.profile-creator-shared-feed-update__container') || document.querySelector('.feed-shared-update-v2');
                            if (!post) return null;
                            const text = post.innerText.split('\n')[0];
                            const linkElement = post.querySelector('a.app-aware-link');
                            const link = linkElement ? linkElement.href : window.location.href;
                            return { title: text || 'New LinkedIn Post', link, date: new Date() };
                        });
                    } catch (e) { console.log('LinkedIn selector failed.'); }
                } else if (platform === 'threads') {
                    try {
                        await new Promise(r => setTimeout(r, 2000));
                        result = await page.evaluate(() => {
                            const links = Array.from(document.querySelectorAll('a[href*="/post/"]'));
                            if (links.length === 0) return null;
                            const link = links[0].href;
                            const text = links[0].innerText || 'New Threads Post';
                            return { title: text, link: link, date: new Date() };
                        });
                    } catch (e) { console.log('Threads selector failed.'); }
                }

                if (result) {
                    result.platform = platform; // Ensure platform is attached
                    results.push(result);
                } else {
                    results.push(null);
                }

            } catch (error) {
                console.error(`Scraper error for ${platform}:`, error.message);
                results.push(null);
            } finally {
                if (page) await page.close();
            }
        }

    } catch (error) {
        console.error('Browser launch error:', error);
    } finally {
        if (browser) await browser.close();
    }

    return results;
};

module.exports = { scrapeSocial, scrapeAll };
