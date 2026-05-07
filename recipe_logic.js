// ==============================
// FRUIT DATABASE
// ==============================
const FRUITS = [
  { id: "mango", name: "Mango", icon: "🥭" },
  { id: "watermelon", name: "Watermelon", icon: "🍉" },
  { id: "passionfruit", name: "Passionfruit", icon: "🟣" },  { id: "apple", name: "Apple", icon: "🍎" },
  { id: "lemon", name: "Lemon", icon: "🍋" },
  { id: "strawberry", name: "Strawberry", icon: "🍓" },
  { id: "banana", name: "Banana", icon: "🍌" },
  { id: "avocado", name: "Avocado", icon: "🥑" }
];

// ==============================
// RECIPE DATABASE
// ==============================
const RECIPES = [
  { name: "Mango Juice", fruits: ["mango"], liquid: "water", ice: true, price: 50 },
  { name: "Watermelon Juice", fruits: ["watermelon"], liquid: "water", ice: true, price: 50 },
  { name: "Passionfruit Juice", fruits: ["passionfruit"], liquid: "water", ice: true, price: 55 },  { name: "Apple Juice", fruits: ["apple"], liquid: "water", ice: true, price: 45 },
  { name: "Lemon Juice", fruits: ["lemon"], liquid: "water", ice: true, price: 40 },

  { name: "Mango Smoothie", fruits: ["mango"], liquid: "milk", ice: true, price: 65 },
  { name: "Strawberry Smoothie", fruits: ["strawberry"], liquid: "milk", ice: true, price: 65 },
  { name: "Banana Milkshake", fruits: ["banana"], liquid: "milk", ice: true, price: 70 },
  { name: "Avocado Milk", fruits: ["avocado"], liquid: "milk", ice: true, price: 75 },
  { name: "Apple Milk", fruits: ["apple"], liquid: "milk", ice: true, price: 60 },

  { name: "Strawberry Banana Smoothie", fruits: ["strawberry", "banana"], liquid: "milk", ice: true, price: 80 }
];

// ==============================
// GAME STATE
// ==============================
let currentOrder = null;
let currentDrink = {};

function resetDrinkLogic() {
  currentDrink = {
    fruits: [],
    cut: false,
    liquid: null,
    ice: false,
    blended: false,
    inCup: false
  };
}

resetDrinkLogic();

// ==============================
// GETTERS
// ==============================
function getFruitById(id) {
  return FRUITS.find(fruit => fruit.id === id);
}

function getCurrentDrink() {
  return currentDrink;
}

function getCurrentOrder() {
  return currentOrder;
}

function createNewOrder() {
  resetDrinkLogic();
  currentOrder = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  return currentOrder;
}

// ==============================
// ACTIONS
// ==============================
function pickFruit(fruitId) {
  if (!currentOrder) return error("No customer order yet.");

  const fruit = getFruitById(fruitId);
  if (!fruit) return error("Invalid fruit.");

  if (currentDrink.cut) return error("Fruit is already cut. Finish this drink or serve it.");
  if (currentDrink.fruits.length >= currentOrder.fruits.length) {
    return error(`This order only needs ${currentOrder.fruits.length} fruit(s).`);
  }

  currentDrink.fruits.push(fruitId);

  if (currentDrink.fruits.length < currentOrder.fruits.length) {
    return success(`Picked ${fruit.name}. Pick one more fruit.`);
  }

  return success(`Picked ${fruit.name}. Now cut the fruit.`);
}

function cutFruit() {
  if (!currentOrder) return error("No customer order yet.");
  if (currentDrink.fruits.length === 0) return error("Pick fruit first.");
  if (currentDrink.fruits.length < currentOrder.fruits.length) {
    return error(`This recipe needs ${currentOrder.fruits.length} fruits.`);
  }
  if (currentDrink.cut) return error("Fruit is already cut.");

  currentDrink.cut = true;
  return success("Cut done. Add water or milk.");
}

function addLiquid(type) {
  if (!currentDrink.cut) return error("Cut the fruit first.");
  if (!["water", "milk"].includes(type)) return error("Invalid liquid.");
  if (currentDrink.liquid) return error("Liquid already added.");

  currentDrink.liquid = type;
  return success(type === "water" ? "Water added. Add ice next." : "Milk added. Add ice next.");
}

function addIce() {
  if (!currentDrink.liquid) return error("Add water or milk first.");
  if (currentDrink.ice) return error("Ice already added.");

  currentDrink.ice = true;
  return success("Ice added. Blend the drink.");
}

function blend() {
  if (!currentDrink.ice) return error("Add ice before blending.");
  if (currentDrink.blended) return error("Drink is already blended.");

  currentDrink.blended = true;
  return success("Blended.");
}

function pour() {
  if (!currentDrink.blended) return error("Blend the drink before pouring.");
  if (currentDrink.inCup) return error("Drink is already in the cup.");

  currentDrink.inCup = true;
  return success("Cup filled. Serve the customer.");
}

// ==============================
// MATCHING LOGIC
// ==============================
function matchRecipe(drink) {
  return RECIPES.find(recipe => {
    if (recipe.fruits.length !== drink.fruits.length) return false;

    const player = [...drink.fruits].sort();
    const target = [...recipe.fruits].sort();

    const fruitsMatch = target.every((fruit, index) => fruit === player[index]);

    return (
      fruitsMatch &&
      recipe.liquid === drink.liquid &&
      recipe.ice === drink.ice
    );
  });
}

function isCurrentOrderMatched() {
  const matchedRecipe = matchRecipe(currentDrink);
  return matchedRecipe && currentOrder && matchedRecipe.name === currentOrder.name
    ? matchedRecipe
    : null;
}

// ==============================
// SERVE
// ==============================
function serve() {
  if (!currentOrder) return error("No customer order yet.");
  if (!currentDrink.inCup) return error("Pour the drink before serving.");

  if (!currentDrink.cut || !currentDrink.blended || !currentDrink.ice || !currentDrink.liquid) {
    return error("Incomplete drink.");
  }

  const recipe = isCurrentOrderMatched();

  if (!recipe) {
    resetDrinkLogic();
    return error("Wrong recipe! Check the order carefully.");
  }

  resetDrinkLogic();
  return {
    ok: true,
    message: "Served " + recipe.name,
    recipe
  };
}

// ==============================
// HELPERS
// ==============================
function success(message) {
  return { ok: true, message };
}

function error(message) {
  return { ok: false, message };
}


function getAllRecipes() {
  return RECIPES;
}
