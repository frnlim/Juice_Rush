class Customer extends GameObject {
  constructor(wave) {
    super(0, 0, 120, 140);
    this.name = 'Customer';
    this.wave = wave;
    this.recipe = RecipeData_getRandomRecipe(wave);
    this.maxPatience = Math.max(15, 30 - wave * 2);
    this.patience = this.maxPatience;
    this.state = 'waiting'; // waiting, happy, angry, leaving
    this.spriteSheets = [
      'https://api.codewisp.ai/storage/v1/object/public/prototype-chat-images/unsaved/333cf473-52c4-4a40-9c44-fab142499627/23d4ef1e-2586-4eee-aa36-b0d69dedfc8c.png',
      'https://api.codewisp.ai/storage/v1/object/public/prototype-chat-images/unsaved/333cf473-52c4-4a40-9c44-fab142499627/411afbbd-ff7d-4e8a-804b-8e54ffae7126.png',
      'https://api.codewisp.ai/storage/v1/object/public/prototype-chat-images/unsaved/333cf473-52c4-4a40-9c44-fab142499627/595d72f0-9d13-4e22-b9b1-31965eacae7e.png',
      'https://api.codewisp.ai/storage/v1/object/public/prototype-chat-images/unsaved/333cf473-52c4-4a40-9c44-fab142499627/9950cf66-adc6-43cc-94ef-b2fc29859223.png'
    ];
    this.spriteIndex = Math.floor(Math.random() * 4);
    this.spriteSheet = this.spriteSheets[this.spriteIndex];
    // Sprite grid: 5 columns x 2 rows
    // Row 0: idle poses, Row 0 col 3: holding drink (happy), Row 1 col 0-1: angry
    // We'll use specific frames:
    // Idle/waiting: row 0, col 0
    // Happy (with drink): row 0, col 3 (or col 4)
    // Angry: row 1, col 0
    this.frameWidth = 120; // percentage of sprite for one frame
    this.currentFrame = 0;
  }

  update(dt) {
    if (this.state === 'waiting') {
      this.patience -= dt;
      if (this.patience <= 0) {
        this.patience = 0;
        this.state = 'angry';
      }
    }
  }

  getPatiencePercent() {
    return Math.max(0, this.patience / this.maxPatience);
  }

  // Returns CSS background-position for the sprite frame
  getSpritePosition(state) {
    // Each sprite sheet is 5 cols x 2 rows
    // Frame size: 20% width, 50% height
    let col = 0, row = 0;
    switch(state) {
      case 'waiting':
        col = 0; row = 0;
        break;
      case 'happy':
        col = 4; row = 0; // holding drink frame
        break;
      case 'angry':
        col = 1; row = 1; // angry frame
        break;
      default:
        col = 0; row = 0;
    }
    // background-position percentage
    const xPct = (col / 4) * 100; // 5 cols: 0, 25, 50, 75, 100
    const yPct = (row / 1) * 100; // 2 rows: 0, 100
    return `${xPct}% ${yPct}%`;
  }

  draw(ctx) {
    // Customer is drawn via DOM, not canvas
  }
}