// src/card-vault/lookup.ts

// Define a basic Card type
export type Card = {
    id: string;
    name: string;
    imageUrl: string;
  };
  
  
  // Helper to grab elements
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchButton = document.getElementById('search-button') as HTMLButtonElement;
  const searchResult = document.getElementById('search-result') as HTMLDivElement;
  
  // Attach a click listener
  searchButton?.addEventListener('click', async () => {
    const cardName = searchInput.value.trim();
    if (!cardName) return;
  
    const cards = await fetchCards(cardName);
    if (cards.length > 0) {
      displayCards(cards);
    } else {
      searchResult.innerHTML = `<p>No cards found!</p>`;
    }
  });
  
  // Fetch card from Scryfall
  async function fetchCards(name: string): Promise<Card[]> {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
      const data = await response.json();
  
      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }
  
      const cards: Card[] = data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_uris?.normal || ''
      }));
  
      return cards;
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }
  
  
  // Display the card info
  function displayCards(cards: Card[]) {
  searchResult.innerHTML = ""; // Clear old results

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

    const increaseButton = document.getElementById(`increase-${card.id}`) as HTMLButtonElement;
    const decreaseButton = document.getElementById(`decrease-${card.id}`) as HTMLButtonElement;

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


  function removeCardFromCollection(card: Card) {
    const collection = getCollection();
    const index = collection.findIndex(c => c.id === card.id);
    if (index !== -1) {
      collection.splice(index, 1); // remove ONE copy
      localStorage.setItem('mtg-collection', JSON.stringify(collection));
    }
  }

  function updateCountDisplay(card: Card) {
    const collection = getCollection();
    const count = collection.filter(c => c.id === card.id).length;
    const countSpan = document.getElementById(`collection-count-${card.id}`);
    if (countSpan) {
      countSpan.textContent = count.toString();
    }
  }
  

  // Save to localStorage
  function addCardToCollection(card: Card) {
    const collection = getCollection();
    collection.push(card);
    localStorage.setItem('mtg-collection', JSON.stringify(collection));

  }
  
  // Read from localStorage
  function getCollection(): Card[] {
    const stored = localStorage.getItem('mtg-collection');
    return stored ? JSON.parse(stored) : [];
  }
  