import { Card } from './lookup'; // Reuse your Card type

let showImages = true; // Start with showing images

// Helper to load your collection
function getCollection(): Card[] {
  const stored = localStorage.getItem('mtg-collection');
  return stored ? JSON.parse(stored) : [];
}

// Helper to save collection
function saveCollection(collection: Card[]) {
  localStorage.setItem('mtg-collection', JSON.stringify(collection));
}

// Add a copy
function addCardToCollection(card: Card) {
  const collection = getCollection();
  collection.push(card);
  saveCollection(collection);
}

// Remove a copy
function removeCardFromCollection(card: Card) {
  const collection = getCollection();
  const index = collection.findIndex(c => c.id === card.id);
  if (index !== -1) {
    collection.splice(index, 1); // remove one copy
    saveCollection(collection);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const collectionList = document.getElementById('collection-list') as HTMLDivElement;
  const toggleButton = document.getElementById('toggle-display') as HTMLButtonElement;

  renderCollection(collectionList);

  toggleButton.addEventListener('click', () => {
    showImages = !showImages; // Flip the mode
    renderCollection(collectionList); // Re-render
  });
});

function renderCollection(container: HTMLElement) {
  container.innerHTML = ""; // Clear it before rendering

  const collection = getCollection();

  if (collection.length === 0) {
    container.innerHTML = `<p>You don't own any cards yet.</p>`;
    return;
  }

  // Build a unique list of cards and count how many of each
  const cardCountMap = new Map<string, { card: Card, count: number }>();

  for (const card of collection) {
    if (cardCountMap.has(card.id)) {
      cardCountMap.get(card.id)!.count++;
    } else {
      cardCountMap.set(card.id, { card, count: 1 });
    }
  }

  // Display each unique card
  cardCountMap.forEach(({ card, count }) => {
    const cardDiv = document.createElement('div');

    cardDiv.innerHTML = `
      <h2>${card.name}</h2>
      ${showImages ? `<img src="${card.imageUrl}" alt="${card.name}" style="width:200px;">` : ""}
      <p>
        Copies Owned: <span id="count-${card.id}">${count}</span>
        <button id="decrease-${card.id}">-</button>
        <button id="increase-${card.id}">+</button>
      </p>
      <hr>
    `;
    container.appendChild(cardDiv);

    const increaseButton = document.getElementById(`increase-${card.id}`) as HTMLButtonElement;
    const decreaseButton = document.getElementById(`decrease-${card.id}`) as HTMLButtonElement;

    increaseButton.addEventListener('click', () => {
      addCardToCollection(card);
      updateCount(card.id);
    });

    decreaseButton.addEventListener('click', () => {
      removeCardFromCollection(card);
      updateCount(card.id);
    });
  });
}


  // Build a unique list of cards and count how many of each
  const cardCountMap = new Map<string, { card: Card, count: number }>();

  for (const card of collection) {
    if (cardCountMap.has(card.id)) {
      cardCountMap.get(card.id)!.count++;
    } else {
      cardCountMap.set(card.id, { card, count: 1 });
    }
  }

  // Display each unique card
  cardCountMap.forEach(({ card, count }) => {
    const cardDiv = document.createElement('div');
    cardDiv.innerHTML = `
      <h2>${card.name}</h2>
      <img src="${card.imageUrl}" alt="${card.name}" style="width:200px;">
      <p>
        Copies Owned: <span id="count-${card.id}">${count}</span>
        <button id="decrease-${card.id}">-</button>
        <button id="increase-${card.id}">+</button>
      </p>
      <hr>
    `;
    container.appendChild(cardDiv);

    // Attach button listeners
    const increaseButton = document.getElementById(`increase-${card.id}`) as HTMLButtonElement;
    const decreaseButton = document.getElementById(`decrease-${card.id}`) as HTMLButtonElement;

    increaseButton.addEventListener('click', () => {
      addCardToCollection(card);
      updateCount(card.id);
    });

    decreaseButton.addEventListener('click', () => {
      removeCardFromCollection(card);
      updateCount(card.id);
    });
  });
}

// Update the number shown on screen for a specific card
function updateCount(cardId: string) {
  const collection = getCollection();
  const count = collection.filter(c => c.id === cardId).length;
  const countSpan = document.getElementById(`count-${cardId}`);
  if (countSpan) {
    countSpan.textContent = count.toString();
  }

  // Optional: If count is 0, re-render the collection (hide card completely)
  if (count === 0) {
    const container = document.getElementById('collection-list') as HTMLDivElement;
    renderCollection(container);
  }
}
