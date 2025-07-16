// Start with showing images
let showImages = true;

/////////////// Types ///////////////////

interface Card {
  id: string;
  name: string;
  imageUrl: string;
  type_line: string;
  colors: string[];
}

/////////////// Helpers ///////////////////

function getCollection(): Card[] {
  const stored = localStorage.getItem('mtg-collection');
  return stored ? (JSON.parse(stored) as Card[]) : [];
}

function saveCollection(collection: Card[]): void {
  localStorage.setItem('mtg-collection', JSON.stringify(collection));
}

function addCardToCollection(card: Card): void {
  const collection = getCollection();
  collection.push(card);
  saveCollection(collection);
  document.dispatchEvent(new CustomEvent("collection-updated"));
}

function removeCardFromCollection(card: Card): void {
  const collection = getCollection();
  const index = collection.findIndex(c => c.id === card.id);
  if (index !== -1) {
    collection.splice(index, 1);
    saveCollection(collection);
    document.dispatchEvent(new CustomEvent("collection-updated"));
  }
}

/////////////// Lookup ///////////////////

async function fetchCards(name: string): Promise<Card[]> {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }
    return data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.image_uris?.normal || '',
      type_line: item.type_line || '',
      colors: item.colors || []
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

function displayCards(cards: Card[]): void {
  const searchResult = document.getElementById('search-result');
  if (!searchResult) return;

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

    increaseButton?.addEventListener('click', () => {
      addCardToCollection(card);
      updateCountDisplay(card);
    });

    decreaseButton?.addEventListener('click', () => {
      removeCardFromCollection(card);
      updateCountDisplay(card);
    });
  }
}

function updateCountDisplay(card: Card): void {
  const collection = getCollection();
  const count = collection.filter(c => c.id === card.id).length;
  const countSpan = document.getElementById(`collection-count-${card.id}`);
  if (countSpan) {
    countSpan.textContent = count.toString();
  }
}

/////////////// Collection Rendering ///////////////////

function renderCollection(container: HTMLElement | null): void {
  if (!container) return;

  const collection = getCollection();
  container.innerHTML = `<div class="card-grid"></div>`;
  const grid = container.querySelector('.card-grid');
  if (!grid) return;

  if (collection.length === 0) {
    container.innerHTML = `<p>You don't own any cards yet.</p>`;
    return;
  }

  const cardCountMap = new Map<string, { card: Card; count: number }>();
  for (const card of collection) {
    if (cardCountMap.has(card.id)) {
      cardCountMap.get(card.id)!.count++;
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
    const target = event.target as HTMLElement;
    const button = target.closest('button');
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
  const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  const searchButton = document.getElementById('search-button');
  const toggleAdvancedButton = document.getElementById('toggle-advanced-search');
  const advancedOptions = document.getElementById('advanced-search-options') as HTMLElement | null;
  const excludeButton = document.getElementById('toggle-exclude-mode');

  let excludeMode = false;
  excludeButton?.addEventListener('click', () => {
    excludeMode = !excludeMode;
    excludeButton.textContent = `Exclude: ${excludeMode ? "On" : "Off"}`;
  });

  searchButton?.addEventListener('click', async () => {
    if (!searchInput) return;
    const cardName = searchInput.value.trim();
    if (!cardName) return;

    const selectedTypes = Array.from(
      document.querySelectorAll<HTMLInputElement>('#advanced-search-options input[type="checkbox"][value]:checked')
    )
      .filter(cb => !["B", "R", "W", "U", "G"].includes(cb.value))
      .map(cb => cb.value);

    const selectedColors = Array.from(
      document.querySelectorAll<HTMLInputElement>('#advanced-search-options input[type="checkbox"]:checked')
    )
      .filter(cb => ["B", "R", "W", "U", "G"].includes(cb.value))
      .map(cb => cb.value);

    const cards = await fetchCards(cardName);
    let filteredCards = cards;

    if (selectedTypes.length > 0) {
      filteredCards = filteredCards.filter(card => {
        const typeLine = (card.type_line || "").toLowerCase();
        return selectedTypes.some(type => typeLine.includes(type));
      });
    }

    if (selectedColors.length > 0) {
      filteredCards = filteredCards.filter(card => {
        const cardColors = card.colors || [];
        if (excludeMode) {
          return (
            cardColors.length === selectedColors.length &&
            selectedColors.every(c => cardColors.includes(c))
          );
        } else {
          return selectedColors.some(c => cardColors.includes(c));
        }
      });
    }

    const searchResult = document.getElementById('search-result');
    if (filteredCards.length > 0) {
      displayCards(filteredCards);
    } else if (searchResult) {
      searchResult.innerHTML = `<p>No cards found!</p>`;
    }
  });

  toggleAdvancedButton?.addEventListener('click', () => {
    if (!advancedOptions) return;
    if (advancedOptions.style.display === "none") {
      advancedOptions.style.display = "block";
    } else {
      advancedOptions.style.display = "none";
    }
  });

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
