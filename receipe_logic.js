// ==============================
// 1. RECIPE DATABASE
// ==============================
const RECIPES = [
  { name: "Mango Juice", fruits: ["mango"], liquid: "water", ice: true, price: 50 },
  { name: "Watermelon Juice", fruits: ["watermelon"], liquid: "water", ice: true, price: 50 },
  { name: "Passionfruit Juice", fruits: ["passionfruit"], liquid: "water", ice: true, price: 55 },
  { name: "Pineapple Juice", fruits: ["pineapple"], liquid: "water", ice: true, price: 50 },
  { name: "Apple Juice", fruits: ["apple"], liquid: "water", ice: true, price: 45 },
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
const STEPS = [
  "pickFruit",
  "cutFruit",
  "addLiquid",
  "addIce",
  "blend",
  "pour",
  "serve"
];

let currentDrink = {};
let currentStepIndex = 0;

function resetDrink() {
  currentDrink = {
    fruits: [],
    cut: false,
    liquid: null,
    ice: false,
    blended: false,
    inCup: false
  };
  currentStepIndex = 0;
}

resetDrink();

// ==============================
// STEP CONTROL
// ==============================
function canDoStep(step) {
  return STEPS[currentStepIndex] === step;
}

function nextStep() {
  currentStepIndex++;
}

// ==============================
// ACTIONS
// ==============================
function pickFruit(fruit) {
  if (!canDoStep("pickFruit")) return error("Wrong step!");
  currentDrink.fruits.push(fruit);
  nextStep();
  return success("Picked " + fruit);
}

function cutFruit() {
  if (!canDoStep("cutFruit")) return error("Pick fruit first!");
  currentDrink.cut = true;
  nextStep();
  return success("Cut done");
}

function addLiquid(type) {
  if (!canDoStep("addLiquid")) return error("Cut first!");
  if (!["water", "milk"].includes(type)) return error("Invalid liquid");

  currentDrink.liquid = type;
  nextStep();
  return success(type + " added");
}

function addIce() {
  if (!canDoStep("addIce")) return error("Add liquid first!");
  currentDrink.ice = true;
  nextStep();
  return success("Ice added");
}

function blend() {
  if (!canDoStep("blend")) return error("Add ice first!");
  currentDrink.blended = true;
  nextStep();
  return success("Blended");
}

function pour() {
  if (!canDoStep("pour")) return error("Blend first!");
  currentDrink.inCup = true;
  nextStep();
  return success("Poured");
}

// ==============================
// MATCHING LOGIC
// ==============================
function matchRecipe(drink) {
  return RECIPES.find(recipe => {
    if (recipe.fruits.length !== drink.fruits.length) return false;

    const player = [...drink.fruits].sort();
    const target = [...recipe.fruits].sort();

    const fruitsMatch = target.every((f, i) => f === player[i]);

    return (
      fruitsMatch &&
      recipe.liquid === drink.liquid &&
      recipe.ice === drink.ice
    );
  });
}

// ==============================
// SERVE
// ==============================
function serve() {
  if (!canDoStep("serve")) return error("Pour first!");

  if (!currentDrink.cut || !currentDrink.blended || !currentDrink.inCup) {
    return error("Incomplete drink!");
  }

  const recipe = matchRecipe(currentDrink);

  if (!recipe) {
    resetDrink();
    return error("Wrong recipe!");
  }

  const result = success("Served " + recipe.name + " +" + recipe.price);
  resetDrink();
  return result;
}

// ==============================
// HELPERS
// ==============================
function success(msg) {
  return { ok: true, message: msg };
}

function error(msg) {
  return { ok: false, message: msg };
}