// src/card-vault/lookup.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Helper to grab elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchResult = document.getElementById('search-result');
// Attach a click listener
searchButton === null || searchButton === void 0 ? void 0 : searchButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    if (!searchInput)
        return;
    const cardName = searchInput.value.trim();
    if (!cardName)
        return;
    const cards = yield fetchCards(cardName);
    if (cards.length > 0) {
        displayCards(cards);
    }
    else {
        if (searchResult) {
            searchResult.innerHTML = `<p>No cards found!</p>`;
        }
    }
}));
// Fetch card data from Scryfall
function fetchCards(name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
            const data = yield response.json();
            if (!data.data || !Array.isArray(data.data)) {
                return [];
            }
            const cards = data.data.map((item) => {
                var _a;
                return ({
                    id: item.id,
                    name: item.name,
                    imageUrl: ((_a = item.image_uris) === null || _a === void 0 ? void 0 : _a.normal) || ''
                });
            });
            return cards;
        }
        catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    });
}
// Display the card info
function displayCards(cards) {
    if (!searchResult)
        return;
    searchResult.innerHTML = ''; // Clear old results
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
        increaseButton === null || increaseButton === void 0 ? void 0 : increaseButton.addEventListener('click', () => {
            addCardToCollection(card);
            updateCountDisplay(card);
        });
        decreaseButton === null || decreaseButton === void 0 ? void 0 : decreaseButton.addEventListener('click', () => {
            removeCardFromCollection(card);
            updateCountDisplay(card);
        });
    }
}
function removeCardFromCollection(card) {
    const collection = getCollection();
    const index = collection.findIndex(c => c.id === card.id);
    if (index !== -1) {
        collection.splice(index, 1); // remove ONE copy
        localStorage.setItem('mtg-collection', JSON.stringify(collection));
    }
}
function updateCountDisplay(card) {
    const collection = getCollection();
    const count = collection.filter(c => c.id === card.id).length;
    const countSpan = document.getElementById(`collection-count-${card.id}`);
    if (countSpan) {
        countSpan.textContent = count.toString();
    }
}
// Save to localStorage
function addCardToCollection(card) {
    const collection = getCollection();
    collection.push(card);
    localStorage.setItem('mtg-collection', JSON.stringify(collection));
}
// Read from localStorage
function getCollection() {
    const stored = localStorage.getItem('mtg-collection');
    return stored ? JSON.parse(stored) : [];
}
export {};
