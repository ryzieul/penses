// Initialize empty penses array
let penses = [];
let currentIndex = 0;
let previewPensesData = [];
let pageFlip; // PageFlip instance

// CONSTANTS
const STORAGE_KEY = 'pensee_data';

// Function to initialize page flip
function initPageFlip() {
    const bookElement = document.getElementById('pensee-book');
    
    // Clear any existing content
    bookElement.innerHTML = '';
    
    if (penses.length === 0) {
        // If no pensées, create empty placeholder pages
        const emptyPage = document.createElement('div');
        emptyPage.className = 'page';
        emptyPage.setAttribute('data-density', 'hard');
        
        const emptyContent = document.createElement('div');
        emptyContent.className = 'page-content';
        emptyContent.textContent = 'No pensées yet';
        
        emptyPage.appendChild(emptyContent);
        bookElement.appendChild(emptyPage);
        
        document.querySelector('.counter').textContent = `0 of 0`;
    } else {
        // Create pages for each pensée
        penses.forEach((pensee, index) => {
            // Front page (left side)
            const frontPage = document.createElement('div');
            frontPage.className = 'page';
            if (index === 0) {
                frontPage.setAttribute('data-density', 'hard');
            }
            
            const frontContent = document.createElement('div');
            frontContent.className = 'page-content left-page';
            frontContent.textContent = pensee.front;
            
            frontPage.appendChild(frontContent);
            bookElement.appendChild(frontPage);
            
            // Back page (right side)
            const backPage = document.createElement('div');
            backPage.className = 'page';
            if (index === penses.length - 1) {
                backPage.setAttribute('data-density', 'hard');
            }
            
            const backContent = document.createElement('div');
            backContent.className = 'page-content right-page';
            
            if (pensee.type === 'image') {
                const img = document.createElement('img');
                img.src = pensee.back;
                img.alt = 'Illustration';
                backContent.appendChild(img);
            } else {
                backContent.className += ' text-content';
                backContent.textContent = pensee.back || '';
            }
            
            backPage.appendChild(backContent);
            bookElement.appendChild(backPage);
        });
    }
    
    // Initialize PageFlip
    if (pageFlip) {
        pageFlip.destroy();
    }
    
    try {
        // Using St.PageFlip as the library is exposed under the St namespace
        pageFlip = new St.PageFlip(document.getElementById('pensee-book'), {
        width: 400,
        height: 500,
        size: 'stretch',
        minWidth: 250,
        maxWidth: 800,
        minHeight: 300,
        maxHeight: 800,
        maxShadowOpacity: 0.5,
        showCover: true,
        flippingTime: 700,
        usePortrait: true,
        startPage: currentIndex * 2,
        autoSize: true,
        drawShadow: true,
        mobileScrollSupport: true
    });
    
    // Load pages
    pageFlip.loadFromHTML(document.querySelectorAll('.page'));
    
    // Event listener for page turning
    pageFlip.on('flip', (e) => {
        // Update current index (divide by 2 because we have 2 pages per pensée)
        currentIndex = Math.floor(e.data / 2);
        updateCounter();
    });
    } catch (error) {
        console.error("Error initializing PageFlip:", error);
        // Fallback to simple display if PageFlip fails
        const defaultMessage = document.createElement('div');
        defaultMessage.className = 'fallback-message';
        defaultMessage.textContent = penses.length > 0 ? penses[0].front : 'No pensées yet';
        document.getElementById('pensee-book').innerHTML = '';
        document.getElementById('pensee-book').appendChild(defaultMessage);
    }
}

// Function to update counter
function updateCounter() {
    if (penses.length === 0) {
        document.querySelector('.counter').textContent = `0 of 0`;
        return;
    }
    document.querySelector('.counter').textContent = `${currentIndex + 1} of ${penses.length}`;
}

// Function to parse penses text (multiple formats)
function parsePensesText(text) {
    const lines = text.split('\n');
    const penses = [];
    let currentPense = null;
    let subthoughts = [];
    let isProcessingSubthoughts = false;
    
    // Detect format - check for bullets like '◦' or Notes.app '- [ ]'
    const hasMobileBullets = text.includes('◦');
    const hasNotesAppFormat = text.includes('- [ ]');
    
    for (let line of lines) {
        if (!line.trim()) continue;
        
        // Notes.app format
        if (hasNotesAppFormat) {
            // Check if it's a main pensée
            if (line.match(/^- \[ \]/)) {
                // If we have a previous pensée, save it
                if (currentPense) {
                    if (currentPense.trim() && subthoughts.length > 0) {
                        penses.push({
                            front: currentPense,
                            back: subthoughts.join('\n'),
                            type: 'text'
                        });
                    } else if (currentPense.trim()) {
                        penses.push({
                            front: currentPense,
                            type: 'text'
                        });
                    }
                }
                
                // Start new pensée
                const content = line.replace(/^- \[ \]/, '').trim();
                currentPense = content;
                subthoughts = [];
            }
            // Check if it's a subthought
            else if (line.match(/^    - \[ \]/)) {
                const subthought = line.replace(/^    - \[ \]/, '').trim();
                if (subthought) {
                    subthoughts.push(subthought);
                }
            }
        }
        // Mobile bullet format (◦)
        else if (hasMobileBullets) {
            if (line.trim().startsWith('◦')) {
                // If there's a previous pensée being processed
                if (currentPense !== null) {
                    // If we're currently collecting subthoughts
                    if (isProcessingSubthoughts && subthoughts.length > 0) {
                        penses.push({
                            front: currentPense,
                            back: subthoughts.join('\n'),
                            type: 'text'
                        });
                        isProcessingSubthoughts = false;
                    } else {
                        penses.push({
                            front: currentPense,
                            type: 'text'
                        });
                    }
                }
                
                // Start a new pensée
                currentPense = line.replace(/^◦/, '').trim();
                subthoughts = [];
            } else if (line.trim() && currentPense !== null) {
                // This is a continuation or subthought for the current pensée
                // Check if this line is an image marker (like '￼')
                if (line.includes('￼')) {
                    // Skip image placeholder characters
                    continue;
                }
                
                // Indent means it's a subthought
                if (line.startsWith('\t') || line.startsWith('    ')) {
                    isProcessingSubthoughts = true;
                    subthoughts.push(line.trim());
                } else {
                    // Might be a continuation of the main pensée
                    currentPense += ' ' + line.trim();
                }
            }
        }
        // Plain text format - just treat each line as a separate pensée
        else {
            penses.push({
                front: line.trim(),
                type: 'text'
            });
        }
    }
    
    // Don't forget the last pensée
    if (currentPense && currentPense.trim()) {
        if (subthoughts.length > 0) {
            penses.push({
                front: currentPense,
                back: subthoughts.join('\n'),
                type: 'text'
            });
        } else {
            penses.push({
                front: currentPense,
                type: 'text'
            });
        }
    }
    
    return penses;
}

// Navigation functions
function nextCard() {
    if (penses.length === 0 || currentIndex >= penses.length - 1) return;
    currentIndex++;
    pageFlip.flip(currentIndex * 2);
}

function previousCard() {
    if (penses.length === 0 || currentIndex <= 0) return;
    currentIndex--;
    pageFlip.flip(currentIndex * 2);
}

function randomCard() {
    if (penses.length <= 1) return;
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * penses.length);
    } while (newIndex === currentIndex);
    
    currentIndex = newIndex;
    pageFlip.flip(currentIndex * 2);
}

function addPensee() {
    openManagePanel();
}

// Manage panel functions
function openManagePanel() {
    const overlay = document.getElementById('manageOverlay');
    overlay.classList.add('active');
    showTab('import');
}

function closeManagePanel() {
    const overlay = document.getElementById('manageOverlay');
    overlay.classList.remove('active');
    document.getElementById('pensesInput').value = '';
    previewPensesData = [];
}

function showTab(tabName) {
    // Hide all tab panels
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab panel and activate button
    document.getElementById(`${tabName}Panel`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function previewPensees() {
    const pensesText = document.getElementById('pensesInput').value;
    if (!pensesText.trim()) {
        alert('Please paste some pensées first');
        return;
    }
    
    previewPensesData = parsePensesText(pensesText);
    if (previewPensesData.length === 0) {
        alert('No valid pensées found. Please check your format.');
        return;
    }
    
    renderPreview();
    showTab('preview');
}

function renderPreview() {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';
    
    previewPensesData.forEach((pensee, index) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.setAttribute('data-index', index);
        
        const front = document.createElement('div');
        front.className = 'preview-card-front';
        front.textContent = pensee.front;
        
        const back = document.createElement('div');
        back.className = 'preview-card-back';
        
        if (pensee.type === 'image') {
            const img = document.createElement('img');
            img.src = pensee.back;
            img.alt = 'Image';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '80px';
            img.style.objectFit = 'contain';
            back.appendChild(img);
        } else {
            back.textContent = pensee.back || '(No back content)';
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'preview-card-actions';
        
        const imageUpload = document.createElement('div');
        imageUpload.className = 'preview-card-image';
        imageUpload.innerHTML = `<span class="image-upload" data-index="${index}">+</span>`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-preview-card';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('data-index', index);
        
        actionsDiv.appendChild(imageUpload);
        actionsDiv.appendChild(deleteBtn);
        
        card.appendChild(front);
        card.appendChild(back);
        card.appendChild(actionsDiv);
        
        previewContainer.appendChild(card);
    });
    
    // Add event listeners for image upload buttons
    document.querySelectorAll('.image-upload').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            // Store the current index for the file input's change handler
            document.getElementById('imageUpload').setAttribute('data-index', index);
            // Trigger the file input click
            document.getElementById('imageUpload').click();
        });
    });
    
    // Set up the file input change handler if it's not already set
    if (!document.getElementById('imageUpload').hasAttribute('data-initialized')) {
        document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
        document.getElementById('imageUpload').setAttribute('data-initialized', 'true');
    }
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-preview-card').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deletePreviewCard(index);
        });
    });
}

function deletePreviewCard(index) {
    if (index >= 0 && index < previewPensesData.length) {
        // Remove the card from the preview data
        previewPensesData.splice(index, 1);
        // Re-render the preview
        renderPreview();
    }
}

function deleteAllPreviewCards() {
    if (previewPensesData.length === 0) return;
    
    if (confirm('Are you sure you want to delete all cards?')) {
        previewPensesData = [];
        renderPreview();
    }
}

// Function to handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const index = parseInt(event.target.getAttribute('data-index'));
    if (index < 0 || index >= previewPensesData.length) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Update the card with the image
        previewPensesData[index].type = 'image';
        previewPensesData[index].back = e.target.result;
        
        // Update the preview
        const previewCard = document.querySelector(`.preview-card[data-index="${index}"]`);
        if (previewCard) {
            const backElement = previewCard.querySelector('.preview-card-back');
            if (backElement) {
                // Show a thumbnail of the image
                backElement.innerHTML = `<img src="${e.target.result}" alt="Image" style="max-width: 100%; max-height: 80px; object-fit: contain;">`;
            }
            
            // Update upload button to show it's been attached
            const uploadButton = previewCard.querySelector('.image-upload');
            if (uploadButton) {
                uploadButton.textContent = '✓';
                uploadButton.style.color = '#4CAF50';
                uploadButton.style.borderColor = '#4CAF50';
            }
        }
    };
    
    reader.readAsDataURL(file);
    
    // Reset the file input for future uploads
    event.target.value = '';
}

function importPensees() {
    if (previewPensesData.length === 0) {
        alert('No pensées to import');
        return;
    }
    
    // Replace existing pensées with new ones
    penses = [...previewPensesData];
    
    // Save to localStorage
    savePensesToStorage();
    
    // Reset index
    currentIndex = 0;
    
    // Reinitialize page flip with new pensées
    initPageFlip();
    
    // Close the panel
    closeManagePanel();
}

// Storage functions
function savePensesToStorage() {
    try {
        const data = JSON.stringify(penses);
        localStorage.setItem(STORAGE_KEY, data);
        console.log('Saved pensées to localStorage:', penses.length);
    } catch (e) {
        console.error('Error saving pensées to localStorage:', e);
    }
}

function loadPensesFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                penses = parsedData;
                console.log('Loaded pensées from localStorage:', penses.length);
                return true;
            }
        }
    } catch (e) {
        console.error('Error loading pensées from localStorage:', e);
    }
    console.log('No pensées found in localStorage');
    return false;
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Try to load from localStorage first
    if (!loadPensesFromStorage()) {
        penses = []; // Start with empty array if no saved data
    }
    
    // Initialize PageFlip component
    initPageFlip();
});