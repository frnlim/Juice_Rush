// Recipe data and utility functions
// Each recipe: name, emoji, fruit, liquid, ice required
const RecipeData_RECIPES = [
  {
    name: 'Banana Juice',
    emoji: '🍌🥤',
    fruit: 'banana',
    liquid: 'water',
    ice: true,
    price: 15,
    color: '#ffe44d'
  },
  {
    name: 'Creamy Avocado',
    emoji: '🥑🥛',
    fruit: 'avocado',
    liquid: 'milk',
    ice: true,
    price: 25,
    color: '#86efac'
  },
  {
    name: 'Mango Splash',
    emoji: '🥭💧',
    fruit: 'mango',
    liquid: 'water',
    ice: true,
    price: 20,
    color: '#fbbf24'
  },
  {
    name: 'Berry Milk',
    emoji: '🍓🥛',
    fruit: 'strawberry',
    liquid: 'milk',
    ice: true,
    price: 22,
    color: '#f472b6'
  },
  {
    name: 'Tropical Mango',
    emoji: '🥭🥛',
    fruit: 'mango',
    liquid: 'milk',
    ice: false,
    price: 18,
    color: '#fdba74'
  },
  {
    name: 'Strawberry Cooler',
    emoji: '🍓💧',
    fruit: 'strawberry',
    liquid: 'water',
    ice: true,
    price: 18,
    color: '#fca5a5'
  },

  // NEW RECIPES
  {
    name: 'Pineapple Chill',
    emoji: '🍍💧',
    fruit: 'pineapple',
    liquid: 'water',
    ice: true,
    price: 24,
    color: '#fde047'
  },
  {
    name: 'Blueberry Shake',
    emoji: '🫐🥛',
    fruit: 'blueberry',
    liquid: 'milk',
    ice: true,
    price: 26,
    color: '#818cf8'
  }
];

const RecipeData_FRUIT_EMOJIS = {
  banana: '🍌',
  mango: '🥭',
  strawberry: '🍓',
  avocado: '🥑',
  pineapple: '🍍',
  blueberry: '🫐'
};

function RecipeData_getRandomRecipe(wave) {
  const maxIdx = Math.min(2 + wave, RecipeData_RECIPES.length);
  const idx = Math.floor(Math.random() * maxIdx);
  return RecipeData_RECIPES[idx];
}

function RecipeData_checkRecipe(fruit, liquid, ice) {
  return RecipeData_RECIPES.find(r =>
    r.fruit === fruit &&
    r.liquid === liquid &&
    r.ice === ice
  ) || null;
}

function RecipeData_getRecipeForOrder(recipeName) {
  return RecipeData_RECIPES.find(r => r.name === recipeName) || null;
}

function RecipeData_populateRecipeBook() {
  const list = document.getElementById('recipeList');
  if (!list) return;

  list.innerHTML = '';

  RecipeData_RECIPES.forEach(r => {
    const card = document.createElement('div');

    card.className = 'recipe-card';

    const iceText = r.ice ? ' + 🧊 Ice' : '';
    const liquidEmoji = r.liquid === 'water' ? '💧' : '🥛';

    card.innerHTML = `
      <h4>${r.emoji} ${r.name}</h4>
      <p>
        ${RecipeData_FRUIT_EMOJIS[r.fruit]}
        ${r.fruit.charAt(0).toUpperCase() + r.fruit.slice(1)}
        + ${liquidEmoji}
        ${r.liquid.charAt(0).toUpperCase() + r.liquid.slice(1)}
        ${iceText}
      </p>
    `;

    list.appendChild(card);
  });
}