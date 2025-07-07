// Start with showing images
let showImages = true;

// Helper to load collection
function getCollection() {
    const stored = localStorage.getItem('mtg-collection');
    return stored ? JSON.parse(stored) : [];
}

// Helper to save collection
function saveCollection(collection) {
    localStorage.setItem('mtg-collection', JSON.stringify(collection));
}

// Add a copy
function addCardToCollection(card) {
    const collection = getCollection();
    collection.push(card);
    saveCollection(collection);
    document.dispatchEvent(new CustomEvent("collection-updated"));
}

// Remove a copy
function removeCardFromCollection(card) {
    const collection = getCollection();
    const index = collection.findIndex(c => c.id === card.id);
    if (index !== -1) {
        collection.splice(index, 1);
        saveCollection(collection);
        document.dispatchEvent(new CustomEvent("collection-updated"));
    }
}

// This function can be called by Lookup page buttons
function handleLookupIncrement(card) {
    addCardToCollection(card);
    updateCount(card.id);
    const container = document.getElementById('collection-list');
    renderCollection(container);
}

function handleLookupDecrement(card) {
    removeCardFromCollection(card);
    updateCount(card.id);
    const container = document.getElementById('collection-list');
    renderCollection(container);
}

document.addEventListener('DOMContentLoaded', () => {
    const collectionList = document.getElementById('collection-list');
    const toggleButton = document.getElementById('toggle-display');
    renderCollection(collectionList);

    toggleButton.addEventListener('click', () => {
        showImages = !showImages;
        renderCollection(collectionList);
    });

    // ✅ Listen for the event so collection updates
    document.addEventListener("collection-updated", () => {
        const collectionList = document.getElementById('collection-list');
        if (collectionList) {
            renderCollection(collectionList);
        }
    });
});




///////////////Render Collection///////////////////////////////////
function renderCollection(container) {
    const collection = getCollection();
    container.innerHTML = `<div class="card-grid"></div>`;
    const grid = container.querySelector('.card-grid');

    if (collection.length === 0) {
        container.innerHTML = `<p>You don't own any cards yet.</p>`;
        return;
    }

    const cardCountMap = new Map();
    for (const card of collection) {
        if (cardCountMap.has(card.id)) {
            cardCountMap.get(card.id).count++;
        } else {
            cardCountMap.set(card.id, { card, count: 1 });
        }
    }

    cardCountMap.forEach(({ card, count }) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-item');
        cardDiv.innerHTML = `
            <h2>${card.name}</h2>
            ${showImages ? `<img src="${card.imageUrl}" alt="${card.name}" style="width:200px;">` : ""}
            <p>
                Copies Owned: <span id="count-${card.id}">${count}</span>
                <button data-action="decrease" data-card-id="${card.id}">-</button>
                <button data-action="increase" data-card-id="${card.id}">+</button>
            </p>
        `;
        grid.appendChild(cardDiv);
    });

    grid.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const cardId = button.dataset.cardId;
        if (!action || !cardId) return;

        const collection = getCollection();
        const firstMatch = collection.find(c => c.id === cardId);
        if (!firstMatch) return;

        if (action === 'increase') {
            addCardToCollection(firstMatch);
        } else if (action === 'decrease') {
            removeCardFromCollection(firstMatch);
        }

        renderCollection(container);
    });
}




export {};