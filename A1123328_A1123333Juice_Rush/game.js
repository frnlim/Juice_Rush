const PLAYER_DATA_DEFAULTS = {
  highScore: 0,
  totalCustomersServed: 0,
  bestWave: 0,
  leaderboard: [{ field: 'highScore', label: 'Highest score' }]
};

let playerData = { highScore: 0, totalCustomersServed: 0, bestWave: 0 };

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.particles = [];
    this.scrollX = 0;
    this.scrollY = 0;
    this.lastTime = 0;

    // Game state
    this.state = 'menu'; // menu, playing, paused, gameover
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hearts = 3;
    this.wave = 1;
    this.customersServed = 0;
    this.customersPerWave = 3;
    this.customersInWave = 0;
    this.totalCustomersServed = 0;
    this.gameStartTime = 0;

    // Work state
    this.selectedFruit = null;
    this.fruitCut = false;
    this.blenderFruit = null;
    this.blenderLiquid = null;
    this.blenderIce = false;
    this.blended = false;
    this.cupReady = false;
    this.cupRecipe = null;

    // Current customer
    this.currentCustomer = null;
    this.waitingForCustomer = false;
    this.customerDelay = 0;

    this.setup();
    this.setupInput();
    this.setupResize();
    this.initSaveData();
    this.start();
  }

  async initSaveData() {
    try {
      if (window.SaveData && SaveData.isAvailable()) {
        playerData = await SaveData.getPlayerData(PLAYER_DATA_DEFAULTS);
      }
    } catch(e) {
      // fallback to in-memory
    }
  }

  setup() {
    // Wire RecipeData and AudioManager
    RecipeData_populateRecipeBook();
    AudioManager_init();
    // Store references for wiring validation
    this._recipeData = RecipeData_RECIPES;
    this._audioReady = true;
  }

  setupResize() {
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = this.canvas.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      this.canvas.width = Math.floor(r.width * dpr);
      this.canvas.height = Math.floor(r.height * dpr);
    };
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(this.canvas);
    fit();
  }

  setupInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.state === 'menu') {
        this.startGame();
      }
      if (e.key === 'Escape') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }
    });

    // Buttons
    document.getElementById('btnStart').addEventListener('click', () => this.startGame());
    document.getElementById('btnHowTo').addEventListener('click', () => {
      AudioManager_playClick();
      document.getElementById('startScreen').style.display = 'none';
      document.getElementById('howToScreen').style.display = 'flex';
    });
    document.getElementById('btnRecipes').addEventListener('click', () => {
      AudioManager_playClick();
      document.getElementById('startScreen').style.display = 'none';
      document.getElementById('recipeScreen').style.display = 'flex';
    });
    document.getElementById('btnBackFromHowTo').addEventListener('click', () => {
      AudioManager_playClick();
      document.getElementById('howToScreen').style.display = 'none';
      document.getElementById('startScreen').style.display = 'flex';
    });
    document.getElementById('btnBackFromRecipes').addEventListener('click', () => {
      AudioManager_playClick();
      document.getElementById('recipeScreen').style.display = 'none';
      document.getElementById('startScreen').style.display = 'flex';
    });
    document.getElementById('btnPause').addEventListener('click', () => this.pauseGame());
    document.getElementById('btnResume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btnQuit').addEventListener('click', () => this.quitToMenu());
    document.getElementById('btnRetry').addEventListener('click', () => this.startGame());
    document.getElementById('btnMainMenu').addEventListener('click', () => this.quitToMenu());
    document.getElementById('btnMute').addEventListener('click', () => {
      const muted = AudioManager_toggleMute();
      document.getElementById('btnMute').textContent = muted ? '🔇' : '🔊';
    });

    // Fruit buttons
    document.querySelectorAll('.fruit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.state !== 'playing') return;
        AudioManager_playClick();
        this.selectFruit(btn.dataset.fruit);
      });
    });

    // Cut
    document.getElementById('btnCut').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.cutFruit();
    });

    // Liquids
    document.getElementById('btnWater').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.addLiquid('water');
    });
    document.getElementById('btnMilk').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.addLiquid('milk');
    });
    document.getElementById('btnIce').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.addIce();
    });

    // Blend
    document.getElementById('btnBlend').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.blend();
    });

    // Pour
    document.getElementById('btnPour').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.pour();
    });

    // Serve
    document.getElementById('btnServe').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      this.serve();
    });

    // Trash
    document.getElementById('btnTrash').addEventListener('click', () => {
      if (this.state !== 'playing') return;
      AudioManager_playClick();
      this.trashAll();
    });
  }

  // === GAME FLOW ===
  startGame() {
    AudioManager_playClick();
    this.state = 'playing';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hearts = 3;
    this.wave = 1;
    this.customersServed = 0;
    this.customersInWave = 0;
    this.customersPerWave = 3;
    this.totalCustomersServed = 0;
    this.currentCustomer = null;
    this.entities = [];
    this.particles = [];
    this.gameStartTime = performance.now();

    this.trashAll();
    this.hideAllScreens();
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('gameArea').style.display = 'flex';
    this.updateHUD();
    this.showWaveBanner();
    this.spawnCustomer();
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.getElementById('pauseScreen').style.display = 'flex';
  }

  resumeGame() {
    this.state = 'playing';
    document.getElementById('pauseScreen').style.display = 'none';
  }

  quitToMenu() {
    this.state = 'menu';
    this.hideAllScreens();
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('gameArea').style.display = 'none';
    this.clearCustomerUI();
  }

  async gameOver() {
    this.state = 'gameover';
    AudioManager_playGameOver();

    // Update save data
    if (this.score > playerData.highScore) {
      playerData.highScore = this.score;
    }
    if (this.wave > (playerData.bestWave || 0)) {
      playerData.bestWave = this.wave;
    }
    playerData.totalCustomersServed = (playerData.totalCustomersServed || 0) + this.totalCustomersServed;

    try {
      if (window.SaveData && SaveData.isAvailable()) {
        await SaveData.setPlayerData(playerData);
      }
    } catch(e) {}

    // Leaderboard
    const timeSec = Math.floor((performance.now() - this.gameStartTime) / 1000);
    try {
      if (window.Leaderboard && Leaderboard.isAvailable()) {
        await Leaderboard.finalize(this.score, { wave: this.wave, timeSec });
      }
    } catch(e) {}

    document.getElementById('finalScore').textContent = `💰 SCORE: $${this.score}`;
    document.getElementById('finalWave').textContent = `🌊 Wave ${this.wave} • ${this.totalCustomersServed} customers served`;
    document.getElementById('finalHighScore').textContent = `🏆 Best: $${playerData.highScore}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
  }

  hideAllScreens() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('howToScreen').style.display = 'none';
    document.getElementById('recipeScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
  }

  // === CUSTOMER MANAGEMENT ===
  spawnCustomer() {
    if (this.customersInWave >= this.customersPerWave) {
      this.nextWave();
      return;
    }

    const customer = new Customer(this.wave);
    this.currentCustomer = customer;
    this.entities.push(customer);
    this.customersInWave++;

    // Update DOM
    const sprite = document.getElementById('customerSprite');
    sprite.style.backgroundImage = `url(${customer.spriteSheet})`;
    sprite.style.backgroundPosition = customer.getSpritePosition('waiting');
    sprite.style.backgroundSize = '500% 200%';
    sprite.className = 'customer-sprite enter';
    setTimeout(() => {
      sprite.className = 'customer-sprite breathing';
    }, 600);

    const bubble = document.getElementById('speechBubble');
    const orderText = document.getElementById('orderText');
    orderText.textContent = `${customer.recipe.emoji} ${customer.recipe.name}`;
    bubble.style.display = 'block';

    const pBar = document.getElementById('patienceBar');
    pBar.style.display = 'block';

    this.updateHUD();
  }

  clearCustomerUI() {
    const sprite = document.getElementById('customerSprite');
    sprite.style.backgroundImage = '';
    sprite.className = 'customer-sprite';
    document.getElementById('speechBubble').style.display = 'none';
    document.getElementById('patienceBar').style.display = 'none';
  }

  customerLeaves(happy) {
    const sprite = document.getElementById('customerSprite');
    if (happy) {
      sprite.style.backgroundPosition = this.currentCustomer.getSpritePosition('happy');
      sprite.className = 'customer-sprite happy';
      setTimeout(() => {
        sprite.className = 'customer-sprite leave';
        setTimeout(() => this.afterCustomerLeaves(), 500);
      }, 1500);
    } else {
      sprite.style.backgroundPosition = this.currentCustomer.getSpritePosition('angry');
      sprite.className = 'customer-sprite angry';
      AudioManager_playCustomerAngry();
      setTimeout(() => {
        sprite.className = 'customer-sprite leave';
        setTimeout(() => this.afterCustomerLeaves(), 500);
      }, 1000);
    }
  }

  afterCustomerLeaves() {
    // Remove customer from entities
    const idx = this.entities.indexOf(this.currentCustomer);
    if (idx > -1) this.entities.splice(idx, 1);
    this.currentCustomer = null;
    this.clearCustomerUI();
    this.trashAll();

    if (this.hearts <= 0) {
      this.gameOver();
      return;
    }

    // Spawn next after delay
    this.waitingForCustomer = true;
    this.customerDelay = 1.5;
  }

  nextWave() {
    this.wave++;
    this.customersInWave = 0;
    this.customersPerWave = Math.min(3 + this.wave, 8);

    // Bonus points
    const bonus = this.wave * 10;
    this.score += bonus;
    this.combo = 0;

    AudioManager_playWaveClear();
    this.showWaveBanner();
    this.spawnParticlesAtCenter('#bfff3c', 30);

    // Leaderboard attest during play
    try {
      if (window.Leaderboard && Leaderboard.isAvailable()) {
        Leaderboard.attest(this.score, { wave: this.wave });
      }
    } catch(e) {}

    this.waitingForCustomer = true;
    this.customerDelay = 2.5;
    this.updateHUD();
  }

  showWaveBanner() {
    const banner = document.getElementById('waveBanner');
    const text = document.getElementById('waveBannerText');
    text.textContent = `🌊 WAVE ${this.wave} 🌊`;
    banner.style.display = 'block';
    // Reset animation
    banner.style.animation = 'none';
    banner.offsetHeight; // force reflow
    banner.style.animation = '';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 2000);
  }

  // === WORKFLOW ===
  selectFruit(fruit) {
    if (this.fruitCut || this.blenderFruit) return; // already have fruit in process
    this.selectedFruit = fruit;
    this.fruitCut = false;

    // UI
    document.querySelectorAll('.fruit-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-fruit="${fruit}"]`).classList.add('selected');

    const cuttingFruit = document.getElementById('cuttingFruit');
    cuttingFruit.textContent = RecipeData_FRUIT_EMOJIS[fruit];

    document.getElementById('btnCut').disabled = false;
  }

  cutFruit() {
    if (!this.selectedFruit) return;
    AudioManager_playCut();

    const cuttingFruit = document.getElementById('cuttingFruit');
    cuttingFruit.classList.add('cutting');
    setTimeout(() => cuttingFruit.classList.remove('cutting'), 400);

    this.fruitCut = true;
    this.blenderFruit = this.selectedFruit;
    this.selectedFruit = null;

    // Update UI
    document.getElementById('btnCut').disabled = true;
    document.querySelectorAll('.fruit-btn').forEach(b => b.classList.remove('selected'));

    // Move to blender
    setTimeout(() => {
      cuttingFruit.textContent = '';
      this.updateBlenderUI();
      document.getElementById('btnWater').disabled = false;
      document.getElementById('btnMilk').disabled = false;
      document.getElementById('btnIce').disabled = false;
    }, 400);

    this.spawnParticlesAtCenter('#fbbf24', 8);
  }

  addLiquid(type) {
    if (!this.blenderFruit || this.blenderLiquid) return;
    AudioManager_playClick();
    this.blenderLiquid = type;

    document.getElementById('btnWater').disabled = true;
    document.getElementById('btnMilk').disabled = true;
    if (type === 'water') {
      document.getElementById('btnWater').classList.add('added');
    } else {
      document.getElementById('btnMilk').classList.add('added');
    }

    this.updateBlenderUI();
    this.checkBlendReady();
  }

  addIce() {
    if (!this.blenderFruit || this.blenderIce) return;
    AudioManager_playClick();
    this.blenderIce = true;
    document.getElementById('btnIce').classList.add('added');
    document.getElementById('btnIce').disabled = true;
    this.updateBlenderUI();
    this.checkBlendReady();
  }

  checkBlendReady() {
    if (this.blenderFruit && this.blenderLiquid) {
      document.getElementById('btnBlend').disabled = false;
    }
  }

  updateBlenderUI() {
    const contents = document.getElementById('blenderContents');
    let html = '';
    if (this.blenderFruit) html += RecipeData_FRUIT_EMOJIS[this.blenderFruit];
    if (this.blenderLiquid) html += (this.blenderLiquid === 'water' ? '💧' : '🥛');
    if (this.blenderIce) html += '🧊';
    contents.innerHTML = html;
  }

  blend() {
    if (!this.blenderFruit || !this.blenderLiquid) return;
    AudioManager_playBlend();

    const blenderArea = document.getElementById('blenderArea');
    blenderArea.classList.add('blending');
    document.getElementById('btnBlend').disabled = true;

    setTimeout(() => {
      blenderArea.classList.remove('blending');
      this.blended = true;

      // Determine what juice this is
      this.cupRecipe = RecipeData_checkRecipe(this.blenderFruit, this.blenderLiquid, this.blenderIce);

      const contents = document.getElementById('blenderContents');
      if (this.cupRecipe) {
        contents.innerHTML = `<span style="font-size:1.5rem">🥤</span>`;
      } else {
        contents.innerHTML = `<span style="font-size:1rem">❓</span>`;
      }

      document.getElementById('btnPour').disabled = false;
    }, 1000);

    this.spawnParticlesAtCenter('#b44dff', 10);
  }

  pour() {
    if (!this.blended) return;
    AudioManager_playPour();

    // Move to cup
    const cupContents = document.getElementById('cupContents');
    if (this.cupRecipe) {
      cupContents.textContent = '🥤';
      cupContents.style.color = this.cupRecipe.color;
    } else {
      cupContents.textContent = '❓';
    }

    this.cupReady = true;

    // Clear blender
    document.getElementById('blenderContents').innerHTML = '';
    document.getElementById('btnPour').disabled = true;
    document.getElementById('btnServe').disabled = false;

    this.spawnParticlesAtCenter('#4dc8ff', 8);
  }

  serve() {
    if (!this.cupReady || !this.currentCustomer) return;

    const customer = this.currentCustomer;
    const ordered = customer.recipe;
    const result = document.getElementById('serveResult');
    const resultText = document.getElementById('serveResultText');

    if (this.cupRecipe && this.cupRecipe.name === ordered.name) {
      // CORRECT!
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      const comboBonus = Math.floor(this.combo * 0.5);
      const earnedScore = ordered.price + comboBonus;
      this.score += earnedScore;
      this.customersServed++;
      this.totalCustomersServed++;

      AudioManager_playServeCorrect();
      customer.state = 'happy';

      resultText.textContent = `✅ PERFECT! +$${earnedScore} ${this.combo > 1 ? '🔥x' + this.combo : ''}`;
      result.className = 'serve-result correct';
      this.spawnParticlesAtCenter('#bfff3c', 20);
      this.customerLeaves(true);
    } else {
      // WRONG
      this.combo = 0;
      AudioManager_playServeWrong();

      resultText.textContent = `❌ WRONG ORDER!`;
      result.className = 'serve-result wrong';
      this.spawnParticlesAtCenter('#ff4444', 12);
      // Customer stays, just waste the cup
    }

    result.style.display = 'block';
    result.style.animation = 'none';
    result.offsetHeight;
    result.style.animation = '';
    setTimeout(() => {
      result.style.display = 'none';
    }, 1500);

    // Leaderboard attest
    try {
      if (window.Leaderboard && Leaderboard.isAvailable()) {
        Leaderboard.attest(this.score, { wave: this.wave });
      }
    } catch(e) {}

    this.clearWorkstation();
    this.updateHUD();
  }

  trashAll() {
    this.selectedFruit = null;
    this.fruitCut = false;
    this.blenderFruit = null;
    this.blenderLiquid = null;
    this.blenderIce = false;
    this.blended = false;
    this.cupReady = false;
    this.cupRecipe = null;
    this.clearWorkstation();
  }

  clearWorkstation() {
    this.selectedFruit = null;
    this.fruitCut = false;
    this.blenderFruit = null;
    this.blenderLiquid = null;
    this.blenderIce = false;
    this.blended = false;
    this.cupReady = false;
    this.cupRecipe = null;

    document.querySelectorAll('.fruit-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('cuttingFruit').textContent = '';
    document.getElementById('btnCut').disabled = true;
    document.getElementById('blenderContents').innerHTML = '';
    document.getElementById('btnWater').disabled = true;
    document.getElementById('btnMilk').disabled = true;
    document.getElementById('btnIce').disabled = true;
    document.getElementById('btnWater').classList.remove('added');
    document.getElementById('btnMilk').classList.remove('added');
    document.getElementById('btnIce').classList.remove('added');
    document.getElementById('btnBlend').disabled = true;
    document.getElementById('btnPour').disabled = true;
    document.getElementById('btnServe').disabled = true;
    document.getElementById('cupContents').textContent = '';
  }

  // === HUD ===
  updateHUD() {
    document.getElementById('hudScore').textContent = `💰 $${this.score}`;
    document.getElementById('hudCombo').textContent = this.combo > 0 ? `🔥 x${this.combo}` : '';
    document.getElementById('hudCustomers').textContent = `👤 ${this.customersInWave}/${this.customersPerWave}`;
    document.getElementById('hudWave').textContent = `WAVE ${this.wave}`;

    let heartsStr = '';
    for (let i = 0; i < 3; i++) {
      heartsStr += i < this.hearts ? '❤️' : '🖤';
    }
    document.getElementById('hudHearts').textContent = heartsStr;
  }

  updatePatienceBar() {
    if (!this.currentCustomer || this.currentCustomer.state !== 'waiting') return;
    const pct = this.currentCustomer.getPatiencePercent();
    const fill = document.getElementById('patienceFill');
    fill.style.width = (pct * 100) + '%';

    fill.classList.remove('warning', 'critical');
    if (pct < 0.3) fill.classList.add('critical');
    else if (pct < 0.6) fill.classList.add('warning');
  }

  // === PARTICLES ===
  spawnParticlesAtCenter(color, count) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const p = new Particle(
        cx + (Math.random() - 0.5) * 100,
        cy + (Math.random() - 0.5) * 100,
        color,
        Math.random() > 0.5 ? 'spark' : 'circle'
      );
      this.particles.push(p);
      this.entities.push(p);
    }
  }

  // === COORDINATE HELPERS ===
  screenToWorld(canvasX, canvasY) {
    return { x: canvasX + this.scrollX, y: canvasY + this.scrollY };
  }

  worldToScreen(worldX, worldY) {
    return { x: worldX - this.scrollX, y: worldY - this.scrollY };
  }

  getObjectAt(canvasX, canvasY) {
    const world = this.screenToWorld(canvasX, canvasY);
    for (const entity of this.entities) {
      const b = entity.getBounds();
      if (world.x >= b.x && world.x <= b.x + b.width &&
          world.y >= b.y && world.y <= b.y + b.height) {
        return entity;
      }
    }
    return null;
  }

  // === MAIN LOOP ===
  update(dt) {
    if (this.state !== 'playing') return;

    // Customer patience
    if (this.currentCustomer && this.currentCustomer.state === 'waiting') {
      this.currentCustomer.update(dt);
      this.updatePatienceBar();

      if (this.currentCustomer.state === 'angry') {
        // Patience ran out
        this.hearts--;
        this.combo = 0;
        this.updateHUD();
        this.customerLeaves(false);
      }
    }

    // Waiting for next customer
    if (this.waitingForCustomer) {
      this.customerDelay -= dt;
      if (this.customerDelay <= 0) {
        this.waitingForCustomer = false;
        this.spawnCustomer();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (!this.particles[i].alive) {
        const idx = this.entities.indexOf(this.particles[i]);
        if (idx > -1) this.entities.splice(idx, 1);
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    // Draw background
    this.drawBackground(w, h);

    // Draw particles
    for (const p of this.particles) {
      p.draw(this.ctx);
    }
  }

  drawBackground(w, h) {
    // Dark gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#05020f');
    grad.addColorStop(0.5, '#0c0220');
    grad.addColorStop(1, '#1a0530');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Decorative stars/lights
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 60; i++) {
        this._stars.push({
          x: Math.random(),
          y: Math.random(),
          size: 1 + Math.random() * 2,
          brightness: Math.random(),
          speed: 0.3 + Math.random() * 0.7
        });
      }
    }

    const time = performance.now() / 1000;
    for (const star of this._stars) {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time * star.speed + star.brightness * 6.28));
      this.ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Neon glow at bottom
    const glowGrad = this.ctx.createLinearGradient(0, h * 0.8, 0, h);
    glowGrad.addColorStop(0, 'rgba(255, 77, 184, 0)');
    glowGrad.addColorStop(1, 'rgba(255, 77, 184, 0.05)');
    this.ctx.fillStyle = glowGrad;
    this.ctx.fillRect(0, h * 0.8, w, h * 0.2);
  }

  async start() {
    // Load saved data
    try {
      if (window.SaveData && SaveData.isAvailable()) {
        playerData = await SaveData.getPlayerData(PLAYER_DATA_DEFAULTS);
      }
    } catch(e) {}

    const gameLoop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;
      this.update(dt);
      this.draw();
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }
}