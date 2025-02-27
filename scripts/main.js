// Initialize empty penses array
let penses = [];
let currentIndex = 0;
const card = document.querySelector('.card');
let isFlipped = false;
let previewPensesData = [];

// Function to parse penses text (Notes.app format)
function parsePensesText(text) {
    const lines = text.split('\n');
    const penses = [];
    let currentPense = null;
    let subthoughts = [];
    
    for (let line of lines) {
        if (!line.trim()) continue;
        
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

// Card functions
function toggleCard() {
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped');
}

function updateCard() {
    if (penses.length === 0) {
        const frontFace = document.querySelector('.card__face--front');
        const backFace = document.querySelector('.card__face--back');
        
        frontFace.textContent = "No pensées yet";
        backFace.textContent = "Add pensées using the Manage button";
        document.querySelector('.counter').textContent = "0 of 0";
        return;
    }
    
    const pensee = penses[currentIndex];
    const frontFace = document.querySelector('.card__face--front');
    const backFace = document.querySelector('.card__face--back');
    
    frontFace.textContent = pensee.front;
    if (pensee.type === 'image') {
        backFace.innerHTML = `<img src="${pensee.back}" alt="Illustration" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        backFace.classList.remove('text-content');
    } else {
        backFace.textContent = pensee.back || '';
        backFace.classList.add('text-content');
    }
    
    document.querySelector('.counter').textContent = `${currentIndex + 1} of ${penses.length}`;
}

function nextCard() {
    if (penses.length === 0) return;
    if (currentIndex < penses.length - 1) {
        currentIndex++;
        if (isFlipped) toggleCard();
        updateCard();
    }
}

function previousCard() {
    if (penses.length === 0) return;
    if (currentIndex > 0) {
        currentIndex--;
        if (isFlipped) toggleCard();
        updateCard();
    }
}

function randomCard() {
    if (penses.length === 0) return;
    const newIndex = Math.floor(Math.random() * penses.length);
    currentIndex = newIndex;
    if (isFlipped) toggleCard();
    updateCard();
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
        back.textContent = pensee.back || '(No back content)';
        
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
    
    // Reset index and update card
    currentIndex = 0;
    if (isFlipped) toggleCard();
    updateCard();
    
    // Close the panel
    closeManagePanel();
}

// Event listeners
card.addEventListener('click', toggleCard);

// Initialize display
document.addEventListener('DOMContentLoaded', function() {
    updateCard();
});