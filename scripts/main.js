// Initialize empty penses array
let penses = [];
let currentIndex = 0;
const card = document.querySelector('.card');
let isFlipped = false;

// Function to load penses from file
async function loadPenses() {
    try {
        const response = await fetch('assets/penses-list/penses-list-1.txt');
        const text = await response.text();
        penses = parsePensesText(text);
        updateCard(); // Update the card after loading penses
    } catch (error) {
        console.error('Error loading penses:', error);
    }
}

// Your existing parsePensesText function stays the same
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

function toggleCard() {
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped');
}

function updateCard() {
    if (penses.length === 0) return;  // Guard against empty penses array
    
    const pensee = penses[currentIndex];
    const frontFace = document.querySelector('.card__face--front');
    const backFace = document.querySelector('.card__face--back');
    
    frontFace.textContent = pensee.front;
    if (pensee.type === 'image') {
        backFace.innerHTML = `<img src="${pensee.back}" alt="Illustration" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
    } else {
        backFace.textContent = pensee.back || '';
    }
    
    if (pensee.type === 'text') {
        backFace.classList.add('text-content');
    } else {
        backFace.classList.remove('text-content');
    }
    
    document.querySelector('.counter').textContent = `${currentIndex + 1}/${penses.length}`;
}

function nextCard() {
    if (currentIndex < penses.length - 1) {
        currentIndex++;
        if (isFlipped) toggleCard();
        updateCard();
    }
}

function previousCard() {
    if (currentIndex > 0) {
        currentIndex--;
        if (isFlipped) toggleCard();
        updateCard();
    }
}

function randomCard() {
    const newIndex = Math.floor(Math.random() * penses.length);
    currentIndex = newIndex;
    if (isFlipped) toggleCard();
    updateCard();
}

function addPensee() {
    alert('Add new pensée functionality coming soon!');
}

// Event listeners
card.addEventListener('click', toggleCard);

// Load penses when the page loads
document.addEventListener('DOMContentLoaded', loadPenses);