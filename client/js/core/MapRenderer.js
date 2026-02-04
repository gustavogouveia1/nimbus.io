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

    // Cores do tema Floresta Mágica - Estilo LoL Mobile (Vibrante e Realista)
    colors: {
        // Fundo - grama verde vibrante com tons naturais
        bgPrimary: '#2d5a1e',
        bgSecondary: '#3d6b2a',
        bgAccent: '#4a7d35',
        bgDark: '#1e4512',

        // Lanes - caminhos de terra batida natural
        lanePath: '#8b7355',
        laneBorder: '#6b5a45',
        laneDetail: '#a08060',

        // Rio - águas cristalinas azuis
        riverDeep: '#1a5a8a',
        riverShallow: '#3498db',
        riverGlow: 'rgba(100, 200, 255, 0.4)',
        riverDark: '#0d4a75',
        riverFoam: 'rgba(255, 255, 255, 0.3)',

        // Arvores - verdes exuberantes e naturais
        treeTrunk: '#5d4037',
        treeTrunkDark: '#3e2723',
        treeLeaves: '#2e7d32',
        treeLeavesLight: '#4caf50',
        treeLeavesGlow: '#66bb6a',
        treeShadow: 'rgba(0, 40, 0, 0.4)',

        // Rochas - cinzas naturais com musgo verde
        rockDark: '#5d5d5d',
        rockLight: '#8a8a8a',
        rockMoss: '#558b2f',
        rockShadow: '#3a3a3a',

        // Ruinas - pedras antigas com atmosfera mística
        ruinStone: '#7d7d8a',
        ruinMoss: '#689f38',
        ruinGlow: 'rgba(180, 160, 220, 0.3)',
        ruinDark: '#5a5a65',

        // Decoracoes - cores vibrantes e mágicas
        mushroomCap: '#c0392b',
        mushroomGlow: 'rgba(255, 100, 100, 0.4)',
        flowerGlow: 'rgba(150, 255, 150, 0.5)',
        fireflyGlow: 'rgba(255, 255, 150, 0.8)',

        // Nevoa - leve e etérea
        mist: 'rgba(200, 220, 200, 0.08)',
        mistDark: 'rgba(150, 180, 150, 0.06)',

        // Vinheta e sombras - muito mais suaves
        vignette: 'rgba(0, 30, 0, 0.25)',
        ambientShadow: 'rgba(0, 20, 0, 0.15)'
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

        // Fundo base - verde grama vibrante
        ctx.fillStyle = this.colors.bgPrimary;
        ctx.fillRect(0, 0, w, h);

        // Gradiente de iluminação ambiente (luz do sol)
        const sunGradient = ctx.createRadialGradient(w * 0.3, h * 0.3, 0, w / 2, h / 2, w * 0.9);
        sunGradient.addColorStop(0, this.colors.bgAccent);
        sunGradient.addColorStop(0.3, this.colors.bgSecondary);
        sunGradient.addColorStop(0.6, this.colors.bgPrimary);
        sunGradient.addColorStop(1, this.colors.bgDark);
        ctx.fillStyle = sunGradient;
        ctx.fillRect(0, 0, w, h);

        // Textura de grama detalhada
        const gridSize = 60;
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

                // Variações de grama mais clara (luz do sol)
                if (combinedNoise > 0.2) {
                    ctx.fillStyle = 'rgba(90, 160, 60, 0.25)';
                    ctx.beginPath();
                    ctx.arc(x + gridSize / 2, y + gridSize / 2, 18 + combinedNoise * 15, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Tufos de grama mais escura (sombra)
                if (combinedNoise < -0.2) {
                    ctx.fillStyle = 'rgba(30, 70, 20, 0.3)';
                    ctx.beginPath();
                    ctx.arc(x + gridSize / 2, y + gridSize / 2, 12 + Math.abs(combinedNoise) * 10, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Folhas caídas coloridas
                if (noise1 > 0.5) {
                    const leafColors = ['rgba(180, 100, 40, 0.4)', 'rgba(200, 150, 50, 0.35)', 'rgba(150, 80, 30, 0.35)'];
                    ctx.fillStyle = leafColors[Math.floor(Math.abs(noise2) * 3)];
                    ctx.save();
                    ctx.translate(x + gridSize / 2, y + gridSize / 2);
                    ctx.rotate(noise2 * Math.PI);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Pequenas flores silvestres
                if (noise2 > 0.7) {
                    const flowerColors = ['rgba(255, 200, 100, 0.6)', 'rgba(255, 150, 200, 0.5)', 'rgba(200, 200, 255, 0.5)'];
                    ctx.fillStyle = flowerColors[Math.floor(Math.abs(noise1) * 3)];
                    ctx.beginPath();
                    ctx.arc(x + 25, y + 35, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Pequenas pedras naturais
                if (noise1 < -0.5 && noise2 > 0.3) {
                    ctx.fillStyle = 'rgba(120, 110, 100, 0.5)';
                    ctx.beginPath();
                    ctx.arc(x + 20, y + 30, 4 + Math.abs(noise1) * 2, 0, Math.PI * 2);
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

        // Desenha raízes expostas com tons de marrom natural
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.35)';
        ctx.lineWidth = 3;

        const rootSpacing = 180;
        const startX = Math.floor(cameraX / rootSpacing) * rootSpacing - cameraX;
        const startY = Math.floor(cameraY / rootSpacing) * rootSpacing - cameraY;

        for (let x = startX; x < w + rootSpacing; x += rootSpacing) {
            for (let y = startY; y < h + rootSpacing; y += rootSpacing) {
                const worldX = x + cameraX;
                const worldY = y + cameraY;
                const seed = Math.sin(worldX * 0.01 + worldY * 0.01);

                if (seed > 0.35) {
                    // Raiz principal
                    ctx.strokeStyle = 'rgba(100, 70, 40, 0.4)';
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(
                        x + seed * 45,
                        y + 25,
                        x + seed * 70,
                        y + seed * 35
                    );
                    ctx.stroke();

                    // Ramificação menor
                    ctx.strokeStyle = 'rgba(80, 55, 30, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + seed * 30, y + 15);
                    ctx.quadraticCurveTo(
                        x + seed * 40,
                        y + 30,
                        x + seed * 35,
                        y + seed * 40
                    );
                    ctx.stroke();
                    ctx.lineWidth = 3;
                }
            }
        }

        // Adiciona grama alta ocasional
        ctx.fillStyle = 'rgba(60, 130, 40, 0.4)';
        const grassSpacing = 120;
        const grassStartX = Math.floor(cameraX / grassSpacing) * grassSpacing - cameraX;
        const grassStartY = Math.floor(cameraY / grassSpacing) * grassSpacing - cameraY;

        for (let x = grassStartX; x < w + grassSpacing; x += grassSpacing) {
            for (let y = grassStartY; y < h + grassSpacing; y += grassSpacing) {
                const worldX = x + cameraX;
                const worldY = y + cameraY;
                const seed = Math.cos(worldX * 0.012 + worldY * 0.008);

                if (seed > 0.5) {
                    // Tufo de grama alta
                    for (let i = 0; i < 5; i++) {
                        const angle = (i - 2) * 0.15 + Math.sin(this.time * 0.5 + worldX) * 0.05;
                        ctx.save();
                        ctx.translate(x + i * 4, y);
                        ctx.rotate(angle);
                        ctx.fillStyle = i % 2 === 0 ? 'rgba(70, 140, 50, 0.5)' : 'rgba(50, 120, 35, 0.5)';
                        ctx.fillRect(-1, -15 - seed * 8, 2, 15 + seed * 8);
                        ctx.restore();
                    }
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

        // Margem de areia/terra úmida
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.moveTo(startX - nx - 30, startY - ny - 30);
        ctx.lineTo(startX + nx + 30, startY + ny + 30);
        ctx.lineTo(endX + nx + 30, endY + ny + 30);
        ctx.lineTo(endX - nx - 30, endY - ny - 30);
        ctx.closePath();
        ctx.fill();

        // Margem com pedrinhas
        ctx.fillStyle = '#7a6550';
        ctx.beginPath();
        ctx.moveTo(startX - nx - 18, startY - ny - 18);
        ctx.lineTo(startX + nx + 18, startY + ny + 18);
        ctx.lineTo(endX + nx + 18, endY + ny + 18);
        ctx.lineTo(endX - nx - 18, endY - ny - 18);
        ctx.closePath();
        ctx.fill();

        // Rio principal - águas cristalinas azuis
        const riverGradient = ctx.createLinearGradient(startX - nx, startY - ny, startX + nx, startY + ny);
        riverGradient.addColorStop(0, this.colors.riverDark);
        riverGradient.addColorStop(0.15, this.colors.riverDeep);
        riverGradient.addColorStop(0.35, this.colors.riverShallow);
        riverGradient.addColorStop(0.5, '#5dade2');
        riverGradient.addColorStop(0.65, this.colors.riverShallow);
        riverGradient.addColorStop(0.85, this.colors.riverDeep);
        riverGradient.addColorStop(1, this.colors.riverDark);

        ctx.fillStyle = riverGradient;
        ctx.beginPath();
        ctx.moveTo(startX - nx, startY - ny);
        ctx.lineTo(startX + nx, startY + ny);
        ctx.lineTo(endX + nx, endY + ny);
        ctx.lineTo(endX - nx, endY - ny);
        ctx.closePath();
        ctx.fill();

        // Reflexos de luz na água
        const shimmerOffset = this.time * 40;
        ctx.strokeStyle = this.colors.riverGlow;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([40, 80]);
        ctx.lineDashOffset = -shimmerOffset;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Reflexos secundários
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.lineDashOffset = -shimmerOffset * 0.6 + 30;
        ctx.beginPath();
        ctx.moveTo(startX + nx * 0.4, startY + ny * 0.4);
        ctx.lineTo(endX + nx * 0.4, endY + ny * 0.4);
        ctx.stroke();

        // Terceira linha de reflexo
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1.5;
        ctx.lineDashOffset = -shimmerOffset * 1.2 - 20;
        ctx.beginPath();
        ctx.moveTo(startX - nx * 0.3, startY - ny * 0.3);
        ctx.lineTo(endX - nx * 0.3, endY - ny * 0.3);
        ctx.stroke();

        ctx.setLineDash([]);

        // Espuma nas bordas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const segments = 25;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            const waveOffset = Math.sin(this.time * 2 + i * 0.5) * 3;

            // Espuma lado esquerdo
            ctx.beginPath();
            ctx.arc(x - nx + waveOffset, y - ny + waveOffset, 4 + Math.sin(i * 0.8) * 2, 0, Math.PI * 2);
            ctx.fill();

            // Espuma lado direito
            ctx.beginPath();
            ctx.arc(x + nx - waveOffset, y + ny - waveOffset, 4 + Math.cos(i * 0.8) * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Vegetação nas margens
        this.drawRiverBankVegetation(ctx, startX, startY, endX, endY, nx, ny);

        ctx.restore();
    },

    drawRiverBankVegetation(ctx, startX, startY, endX, endY, nx, ny) {
        const segments = 20;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            const waveOffset = Math.sin(this.time * 0.8 + i * 0.3) * 2;

            // Juncos lado esquerdo
            if (Math.sin(i * 2.5) > 0.2) {
                // Folhas de junco
                for (let j = 0; j < 3; j++) {
                    const jOffset = (j - 1) * 5;
                    ctx.fillStyle = j === 1 ? '#4caf50' : '#388e3c';
                    ctx.save();
                    ctx.translate(x - nx - 12 + jOffset, y - ny - 12);
                    ctx.rotate((waveOffset + jOffset) * 0.03);
                    ctx.fillRect(-1.5, -25, 3, 25);
                    ctx.restore();
                }
            }

            // Juncos lado direito
            if (Math.cos(i * 2.1) > 0.2) {
                for (let j = 0; j < 3; j++) {
                    const jOffset = (j - 1) * 5;
                    ctx.fillStyle = j === 1 ? '#66bb6a' : '#43a047';
                    ctx.save();
                    ctx.translate(x + nx + 12 + jOffset, y + ny + 12);
                    ctx.rotate((-waveOffset + jOffset) * 0.03);
                    ctx.fillRect(-1.5, -25, 3, 25);
                    ctx.restore();
                }
            }

            // Lírios d'água ocasionais
            if (i % 4 === 0) {
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.ellipse(x - nx * 0.5, y - ny * 0.5, 12, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Flor do lírio
                ctx.fillStyle = '#f8bbd9';
                ctx.beginPath();
                ctx.arc(x - nx * 0.5, y - ny * 0.5, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(x - nx * 0.5, y - ny * 0.5, 2, 0, Math.PI * 2);
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

        // Borda das lanes - grama pisoteada
        ctx.fillStyle = 'rgba(90, 120, 50, 0.4)';

        // Cor base das lanes - terra batida natural (marrom claro)
        const laneGradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        laneGradient.addColorStop(0, '#a08060');
        laneGradient.addColorStop(0.3, '#8b7355');
        laneGradient.addColorStop(0.5, '#9a8268');
        laneGradient.addColorStop(0.7, '#8b7355');
        laneGradient.addColorStop(1, '#7a6550');

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
        this.drawLaneDetails(ctx, cameraX, cameraY, mapW, mapH, laneWidth);

        ctx.restore();
    },

    drawLaneDetails(ctx, cameraX, cameraY, mapW, mapH, laneWidth) {
        // Mid lane details
        for (let i = 0; i < 35; i++) {
            const t = i / 35;
            const x = 100 + (mapW - 200) * t - cameraX;
            const y = 100 + (mapH - 200) * t - cameraY;

            if (x > -50 && x < this.canvas.width + 50 && y > -50 && y < this.canvas.height + 50) {
                // Pedras no caminho
                if (Math.sin(i * 1.5) > 0.4) {
                    ctx.fillStyle = 'rgba(130, 120, 110, 0.5)';
                    ctx.beginPath();
                    ctx.arc(x + laneWidth / 2, y + laneWidth / 2, 6 + Math.sin(i) * 3, 0, Math.PI * 2);
                    ctx.fill();

                    // Sombra da pedra
                    ctx.fillStyle = 'rgba(80, 70, 60, 0.3)';
                    ctx.beginPath();
                    ctx.arc(x + laneWidth / 2 + 2, y + laneWidth / 2 + 2, 5 + Math.sin(i) * 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Marcas de trilha mais claras
                ctx.fillStyle = 'rgba(180, 160, 130, 0.25)';
                ctx.beginPath();
                ctx.ellipse(x + laneWidth / 2 + 20, y + laneWidth / 2, 5, 8, Math.sin(i) * 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Grama nas bordas da lane
                if (i % 3 === 0) {
                    ctx.fillStyle = 'rgba(80, 140, 50, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x + 10, y + laneWidth / 2 - 30, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + laneWidth - 10, y + laneWidth / 2 + 30, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Top/Bot lane details com pedras decorativas
        const sideLaneStones = 20;
        for (let i = 0; i < sideLaneStones; i++) {
            const t = i / sideLaneStones;

            // Top lane horizontal
            const topX = 100 + (mapW - 200) * t - cameraX;
            const topY = 100 + laneWidth / 2 - cameraY;

            if (topX > -50 && topX < this.canvas.width + 50 && topY > -50 && topY < this.canvas.height + 50) {
                if (Math.sin(i * 2.3) > 0.5) {
                    ctx.fillStyle = 'rgba(140, 130, 115, 0.4)';
                    ctx.beginPath();
                    ctx.arc(topX, topY + (Math.sin(i) * 20), 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    },

    drawBases(cameraX, cameraY) {
        if (!this.mapConfig.bases) return;

        const ctx = this.ctx;

        const teamColors = {
            team1: { primary: '#3498db', secondary: '#2980b9', glow: 'rgba(52, 152, 219, 0.4)' },
            team2: { primary: '#e74c3c', secondary: '#c0392b', glow: 'rgba(231, 76, 60, 0.4)' }
        };

        Object.entries(this.mapConfig.bases).forEach(([team, base]) => {
            const x = base.x - cameraX;
            const y = base.y - cameraY;
            const radius = base.radius || 400;
            const colors = teamColors[team] || teamColors.team1;

            // Verifica se esta na tela
            if (x + radius < -100 || x - radius > this.canvas.width + 100 ||
                y + radius < -100 || y - radius > this.canvas.height + 100) {
                return;
            }

            // Plataforma de pedra
            ctx.fillStyle = '#5d5d65';
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
            ctx.fill();

            // Textura de pedra
            ctx.fillStyle = '#6d6d75';
            ctx.beginPath();
            ctx.arc(x - radius * 0.1, y - radius * 0.1, radius * 0.85, 0, Math.PI * 2);
            ctx.fill();

            // Centro mais claro
            ctx.fillStyle = '#7a7a85';
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Glow da base - vibrante
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            glowGradient.addColorStop(0, colors.primary);
            glowGradient.addColorStop(0.3, colors.secondary);
            glowGradient.addColorStop(0.5, colors.glow);
            glowGradient.addColorStop(0.8, 'rgba(100, 100, 120, 0.2)');
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = glowGradient;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Círculos decorativos
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Runas decorativas animadas
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.time * 0.15);

            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * radius * 0.45, Math.sin(angle) * radius * 0.45);
                ctx.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
                ctx.stroke();

                // Pontinha brilhante
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Símbolos internos
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const nextAngle = ((i + 2) / 6) * Math.PI * 2;
                ctx.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3);
                ctx.lineTo(Math.cos(nextAngle) * radius * 0.3, Math.sin(nextAngle) * radius * 0.3);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;

            ctx.restore();

            // Centro brilhante pulsante
            const pulse = 0.7 + Math.sin(this.time * 2) * 0.3;
            ctx.fillStyle = colors.primary;
            ctx.globalAlpha = pulse * 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
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

        // Sombra suave projetada
        ctx.fillStyle = this.colors.treeShadow;
        ctx.fillRect(x + 12, y + 12, width, height);

        // Base verde escura
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(x, y, width, height);

        // Camada principal de folhagem
        ctx.fillStyle = this.colors.treeLeaves;
        ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

        // Gradiente de luz do sol
        const sunGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        sunGradient.addColorStop(0, 'rgba(100, 180, 80, 0.4)');
        sunGradient.addColorStop(0.5, 'rgba(70, 150, 60, 0.2)');
        sunGradient.addColorStop(1, 'rgba(30, 80, 30, 0.3)');
        ctx.fillStyle = sunGradient;
        ctx.fillRect(x, y, width, height);

        // Textura de folhas detalhada
        const leafSize = 22;
        for (let lx = x; lx < x + width; lx += leafSize) {
            for (let ly = y; ly < y + height; ly += leafSize) {
                const offset = Math.sin(lx * 0.08 + ly * 0.08 + this.time * 0.4) * 2;
                const shade = Math.sin(lx * 0.05 + ly * 0.03);

                // Folhas com variação de cor
                if (shade > 0) {
                    ctx.fillStyle = this.colors.treeLeavesLight;
                } else {
                    ctx.fillStyle = this.colors.treeLeaves;
                }
                ctx.beginPath();
                ctx.arc(lx + leafSize / 2 + offset, ly + leafSize / 2, leafSize / 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Highlight de luz
                if (shade > 0.5) {
                    ctx.fillStyle = this.colors.treeLeavesGlow;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(lx + leafSize / 2 + offset - 2, ly + leafSize / 2 - 2, leafSize / 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                // Sombras sutis
                ctx.fillStyle = 'rgba(20, 60, 20, 0.25)';
                ctx.beginPath();
                ctx.arc(lx + leafSize / 2 + 4, ly + leafSize / 2 + 4, leafSize / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Troncos marrons visíveis
        for (let i = 0; i < 4; i++) {
            const tx = x + (width / 5) * (i + 0.5);
            // Sombra do tronco
            ctx.fillStyle = this.colors.treeTrunkDark;
            ctx.fillRect(tx - 7, y + height - 18, 14, 25);
            ctx.fillRect(tx - 7, y - 8, 14, 25);
            // Tronco principal
            ctx.fillStyle = this.colors.treeTrunk;
            ctx.fillRect(tx - 5, y + height - 15, 10, 22);
            ctx.fillRect(tx - 5, y - 5, 10, 22);
            // Highlight do tronco
            ctx.fillStyle = '#795548';
            ctx.fillRect(tx - 3, y + height - 12, 4, 18);
            ctx.fillRect(tx - 3, y - 2, 4, 18);
        }

        // Raízes expostas
        ctx.fillStyle = '#5d4037';
        for (let i = 0; i < 5; i++) {
            const rx = x + (width / 6) * (i + 0.5);
            ctx.beginPath();
            ctx.moveTo(rx, y + height);
            ctx.quadraticCurveTo(rx + 12, y + height + 18, rx + 25, y + height + 8);
            ctx.quadraticCurveTo(rx + 12, y + height + 6, rx, y + height);
            ctx.fill();
        }

        // Borda suave
        ctx.strokeStyle = 'rgba(20, 80, 20, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.restore();
    },

    drawRock(ctx, x, y, radius) {
        ctx.save();

        // Sombra suave
        ctx.fillStyle = 'rgba(50, 50, 50, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 6, radius * 1.1, radius * 0.65, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Rocha principal - tons naturais de cinza
        const rockGradient = ctx.createRadialGradient(
            x - radius * 0.35, y - radius * 0.35, 0,
            x, y, radius
        );
        rockGradient.addColorStop(0, '#a5a5a5');
        rockGradient.addColorStop(0.3, this.colors.rockLight);
        rockGradient.addColorStop(0.6, this.colors.rockDark);
        rockGradient.addColorStop(1, this.colors.rockShadow);

        ctx.fillStyle = rockGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Textura de rocha - rachaduras sutis
        ctx.strokeStyle = 'rgba(60, 60, 60, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.3, y - radius * 0.2);
        ctx.lineTo(x + radius * 0.15, y + radius * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + radius * 0.25, y - radius * 0.4);
        ctx.lineTo(x + radius * 0.45, y + radius * 0.15);
        ctx.stroke();

        // Highlight de luz
        ctx.fillStyle = 'rgba(180, 180, 180, 0.35)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Musgo verde vibrante
        ctx.fillStyle = this.colors.rockMoss;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y + radius * 0.35, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.35, y + radius * 0.25, radius * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Detalhe de musgo mais claro
        ctx.fillStyle = '#7cb342';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x - radius * 0.15, y + radius * 0.4, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
    },

    drawRuins(ctx, x, y, width, height) {
        ctx.save();

        // Sombra suave
        ctx.fillStyle = 'rgba(60, 60, 70, 0.35)';
        ctx.fillRect(x + 8, y + 8, width, height);

        // Base das ruinas - pedra antiga clara
        const ruinGradient = ctx.createLinearGradient(x, y, x + width, y + height);
        ruinGradient.addColorStop(0, '#9a9aa5');
        ruinGradient.addColorStop(0.3, this.colors.ruinStone);
        ruinGradient.addColorStop(0.7, this.colors.ruinDark);
        ruinGradient.addColorStop(1, '#8a8a95');
        ctx.fillStyle = ruinGradient;
        ctx.fillRect(x, y, width, height);

        // Textura de pedras antigas
        ctx.strokeStyle = 'rgba(80, 80, 90, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + width * 0.2 * (i + 0.5), y);
            ctx.lineTo(x + width * 0.2 * (i + 0.5) + 6, y + height);
            ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + height * 0.25 * (i + 1));
            ctx.lineTo(x + width, y + height * 0.25 * (i + 1) + 2);
            ctx.stroke();
        }

        // Highlight de luz
        ctx.fillStyle = 'rgba(200, 200, 210, 0.3)';
        ctx.fillRect(x + 3, y + 3, width * 0.4, height * 0.3);

        // Desgaste e erosão
        ctx.fillStyle = 'rgba(100, 100, 110, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 12, y);
        ctx.lineTo(x, y + 18);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + width, y + height);
        ctx.lineTo(x + width - 18, y + height);
        ctx.lineTo(x + width, y + height - 12);
        ctx.fill();

        // Musgo verde vibrante nas ruinas
        ctx.fillStyle = this.colors.ruinMoss;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width * 0.4, y + height);
        ctx.lineTo(x + width * 0.25, y + height * 0.55);
        ctx.lineTo(x, y + height * 0.65);
        ctx.closePath();
        ctx.fill();

        // Segundo patch de musgo
        ctx.fillStyle = '#8bc34a';
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height * 0.35);
        ctx.lineTo(x + width * 0.65, y + height * 0.25);
        ctx.lineTo(x + width * 0.75, y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Brilho místico vibrante
        const glowGradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width * 0.9
        );
        glowGradient.addColorStop(0, this.colors.ruinGlow);
        glowGradient.addColorStop(0.5, 'rgba(150, 140, 200, 0.15)');
        glowGradient.addColorStop(1, 'rgba(100, 100, 150, 0)');

        ctx.fillStyle = glowGradient;
        ctx.globalAlpha = 0.4 + Math.sin(this.time * 1.2) * 0.15;
        ctx.fillRect(x - 12, y - 12, width + 24, height + 24);
        ctx.globalAlpha = 1;

        // Pequenas partículas mágicas
        for (let i = 0; i < 3; i++) {
            const px = x + width / 2 + Math.sin(this.time * 1.5 + i * 2) * 30;
            const py = y + height / 2 + Math.cos(this.time * 1.2 + i * 2.5) * 25;
            ctx.fillStyle = 'rgba(200, 180, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.sin(this.time * 3 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
        }

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

        // Sombra suave do cluster
        ctx.fillStyle = 'rgba(60, 40, 30, 0.3)';
        ctx.beginPath();
        ctx.ellipse(4, 12, 32, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenha cogumelos coloridos e vibrantes
        const positions = [
            { x: 0, y: 0, size: 1, color: '#e74c3c' },
            { x: 25, y: -10, size: 0.7, color: '#f39c12' },
            { x: -20, y: 5, size: 0.8, color: '#c0392b' },
            { x: 10, y: 15, size: 0.6, color: '#e67e22' },
        ];

        positions.forEach(pos => {
            const mSize = 15 * pos.size;

            // Tronco bege claro
            ctx.fillStyle = '#d7ccc8';
            ctx.fillRect(pos.x - mSize * 0.25, pos.y, mSize * 0.5, mSize);

            // Sombra do tronco
            ctx.fillStyle = '#bcaaa4';
            ctx.fillRect(pos.x + mSize * 0.1, pos.y, mSize * 0.15, mSize);

            // Chapeu colorido vibrante
            ctx.fillStyle = pos.color;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, mSize, mSize * 0.65, 0, Math.PI, 0);
            ctx.fill();

            // Highlight no chapéu
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(pos.x - mSize * 0.25, pos.y - mSize * 0.15, mSize * 0.35, mSize * 0.25, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Pintas brancas (estilo Mario)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(pos.x - mSize * 0.35, pos.y - mSize * 0.2, 3 * pos.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pos.x + mSize * 0.25, pos.y - mSize * 0.35, 2.5 * pos.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - mSize * 0.4, 2 * pos.size, 0, Math.PI * 2);
            ctx.fill();

            // Glow sutil
            ctx.fillStyle = this.colors.mushroomGlow;
            ctx.globalAlpha = 0.25 + Math.sin(this.time * 2 + pos.x) * 0.1;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y - mSize * 0.1, mSize * 1.2, mSize * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        ctx.restore();
    },

    drawFallenLog(ctx, x, y, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);

        // Sombra suave do tronco
        ctx.fillStyle = 'rgba(80, 60, 40, 0.35)';
        ctx.fillRect(-52, 6, 110, 12);

        // Tronco caído - marrom natural
        const logGradient = ctx.createLinearGradient(-60, -12, -60, 12);
        logGradient.addColorStop(0, '#8d6e63');
        logGradient.addColorStop(0.3, this.colors.treeTrunk);
        logGradient.addColorStop(0.7, '#6d4c41');
        logGradient.addColorStop(1, this.colors.treeTrunkDark);

        ctx.fillStyle = logGradient;
        ctx.fillRect(-60, -12, 120, 24);

        // Highlight de luz
        ctx.fillStyle = 'rgba(180, 150, 120, 0.3)';
        ctx.fillRect(-55, -12, 110, 8);

        // Textura de casca
        ctx.strokeStyle = 'rgba(90, 60, 40, 0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(-50 + i * 15, -10);
            ctx.lineTo(-48 + i * 15, 10);
            ctx.stroke();
        }

        // Anéis do tronco nas pontas
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.ellipse(-60, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(60, 0, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Anéis internos
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(-60, 0, 5, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-60, 0, 2, 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Musgo verde vibrante
        ctx.fillStyle = this.colors.rockMoss;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-45, -14, 35, 6);
        ctx.fillRect(5, -14, 30, 6);

        // Musgo mais claro
        ctx.fillStyle = '#7cb342';
        ctx.fillRect(-40, -14, 20, 4);
        ctx.fillRect(10, -14, 18, 4);

        // Fungos coloridos no tronco
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffab91';
        ctx.beginPath();
        ctx.ellipse(-20, -12, 8, 4, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffcc80';
        ctx.beginPath();
        ctx.ellipse(25, -12, 6, 3, 0, Math.PI, 0);
        ctx.fill();

        // Pequenas plantas crescendo
        ctx.fillStyle = '#66bb6a';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-30 + i * 20, -12);
            ctx.lineTo(-28 + i * 20, -20);
            ctx.lineTo(-26 + i * 20, -12);
            ctx.fill();
        }

        ctx.restore();
    },

    drawAncientTree(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Sombra suave projetada
        ctx.fillStyle = 'rgba(40, 60, 30, 0.35)';
        ctx.beginPath();
        ctx.ellipse(12, 22, 65, 28, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Tronco grosso - marrom natural
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

        // Highlight do tronco
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-22, -75);
        ctx.lineTo(-5, -75);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();

        // Textura do tronco - casca
        ctx.strokeStyle = 'rgba(60, 40, 30, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-20 + i * 8, -10 - i * 10);
            ctx.lineTo(-18 + i * 8, -30 - i * 12);
            ctx.stroke();
        }

        // Raizes massivas
        ctx.fillStyle = this.colors.treeTrunk;
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

        // Highlight das raizes
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.moveTo(-28, 2);
        ctx.quadraticCurveTo(-50, 12, -60, 18);
        ctx.quadraticCurveTo(-50, 18, -28, 8);
        ctx.fill();

        // Copa da arvore - verde vibrante
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(0, -100, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.treeLeaves;
        ctx.beginPath();
        ctx.arc(0, -100, 62, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.treeLeavesLight;
        ctx.beginPath();
        ctx.arc(-18, -112, 35, 0, Math.PI * 2);
        ctx.fill();

        // Highlight de luz do sol
        ctx.fillStyle = this.colors.treeLeavesGlow;
        ctx.beginPath();
        ctx.arc(-25, -120, 22, 0, Math.PI * 2);
        ctx.fill();

        // Sombra suave na copa
        ctx.fillStyle = 'rgba(20, 80, 20, 0.3)';
        ctx.beginPath();
        ctx.arc(15, -85, 28, 0, Math.PI * 2);
        ctx.fill();

        // Pequenas folhas detalhadas na borda
        ctx.fillStyle = '#4caf50';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const fx = Math.cos(angle) * 58;
            const fy = -100 + Math.sin(angle) * 58;
            ctx.beginPath();
            ctx.arc(fx, fy, 8 + Math.sin(i * 1.5) * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawGlowingFlowers(ctx, x, y, count) {
        ctx.save();

        const flowerColors = [
            { petal: '#e91e63', glow: 'rgba(233, 30, 99, 0.5)' },
            { petal: '#9c27b0', glow: 'rgba(156, 39, 176, 0.5)' },
            { petal: '#2196f3', glow: 'rgba(33, 150, 243, 0.5)' },
            { petal: '#ff9800', glow: 'rgba(255, 152, 0, 0.5)' },
        ];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 25 + Math.sin(i * 2.5) * 18;
            const fx = x + Math.cos(angle) * dist;
            const fy = y + Math.sin(angle) * dist;
            const color = flowerColors[i % flowerColors.length];

            // Glow vibrante
            ctx.fillStyle = color.glow;
            ctx.globalAlpha = 0.4 + Math.sin(this.time * 1.5 + i) * 0.2;
            ctx.beginPath();
            ctx.arc(fx, fy, 12, 0, Math.PI * 2);
            ctx.fill();

            // Caule
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fx, fy + 5);
            ctx.lineTo(fx + Math.sin(i) * 3, fy + 15);
            ctx.stroke();

            // Pétalas
            ctx.fillStyle = color.petal;
            for (let p = 0; p < 5; p++) {
                const pAngle = (p / 5) * Math.PI * 2 + this.time * 0.2;
                const px = fx + Math.cos(pAngle) * 5;
                const py = fy + Math.sin(pAngle) * 5;
                ctx.beginPath();
                ctx.ellipse(px, py, 4, 2.5, pAngle, 0, Math.PI * 2);
                ctx.fill();
            }

            // Centro amarelo brilhante
            ctx.fillStyle = '#ffeb3b';
            ctx.globalAlpha = 0.9 + Math.sin(this.time * 2 + i * 0.5) * 0.1;
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fill();

            // Brilho central
            ctx.fillStyle = '#fff9c4';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(fx - 0.5, fy - 0.5, 1.5, 0, Math.PI * 2);
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

            // Glow externo vibrante
            ctx.fillStyle = this.colors.fireflyGlow;
            ctx.globalAlpha = f.brightness * 0.5;
            ctx.beginPath();
            ctx.arc(x, y, f.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Halo médio amarelo-verde
            ctx.globalAlpha = f.brightness * 0.6;
            ctx.fillStyle = 'rgba(200, 230, 100, 0.6)';
            ctx.beginPath();
            ctx.arc(x, y, f.size * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Centro brilhante
            ctx.globalAlpha = f.brightness * 0.95;
            ctx.fillStyle = '#f0f4c3';
            ctx.beginPath();
            ctx.arc(x, y, f.size * 1.1, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo branco
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = f.brightness;
            ctx.beginPath();
            ctx.arc(x, y, f.size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        });
    },

    drawMist(cameraX, cameraY) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Névoa leve e etérea (estilo mágico)
        this.mistParticles.forEach(m => {
            const x = m.x - cameraX;
            const y = m.y - cameraY;

            if (x + m.size < 0 || x - m.size > w ||
                y + m.size < 0 || y - m.size > h) {
                return;
            }

            // Névoa clara e mágica
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, m.size);
            gradient.addColorStop(0, this.colors.mist);
            gradient.addColorStop(0.4, 'rgba(220, 240, 220, 0.05)');
            gradient.addColorStop(0.7, this.colors.mistDark);
            gradient.addColorStop(1, 'rgba(200, 220, 200, 0)');

            ctx.fillStyle = gradient;
            ctx.globalAlpha = m.alpha * 0.6 * (0.6 + Math.sin(m.phase) * 0.4);
            ctx.beginPath();
            ctx.arc(x, y, m.size * 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Partículas de luz flutuantes (poeira mágica)
        ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        for (let i = 0; i < 20; i++) {
            const px = (Math.sin(this.time * 0.3 + i * 0.7) * 0.5 + 0.5) * w;
            const py = (Math.cos(this.time * 0.2 + i * 0.9) * 0.5 + 0.5) * h;
            ctx.globalAlpha = 0.2 + Math.sin(this.time * 1.5 + i) * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // Desenha vinheta sutil nas bordas (muito mais clara)
    drawVignette() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Vinheta muito suave - apenas nas bordas extremas
        const vignetteGradient = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.5,
            w / 2, h / 2, Math.max(w, h) * 0.9
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(0.85, 'rgba(0, 30, 0, 0.08)');
        vignetteGradient.addColorStop(1, this.colors.vignette);

        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, w, h);
    },

    // Adiciona iluminação ambiente suave
    drawAmbientDarkness() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Luz ambiente suave (simulando luz do sol filtrada pelas árvores)
        const sunX = w * 0.3;
        const sunY = h * 0.2;
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.8);
        sunGradient.addColorStop(0, 'rgba(255, 250, 200, 0.05)');
        sunGradient.addColorStop(0.3, 'rgba(255, 255, 220, 0.02)');
        sunGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sunGradient;
        ctx.fillRect(0, 0, w, h);

        // Variação de luz ambiente muito sutil
        const ambientPulse = Math.sin(this.time * 0.08) * 0.01;
        ctx.fillStyle = `rgba(255, 255, 230, ${0.02 + ambientPulse})`;
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
