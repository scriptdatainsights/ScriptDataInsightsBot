const fs = require('fs');
const path = require('path');

const shortsFile = path.join(__dirname, '../data/youtube_shorts_source.json');
const videosFile = path.join(__dirname, '../data/youtube_videos_source.json');
const outputFile = path.join(__dirname, '../data/youtube_data.json');

const processData = () => {
    try {
        console.log('Reading YouTube data files...');

        let allContent = [];

        if (fs.existsSync(shortsFile)) {
            const shortsData = JSON.parse(fs.readFileSync(shortsFile, 'utf8'));
            allContent = allContent.concat(shortsData);
            console.log(`Loaded ${shortsData.length} items from shorts file.`);
        }

        if (fs.existsSync(videosFile)) {
            const videosData = JSON.parse(fs.readFileSync(videosFile, 'utf8'));
            allContent = allContent.concat(videosData);
            console.log(`Loaded ${videosData.length} items from videos file.`);
        }

        // Clean and map data
        const cleanedData = allContent.map(item => ({
            id: item.id,
            title: item.title,
            url: item.url,
            type: item.type || (item.url.includes('/shorts/') ? 'shorts' : 'video'),
            views: item.viewCount || 0,
            likes: item.likes || 0,
            date: item.date,
            thumbnail: item.thumbnailUrl
        }));

        // Remove duplicates based on ID
        const uniqueData = Array.from(new Map(cleanedData.map(item => [item.id, item])).values());

        // Ensure data directory exists
        const dataDir = path.dirname(outputFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(outputFile, JSON.stringify(uniqueData, null, 2));
        console.log(`Successfully processed and saved ${uniqueData.length} unique items to ${outputFile}`);

    } catch (error) {
        console.error('Error processing YouTube data:', error);
    }
};

// Execute if run directly
if (require.main === module) {
    processData();
}

module.exports = { processData };
