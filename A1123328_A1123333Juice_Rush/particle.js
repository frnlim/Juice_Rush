class Particle extends GameObject {
  constructor(x, y, color, type) {
    super(x, y, 6, 6);
    this.name = 'Particle';
    this.color = color || '#fff';
    this.type = type || 'spark';
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = (Math.random() - 0.5) * 200 - 100;
    this.life = 1.0;
    this.decay = 1.5 + Math.random() * 1.5;
    this.size = 3 + Math.random() * 5;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 200 * dt; // gravity
    this.life -= this.decay * dt;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    if (this.type === 'spark') {
      ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}