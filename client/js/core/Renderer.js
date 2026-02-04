/**
 * Nimbus.io - Renderer
 * Sistema de renderizacao do jogo
 */
const Renderer = {
    ctx: null,
    canvas: null,
    minimapCtx: null,
    minimap: null,

    // Sistema de particulas
    particles: [],
    maxParticles: 800,

    // Trilhas magicas
    magicTrails: [],

    // Hit effects
    hitEffects: [],

    // Explosoes de colisao de feiticos
    spellExplosions: [],

    init(canvas, ctx, minimap, minimapCtx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.minimap = minimap;
        this.minimapCtx = minimapCtx;
    },

    // Limpa a tela
    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    // Desenha o grid do fundo
    drawGrid(cameraX, cameraY, mapWidth, mapHeight, gridSize) {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        const startX = Math.floor(cameraX / gridSize) * gridSize - cameraX;
        const startY = Math.floor(cameraY / gridSize) * gridSize - cameraY;

        for (let x = startX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = startY; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    },

    // Desenha borda do mapa
    drawMapBorder(cameraX, cameraY, mapWidth, mapHeight) {
        const ctx = this.ctx;

        // Borda vermelha suave
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(-cameraX, -cameraY, mapWidth, mapHeight);

        // Area fora do mapa (escurecida)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

        // Esquerda
        if (cameraX < 0) {
            ctx.fillRect(0, 0, -cameraX, this.canvas.height);
        }
        // Direita
        if (cameraX + this.canvas.width > mapWidth) {
            ctx.fillRect(mapWidth - cameraX, 0, this.canvas.width - (mapWidth - cameraX), this.canvas.height);
        }
        // Cima
        if (cameraY < 0) {
            ctx.fillRect(0, 0, this.canvas.width, -cameraY);
        }
        // Baixo
        if (cameraY + this.canvas.height > mapHeight) {
            ctx.fillRect(0, mapHeight - cameraY, this.canvas.width, this.canvas.height - (mapHeight - cameraY));
        }
    },

    // Atualiza e desenha particulas
    updateParticles(cameraX, cameraY) {
        const ctx = this.ctx;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Atualiza posicao
            p.x += p.vx;
            p.y += p.vy;

            // Atualiza vida
            if (p.life !== Infinity) {
                p.life--;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            }

            // Desenha particula na tela
            const screenX = p.x - cameraX;
            const screenY = p.y - cameraY;

            // Pula se fora da tela
            if (screenX < -50 || screenX > this.canvas.width + 50 ||
                screenY < -50 || screenY > this.canvas.height + 50) {
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'ambient') {
                // Particulas ambiente (estrelas)
                p.twinkle = (p.twinkle || 0) + 0.05;
                const twinkleAlpha = 0.5 + Math.sin(p.twinkle) * 0.3;
                ctx.globalAlpha = p.alpha * twinkleAlpha;
            }

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    // Adiciona particula
    addParticle(x, y, vx, vy, size, color, life, alpha = 1, type = 'normal') {
        if (this.particles.length >= this.maxParticles) {
            // Remove particulas mais antigas (nao ambient)
            for (let i = 0; i < this.particles.length; i++) {
                if (this.particles[i].type !== 'ambient') {
                    this.particles.splice(i, 1);
                    break;
                }
            }
        }

        this.particles.push({
            x, y, vx, vy, size, color, life, alpha, type
        });
    },

    // Desenha minimap
    drawMinimap(players, creatures, myPlayerId, mapWidth, mapHeight) {
        const ctx = this.minimapCtx;
        const scale = 150 / Math.max(mapWidth, mapHeight);

        // Fundo
        ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
        ctx.fillRect(0, 0, 150, 150);

        // Borda
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 150, 150);

        // Criaturas (pequenos pontos)
        creatures.forEach(c => {
            ctx.fillStyle = c.color || '#FFD700';
            ctx.beginPath();
            ctx.arc(c.x * scale, c.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Jogadores
        Object.values(players).forEach(p => {
            if (p.id === myPlayerId) {
                ctx.fillStyle = '#00FF00';
                ctx.beginPath();
                ctx.arc(p.x * scale, p.y * scale, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color || '#FF0000';
                ctx.beginPath();
                ctx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
};
