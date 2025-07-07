// Start with showing images
let showImages = true;

/////////////// Helpers ///////////////////

function getCollection() {
    const stored = localStorage.getItem('mtg-collection');
    return stored ? JSON.parse(stored) : [];
}

function saveCollection(collection) {
    localStorage.setItem('mtg-collection', JSON.stringify(collection));
}

function addCardToCollection(card) {
    const collection = getCollection();
    collection.push(card);
    saveCollection(collection);
    document.dispatchEvent(new CustomEvent("collection-updated"));
}

function removeCardFromCollection(card) {
    const collection = getCollection();
    const index = collection.findIndex(c => c.id === card.id);
    if (index !== -1) {
        collection.splice(index, 1);
        saveCollection(collection);
        document.dispatchEvent(new CustomEvent("collection-updated"));
    }
}

/////////////// Lookup ///////////////////

async function fetchCards(name) {
    try {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }
        return data.data.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: (item.image_uris?.normal) || ''
        }));
    } catch (error) {
        console.error('Error fetching cards:', error);
        return [];
    }
}

/*      ******Potentially redundant*******
function updateCountDisplay(card) {
    const collection = getCollection();
    const count = collection.filter(c => c.id === card.id).length;
    const countSpan = document.getElementById(`collection-count-${card.id}`);
    if (countSpan) {
        countSpan.textContent = count.toString();
    }
}
*/

function displayCards(cards) {
    const searchResult = document.getElementById('search-result');
    searchResult.innerHTML = "";

    for (const card of cards) {
        const collection = getCollection();
        const count = collection.filter(c => c.id === card.id).length;

        const cardDiv = document.createElement('div');
        cardDiv.innerHTML = `
            <h2>${card.name}</h2>
            <img src="${card.imageUrl}" alt="${card.name}" style="width:200px;">
            <p>Collection Count: <span id="collection-count-${card.id}">${count}</span></p>
            <br>
            <button id="decrease-${card.id}">-</button>
            <button id="increase-${card.id}">+</button>
            <hr>
        `;
        searchResult.appendChild(cardDiv);

        const increaseButton = document.getElementById(`increase-${card.id}`);
        const decreaseButton = document.getElementById(`decrease-${card.id}`);

        increaseButton.addEventListener('click', () => {
            addCardToCollection(card);
            updateCountDisplay(card);
        });

        decreaseButton.addEventListener('click', () => {
            removeCardFromCollection(card);
            updateCountDisplay(card);
        });
    }
}

/////////////// Collection Rendering ///////////////////

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

    // Use event delegation to handle +/- clicks
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
    });
}

/////////////// Init ///////////////////

document.addEventListener('DOMContentLoaded', () => {
    // Lookup search
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    searchButton?.addEventListener('click', async () => {
        const cardName = searchInput.value.trim();
        if (!cardName) return;
        const cards = await fetchCards(cardName);
        if (cards.length > 0) {
            displayCards(cards);
        } else {
            document.getElementById('search-result').innerHTML = `<p>No cards found!</p>`;
        }
    });

    // Collection
    const collectionList = document.getElementById('collection-list');
    const toggleButton = document.getElementById('toggle-display');
    const deleteButton = document.getElementById("delete-collection");
    renderCollection(collectionList);

    toggleButton?.addEventListener('click', () => {
        showImages = !showImages;
        renderCollection(collectionList);
    });

    deleteButton?.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete your entire collection? This cannot be undone.")) {
            localStorage.removeItem("mtg-collection");
            renderCollection(collectionList);
        }
    });

    document.addEventListener("collection-updated", () => {
        renderCollection(collectionList);
    });
});

export {};
