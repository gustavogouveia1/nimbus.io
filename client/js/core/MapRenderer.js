/**
 * Nimbus.io - Map Renderer
 * Renderiza o mapa estilo Floresta Proibida
 */
const MapRenderer = {
    ctx: null,
    canvas: null,
    mapConfig: null,
    time: 0,

    // Cache de elementos pre-renderizados
    treeCache: [],
    rockCache: [],
    ruinCache: [],

    // Particulas de ambiente
    fireflies: [],
    mistParticles: [],

    // Cores do tema Floresta Proibida - Sombrio e Realista
    colors: {
        // Fundo - tons muito escuros e sombrios
        bgPrimary: '#050a05',
        bgSecondary: '#0a120a',
        bgAccent: '#101810',
        bgDark: '#020402',

        // Lanes - caminhos de terra escura
        lanePath: '#1a1a18',
        laneBorder: '#0a0a08',
        laneDetail: '#252520',

        // Rio - águas escuras e misteriosas
        riverDeep: '#040810',
        riverShallow: '#081018',
        riverGlow: 'rgba(40, 80, 120, 0.15)',
        riverDark: '#020408',

        // Arvores - muito escuras com tons de verde profundo
        treeTrunk: '#0a0805',
        treeTrunkDark: '#050402',
        treeLeaves: '#050a05',
        treeLeavesLight: '#0a150a',
        treeLeavesGlow: '#152015',
        treeShadow: 'rgba(0, 0, 0, 0.8)',

        // Rochas - cinzas escuros com musgo
        rockDark: '#1a1a1a',
        rockLight: '#2a2a28',
        rockMoss: '#0a1a0a',
        rockShadow: '#080808',

        // Ruinas - pedras antigas desgastadas
        ruinStone: '#1a1a20',
        ruinMoss: '#0a1510',
        ruinGlow: 'rgba(40, 40, 80, 0.15)',
        ruinDark: '#0a0a10',

        // Decoracoes - bioluminescência sutil
        mushroomCap: '#3a1520',
        mushroomGlow: 'rgba(100, 40, 50, 0.2)',
        flowerGlow: 'rgba(60, 100, 60, 0.25)',
        fireflyGlow: 'rgba(120, 150, 80, 0.5)',

        // Nevoa - densa e misteriosa
        mist: 'rgba(20, 30, 20, 0.12)',
        mistDark: 'rgba(5, 10, 5, 0.2)',

        // Vinheta e sombras
        vignette: 'rgba(0, 0, 0, 0.6)',
        ambientShadow: 'rgba(0, 0, 0, 0.4)'
    },

    init(canvas, ctx, mapConfig) {
        console.log('[MapRenderer] init() chamado');
        console.log('[MapRenderer] canvas:', canvas);
        console.log('[MapRenderer] mapConfig:', mapConfig);

        this.canvas = canvas;
        this.ctx = ctx;
        this.mapConfig = mapConfig;

        if (mapConfig && mapConfig.ambientColors) {
            this.colors.bgPrimary = mapConfig.ambientColors.primary || this.colors.bgPrimary;
            this.colors.bgSecondary = mapConfig.ambientColors.secondary || this.colors.bgSecondary;
        }

        // Inicializa fireflies
        this.initFireflies();
        this.initMist();

        console.log('[MapRenderer] inicializado com sucesso!');
    },

    initFireflies() {
        this.fireflies = [];
        if (!this.mapConfig || !this.mapConfig.decorations) return;

        this.mapConfig.decorations
            .filter(d => d.type === 'fireflies')
            .forEach(deco => {
                for (let i = 0; i < (deco.count || 10); i++) {
                    this.fireflies.push({
                        x: deco.x + (Math.random() - 0.5) * 400,
                        y: deco.y + (Math.random() - 0.5) * 400,
                        baseX: deco.x,
                        baseY: deco.y,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.3 + Math.random() * 0.3,
                        size: 2 + Math.random() * 2,
                        brightness: Math.random()
                    });
                }
            });
    },

    initMist() {
        this.mistParticles = [];
        if (!this.mapConfig || !this.mapConfig.decorations) return;

        this.mapConfig.decorations
            .filter(d => d.type === 'mist')
            .forEach(deco => {
                const count = 30;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * (deco.radius || 400);
                    this.mistParticles.push({
                        x: deco.x + Math.cos(angle) * dist,
                        y: deco.y + Math.sin(angle) * dist,
                        size: 100 + Math.random() * 200,
                        alpha: (deco.density || 0.2) * Math.random(),
                        phase: Math.random() * Math.PI * 2
                    });
                }
            });
    },

    update(deltaTime) {
        this.time += deltaTime;

        // Atualiza fireflies
        this.fireflies.forEach(f => {
            f.phase += f.speed * deltaTime;
            f.x = f.baseX + Math.sin(f.phase) * 80 + Math.sin(f.phase * 1.3) * 40;
            f.y = f.baseY + Math.cos(f.phase * 0.7) * 60 + Math.sin(f.phase * 0.9) * 30;
            f.brightness = 0.3 + Math.sin(f.phase * 2) * 0.7;
        });

        // Atualiza mist
        this.mistParticles.forEach(m => {
            m.phase += 0.01 * deltaTime;
            m.x += Math.sin(m.phase) * 0.5;
            m.y += Math.cos(m.phase * 0.7) * 0.3;
        });
    },

    render(cameraX, cameraY) {
        if (!this.mapConfig) {
            console.log('[MapRenderer] render() chamado mas mapConfig é null');
            return;
        }

        // Log apenas uma vez
        if (!this._loggedRender) {
            console.log('[MapRenderer] render() executando com mapConfig válido');
            this._loggedRender = true;
        }

        const ctx = this.ctx;

        // Desenha o fundo base
        this.drawBackground(cameraX, cameraY);

        // Desenha o rio
        this.drawRiver(cameraX, cameraY);

        // Desenha as lanes
        this.drawLanes(cameraX, cameraY);

        // Desenha as bases
        this.drawBases(cameraX, cameraY);

        // Desenha os obstaculos (arvores, rochas, ruinas)
        this.drawObstacles(cameraX, cameraY);

        // Desenha decoracoes
        this.drawDecorations(cameraX, cameraY);

        // Camada de escuridão ambiente
        this.drawAmbientDarkness();

        // Desenha fireflies (brilham na escuridão)
        this.drawFireflies(cameraX, cameraY);

        // Desenha névoa densa (por cima de quase tudo)
        this.drawMist(cameraX, cameraY);

        // Vinheta escura nas bordas (última camada)
        this.drawVignette();
    },

    drawBackground(cameraX, cameraY) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Fundo base - preto profundo
        ctx.fillStyle = this.colors.bgDark;
        ctx.fillRect(0, 0, w, h);

        // Camada de terra escura com variação sutil
        const groundGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
        groundGradient.addColorStop(0, this.colors.bgSecondary);
        groundGradient.addColorStop(0.4, this.colors.bgPrimary);
        groundGradient.addColorStop(1, this.colors.bgDark);
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, 0, w, h);

        // Textura de terreno - folhas caídas e detritos
        const gridSize = 80;
        const startX = Math.floor(cameraX / gridSize) * gridSize - cameraX;
        const startY = Math.floor(cameraY / gridSize) * gridSize - cameraY;

        for (let x = startX - gridSize; x < w + gridSize; x += gridSize) {
            for (let y = startY - gridSize; y < h + gridSize; y += gridSize) {
                const worldX = x + cameraX;
                const worldY = y + cameraY;

                // Noise procedural para variação natural
                const noise1 = Math.sin(worldX * 0.008 + worldY * 0.005) * Math.cos(worldY * 0.007);
                const noise2 = Math.sin(worldX * 0.015) * Math.cos(worldY * 0.012);
                const combinedNoise = (noise1 + noise2) * 0.5;

                // Manchas de musgo escuro
                if (combinedNoise > 0.2) {
                    ctx.fillStyle = 'rgba(8, 15, 8, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x + gridSize / 2, y + gridSize / 2, 15 + combinedNoise * 20, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Folhas caídas
                if (noise1 > 0.4) {
                    ctx.fillStyle = 'rgba(20, 12, 8, 0.3)';
                    ctx.save();
                    ctx.translate(x + gridSize / 2, y + gridSize / 2);
                    ctx.rotate(noise2 * Math.PI);
                    ctx.fillRect(-8, -3, 16, 6);
                    ctx.restore();
                }

                // Pequenas pedras
                if (noise2 > 0.6) {
                    ctx.fillStyle = 'rgba(25, 25, 25, 0.5)';
                    ctx.beginPath();
                    ctx.arc(x + 20, y + 30, 4 + noise1 * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Raízes expostas e detalhes de terreno
        this.drawGroundDetails(cameraX, cameraY);
    },

    drawGroundDetails(cameraX, cameraY) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Desenha raízes expostas aleatórias
        ctx.strokeStyle = 'rgba(15, 10, 5, 0.4)';
        ctx.lineWidth = 2;

        const rootSpacing = 200;
        const startX = Math.floor(cameraX / rootSpacing) * rootSpacing - cameraX;
        const startY = Math.floor(cameraY / rootSpacing) * rootSpacing - cameraY;

        for (let x = startX; x < w + rootSpacing; x += rootSpacing) {
            for (let y = startY; y < h + rootSpacing; y += rootSpacing) {
                const worldX = x + cameraX;
                const worldY = y + cameraY;
                const seed = Math.sin(worldX * 0.01 + worldY * 0.01);

                if (seed > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(
                        x + seed * 40,
                        y + 20,
                        x + seed * 60,
                        y + seed * 30
                    );
                    ctx.stroke();
                }
            }
        }
    },

    drawRiver(cameraX, cameraY) {
        if (!this.mapConfig.river) return;

        const ctx = this.ctx;
        const river = this.mapConfig.river;
        const riverWidth = river.width || 300;

        // Calcula pontos do rio em coordenadas de tela
        const startX = river.start[0] - cameraX;
        const startY = river.start[1] - cameraY;
        const endX = river.end[0] - cameraX;
        const endY = river.end[1] - cameraY;

        // Direcao perpendicular ao rio
        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * riverWidth / 2;
        const ny = dx / len * riverWidth / 2;

        ctx.save();

        // Sombra profunda das margens - mais escura
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(startX - nx - 25, startY - ny - 25);
        ctx.lineTo(startX + nx + 25, startY + ny + 25);
        ctx.lineTo(endX + nx + 25, endY + ny + 25);
        ctx.lineTo(endX - nx - 25, endY - ny - 25);
        ctx.closePath();
        ctx.fill();

        // Margem lodosa
        ctx.fillStyle = 'rgba(10, 8, 5, 0.9)';
        ctx.beginPath();
        ctx.moveTo(startX - nx - 15, startY - ny - 15);
        ctx.lineTo(startX + nx + 15, startY + ny + 15);
        ctx.lineTo(endX + nx + 15, endY + ny + 15);
        ctx.lineTo(endX - nx - 15, endY - ny - 15);
        ctx.closePath();
        ctx.fill();

        // Rio principal - águas escuras e turvas
        const riverGradient = ctx.createLinearGradient(startX - nx, startY - ny, startX + nx, startY + ny);
        riverGradient.addColorStop(0, this.colors.riverDark);
        riverGradient.addColorStop(0.3, this.colors.riverDeep);
        riverGradient.addColorStop(0.5, this.colors.riverShallow);
        riverGradient.addColorStop(0.7, this.colors.riverDeep);
        riverGradient.addColorStop(1, this.colors.riverDark);

        ctx.fillStyle = riverGradient;
        ctx.beginPath();
        ctx.moveTo(startX - nx, startY - ny);
        ctx.lineTo(startX + nx, startY + ny);
        ctx.lineTo(endX + nx, endY + ny);
        ctx.lineTo(endX - nx, endY - ny);
        ctx.closePath();
        ctx.fill();

        // Reflexos sutis na água - muito fracos
        const shimmerOffset = this.time * 20;
        ctx.strokeStyle = this.colors.riverGlow;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([30, 60]);
        ctx.lineDashOffset = -shimmerOffset;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Segunda linha de reflexo mais sutil
        ctx.globalAlpha = 0.15;
        ctx.lineDashOffset = -shimmerOffset * 0.7 + 15;
        ctx.beginPath();
        ctx.moveTo(startX + nx * 0.3, startY + ny * 0.3);
        ctx.lineTo(endX + nx * 0.3, endY + ny * 0.3);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Vegetação nas margens
        this.drawRiverBankVegetation(ctx, startX, startY, endX, endY, nx, ny);

        ctx.restore();
    },

    drawRiverBankVegetation(ctx, startX, startY, endX, endY, nx, ny) {
        // Juncos e plantas nas margens
        ctx.fillStyle = 'rgba(5, 15, 5, 0.6)';

        const segments = 15;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;

            // Lado esquerdo
            if (Math.sin(i * 2.5) > 0.3) {
                ctx.beginPath();
                ctx.moveTo(x - nx - 10, y - ny - 10);
                ctx.lineTo(x - nx - 15, y - ny - 25);
                ctx.lineTo(x - nx - 5, y - ny - 10);
                ctx.fill();
            }

            // Lado direito
            if (Math.cos(i * 2.1) > 0.3) {
                ctx.beginPath();
                ctx.moveTo(x + nx + 10, y + ny + 10);
                ctx.lineTo(x + nx + 15, y + ny + 25);
                ctx.lineTo(x + nx + 5, y + ny + 10);
                ctx.fill();
            }
        }
    },

    drawLanes(cameraX, cameraY) {
        if (!this.mapConfig.lanes) return;

        const ctx = this.ctx;
        const laneWidth = this.mapConfig.lanes.width || 280;

        const mapW = this.mapConfig.width;
        const mapH = this.mapConfig.height;

        ctx.save();

        // Cor base das lanes - terra batida escura
        const laneGradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        laneGradient.addColorStop(0, 'rgba(20, 18, 15, 0.6)');
        laneGradient.addColorStop(0.5, 'rgba(25, 22, 18, 0.5)');
        laneGradient.addColorStop(1, 'rgba(18, 16, 12, 0.6)');

        ctx.fillStyle = laneGradient;

        // Mid lane
        ctx.beginPath();
        ctx.moveTo(100 - cameraX, 100 - cameraY);
        ctx.lineTo(100 + laneWidth - cameraX, 100 - cameraY);
        ctx.lineTo(mapW - 100 - cameraX, mapH - 100 - laneWidth - cameraY);
        ctx.lineTo(mapW - 100 - cameraX, mapH - 100 - cameraY);
        ctx.lineTo(mapW - 100 - laneWidth - cameraX, mapH - 100 - cameraY);
        ctx.lineTo(100 - cameraX, 100 + laneWidth - cameraY);
        ctx.closePath();
        ctx.fill();

        // Top lane
        ctx.beginPath();
        ctx.moveTo(100 - cameraX, 100 - cameraY);
        ctx.lineTo(mapW - 100 - cameraX, 100 - cameraY);
        ctx.lineTo(mapW - 100 - cameraX, 100 + laneWidth - cameraY);
        ctx.lineTo(100 + laneWidth - cameraX, 100 + laneWidth - cameraY);
        ctx.lineTo(100 + laneWidth - cameraX, mapH - 100 - cameraY);
        ctx.lineTo(100 - cameraX, mapH - 100 - cameraY);
        ctx.closePath();
        ctx.fill();

        // Bot lane
        ctx.beginPath();
        ctx.moveTo(mapW - 100 - cameraX, 100 - cameraY);
        ctx.lineTo(mapW - 100 - cameraX, mapH - 100 - cameraY);
        ctx.lineTo(100 - cameraX, mapH - 100 - cameraY);
        ctx.lineTo(100 - cameraX, mapH - 100 - laneWidth - cameraY);
        ctx.lineTo(mapW - 100 - laneWidth - cameraX, mapH - 100 - laneWidth - cameraY);
        ctx.lineTo(mapW - 100 - laneWidth - cameraX, 100 - cameraY);
        ctx.closePath();
        ctx.fill();

        // Detalhes de desgaste nas lanes
        ctx.fillStyle = 'rgba(30, 25, 20, 0.2)';
        this.drawLaneDetails(ctx, cameraX, cameraY, mapW, mapH, laneWidth);

        ctx.restore();
    },

    drawLaneDetails(ctx, cameraX, cameraY, mapW, mapH, laneWidth) {
        // Marcas de desgaste ao longo das lanes
        const spacing = 150;

        // Mid lane details
        for (let i = 0; i < 30; i++) {
            const t = i / 30;
            const x = 100 + (mapW - 200) * t - cameraX;
            const y = 100 + (mapH - 200) * t - cameraY;

            if (x > -50 && x < this.canvas.width + 50 && y > -50 && y < this.canvas.height + 50) {
                // Pedras no caminho
                if (Math.sin(i * 1.5) > 0.5) {
                    ctx.fillStyle = 'rgba(25, 25, 22, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x + laneWidth / 2, y + laneWidth / 2, 8 + Math.sin(i) * 4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Marcas de pegadas/trilha
                ctx.fillStyle = 'rgba(15, 12, 10, 0.2)';
                ctx.beginPath();
                ctx.ellipse(x + laneWidth / 2 + 20, y + laneWidth / 2, 6, 10, Math.sin(i) * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    drawBases(cameraX, cameraY) {
        if (!this.mapConfig.bases) return;

        const ctx = this.ctx;

        Object.entries(this.mapConfig.bases).forEach(([team, base]) => {
            const x = base.x - cameraX;
            const y = base.y - cameraY;
            const radius = base.radius || 400;

            // Verifica se esta na tela
            if (x + radius < -100 || x - radius > this.canvas.width + 100 ||
                y + radius < -100 || y - radius > this.canvas.height + 100) {
                return;
            }

            // Sombra da base
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, radius, 0, Math.PI * 2);
            ctx.fill();

            // Glow da base - muito mais escuro e sutil
            const baseColor = base.color || '#2a1a4a';
            // Escurecer a cor base
            const darkColor = this.darkenColor(baseColor, 0.4);

            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            glowGradient.addColorStop(0, darkColor);
            glowGradient.addColorStop(0.4, 'rgba(15, 10, 25, 0.6)');
            glowGradient.addColorStop(0.7, 'rgba(8, 5, 15, 0.4)');
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Círculo central - mais escuro
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            // Círculo interno
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Runas decorativas (animadas) - muito sutis
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.time * 0.1);

            ctx.strokeStyle = 'rgba(60, 50, 80, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35);
                ctx.lineTo(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5);
                ctx.stroke();
            }

            // Símbolos místicos internos
            ctx.strokeStyle = 'rgba(40, 30, 60, 0.15)';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const nextAngle = ((i + 2) / 6) * Math.PI * 2;
                ctx.moveTo(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25);
                ctx.lineTo(Math.cos(nextAngle) * radius * 0.25, Math.sin(nextAngle) * radius * 0.25);
            }
            ctx.stroke();

            ctx.restore();
        });
    },

    // Função auxiliar para escurecer cores
    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        return `rgb(${newR}, ${newG}, ${newB})`;
    },

    drawObstacles(cameraX, cameraY) {
        if (!this.mapConfig.obstacles) return;

        const ctx = this.ctx;

        this.mapConfig.obstacles.forEach(obstacle => {
            const x = obstacle.x - cameraX;
            const y = obstacle.y - cameraY;

            // Verifica se esta na tela
            const size = obstacle.radius || Math.max(obstacle.width || 0, obstacle.height || 0);
            if (x + size < -100 || x - size > this.canvas.width + 100 ||
                y + size < -100 || y - size > this.canvas.height + 100) {
                return;
            }

            switch (obstacle.type) {
                case 'trees':
                    this.drawTreeCluster(ctx, x, y, obstacle.width, obstacle.height);
                    break;
                case 'rocks':
                    this.drawRock(ctx, x, y, obstacle.radius);
                    break;
                case 'ruins':
                    this.drawRuins(ctx, x, y, obstacle.width, obstacle.height);
                    break;
            }
        });
    },

    drawTreeCluster(ctx, x, y, width, height) {
        ctx.save();

        // Sombra muito densa projetada
        ctx.fillStyle = this.colors.treeShadow;
        ctx.fillRect(x + 15, y + 15, width, height);

        // Sombra da floresta - mais ampla
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 20, y - 20, width + 40, height + 40);

        // Base muito escura
        ctx.fillStyle = this.colors.treeLeaves;
        ctx.fillRect(x, y, width, height);

        // Camada de densidade - escuridão interna
        const densityGradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, Math.max(width, height) / 2
        );
        densityGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        densityGradient.addColorStop(0.7, 'rgba(0, 5, 0, 0.3)');
        densityGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = densityGradient;
        ctx.fillRect(x, y, width, height);

        // Textura de folhas - mais densa e escura
        const leafSize = 25;
        for (let lx = x; lx < x + width; lx += leafSize) {
            for (let ly = y; ly < y + height; ly += leafSize) {
                const offset = Math.sin(lx * 0.08 + ly * 0.08 + this.time * 0.3) * 2;

                // Folhas escuras com variação mínima
                ctx.fillStyle = this.colors.treeLeavesLight;
                ctx.beginPath();
                ctx.arc(lx + leafSize / 2 + offset, ly + leafSize / 2, leafSize / 3, 0, Math.PI * 2);
                ctx.fill();

                // Sombras entre as folhas
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(lx + leafSize / 2 + 5, ly + leafSize / 2 + 5, leafSize / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Troncos escuros visíveis nas bordas
        ctx.fillStyle = this.colors.treeTrunk;
        for (let i = 0; i < 4; i++) {
            const tx = x + (width / 5) * (i + 0.5);
            // Troncos com sombra
            ctx.fillStyle = this.colors.treeTrunkDark;
            ctx.fillRect(tx - 6, y + height - 15, 12, 20);
            ctx.fillRect(tx - 6, y - 5, 12, 20);
            ctx.fillStyle = this.colors.treeTrunk;
            ctx.fillRect(tx - 5, y + height - 15, 10, 20);
            ctx.fillRect(tx - 5, y - 5, 10, 20);
        }

        // Raízes expostas na base
        ctx.fillStyle = 'rgba(8, 5, 3, 0.6)';
        for (let i = 0; i < 5; i++) {
            const rx = x + (width / 6) * (i + 0.5);
            ctx.beginPath();
            ctx.moveTo(rx, y + height);
            ctx.quadraticCurveTo(rx + 10, y + height + 15, rx + 20, y + height + 5);
            ctx.quadraticCurveTo(rx + 10, y + height + 5, rx, y + height);
            ctx.fill();
        }

        // Borda muito escura
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.restore();
    },

    drawRock(ctx, x, y, radius) {
        ctx.save();

        // Sombra profunda
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 8, radius * 1.2, radius * 0.7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Rocha principal - muito mais escura
        const rockGradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,
            x, y, radius
        );
        rockGradient.addColorStop(0, this.colors.rockLight);
        rockGradient.addColorStop(0.5, this.colors.rockDark);
        rockGradient.addColorStop(1, this.colors.rockShadow);

        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Textura de rocha - rachaduras
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.3, y - radius * 0.2);
        ctx.lineTo(x + radius * 0.1, y + radius * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + radius * 0.2, y - radius * 0.4);
        ctx.lineTo(x + radius * 0.4, y + radius * 0.1);
        ctx.stroke();

        // Musgo escuro
        ctx.fillStyle = this.colors.rockMoss;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x - radius * 0.2, y + radius * 0.3, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.3, y + radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Brilho muito sutil - quase imperceptível
        ctx.fillStyle = 'rgba(40, 40, 40, 0.15)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawRuins(ctx, x, y, width, height) {
        ctx.save();

        // Sombra profunda
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x + 10, y + 10, width, height);

        // Base das ruinas - pedra escura desgastada
        const ruinGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        ruinGradient.addColorStop(0, this.colors.ruinStone);
        ruinGradient.addColorStop(0.5, this.colors.ruinDark);
        ruinGradient.addColorStop(1, this.colors.ruinStone);
        ctx.fillStyle = ruinGradient;
        ctx.fillRect(x, y, width, height);

        // Textura de pedras antigas - mais detalhada
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2 * (i + 0.5), y);
            ctx.lineTo(x + width * 0.2 * (i + 0.5) + 8, y + height);
            ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + height * 0.25 * (i + 1));
            ctx.lineTo(x + width, y + height * 0.25 * (i + 1) + 3);
            ctx.stroke();
        }

        // Desgaste e erosão
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 15, y);
        ctx.lineTo(x, y + 20);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + width, y + height);
        ctx.lineTo(x + width - 20, y + height);
        ctx.lineTo(x + width, y + height - 15);
        ctx.fill();

        // Musgo escuro nas ruinas
        ctx.fillStyle = this.colors.ruinMoss;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width * 0.4, y + height);
        ctx.lineTo(x + width * 0.25, y + height * 0.6);
        ctx.lineTo(x, y + height * 0.7);
        ctx.closePath();
        ctx.fill();

        // Segundo patch de musgo
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height * 0.3);
        ctx.lineTo(x + width * 0.7, y + height * 0.2);
        ctx.lineTo(x + width * 0.8, y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Brilho místico muito sutil - quase imperceptível
        const glowGradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width * 0.8
        );
        glowGradient.addColorStop(0, this.colors.ruinGlow);
        glowGradient.addColorStop(1, 'rgba(20, 20, 40, 0)');

        ctx.fillStyle = glowGradient;
        ctx.globalAlpha = 0.15 + Math.sin(this.time * 0.8) * 0.08;
        ctx.fillRect(x - 15, y - 15, width + 30, height + 30);
        ctx.globalAlpha = 1;

        ctx.restore();
    },

    drawDecorations(cameraX, cameraY) {
        if (!this.mapConfig.decorations) return;

        const ctx = this.ctx;

        this.mapConfig.decorations.forEach(deco => {
            const x = deco.x - cameraX;
            const y = deco.y - cameraY;

            // Verifica se esta na tela
            if (x < -200 || x > this.canvas.width + 200 ||
                y < -200 || y > this.canvas.height + 200) {
                return;
            }

            switch (deco.type) {
                case 'mushroom_cluster':
                    this.drawMushroomCluster(ctx, x, y, deco.scale || 1);
                    break;
                case 'fallen_log':
                    this.drawFallenLog(ctx, x, y, deco.rotation || 0);
                    break;
                case 'ancient_tree':
                    this.drawAncientTree(ctx, x, y, deco.scale || 1);
                    break;
                case 'glowing_flowers':
                    this.drawGlowingFlowers(ctx, x, y, deco.count || 8);
                    break;
            }
        });
    },

    drawMushroomCluster(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Sombra do cluster
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(5, 15, 35, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenha cogumelos mais escuros e realistas
        const positions = [
            { x: 0, y: 0, size: 1 },
            { x: 25, y: -10, size: 0.7 },
            { x: -20, y: 5, size: 0.8 },
            { x: 10, y: 15, size: 0.6 },
        ];

        positions.forEach(pos => {
            const mSize = 15 * pos.size;

            // Tronco escuro
            ctx.fillStyle = '#3a3530';
            ctx.fillRect(pos.x - mSize * 0.3, pos.y, mSize * 0.6, mSize);

            // Chapeu escuro
            ctx.fillStyle = this.colors.mushroomCap;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, mSize, mSize * 0.6, 0, Math.PI, 0);
            ctx.fill();

            // Sombra no chapéu
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(pos.x + 3, pos.y + 2, mSize * 0.7, mSize * 0.4, 0, Math.PI, 0);
            ctx.fill();

            // Bioluminescência muito sutil
            ctx.fillStyle = this.colors.mushroomGlow;
            ctx.globalAlpha = 0.1 + Math.sin(this.time * 1.5 + pos.x) * 0.08;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y - mSize * 0.2, mSize * 0.8, mSize * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Pintas escuras
            ctx.fillStyle = '#2a2020';
            ctx.beginPath();
            ctx.arc(pos.x - mSize * 0.3, pos.y - mSize * 0.2, 2 * pos.size, 0, Math.PI * 2);
            ctx.arc(pos.x + mSize * 0.2, pos.y - mSize * 0.3, 1.5 * pos.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    },

    drawFallenLog(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);

        // Sombra do tronco
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-55, 5, 115, 15);

        // Tronco caído - mais escuro e decomposto
        const logGradient = ctx.createLinearGradient(-60, -12, -60, 12);
        logGradient.addColorStop(0, '#1a1510');
        logGradient.addColorStop(0.3, this.colors.treeTrunk);
        logGradient.addColorStop(0.7, this.colors.treeTrunkDark);
        logGradient.addColorStop(1, '#0a0805');

        ctx.fillStyle = logGradient;
        ctx.fillRect(-60, -12, 120, 24);

        // Textura de casca
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(-50 + i * 15, -10);
            ctx.lineTo(-48 + i * 15, 10);
            ctx.stroke();
        }

        // Anéis do tronco nas pontas - escuros
        ctx.fillStyle = '#15100a';
        ctx.beginPath();
        ctx.ellipse(-60, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(60, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Anéis internos
        ctx.strokeStyle = '#201510';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-60, 0, 5, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-60, 0, 2, 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Musgo escuro
        ctx.fillStyle = this.colors.rockMoss;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-45, -14, 35, 5);
        ctx.fillRect(5, -14, 30, 5);

        // Fungos no tronco
        ctx.fillStyle = '#252015';
        ctx.beginPath();
        ctx.ellipse(-20, -12, 8, 4, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(25, -12, 6, 3, 0, Math.PI, 0);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawAncientTree(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Sombra projetada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(15, 25, 70, 30, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tronco grosso e escuro
        ctx.fillStyle = this.colors.treeTrunkDark;
        ctx.beginPath();
        ctx.moveTo(-35, 5);
        ctx.lineTo(-28, -85);
        ctx.lineTo(28, -85);
        ctx.lineTo(35, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this.colors.treeTrunk;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(-25, -80);
        ctx.lineTo(25, -80);
        ctx.lineTo(30, 0);
        ctx.closePath();
        ctx.fill();

        // Textura do tronco - casca
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-20 + i * 8, -10 - i * 10);
            ctx.lineTo(-18 + i * 8, -30 - i * 12);
            ctx.stroke();
        }

        // Raizes massivas
        ctx.fillStyle = this.colors.treeTrunk;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.quadraticCurveTo(-55, 15, -70, 25);
        ctx.quadraticCurveTo(-55, 25, -30, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.quadraticCurveTo(55, 15, 70, 25);
        ctx.quadraticCurveTo(55, 25, 30, 10);
        ctx.fill();

        // Copa da arvore - muito escura
        ctx.fillStyle = 'rgba(0, 5, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(0, -100, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.treeLeaves;
        ctx.beginPath();
        ctx.arc(0, -100, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.treeLeavesLight;
        ctx.beginPath();
        ctx.arc(-15, -110, 30, 0, Math.PI * 2);
        ctx.fill();

        // Escuridão interna da copa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(10, -90, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawGlowingFlowers(ctx, x, y, count) {
        ctx.save();

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 20 + Math.sin(i * 2.5) * 15;
            const fx = x + Math.cos(angle) * dist;
            const fy = y + Math.sin(angle) * dist;

            // Bioluminescência muito sutil
            ctx.fillStyle = this.colors.flowerGlow;
            ctx.globalAlpha = 0.12 + Math.sin(this.time * 1.2 + i) * 0.08;
            ctx.beginPath();
            ctx.arc(fx, fy, 6, 0, Math.PI * 2);
            ctx.fill();

            // Flor escura com centro bioluminescente
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#1a2a1a';
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Centro brilhante sutil
            ctx.globalAlpha = 0.4 + Math.sin(this.time * 1.5 + i * 0.5) * 0.2;
            ctx.fillStyle = '#3a5a3a';
            ctx.beginPath();
            ctx.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawFireflies(cameraX, cameraY) {
        const ctx = this.ctx;

        this.fireflies.forEach(f => {
            const x = f.x - cameraX;
            const y = f.y - cameraY;

            if (x < -50 || x > this.canvas.width + 50 ||
                y < -50 || y > this.canvas.height + 50) {
                return;
            }

            // Brilho externo suave - mais sutil na escuridão
            ctx.fillStyle = this.colors.fireflyGlow;
            ctx.globalAlpha = f.brightness * 0.2;
            ctx.beginPath();
            ctx.arc(x, y, f.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Halo médio
            ctx.globalAlpha = f.brightness * 0.35;
            ctx.fillStyle = 'rgba(100, 120, 60, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, f.size * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Centro brilhante - cor mais natural
            ctx.globalAlpha = f.brightness * 0.8;
            ctx.fillStyle = '#a0b080';
            ctx.beginPath();
            ctx.arc(x, y, f.size * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        });
    },

    drawMist(cameraX, cameraY) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Névoa de partículas - mais densa
        this.mistParticles.forEach(m => {
            const x = m.x - cameraX;
            const y = m.y - cameraY;

            if (x + m.size < 0 || x - m.size > w ||
                y + m.size < 0 || y - m.size > h) {
                return;
            }

            // Névoa escura
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, m.size);
            gradient.addColorStop(0, this.colors.mist);
            gradient.addColorStop(0.5, this.colors.mistDark);
            gradient.addColorStop(1, 'rgba(5, 10, 5, 0)');

            ctx.fillStyle = gradient;
            ctx.globalAlpha = m.alpha * 1.5 * (0.7 + Math.sin(m.phase) * 0.3);
            ctx.beginPath();
            ctx.arc(x, y, m.size * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Névoa ambiente geral - cobertura sutil
        ctx.fillStyle = 'rgba(5, 10, 5, 0.08)';
        ctx.fillRect(0, 0, w, h);
    },

    // Desenha vinheta escura nas bordas
    drawVignette() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Vinheta radial escura
        const vignetteGradient = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.3,
            w / 2, h / 2, Math.max(w, h) * 0.8
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        vignetteGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.5)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, w, h);
    },

    // Adiciona camada de escuridão ambiente
    drawAmbientDarkness() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Escuridão geral sutil
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);

        // Variação de luz ambiente (simulando nuvens passando)
        const ambientPulse = Math.sin(this.time * 0.1) * 0.03;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + ambientPulse})`;
        ctx.fillRect(0, 0, w, h);
    },

    // Renderiza os obstaculos no minimap
    drawMinimap(minimapCtx, scale) {
        if (!this.mapConfig || !this.mapConfig.obstacles) return;

        // Desenha rio no minimap
        if (this.mapConfig.river) {
            const river = this.mapConfig.river;
            minimapCtx.strokeStyle = '#1a4a6a';
            minimapCtx.lineWidth = 3;
            minimapCtx.beginPath();
            minimapCtx.moveTo(river.start[0] * scale, river.start[1] * scale);
            minimapCtx.lineTo(river.end[0] * scale, river.end[1] * scale);
            minimapCtx.stroke();
        }

        // Desenha obstaculos
        this.mapConfig.obstacles.forEach(obstacle => {
            if (obstacle.type === 'trees') {
                minimapCtx.fillStyle = 'rgba(30, 60, 30, 0.8)';
                minimapCtx.fillRect(
                    obstacle.x * scale,
                    obstacle.y * scale,
                    obstacle.width * scale,
                    obstacle.height * scale
                );
            } else if (obstacle.type === 'rocks') {
                minimapCtx.fillStyle = 'rgba(80, 80, 80, 0.8)';
                minimapCtx.beginPath();
                minimapCtx.arc(
                    obstacle.x * scale,
                    obstacle.y * scale,
                    obstacle.radius * scale,
                    0, Math.PI * 2
                );
                minimapCtx.fill();
            } else if (obstacle.type === 'ruins') {
                minimapCtx.fillStyle = 'rgba(80, 80, 100, 0.8)';
                minimapCtx.fillRect(
                    obstacle.x * scale,
                    obstacle.y * scale,
                    obstacle.width * scale,
                    obstacle.height * scale
                );
            }
        });

        // Desenha bases
        if (this.mapConfig.bases) {
            Object.values(this.mapConfig.bases).forEach(base => {
                minimapCtx.fillStyle = base.color || '#4a3a6a';
                minimapCtx.globalAlpha = 0.5;
                minimapCtx.beginPath();
                minimapCtx.arc(
                    base.x * scale,
                    base.y * scale,
                    base.radius * scale,
                    0, Math.PI * 2
                );
                minimapCtx.fill();
                minimapCtx.globalAlpha = 1;
            });
        }
    }
};
