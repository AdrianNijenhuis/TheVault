let showImages = true; // Start with showing images
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
}
// Remove a copy
function removeCardFromCollection(card) {
    const collection = getCollection();
    const index = collection.findIndex(c => c.id === card.id);
    if (index !== -1) {
        collection.splice(index, 1); // remove one copy
        saveCollection(collection);
    }
}
// Update the number shown on screen for a specific card
function updateCount(cardId) {
    const collection = getCollection();
    const count = collection.filter(c => c.id === cardId).length;
    const countSpan = document.getElementById(`count-${cardId}`);
    if (countSpan) {
        countSpan.textContent = count.toString();
    }
    // Optional: If count is 0, re-render the collection (hide card completely)
    if (count === 0) {
        const container = document.getElementById('collection-list');
        renderCollection(container);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const collectionList = document.getElementById('collection-list');
    const toggleButton = document.getElementById('toggle-display');
    renderCollection(collectionList);
    toggleButton.addEventListener('click', () => {
        showImages = !showImages; // Flip the mode
        renderCollection(collectionList); // Re-render
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

    // Attach a single click handler to the grid
    grid.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const cardId = button.dataset.cardId;

        if (!action || !cardId) return;

        // Find the card object again to pass to add/remove
        const { card } = cardCountMap.get(cardId);

        if (action === 'increase') {
            addCardToCollection(card);
        } else if (action === 'decrease') {
            removeCardFromCollection(card);
        }

        // Always re-render the collection to refresh counts/buttons
        renderCollection(container);
    });
}




export {};