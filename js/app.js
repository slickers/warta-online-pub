// Configuration
const markdownPath = 'markdown/';
const songsPath = 'markdown/songs/'; // Path to the songs folder
const biblePath = 'markdown/bible/'; // Path to the bible folder


// Initialize Marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
});

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const bulletinId = params.get('bulletin');
    const staticPageId = params.get('page');

    if (bulletinId) {
        loadBulletin(bulletinId);
    } else if (staticPageId) {
        loadStaticPage(`${staticPageId}.md`);
    } else {
        loadBulletinList();
    }
});

// Load a static page
async function loadStaticPage(filename) {
    try {
        const response = await fetch(`${markdownPath}/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${response.status}`);
        }
        const markdownContent = await response.text();
        document.getElementById('bulletin-list').style.display = 'none';
        document.getElementById('bulletin-content').style.display = 'block';
        
        // No song processing for static pages, just parse and display
        document.getElementById('content').innerHTML = marked.parse(markdownContent);
        
        // Ensure collapsible elements in static pages (if any) work
        convertCodeBlocksToCollapsible(); 
        adjustContentFormatting(); 
        history.pushState(null, '', `?page=${filename.replace('.md', '')}`);
    } catch (error) {
        console.error('Error loading static page:', error);
        document.getElementById('content').innerHTML = `
            <h2>Error</h2>
            <p>Gagal memuat halaman. Silakan coba lagi nanti.</p>
        `;
        document.getElementById('bulletin-list').style.display = 'none';
        document.getElementById('bulletin-content').style.display = 'block';
    }
}

// Global function to toggle code visibility (used by onclick)
window.toggleCode = function(id) {
    const contentElement = document.getElementById(`${id}-content`);
    const buttonElement = document.querySelector(`[onclick="toggleCode('${id}')"]`);
    
    if (contentElement.classList.contains('code-expanded')) {
        contentElement.classList.replace('code-expanded', 'code-collapsed');
        buttonElement.classList.add('collapsed');
    } else {
        contentElement.classList.replace('code-collapsed', 'code-expanded');
        buttonElement.classList.remove('collapsed');
    }
};

// Parses song content and extracts specific verses
function parseSongVerses(songContent, requestedVerses) {
    console.log("--- START parseSongVerses ---");
    console.log("Song Content (raw, first 200 chars):", songContent.substring(0, 200) + (songContent.length > 200 ? "..." : "")); 
    console.log("Requested Verses (input):", requestedVerses);

    const lines = songContent.split('\n');
    let verses = [];
    let refrainContent = '';
    let currentVerseNumber = '';
    let currentVerseLines = [];

    const cleanLines = (linesArray) => {
        return linesArray
            .filter(line => line.trim().length > 0)
            .map(line => line.trimEnd());
    };

    // First pass: extract Refrain and all verses
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Regex for flexible "Reff" matching (with or without space before colon)
        if (trimmedLine.toLowerCase().match(/^reff\s*:/)) {
            console.log(`[parseSongVerses] FOUND REFF marker at line ${i+1}: "${line.trim()}"`); // Debug: Found Reff
            refrainContent = ''; // Reset for new refrain
            let j = i + 1;
            // Collect lines until empty line or new verse/reff
            while (j < lines.length && !lines[j].trim().match(/^\d+\./i) && !lines[j].trim().toLowerCase().match(/^reff\s*:/)) {
                 // Check if line is not empty or just whitespace before adding
                if (lines[j].trim().length > 0) {
                    refrainContent += lines[j] + '\n';
                }
                j++;
            }
            refrainContent = refrainContent.trim(); // Trim trailing whitespace
            console.log("[parseSongVerses] Extracted Refrain Content (first 100 chars):", refrainContent.substring(0, 100) + (refrainContent.length > 100 ? "..." : "")); // Debug: Refrain content
            i = j - 1; // Adjust i to skip lines that were just processed for refrain
        } else {
            const verseMatch = trimmedLine.match(/^(\d+)\./); 
            if (verseMatch) {
                // If we were collecting a previous verse, save it
                if (currentVerseNumber !== '') {
                    verses.push({ number: currentVerseNumber, content: cleanLines(currentVerseLines).join('<br>') }); // <-- Pastikan ini <br>
                    console.log(`[parseSongVerses] Pushed Verse ${currentVerseNumber}:`, verses[verses.length - 1].content.substring(0, 100) + (verses[verses.length - 1].content.length > 100 ? "..." : "")); // Debug: Pushed verse
                }
                currentVerseNumber = verseMatch[1];
                currentVerseLines = []; // Reset for new verse
                console.log(`[parseSongVerses] Starting new verse collection for ${currentVerseNumber}.`); // Debug: New verse
            } else if (trimmedLine.length > 0) { // Only add if line is not empty or just whitespace
                // Collect lines for the current verse
                currentVerseLines.push(line);
            }
        }
    }
    // Add the last collected verse
    if (currentVerseNumber !== '') {
        verses.push({ number: currentVerseNumber, content: cleanLines(currentVerseLines).join('<br>') }); // <-- Pastikan ini <br>
        console.log(`[parseSongVerses] Pushed last Verse ${currentVerseNumber}:`, verses[verses.length - 1].content.substring(0, 100) + (verses[verses.length - 1].content.length > 100 ? "..." : "")); // Debug: Last verse
    }

    console.log("[parseSongVerses] All Parsed Verses Array:", verses); // Debug: All verses
    console.log("[parseSongVerses] Final Refrain Content (after parsing):", refrainContent.substring(0, 100) + (refrainContent.length > 100 ? "..." : "")); // Debug: Refrain content

    let finalLyricsHtml = []; 

    // Process requested verses
    if (requestedVerses.length > 0) {
        console.log("[parseSongVerses] Processing specific requested verses..."); // Debug
        for (const req of requestedVerses) {
            const lowerReq = req.toLowerCase();
            console.log(`[parseSongVerses] Processing request: "${req}"`); // Debug: Current request

            if (lowerReq === 'reff') {
                if (refrainContent) { // Hanya tambahkan jika refrainContent tidak kosong
            finalLyricsHtml.push(`<div><b>Reff :</b><br>${refrainContent.split('\n').join('<br>')}</div>`);
                    console.log("[parseSongVerses] Added Reff to final HTML."); // Debug: Added Reff
                } else {
                    console.warn("[parseSongVerses] Requested 'Reff' but refrainContent is empty!"); // Debug: Warn empty Reff
                }
            } else if (lowerReq.startsWith('kembali ke reff')) {
                finalLyricsHtml.push(`<div><i>Kembali ke Reff.</i></div>`); // Teks instruksi
                console.log("[parseSongVerses] Added 'Kembali ke Reff' to final HTML."); // Debug: Added Kembali ke Reff
            } else {
                const verse = verses.find(v => v.number === req);
                if (verse) {
                    finalLyricsHtml.push(`<div><b>${verse.number}.</b><br>${verse.content}</div>`); // <-- verse.content sudah HTML, tidak perlu split/join
                    console.log(`[parseSongVerses] Added Verse ${verse.number} to final HTML.`); // Debug: Added Verse
                } else {
                    console.warn(`[parseSongVerses] Requested verse "${req}" not found!`); // Debug: Warn verse not found
                }
            }
        }
    } else { // If no specific verses requested, show Refrain if exists, then all verses
        console.log("[parseSongVerses] No specific verses requested, adding all verses and refrain."); // Debug
        if (refrainContent) {
        finalLyricsHtml.push(`<div><b>Reff :</b><br>${refrainContent.split('\n').join('<br>')}</div>`);
        }
        verses.forEach(verse => {
            finalLyricsHtml.push(`<div><b>${verse.number}.</b><br>${verse.content}</div>`); // <-- verse.content sudah HTML, tidak perlu split/join
        });
    }

    console.log("[parseSongVerses] Final HTML array:", finalLyricsHtml); // Debug: Final HTML array
    console.log("--- END parseSongVerses ---");
    return finalLyricsHtml.join(''); // Menggabungkan dengan string kosong
}

// Parses Bible content and extracts specific verses
function parseBibleVerses(bibleContent, requestedVerses) {
    console.log("--- START parseBibleVerses ---");
    console.log("Bible Content (raw, first 200 chars):", bibleContent.substring(0, 200) + (bibleContent.length > 200 ? "..." : ""));
    console.log("Requested Verses (input):", requestedVerses);

    const lines = bibleContent.split('\n');
    let verses = [];
    let currentVerseNumber = '';
    let currentVerseLines = [];

    const cleanLines = (linesArray) => {
        return linesArray
            .filter(line => line.trim().length > 0)
            .map(line => line.trimEnd());
    };

    // First pass: extract all verses
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        const verseMatch = trimmedLine.match(/^(\d+)\./);
        if (verseMatch) {
            // If we were collecting a previous verse, save it
            if (currentVerseNumber !== '') {
                verses.push({ number: parseInt(currentVerseNumber), content: cleanLines(currentVerseLines).join('<br>') });
                console.log(`[parseBibleVerses] Pushed Verse ${currentVerseNumber}:`, verses[verses.length - 1].content.substring(0, 100) + (verses[verses.length - 1].content.length > 100 ? "..." : ""));
            }
            currentVerseNumber = verseMatch[1];
            currentVerseLines = []; // Reset for new verse
            console.log(`[parseBibleVerses] Starting new verse collection for ${currentVerseNumber}.`);
        } else if (trimmedLine.length > 0) {
            // Collect lines for the current verse
            currentVerseLines.push(line);
        }
    }
    // Add the last collected verse
    if (currentVerseNumber !== '') {
        verses.push({ number: parseInt(currentVerseNumber), content: cleanLines(currentVerseLines).join('<br>') });
        console.log(`[parseBibleVerses] Pushed last Verse ${currentVerseNumber}:`, verses[verses.length - 1].content.substring(0, 100) + (verses[verses.length - 1].content.length > 100 ? "..." : ""));
    }

    console.log("[parseBibleVerses] All Parsed Verses Array:", verses);

    let finalBibleHtml = [];

    // Process requested verses
    if (requestedVerses.length > 0) {
        console.log("[parseBibleVerses] Processing specific requested verses...");
        for (const req of requestedVerses) {
            console.log(`[parseBibleVerses] Processing request: "${req}"`);
            
            // Handle verse ranges (e.g., "1-5")
            const rangeMatch = req.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
                const startVerse = parseInt(rangeMatch[1]);
                const endVerse = parseInt(rangeMatch[2]);
                console.log(`[parseBibleVerses] Requesting range from ${startVerse} to ${endVerse}`);
                for (let i = startVerse; i <= endVerse; i++) {
                    const verse = verses.find(v => v.number === i);
                    if (verse) {
                        finalBibleHtml.push(`<div><b>${verse.number}.</b> ${verse.content}</div>`); // Tanpa <br> setelah nomor ayat, nomor ayat dan teks menyatu
                        console.log(`[parseBibleVerses] Added Verse ${verse.number} (from range) to final HTML.`);
                    } else {
                        console.warn(`[parseBibleVerses] Verse ${i} (from range) not found!`);
                    }
                }
            } else { // Handle single verses (e.g., "1", "2")
                const verseNum = parseInt(req);
                const verse = verses.find(v => v.number === verseNum);
                if (verse) {
                    finalBibleHtml.push(`<div><b>${verse.number}.</b> ${verse.content}</div>`); // Tanpa <br> setelah nomor ayat, nomor ayat dan teks menyatu
                    console.log(`[parseBibleVerses] Added Verse ${verse.number} to final HTML.`);
                } else {
                    console.warn(`[parseBibleVerses] Requested verse "${req}" not found!`);
                }
            }
        }
    } else { // If no specific verses requested, show all verses
        console.log("[parseBibleVerses] No specific verses requested, adding all verses.");
        verses.forEach(verse => {
            finalBibleHtml.push(`<div><b>${verse.number}.</b> ${verse.content}</div>`);
        });
    }

    console.log("[parseBibleVerses] Final HTML array:", finalBibleHtml);
    console.log("--- END parseBibleVerses ---");
    return finalBibleHtml.join('');
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

// Display bulletin list
function displayBulletinList(bulletinsToDisplay) {
    const bulletinList = document.getElementById('bulletins');
    bulletinList.innerHTML = '';
    
    if (bulletinsToDisplay.length === 0) {
        bulletinList.innerHTML = '<li>Tidak ada warta yang tersedia atau sesuai pencarian.</li>';
        return;
    }
    
    bulletinsToDisplay.sort((a, b) => {
        const dateA = a.match(/^(\d{8})/)?.[1] || '';
        const dateB = b.match(/^(\d{8})/)?.[1] || '';
        if (dateB !== dateA) {
            return dateB.localeCompare(dateA);
        }

        const order = ['Enggano_Pagi', 'Enggano_Sore', 'Melur_Pagi', 'Melur_Sore', 'PKP', 'Kelompok']; 
        
        let indexA = order.length;
        let indexB = order.length;

        for (let i = 0; i < order.length; i++) {
            if (a.includes(order[i])) {
                indexA = i;
                break;
            }
        }
        for (let i = 0; i < order.length; i++) {
            if (b.includes(order[i])) {
                indexB = i;
                break;
            }
        }
        if (indexA !== indexB) {
            return indexA - indexB;
        }

        return a.localeCompare(b);
    });
    
    bulletinsToDisplay.forEach(filename => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${filename}`;
        
        let displayText = filename; 

        const ibadahMingguMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_(Enggano|Melur)_(Pagi|Sore)\.md$/);
        const kebaktianKelompokMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_([a-zA-Z0-9]+)_(\d{4})\.md$/);

        if (ibadahMingguMatch) {
            const [_, year, month, day, location, session] = ibadahMingguMatch;
            const date = new Date(year, month - 1, day);
            const formattedDate = date.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
            displayText = `Gereja XYZ ${location}, ${formattedDate}, Ibadah ${session}`;

        } else if (kebaktianKelompokMatch) {
            const [_, year, month, day, activityType, time] = kebaktianKelompokMatch;
            const date = new Date(year, month - 1, day);
            const formattedDate = date.toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });

            const formattedTime = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
            const readableActivityType = activityType.replace(/(\d+)$/, ' $1');

            displayText = `Ibadah ${readableActivityType}, ${formattedDate}, ${formattedTime}`;
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
        let markdownContent = await response.text(); // Use 'let' because we will modify it

        // Array untuk menyimpan semua promise (lagu dan alkitab)
        const allPromises = [];
        const allReplacements = []; // Array untuk menyimpan semua objek replacement

        // --- Process song linking ---
        const songPlaceholderRegex = /\[SONG:([a-zA-Z0-9_\/]+):?((?:[\d,]|reff|Reff|REFF)*)?\]/g;
        // PENTING: Reset lastIndex sebelum setiap penggunaan regex.exec dalam loop
        songPlaceholderRegex.lastIndex = 0; // <--- Perbaikan di sini
        let songMatch;
        let songMatches = [];
        while ((songMatch = songPlaceholderRegex.exec(markdownContent)) !== null) {
            songMatches.push(songMatch);
        }
        console.log(`[loadBulletin] Found ${songMatches.length} song placeholders.`);

        for (const m of songMatches) {
            const fullMatch = m[0];
            const songFileNameBase = m[1];
            const requestedVerses = m[2] ? m[2].split(',').map(v => v.trim()) : [];
            console.log(`[loadBulletin] Processing song placeholder: ${fullMatch}, Song: ${songFileNameBase}, Verses: ${requestedVerses.join(',')}`);

            allPromises.push( // Masukkan ke allPromises
                fetch(`${songsPath}${songFileNameBase}.md`)
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`[loadBulletin] Song file not found: ${songFileNameBase}.md (Status: ${response.status})`);
                            return `[Lirik lagu tidak ditemukan untuk ${songFileNameBase}]`;
                        }
                        return response.text();
                    })
                    .then(songContent => {
                        let parsedSongContent = parseSongVerses(songContent, requestedVerses);
                        const uniqueId = `song-${songFileNameBase.replace(/\//g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; // ID lebih unik
                        return {
                            fullMatch,
                            replacementHtml: `<div class="collapsible-song-lyrics">` +
                                `<button class="code-toggle-btn collapsed" onclick="toggleCode('${uniqueId}')">Tampilkan Lirik</button>` +
                                `<div id="${uniqueId}-content" class="code-collapsed song-lyrics-content">` +
                                `<div>${parsedSongContent}</div>` +
                                `</div></div>`
                        };
                    })
                    .catch(error => {
                        console.error(`[loadBulletin] Error loading song ${songFileNameBase}:`, error);
                        return { fullMatch, replacementHtml: `[Error memuat lirik lagu ${songFileNameBase}]` };
                    })
            );
        }

        // --- Process Bible linking ---
        const biblePlaceholderRegex = /\[BIBLE:([a-zA-Z0-9_\/]+):?([\d,-]*)?\]/g;
        // PENTING: Reset lastIndex sebelum setiap penggunaan regex.exec dalam loop
        biblePlaceholderRegex.lastIndex = 0; // <--- Perbaikan di sini
        let bibleMatch;
        let bibleMatches = [];
        while ((bibleMatch = biblePlaceholderRegex.exec(markdownContent)) !== null) {
            bibleMatches.push(bibleMatch);
        }
        console.log(`[loadBulletin] Found ${bibleMatches.length} bible placeholders.`);

        for (const m of bibleMatches) {
            const fullMatch = m[0];
            const bibleFileNameBase = m[1]; // e.g., "PB/Matius_1"
            const requestedVerses = m[2] ? m[2].split(',').map(v => v.trim()) : [];
            console.log(`[loadBulletin] Processing bible placeholder: ${fullMatch}, Book: ${bibleFileNameBase}, Verses: ${requestedVerses.join(',')}`);

            allPromises.push( // Masukkan ke allPromises
                fetch(`${biblePath}${bibleFileNameBase}.md`)
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`[loadBulletin] Bible file not found: ${bibleFileNameBase}.md (Status: ${response.status})`);
                            return `[Teks Alkitab tidak ditemukan untuk ${bibleFileNameBase}]`;
                        }
                        return response.text();
                    })
                    .then(bibleContent => {
                        let parsedBibleContent = parseBibleVerses(bibleContent, requestedVerses);
                        const [bookChapterPart] = bibleFileNameBase.split('/').slice(-1); // Ambil hanya bagian akhir "Matius_1"
                        const [bookNamePart, chapterNumPart] = bookChapterPart.split('_');
                        const bibleTitle = `${bookNamePart.replace(/_/g, ' ')} ${chapterNumPart}`;

                        const uniqueId = `bible-${bibleFileNameBase.replace(/\//g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; // ID lebih unik
                        return {
                            fullMatch,
                            replacementHtml: `<div class="collapsible-bible-text">` +
                                `<button class="code-toggle-btn collapsed" onclick="toggleCode('${uniqueId}')">Pembacaan ${bibleTitle}</button>` +
                                `<div id="${uniqueId}-content" class="code-collapsed bible-text-content">` +
                                `<div>${parsedBibleContent}</div>` +
                                `</div></div>`
                        };
                    })
                    .catch(error => {
                        console.error(`[loadBulletin] Error loading bible text ${bibleFileNameBase}:`, error);
                        return { fullMatch, replacementHtml: `[Error memuat teks Alkitab ${bibleFileNameBase}]` };
                    })
            );
        }
        // --- END: Process Bible linking ---

        // Jalankan semua promise secara paralel
        const resolvedReplacements = await Promise.all(allPromises);
        console.log(`[loadBulletin] All song and bible promises resolved. Performing ${resolvedReplacements.length} replacements.`);

        // Lakukan penggantian dalam dua tahap untuk keamanan
        let tempMarkdownContent = markdownContent;
        const tempPlaceholders = new Map(); // Menggunakan Map untuk menyimpan placeholder unik dan replacement aslinya

        for (const replacement of resolvedReplacements) {
            // Buat placeholder yang unik dan tidak mungkin ada di konten asli
            const uniquePlaceholder = `__DYNAMIC_CONTENT_PLACEHOLDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}__`;
            // Ganti fullMatch di tempMarkdownContent dengan placeholder unik
            tempMarkdownContent = tempMarkdownContent.replace(replacement.fullMatch, uniquePlaceholder);
            // Simpan placeholder unik dan replacement HTML aslinya
            tempPlaceholders.set(uniquePlaceholder, replacement.replacementHtml);
        }

        // Sekarang ganti placeholder unik dengan HTML asli
        let finalProcessedMarkdown = tempMarkdownContent;
        for (const [placeholder, html] of tempPlaceholders.entries()) {
            finalProcessedMarkdown = finalProcessedMarkdown.replace(placeholder, html);
        }

        markdownContent = finalProcessedMarkdown;
        console.log("[loadBulletin] Final Markdown Content after all processing:", markdownContent.substring(0, 500) + (markdownContent.length > 500 ? "..." : ""));

        displayBulletin(markdownContent, filename);
    } catch (error) {
        console.error('Error loading bulletin:', error);
        document.getElementById('content').innerHTML = `
            <h2>Error</h2>
            <p>Gagal memuat warta. Silakan coba lagi nanti.</p>
        `;
        document.getElementById('bulletin-list').style.display = 'none';
        document.getElementById('bulletin-content').style.display = 'block';
    }
}

// Display a bulletin (This function now receives already processed markdown)
function displayBulletin(processedMarkdownContent, filename) {
    document.getElementById('bulletin-list').style.display = 'none';
    document.getElementById('bulletin-content').style.display = 'block';
    
    let formattedBulletinDetail = ''; 

    const ibadahMingguMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_(Enggano|Melur)_(Pagi|Sore)\.md$/);
    const kebaktianKelompokMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_([a-zA-Z0-9]+)_(\d{4})\.md$/);

    if (ibadahMingguMatch) {
        const [_, year, month, day, location, session] = ibadahMingguMatch;
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        formattedBulletinDetail = `Gereja XYZ ${location}, ${formattedDate}, Ibadah ${session}`;

    } else if (kebaktianKelompokMatch) {
        const [_, year, month, day, activityType, time] = kebaktianKelompokMatch;
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        const formattedTime = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
        const readableActivityType = activityType.replace(/(\d+)$/, ' $1');

        formattedBulletinDetail = `Ibadah ${readableActivityType}, ${formattedDate}, ${formattedTime}`;
    }

    const detailHtml = formattedBulletinDetail ? 
        `<div class="bulletin-detail-header"><i>${formattedBulletinDetail}</i></div>` : '';

    // Now, parse the final processed markdown content
    const htmlContent = marked.parse(processedMarkdownContent);
    console.log("[displayBulletin] Final HTML content after marked.parse:", htmlContent.substring(0, 500) + (htmlContent.length > 500 ? "..." : ""));
    
    document.getElementById('content').innerHTML = detailHtml + htmlContent;
    
    // Convert collapsible elements (songs or other code blocks) after they are in DOM
    convertCodeBlocksToCollapsible();
    
    adjustContentFormatting();
}

// Function to convert *all* collapsible elements (including song lyrics)
function convertCodeBlocksToCollapsible() {
    // Select all buttons that are meant to trigger collapsible content
    // These buttons have an onclick attribute and a specific class
    const buttons = document.querySelectorAll('.code-toggle-btn');
    console.log(`[convertCodeBlocksToCollapsible] Found ${buttons.length} toggle buttons.`);

    buttons.forEach(button => {
        // Extract the unique ID from the onclick attribute
        const onclickAttr = button.getAttribute('onclick');
        const idMatch = onclickAttr.match(/toggleCode\('([^']+)'\)/);
        if (idMatch && idMatch[1]) {
            const uniqueId = idMatch[1];
            const contentElement = document.getElementById(`${uniqueId}-content`);

            // Ensure content element exists before trying to manipulate
            if (contentElement) {
                // Initial state: ensure they are collapsed if they don't have expanded
                if (!contentElement.classList.contains('code-expanded')) {
                    contentElement.classList.add('code-collapsed');
                    button.classList.add('collapsed');
                }
                // No need to re-attach onclick, as it's already in the HTML
                console.log(`[convertCodeBlocksToCollapsible] Initialized collapsible for ID: ${uniqueId}`);
            } else {
                console.warn(`[convertCodeBlocksToCollapsible] Content element not found for button with ID: ${uniqueId}`);
            }
        }
    });
}

// Function to adjust formatting for better display
function adjustContentFormatting() {
    // Fix code blocks (applies to both regular code blocks)
    // Note: Song lyrics and Bible texts are now handled by their own specific classes
    const preElements = document.querySelectorAll('#content pre');
    preElements.forEach(preEl => {
        const codeEl = preEl.querySelector('code');
        if (codeEl) {
            codeEl.style.fontFamily = 'inherit';
            codeEl.style.whiteSpace = 'pre-wrap';
            codeEl.style.wordWrap = 'break-word';
        }
        preEl.classList.add('text-box'); // You might want to rename this class to something more generic like 'content-block'
    });
    
    // Ensure proper list indentation
    const listItems = document.querySelectorAll('#content ol > li');
    listItems.forEach(li => {
        li.style.display = 'list-item';
        const firstParagraph = li.querySelector('p:first-child');
        if (firstParagraph) {
            firstParagraph.style.display = 'inline';
            firstParagraph.style.marginTop = '0';
        }
    });

    // NEW: Apply specific formatting for song and bible content blocks
    const songAndBibleContentDivs = document.querySelectorAll('.song-lyrics-content > div, .bible-text-content > div');
    songAndBibleContentDivs.forEach(divEl => {
        // These styles are now applied directly via CSS classes,
        // but if you have inline styles you want to force, you can do it here.
        // Example:
        // divEl.style.whiteSpace = 'pre-wrap';
        // divEl.style.wordWrap = 'break-word';
    });
}

// Show bulletin list and clear URL parameter
function showBulletinList() {
    document.getElementById('bulletin-list').style.display = 'block';
    document.getElementById('bulletin-content').style.display = 'none';
    history.pushState(null, '', window.location.pathname); 
}

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const bulletinId = params.get('bulletin');
    const staticPageId = params.get('page');

    if (bulletinId) {
        loadBulletin(bulletinId);
    } else if (staticPageId) {
        loadStaticPage(`${staticPageId}.md`);
    } else {
        showBulletinList();
    }
});
