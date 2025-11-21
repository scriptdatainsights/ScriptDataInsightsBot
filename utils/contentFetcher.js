const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { scrapeSocial } = require('./scrapers');

const parser = new Parser();
const dataPath = path.join(__dirname, '../data/latest_posts.json');

/**
 * Fetches the latest post for a given platform.
 * @param {string} platform - The platform to fetch from (e.g., 'youtube', 'x', 'linkedin').
 * @returns {Promise<{platform: string, title: string, link: string, date: Date}|null>}
 */
const fetchLatest = async (platform) => {
    // 1. CHECK MANUAL OVERRIDE FIRST
    try {
        if (fs.existsSync(dataPath)) {
            const fileContent = fs.readFileSync(dataPath, 'utf8');
            const manualData = JSON.parse(fileContent);
            if (manualData[platform] && manualData[platform].link) {
                let title = `Latest ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`;

                try {
                    const response = await axios.get(manualData[platform].link, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 5000
                    });
                    const $ = cheerio.load(response.data);

                    // Try Open Graph title first (better for social media)
                    let pageTitle = $('meta[property="og:title"]').attr('content') ||
                        $('meta[name="twitter:title"]').attr('content') ||
                        $('title').text().trim();

                    if (pageTitle) {
                        // Clean up the title (remove site name suffixes)
                        pageTitle = pageTitle.split('|')[0].trim();
                        pageTitle = pageTitle.split(' - ')[0].trim();
                        title = pageTitle.length > 100 ? pageTitle.substring(0, 97) + '...' : pageTitle;
                    }
                } catch (err) {
                    console.log(`Could not fetch title for ${platform}, using default`);
                }

                return {
                    platform,
                    title: title,
                    link: manualData[platform].link,
                    date: manualData[platform].date
                };
            }
        }
    } catch (err) {
        console.error('Error reading manual data:', err);
    }

    // 2. PROCEED TO AUTO-FETCH IF NO MANUAL ENTRY
    const url = config.profiles[platform];
    if (!url) return null;

    try {
        // BLOGGER
        if (platform === 'blogger') {
            const feed = await parser.parseURL(config.rss_feeds[0]);
            return feed.items.length ? { platform, title: feed.items[0].title, link: feed.items[0].link, date: feed.items[0].pubDate } : null;
        }
        // TUMBLR
        else if (platform === 'tumblr') {
            const feed = await parser.parseURL(`${url}/rss`);
            return feed.items.length ? { platform, title: feed.items[0].title, link: feed.items[0].link, date: feed.items[0].pubDate } : null;
        }
        // YOUTUBE
        else if (platform === 'youtube') {
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(response.data);
            const rssLink = $('link[type="application/rss+xml"]').attr('href');
            if (rssLink) {
                const feed = await parser.parseURL(rssLink);
                return feed.items.length ? { platform, title: feed.items[0].title, link: feed.items[0].link, date: feed.items[0].pubDate } : null;
            }
        }
        // BLUESKY
        else if (platform === 'bluesky') {
            const handle = url.split('/profile/')[1]?.split('/')[0];
            if (!handle) return null;
            const apiEndpoint = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=1`;
            const response = await axios.get(apiEndpoint);
            if (response.data.feed && response.data.feed.length > 0) {
                const post = response.data.feed[0].post;
                return {
                    platform,
                    title: post.record.text.substring(0, 100) + '...',
                    link: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
                    date: post.record.createdAt
                };
            }
        }
        // TWITTER / X
        else if (platform === 'x') {
            // Try API first if token exists
            if (process.env.TWITTER_BEARER_TOKEN) {
                try {
                    const username = 'insightsbysd';
                    const userResp = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
                        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
                    });
                    const userId = userResp.data.data.id;
                    const tweets = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5`, {
                        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
                    });
                    const tweet = tweets.data.data[0];
                    const cleanTitle = tweet.text.length > 100 ? tweet.text.substring(0, 97) + '...' : tweet.text;
                    return { platform, title: cleanTitle, link: `https://twitter.com/${username}/status/${tweet.id}`, date: new Date() };
                } catch (e) {
                    console.log('Twitter API failed, trying scraper...');
                }
            }
            // Fallback to Scraper
            const profileUrl = config.profiles[platform];
            if (profileUrl) {
                return await scrapeSocial(profileUrl, platform);
            }
        }
        // LINKEDIN / THREADS
        else if (platform === 'linkedin' || platform === 'threads') {
            const profileUrl = config.profiles[platform];
            if (profileUrl) {
                return await scrapeSocial(profileUrl, platform);
            }
        }
        // FACEBOOK / INSTAGRAM
        else if (platform === 'facebook' || platform === 'instagram') {
            // Try API first
            if (process.env.FB_ACCESS_TOKEN && process.env.FB_PAGE_ID) {
                try {
                    const fields = 'message,permalink_url,created_time';
                    const fbUrl = `https://graph.facebook.com/v19.0/${process.env.FB_PAGE_ID}/feed?fields=${fields}&access_token=${process.env.FB_ACCESS_TOKEN}&limit=1`;
                    const resp = await axios.get(fbUrl);
                    const post = resp.data.data[0];
                    return { platform, title: post.message || 'New Post', link: post.permalink_url, date: post.created_time };
                } catch (e) {
                    console.log('FB API failed, trying scraper...');
                }
            }

            // Fallback to Scraper
            const profileUrl = config.profiles[platform];
            if (profileUrl) {
                return await scrapeSocial(profileUrl, platform);
            }
        }
    } catch (e) {
        console.error(`Failed to fetch ${platform}: ${e.message}`);
        return null;
    }
    return null;
};

module.exports = { fetchLatest };
