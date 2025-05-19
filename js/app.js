// Configuration
const markdownPath = 'markdown/';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a specific bulletin to display
    const params = new URLSearchParams(window.location.search);
    const bulletinId = params.get('bulletin');
    
    if (bulletinId) {
        loadBulletin(bulletinId);
    } else {
        loadBulletinList();
    }

    // Configure marked options for better rendering
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true
    });
});

// Create a custom renderer for Markdown
function createCustomRenderer() {
    const renderer = new marked.Renderer();
    
    // Customize code block rendering to use collapsible sections
    renderer.code = function(code, language) {
        const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
        return `
        <button class="code-toggle-btn" onclick="toggleCode('${uniqueId}')">Klik untuk melihat/sembunyikan detail</button>
        <div id="${uniqueId}-content" class="code-expanded">
            <pre><code class="language-${language || 'text'}">${code}</code></pre>
        </div>`;
    };
    
    return renderer;
}

// Function to toggle code visibility
function toggleCode(id) {
    const contentElement = document.getElementById(`${id}-content`);
    const buttonElement = document.querySelector(`[onclick="toggleCode('${id}')"]`);
    
    if (contentElement.classList.contains('code-expanded')) {
        contentElement.classList.replace('code-expanded', 'code-collapsed');
        buttonElement.classList.add('collapsed');
    } else {
        contentElement.classList.replace('code-collapsed', 'code-expanded');
        buttonElement.classList.remove('collapsed');
    }
}

// Load the list of available bulletins
async function loadBulletinList() {
    try {
        const response = await fetch('markdown-list.json');
        const bulletins = await response.json();
        
        displayBulletinList(bulletins);
    } catch (error) {
        console.error('Error loading bulletin list:', error);
        document.getElementById('bulletins').innerHTML = '<li>Error loading bulletins. Please try again later.</li>';
    }
}

// Display the list of bulletins
function displayBulletinList(bulletins) {
    const bulletinList = document.getElementById('bulletins');
    bulletinList.innerHTML = '';
    
    if (bulletins.length === 0) {
        bulletinList.innerHTML = '<li>No bulletins available</li>';
        return;
    }
    
    // Sort bulletins by date (filename) in descending order
    bulletins.sort((a, b) => b.localeCompare(a));
    
    bulletins.forEach(filename => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${filename}`;
        
        // Format the date from YYYYMMDD.md to a readable format
        const dateMatch = filename.match(/^(\d{4})(\d{2})(\d{2})\.md$/);
        let displayText = filename;
        
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2];
            const day = dateMatch[3];
            
            const date = new Date(year, month - 1, day);
            displayText = date.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        link.textContent = displayText;
        link.onclick = (e) => {
            e.preventDefault();
            loadBulletin(filename);
            history.pushState(null, '', `?bulletin=${filename}`);
        };
        
        li.appendChild(link);
        bulletinList.appendChild(li);
    });
    
    document.getElementById('bulletin-list').style.display = 'block';
    document.getElementById('bulletin-content').style.display = 'none';
}

// Load a specific bulletin
async function loadBulletin(filename) {
    try {
        const response = await fetch(`${markdownPath}/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load bulletin: ${response.status}`);
        }
        const markdownContent = await response.text();
        displayBulletin(markdownContent, filename);
    } catch (error) {
        console.error('Error loading bulletin:', error);
        document.getElementById('content').innerHTML = `
            <h2>Error</h2>
            <p>Failed to load the bulletin. Please try again later.</p>
        `;
        document.getElementById('bulletin-list').style.display = 'none';
        document.getElementById('bulletin-content').style.display = 'block';
    }
}

// Display a bulletin
function displayBulletin(markdownContent, filename) {
    document.getElementById('bulletin-list').style.display = 'none';
    document.getElementById('bulletin-content').style.display = 'block';
    
    // Format the date from filename
    const dateMatch = filename.match(/^(\d{4})(\d{2})(\d{2})\.md$/);
    let dateDisplay = '';
    
    if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2];
        const day = dateMatch[3];
        
        const date = new Date(year, month - 1, day);
        dateDisplay = `<div class="date-display">${date.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>`;
    }
    
    // Process the markdown content with default marked settings
    const htmlContent = marked.parse(markdownContent);
    
    // Insert into DOM
    document.getElementById('content').innerHTML = dateDisplay + htmlContent;
    
    // Post-process to convert code blocks to collapsible sections
    convertCodeBlocksToCollapsible();
    
    // After content is loaded, adjust formatting
    adjustContentFormatting();
}

// Function to convert code blocks to collapsible sections
function convertCodeBlocksToCollapsible() {
    const preElements = document.querySelectorAll('#content pre');
    
    preElements.forEach((preEl, index) => {
        const uniqueId = 'code-' + index;
        const codeContent = preEl.outerHTML;
        
        // Create wrapper for the collapsible content
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <button class="code-toggle-btn collapsed" onclick="toggleCode('${uniqueId}')">Tampilkan teks lirik / ayat</button>
            <div id="${uniqueId}-content" class="code-collapsed">
                ${codeContent}
            </div>
        `;
        
        // Replace the pre element with our wrapper
        preEl.replaceWith(wrapper);
    });
    
    // Make toggleCode accessible globally
    window.toggleCode = toggleCode;
}

// Function to adjust formatting for better display
function adjustContentFormatting() {
    // Fix code blocks
    const preElements = document.querySelectorAll('#content pre');
    preElements.forEach(preEl => {
        const codeEl = preEl.querySelector('code');
        if (codeEl) {
            // Make sure it uses regular font, not monospace
            codeEl.style.fontFamily = 'inherit';
            codeEl.style.whiteSpace = 'pre-wrap';
            codeEl.style.wordWrap = 'break-word';
        }
        
        // Add text-box class to all pre elements
        preEl.classList.add('text-box');
    });
    
    // Ensure proper list indentation
    const listItems = document.querySelectorAll('#content ol > li');
    listItems.forEach(li => {
        // Make sure list items display properly
        li.style.display = 'list-item';
        
        // Ensure first paragraph in list item is inline
        const firstParagraph = li.querySelector('p:first-child');
        if (firstParagraph) {
            firstParagraph.style.display = 'inline';
            firstParagraph.style.marginTop = '0';
        }
    });
}

// Show the bulletin list
function showBulletinList() {
    document.getElementById('bulletin-list').style.display = 'block';
    document.getElementById('bulletin-content').style.display = 'none';
    history.pushState(null, '', window.location.pathname);
}

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const bulletinId = params.get('bulletin');
    
    if (bulletinId) {
        loadBulletin(bulletinId);
    } else {
        showBulletinList();
    }
});
