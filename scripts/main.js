// Function to parse penses from text format
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

// Sample data structure for pensées with image support
const penses = [
    {
        front: "Great things are meant to be hard",
        back: "The resistance we face when pursuing significant goals isn't just an obstacle - it's a signal. It tells us we're pushing beyond our comfort zone, growing, and attempting something truly worthwhile.",
        type: "text"
    },
    // Add more pensées here
];

let currentIndex = 0;
const card = document.querySelector('.card');
let isFlipped = false;

function toggleCard() {
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped');
}

function updateCard() {
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
    // This function would open a form to add new pensées
    alert('Add new pensée functionality coming soon!');
}

card.addEventListener('click', toggleCard);

function importPensesFromFile(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const newPenses = parsePensesText(text);
            penses.push(...newPenses);
            updateCard();
        };
        reader.readAsText(file);
    }
}