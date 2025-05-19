const fs = require('fs');
const path = require('path');

// Path to the markdown folder
const markdownDir = path.join(__dirname, '..', 'markdown');

// Path to the markdown-list.json file
const markdownListPath = path.join(__dirname, '..', 'markdown-list.json');

// Get all markdown files
try {
    const files = fs.readdirSync(markdownDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    // Write to the markdown-list.json file
    fs.writeFileSync(markdownListPath, JSON.stringify(markdownFiles, null, 2));
    
    console.log(`Updated markdown-list.json with ${markdownFiles.length} bulletins.`);
} catch (error) {
    console.error('Error updating markdown list:', error);
    process.exit(1);
}
