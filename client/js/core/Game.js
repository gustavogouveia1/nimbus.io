/**
 * Nimbus.io - Batalha de Bruxos
 * Game Loop e Renderização - Estilo Pixel Art
 */
console.log('=== Game.js carregado ===');
console.log('MAP_CONFIG disponível:', typeof MAP_CONFIG !== 'undefined');
console.log('MapRenderer disponível:', typeof MapRenderer !== 'undefined');

const Game = {
    canvas: null,
    ctx: null,
    minimap: null,
    minimapCtx: null,

    // Estado do jogo
    running: false,
    myPlayerId: null,
    myPlayer: null,

    // Dados do servidor
    players: {},
    spells: [],
    creatures: [],
    leaderboard: [],

    // Configuração do mapa
    mapWidth: 3000,
    mapHeight: 3000,
    mapConfig: null,

    // Câmera
    camera: {
        x: 0,
        y: 0,
        shake: 0,
        shakeDecay: 0.9
    },

    // Client-side prediction
    localPlayer: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        targetAngle: 0,
        angularVelocity: 0,
        armAngle: 0,         // Ângulo atual do braço (interpolado)
        targetArmAngle: 0    // Ângulo alvo do braço
    },
    baseSpeed: 5,

    // Interpolação
    playerInterpolation: {},

    // Grid
    gridSize: 60,

    // Sistema de partículas
    particles: [],
    maxParticles: 800,

    // Trilhas mágicas
    magicTrails: [],

    // Hit effects (animações de acerto)
    hitEffects: [],

    // Explosões de colisão de feitiços
    spellExplosions: [],

    // Tempo
    time: 0,
    deltaTime: 0,
    lastTime: 0,

    // Varinha selecionada
    selectedWand: 'phoenix',

    // Tracking de HP para detectar hits
    lastPlayerHp: {},

    // Elementos DOM
    elements: {
        menu: null,
        hud: null,
        deathScreen: null,
        xpFill: null,
        levelText: null,
        manaFill: null,
        statsPanel: null,
        statPoints: null,
        leaderboardList: null,
        scoreDisplay: null,
        killFeed: null,
        finalScore: null,
        killedBy: null,
        spellSlots: null,
        // Loja
        shopPanel: null,
        goldValue: null,
        shopGoldValue: null,
        // Menu scoreboard
        menuLeaderboard: null
    },

    // Loja aberta?
    shopOpen: false,

    // Cores das casas/varinhas
    wandColors: {
        phoenix: { primary: '#FF6B35', secondary: '#FF4444', trail: '#FFD700' },
        dragon: { primary: '#2ECC71', secondary: '#27AE60', trail: '#98FB98' },
        unicorn: { primary: '#E8E8E8', secondary: '#C0C0C0', trail: '#FFFFFF' },
        elder: { primary: '#8B4513', secondary: '#654321', trail: '#DEB887' }
    },

    // Cores das magias
    spellColors: {
        stupefy: { primary: '#FF5252', secondary: '#D32F2F', glow: '#FF8A80' },
        incendio: { primary: '#FF9800', secondary: '#F57C00', glow: '#FFCC80' },
        glacius: { primary: '#81D4FA', secondary: '#29B6F6', glow: '#B3E5FC' },
        bombarda: { primary: '#8D6E63', secondary: '#5D4037', glow: '#D7CCC8' },
        protego: { primary: '#7B68EE', secondary: '#5C6BC0', glow: '#B39DDB' },
        basic: { primary: '#D4AF37', secondary: '#AA8C2C', glow: '#F4D03F' },
        // ========== COMBOS DE SPELL WEAVING ==========
        combo_stupefy: { primary: '#FF4444', secondary: '#CC0000', glow: '#FF8888', combo: true },
        combo_stunning_fire: { primary: '#FF6B35', secondary: '#CC4400', glow: '#FFAA77', combo: true },
        combo_frozen_paralysis: { primary: '#00D4FF', secondary: '#0088CC', glow: '#66E5FF', combo: true },
        combo_steam_blast: { primary: '#B8B8B8', secondary: '#888888', glow: '#DDDDDD', combo: true },
        combo_elemental_storm: { primary: '#9B59B6', secondary: '#6C3483', glow: '#D2B4DE', combo: true },
        combo_glacial_inferno: { primary: '#E74C3C', secondary: '#922B21', glow: '#F5B7B1', combo: true },
        combo_arcane_avalanche: { primary: '#3498DB', secondary: '#1B4F72', glow: '#AED6F1', combo: true },
        combo_arcane_apocalypse: { primary: '#8E44AD', secondary: '#512E5F', glow: '#D7BDE2', combo: true },
        combo_elemental_harmony: { primary: '#00FF88', secondary: '#00AA55', glow: '#88FFBB', combo: true },
        combo_primordial_cyclone: { primary: '#1ABC9C', secondary: '#0E6655', glow: '#A3E4D7', combo: true }
    },

    // Designs de skins de bruxos
    wizardSkins: {
        default: {
            robe: null, // usa player.color
            robeDark: null,
            robeLight: null,
            hat: null,
            hatBand: '#D4AF37',
            skin: '#FFDAB9',
            skinDark: '#E8C4A0',
            eyes: '#000000',
            wand: '#654321',
            wandTip: '#FFD700',
            aura: null,
            special: null
        },
        wizard_dark: {
            robe: '#1a1a2e',
            robeDark: '#0d0d1a',
            robeLight: '#2a2a4e',
            hat: '#16213e',
            hatBand: '#4a0080',
            skin: '#c9b8a8',
            skinDark: '#a89888',
            eyes: '#ff0040',
            wand: '#1a1a2e',
            wandTip: '#8b00ff',
            aura: { color: '#4a0080', alpha: 0.15 },
            special: 'darkMist'
        },
        wizard_ice: {
            robe: '#0984e3',
            robeDark: '#0652a3',
            robeLight: '#74b9ff',
            hat: '#0652a3',
            hatBand: '#81ecec',
            skin: '#dfe6e9',
            skinDark: '#b2bec3',
            eyes: '#00cec9',
            wand: '#74b9ff',
            wandTip: '#00cec9',
            aura: { color: '#74b9ff', alpha: 0.2 },
            special: 'snowflakes'
        },
        wizard_fire: {
            robe: '#d63031',
            robeDark: '#a02020',
            robeLight: '#ff7675',
            hat: '#c0392b',
            hatBand: '#fdcb6e',
            skin: '#ffeaa7',
            skinDark: '#f5d79e',
            eyes: '#e17055',
            wand: '#2d3436',
            wandTip: '#ff9f43',
            aura: { color: '#e17055', alpha: 0.2 },
            special: 'embers'
        },
        wizard_gold: {
            robe: '#f39c12',
            robeDark: '#d68910',
            robeLight: '#f7dc6f',
            hat: '#d4ac0d',
            hatBand: '#fff9c4',
            skin: '#ffefd5',
            skinDark: '#ffe4b5',
            eyes: '#8d6e63',
            wand: '#d4af37',
            wandTip: '#fff59d',
            aura: { color: '#ffd700', alpha: 0.25 },
            special: 'sparkles'
        },
        wizard_shadow: {
            robe: '#2d3436',
            robeDark: '#1e2324',
            robeLight: '#636e72',
            hat: '#1e2324',
            hatBand: '#6c5ce7',
            skin: '#95a5a6',
            skinDark: '#7f8c8d',
            eyes: '#a29bfe',
            wand: '#1e1e1e',
            wandTip: '#6c5ce7',
            aura: { color: '#6c5ce7', alpha: 0.15 },
            special: 'shadowTrail'
        },
        wizard_ancient: {
            robe: '#6c5ce7',
            robeDark: '#5341d6',
            robeLight: '#a29bfe',
            hat: '#5341d6',
            hatBand: '#ffeaa7',
            skin: '#f5f5dc',
            skinDark: '#e8e4c9',
            eyes: '#ffd700',
            wand: '#deb887',
            wandTip: '#e056fd',
            aura: { color: '#a29bfe', alpha: 0.25 },
            special: 'runes',
            hasBeard: true
        }
    },

    // Designs de skins de varinhas (para loja)
    wandSkins: {
        default: {
            wood: '#654321',
            woodLight: '#8B7355',
            woodDark: '#3E2723',
            core: '#FFD700',
            coreGlow: '#FFF8DC',
            handle: '#4A3728',
            special: null
        },
        wand_elder: {
            wood: '#2C2416',
            woodLight: '#4A3C2A',
            woodDark: '#1A1510',
            core: '#E8E8E8',
            coreGlow: '#FFFFFF',
            handle: '#1E1A14',
            special: 'deathlyGlow',
            aura: { color: '#E8E8E8', alpha: 0.4 }
        },
        wand_phoenix: {
            wood: '#8B0000',
            woodLight: '#CD5C5C',
            woodDark: '#5C0000',
            core: '#FF6B35',
            coreGlow: '#FFD700',
            handle: '#6B0000',
            special: 'phoenixFeather',
            aura: { color: '#FF6B35', alpha: 0.3 }
        },
        wand_dragon: {
            wood: '#006266',
            woodLight: '#00B894',
            woodDark: '#003D3D',
            core: '#55EFC4',
            coreGlow: '#81ECEC',
            handle: '#004D4D',
            special: 'dragonHeartstring',
            aura: { color: '#00B894', alpha: 0.25 }
        },
        wand_unicorn: {
            wood: '#DEB887',
            woodLight: '#F5DEB3',
            woodDark: '#A0785A',
            core: '#E8E8E8',
            coreGlow: '#FFFFFF',
            handle: '#C4A574',
            special: 'unicornHair',
            aura: { color: '#FFFFFF', alpha: 0.35 }
        },
        wand_thestral: {
            wood: '#1A1A2E',
            woodLight: '#2D2D44',
            woodDark: '#0D0D17',
            core: '#8B00FF',
            coreGlow: '#DA70D6',
            handle: '#16162A',
            special: 'thestralCore',
            aura: { color: '#8B00FF', alpha: 0.3 }
        }
    },

    // Definições de cosméticos
    cosmeticEffects: {
        // Efeitos de nome
        nameEffects: {
            name_rainbow: {
                type: 'rainbow',
                colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
                speed: 0.003
            },
            name_fire: {
                type: 'gradient',
                colors: ['#ff4500', '#ff6600', '#ffcc00'],
                speed: 0.002,
                glow: { color: '#ff6600', blur: 8 }
            },
            name_ice: {
                type: 'gradient',
                colors: ['#00bfff', '#87ceeb', '#ffffff'],
                speed: 0.002,
                glow: { color: '#00bfff', blur: 8 }
            },
            name_golden: {
                type: 'gradient',
                colors: ['#ffd700', '#fff8dc', '#ffd700'],
                speed: 0.001,
                glow: { color: '#ffd700', blur: 10 }
            }
        },
        // Tags
        tags: {
            tag_vip: { text: 'VIP', bgColor: '#ffd700', textColor: '#000', glow: '#ffd700' },
            tag_pro: { text: 'PRO', bgColor: '#1e90ff', textColor: '#fff', glow: '#00bfff' },
            tag_legend: { text: 'LENDA', bgColor: '#9400d3', textColor: '#fff', glow: '#ff1493' },
            tag_mystic: { text: 'MISTICO', bgColor: '#4b0082', textColor: '#fff', glow: '#8a2be2' }
        },
        // Auras
        auras: {
            aura_fire: {
                type: 'fire',
                color: '#ff6600',
                particles: true,
                particleColor: '#ff4500'
            },
            aura_ice: {
                type: 'ice',
                color: '#00bfff',
                particles: true,
                particleColor: '#87ceeb'
            },
            aura_lightning: {
                type: 'lightning',
                color: '#ffff00',
                flicker: true
            },
            aura_dark: {
                type: 'dark',
                color: '#4b0082',
                particles: true,
                particleColor: '#8a2be2'
            },
            aura_rainbow: {
                type: 'rainbow',
                colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
                rotate: true
            },
            aura_stars: {
                type: 'stars',
                color: '#ffffff',
                starCount: 8
            }
        }
    },

    init() {
        // Canvas principal
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // Minimap
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');

        // Elementos DOM
        this.elements.menu = document.getElementById('menu');
        this.elements.hud = document.getElementById('hud');
        this.elements.deathScreen = document.getElementById('deathScreen');
        this.elements.xpFill = document.getElementById('xpFill');
        this.elements.levelText = document.getElementById('levelText');
        this.elements.manaFill = document.getElementById('manaFill');
        this.elements.statsPanel = document.getElementById('statsPanel');
        this.elements.statPoints = document.querySelector('#statPoints span');
        this.elements.leaderboardList = document.getElementById('leaderboardList');
        this.elements.scoreDisplay = document.querySelector('.score-value');
        this.elements.killFeed = document.getElementById('killFeed');
        this.elements.finalScore = document.getElementById('finalScore');
        this.elements.killedBy = document.getElementById('killedBy');
        this.elements.spellSlots = document.querySelectorAll('.spell-slot');

        // Loja
        this.elements.shopPanel = document.getElementById('shopPanel');
        this.elements.goldValue = document.querySelector('#goldDisplay .gold-value');
        this.elements.shopGoldValue = document.getElementById('shopGoldValue');

        // Speed Boost
        this.elements.speedBar = document.getElementById('speedBar');
        this.elements.speedFill = document.getElementById('speedFill');

        // Menu scoreboard
        this.elements.menuLeaderboard = document.getElementById('menuLeaderboard');

        // Resize
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Carrega configuração do mapa
        this.loadMapConfig();

        // Inicializa input
        Input.init();

        // Configura callbacks de rede
        this.setupNetworkCallbacks();

        // Event listeners
        this.setupEventListeners();

        // Inicia partículas ambientais
        this.initAmbientParticles();

        // Inicializa previews da loja
        this.initShopPreviews();

        // Inicia o modo de fundo do menu (formas flutuantes estilo Diep.io)
        this.initBackgroundMode();

        // Inicializa o conteúdo do Spellbook
        this.initSpellbook();
    },

    // Inicializa o conteúdo do Spellbook com os combos do Input
    initSpellbook() {
        if (typeof Input === 'undefined' || !Input.spellCombos) return;

        const basicContainer = document.getElementById('basicCombos');
        const intermediateContainer = document.getElementById('intermediateCombos');
        const advancedContainer = document.getElementById('advancedCombos');

        if (!basicContainer || !intermediateContainer || !advancedContainer) return;

        // Limpa containers
        basicContainer.innerHTML = '';
        intermediateContainer.innerHTML = '';
        advancedContainer.innerHTML = '';

        // Organiza combos por tamanho
        const combos = Object.entries(Input.spellCombos);

        combos.forEach(([key, combo]) => {
            const sequenceLen = combo.sequence.length;
            const comboHtml = this.createComboHtml(key, combo);

            if (sequenceLen === 3) {
                basicContainer.innerHTML += comboHtml;
            } else if (sequenceLen === 4) {
                intermediateContainer.innerHTML += comboHtml;
            } else if (sequenceLen === 5) {
                advancedContainer.innerHTML += comboHtml;
            }
        });
    },

    // Cria HTML para um combo
    createComboHtml(key, combo) {
        const spellClasses = {
            1: 'stupefy',
            2: 'incendio',
            3: 'glacius',
            4: 'bombarda',
            5: 'protego'
        };

        const sequenceHtml = combo.sequence.map(num =>
            `<span class="seq-key ${spellClasses[num]}">${num}</span>`
        ).join('');

        const effectsHtml = combo.effects.map(effect => {
            // Converte underscore para hífen e usa como classe CSS
            const effectClass = effect.replace(/_/g, '-');
            return `<span class="effect-tag ${effectClass}">${effect}</span>`;
        }).join('');

        return `
            <div class="combo-card">
                <div class="combo-header">
                    <span class="combo-icon">${combo.icon}</span>
                    <div class="combo-title">
                        <h3 style="color: ${combo.color}">${combo.name}</h3>
                        <span class="combo-name-en">${combo.nameEn}</span>
                    </div>
                </div>
                <div class="combo-sequence">${sequenceHtml}</div>
                <p class="combo-desc">${combo.description}</p>
                <div class="combo-stats">
                    <span class="stat"><span class="stat-icon">💧</span>${combo.manaCost}</span>
                    <span class="stat"><span class="stat-icon">⚔️</span>${combo.damage}</span>
                    <span class="stat"><span class="stat-icon">⏱️</span>${combo.cooldown}s</span>
                </div>
                <div class="combo-effects">${effectsHtml}</div>
            </div>
        `;
    },

    // Flag para usar Pixi.js
    usePixiRenderer: false,
    pixiTime: 0,

    loadMapConfig() {
        console.log('[Game] loadMapConfig() chamado');
        console.log('[Game] MAP_CONFIG existe?', typeof MAP_CONFIG !== 'undefined');

        // Usa a configuração global MAP_CONFIG definida em MapConfig.js
        if (typeof MAP_CONFIG !== 'undefined') {
            this.mapConfig = MAP_CONFIG;
            this.mapWidth = MAP_CONFIG.width || 6000;
            this.mapHeight = MAP_CONFIG.height || 6000;
            this.gridSize = MAP_CONFIG.gridSize || 60;

            console.log('Map config carregado:', this.mapConfig.theme);

            // Tenta inicializar Pixi.js para gráficos avançados
            this.initPixiRenderer();

            // Fallback para MapRenderer Canvas 2D se Pixi.js falhar
            if (!this.usePixiRenderer && typeof MapRenderer !== 'undefined') {
                MapRenderer.init(this.canvas, this.ctx, this.mapConfig);
                console.log('MapRenderer (Canvas 2D) inicializado como fallback');
            }
        } else {
            console.warn('MAP_CONFIG não encontrado, usando valores padrão');
            this.mapWidth = 6000;
            this.mapHeight = 6000;
        }
    },

    // Inicializa o sistema de renderização Pixi.js
    async initPixiRenderer() {
        // Verifica se Pixi.js está disponível
        if (typeof PIXI === 'undefined') {
            console.warn('[Pixi] PIXI não disponível, usando Canvas 2D');
            return;
        }

        // Verifica se os módulos Pixi estão disponíveis
        if (typeof PixiApp === 'undefined') {
            console.warn('[Pixi] Módulos Pixi não carregados, usando Canvas 2D');
            return;
        }

        try {
            console.log('[Pixi] Inicializando sistema de renderização WebGL...');

            // Inicializa aplicação Pixi.js
            const success = await PixiApp.init(this.canvas);
            if (!success) {
                console.warn('[Pixi] Falha ao inicializar PixiApp');
                return;
            }

            // Inicializa câmera
            PixiCamera.init(PixiApp.stage, this.canvas.width, this.canvas.height);
            PixiCamera.setBounds(0, 0, this.mapWidth, this.mapHeight);

            // Inicializa renderizadores
            await TerrainRenderer.init(
                PixiApp.getLayer('terrain'),
                PixiApp.getLayer('lanes'),
                this.mapConfig
            );

            await WaterRenderer.init(
                PixiApp.getLayer('water'),
                this.mapConfig
            );

            await VegetationRenderer.init(
                PixiApp.getLayer('shadows'),
                PixiApp.getLayer('obstacles'),
                this.mapConfig
            );

            await ObstacleRenderer.init(
                PixiApp.getLayer('obstacles'),
                PixiApp.getLayer('shadows'),
                this.mapConfig
            );

            await DecorationRenderer.init(
                PixiApp.getLayer('decorations'),
                this.mapConfig
            );

            await ParticleSystem.init(
                PixiApp.getLayer('effects'),
                this.mapConfig
            );

            await LightingSystem.init(
                PixiApp.getLayer('lighting'),
                this.mapConfig
            );

            this.usePixiRenderer = true;
            console.log('[Pixi] Sistema de renderização WebGL inicializado com sucesso!');
            console.log('[Pixi] Stats:', PixiApp.getStats());

        } catch (error) {
            console.error('[Pixi] Erro ao inicializar:', error);
            this.usePixiRenderer = false;
        }
    },

    // Atualiza o sistema Pixi.js
    updatePixiRenderer(deltaTime) {
        if (!this.usePixiRenderer) return;

        this.pixiTime += deltaTime * 0.016;

        // Atualiza câmera para seguir o jogador local
        if (this.localPlayer) {
            PixiCamera.setTarget(this.localPlayer.x, this.localPlayer.y);
            PixiCamera.update(deltaTime);
        }

        // Atualiza terreno (chunks visíveis)
        const bounds = PixiCamera.getVisibleBounds(100);
        TerrainRenderer.update(
            PixiCamera.x,
            PixiCamera.y,
            PixiCamera.viewport.width,
            PixiCamera.viewport.height
        );

        // Atualiza água (animação)
        WaterRenderer.update(deltaTime);

        // Atualiza vegetação (animação de balanço)
        VegetationRenderer.update(deltaTime, this.pixiTime);

        // Atualiza decorações (flores brilhantes)
        DecorationRenderer.update(deltaTime, this.pixiTime);

        // Atualiza partículas
        ParticleSystem.update(
            deltaTime,
            PixiCamera.x,
            PixiCamera.y,
            PixiCamera.viewport.width,
            PixiCamera.viewport.height
        );

        // Atualiza iluminação
        LightingSystem.update(deltaTime);
    },

    // Adiciona shake à câmera Pixi
    addPixiShake(intensity) {
        if (this.usePixiRenderer && typeof PixiCamera !== 'undefined') {
            PixiCamera.addShake(intensity);
        }
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Atualiza viewport da câmera Pixi se ativo
        if (this.usePixiRenderer && typeof PixiCamera !== 'undefined') {
            PixiCamera.updateViewport(window.innerWidth, window.innerHeight);
        }
    },

    initAmbientParticles() {
        // Partículas mágicas flutuantes (estrelas)
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.mapWidth,
                y: Math.random() * this.mapHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5 - 0.2,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                color: Math.random() > 0.6 ? '#FFD700' : (Math.random() > 0.5 ? '#7B68EE' : '#FFFFFF'),
                type: 'ambient',
                life: Infinity,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    },

    // ========== MODO DE FUNDO DO MENU (Jogo Real com Blur) ==========
    initBackgroundMode() {
        this.backgroundMode = true;
        this.spectatorCamera = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.spectatorTime = 0;
        this.spectatorTargetPlayer = null;
        this.lastCameraSwitch = 0;

        // Conecta ao servidor automaticamente para modo espectador
        this.connectAsSpectator();
    },

    async connectAsSpectator() {
        try {
            // Define callbacks especiais para o modo espectador
            Network.onConfig = (msg) => {
                this.mapWidth = msg.mapWidth || this.mapWidth;
                this.mapHeight = msg.mapHeight || this.mapHeight;
                // NÃO sobrescrever mapConfig se já temos o MAP_CONFIG local
                // O servidor pode não enviar mapConfig

                console.log('Config recebida do servidor:', msg);

                // Posiciona a câmera no centro do mapa inicialmente
                this.spectatorCamera.x = this.mapWidth / 2 - this.canvas.width / 2;
                this.spectatorCamera.y = this.mapHeight / 2 - this.canvas.height / 2;
                this.spectatorCamera.targetX = this.spectatorCamera.x;
                this.spectatorCamera.targetY = this.spectatorCamera.y;
            };

            // Conecta ao servidor
            await Network.connect();

            // Envia um join "fantasma" para receber atualizações do jogo
            // O jogador será invisível até fazer o login real
            Network.send({
                type: 'spectate'
            });

            // Se o servidor não suportar spectate, fazemos um join temporário
            // que será substituído pelo join real quando o usuário clicar Play
            setTimeout(() => {
                if (!this.spectatorConnected) {
                    // Tenta fazer um join silencioso para receber updates
                    // Isso será sobrescrito quando o jogador clicar em Play
                }
            }, 1000);

            // Inicia o loop do espectador
            this.spectatorLoop();

        } catch (error) {
            console.log('Não foi possível conectar para modo espectador:', error);
            // Inicia o loop mesmo sem conexão (mostrará apenas o fundo)
            this.spectatorLoop();
        }
    },

    spectatorLoop(currentTime = performance.now()) {
        if (!this.backgroundMode) return;

        this.spectatorTime = currentTime * 0.001;
        this.deltaTime = 1;
        this.time = this.spectatorTime;

        // Atualiza a câmera do espectador
        this.updateSpectatorCamera();

        // Atualiza partículas
        this.updateParticles();

        // Renderiza o jogo como espectador
        this.renderSpectatorView();

        requestAnimationFrame((t) => this.spectatorLoop(t));
    },

    updateSpectatorCamera() {
        const now = Date.now();

        // A cada 5 segundos, escolhe um novo jogador para seguir
        if (now - this.lastCameraSwitch > 5000 || !this.spectatorTargetPlayer) {
            const playerIds = Object.keys(this.players);
            if (playerIds.length > 0) {
                // Escolhe um jogador aleatório para seguir
                const randomId = playerIds[Math.floor(Math.random() * playerIds.length)];
                this.spectatorTargetPlayer = randomId;
                this.lastCameraSwitch = now;
            } else {
                // Sem jogadores, move a câmera pelo mapa
                this.spectatorCamera.targetX = (Math.sin(this.spectatorTime * 0.1) + 1) * (this.mapWidth - this.canvas.width) / 2;
                this.spectatorCamera.targetY = (Math.cos(this.spectatorTime * 0.15) + 1) * (this.mapHeight - this.canvas.height) / 2;
            }
        }

        // Se tem um jogador alvo, segue ele
        if (this.spectatorTargetPlayer && this.players[this.spectatorTargetPlayer]) {
            const target = this.players[this.spectatorTargetPlayer];
            this.spectatorCamera.targetX = target.x - this.canvas.width / 2;
            this.spectatorCamera.targetY = target.y - this.canvas.height / 2;
        }

        // Suaviza o movimento da câmera
        const smoothing = 0.02;
        this.spectatorCamera.x += (this.spectatorCamera.targetX - this.spectatorCamera.x) * smoothing;
        this.spectatorCamera.y += (this.spectatorCamera.targetY - this.spectatorCamera.y) * smoothing;

        // Limita a câmera aos limites do mapa
        this.spectatorCamera.x = Math.max(0, Math.min(this.mapWidth - this.canvas.width, this.spectatorCamera.x));
        this.spectatorCamera.y = Math.max(0, Math.min(this.mapHeight - this.canvas.height, this.spectatorCamera.y));
    },

    renderSpectatorView() {
        // Usa a câmera do espectador temporariamente
        const savedCamera = { ...this.camera };
        this.camera.x = this.spectatorCamera.x;
        this.camera.y = this.spectatorCamera.y;

        // Renderiza o mapa da Floresta Proibida
        if (this.mapConfig && typeof MapRenderer !== 'undefined') {
            MapRenderer.update(this.deltaTime * 0.016);
            MapRenderer.render(this.camera.x, this.camera.y);
        } else {
            this.drawBackground();
        }

        this.drawGrid();
        this.drawMapBounds();
        this.drawParticles('ambient');
        this.drawMagicTrails();

        // Desenha as criaturas
        this.creatures.forEach(creature => this.drawCreature(creature));

        // Desenha os feitiços
        this.spells.forEach(spell => this.drawSpell(spell));

        // Desenha os jogadores
        Object.values(this.players).forEach(player => this.drawPixelWizard(player));

        // Restaura a câmera
        this.camera = savedCamera;
    },

    stopBackgroundMode() {
        this.backgroundMode = false;
    },

    setupNetworkCallbacks() {
        Network.onConfig = (msg) => {
            console.log('[setupNetworkCallbacks] Config recebida:', msg);
            this.mapWidth = msg.mapWidth || this.mapWidth;
            this.mapHeight = msg.mapHeight || this.mapHeight;
            // NÃO sobrescrever mapConfig - usamos o MAP_CONFIG local
        };

        Network.onJoined = (msg) => {
            this.myPlayerId = msg.playerId;
            this.myPlayer = msg.player;
            this.players[msg.playerId] = msg.player;
            this.lastPlayerHp[msg.playerId] = msg.player.hp;

            this.localPlayer.x = msg.player.x;
            this.localPlayer.y = msg.player.y;
            this.localPlayer.targetX = msg.player.x;
            this.localPlayer.targetY = msg.player.y;
            this.localPlayer.angle = msg.player.angle || 0;
            this.localPlayer.targetAngle = msg.player.angle || 0;
            this.localPlayer.angularVelocity = 0;

            // Para o modo de fundo do menu
            this.stopBackgroundMode();

            this.elements.menu.classList.add('hidden');
            this.elements.hud.classList.remove('hidden');
            this.elements.deathScreen.classList.add('hidden');

            this.running = true;
            this.lastTime = performance.now();
            this.gameLoop();
        };

        Network.onGameState = (msg) => {
            const oldSpells = new Set(this.spells.map(s => s.id));

            this.players = {};
            msg.players.forEach(p => {
                this.players[p.id] = p;

                // Detecta hit (dano recebido)
                if (this.lastPlayerHp[p.id] !== undefined && p.hp < this.lastPlayerHp[p.id]) {
                    const damage = this.lastPlayerHp[p.id] - p.hp;
                    this.createHitEffect(p.x, p.y, damage, p.color);
                }
                this.lastPlayerHp[p.id] = p.hp;

                if (p.id === this.myPlayerId) {
                    if (this.myPlayer && p.hp < this.myPlayer.hp) {
                        this.triggerScreenShake((this.myPlayer.hp - p.hp) * 0.8);
                    }
                    this.myPlayer = p;

                    this.localPlayer.targetX = p.x;
                    this.localPlayer.targetY = p.y;
                    this.baseSpeed = 5 + (p.stats?.movementSpeed || 0) * 0.5;
                } else {
                    if (!this.playerInterpolation[p.id]) {
                        this.playerInterpolation[p.id] = {
                            x: p.x,
                            y: p.y,
                            targetX: p.x,
                            targetY: p.y,
                            angle: p.angle || 0,
                            targetAngle: p.angle || 0,
                            angularVelocity: 0
                        };
                    } else {
                        this.playerInterpolation[p.id].targetX = p.x;
                        this.playerInterpolation[p.id].targetY = p.y;
                        this.playerInterpolation[p.id].targetAngle = p.angle || 0;
                    }
                }
            });

            Object.keys(this.playerInterpolation).forEach(id => {
                if (!this.players[id]) {
                    delete this.playerInterpolation[id];
                    delete this.lastPlayerHp[id];
                }
            });

            // Detecta novas magias para criar efeitos
            msg.spells.forEach(spell => {
                if (!oldSpells.has(spell.id)) {
                    this.createSpellCastEffect(spell);
                }
            });

            this.spells = msg.spells;
            this.creatures = msg.creatures;
            this.leaderboard = msg.leaderboard;

            // Atualiza o scoreboard do menu (para modo espectador)
            if (this.backgroundMode) {
                this.updateMenuScoreboard();
            }

            // Processa explosões de colisão de feitiços
            if (msg.explosions) {
                msg.explosions.forEach(exp => {
                    // Verifica se já existe essa explosão
                    const exists = this.spellExplosions.some(e => e.id === exp.id);
                    if (!exists) {
                        this.createSpellCollisionExplosion(exp);
                    }
                });
            }

            this.updateUI();
        };

        Network.onPlayerKilled = (msg) => {
            this.addKillMessage(msg.killerName, msg.victimName);

            const victim = this.players[msg.victimId];
            if (victim) {
                this.createDeathExplosion(victim.x, victim.y, victim.color);
                this.triggerScreenShake(20);
            }

            if (msg.victimId === this.myPlayerId) {
                this.elements.finalScore.textContent = this.myPlayer?.score || 0;
                this.elements.killedBy.textContent = msg.killerName;
                this.elements.deathScreen.classList.remove('hidden');
            }
        };

        Network.onRespawn = (msg) => {
            this.myPlayer = msg.player;
            this.lastPlayerHp[msg.player.id] = msg.player.hp;

            this.localPlayer.x = msg.player.x;
            this.localPlayer.y = msg.player.y;
            this.localPlayer.targetX = msg.player.x;
            this.localPlayer.targetY = msg.player.y;
            this.localPlayer.angle = msg.player.angle || 0;
            this.localPlayer.targetAngle = msg.player.angle || 0;
            this.localPlayer.angularVelocity = 0;

            this.elements.deathScreen.classList.add('hidden');
            this.createSpawnEffect(msg.player.x, msg.player.y, msg.player.color);
        };

        Network.onDisconnected = () => {
            this.running = false;
            this.elements.menu.classList.remove('hidden');
            this.elements.hud.classList.add('hidden');
            alert('Desconectado do servidor!');
        };

        Network.onShopResult = (msg) => {
            if (msg.success) {
                // Atualiza gold
                if (this.myPlayer) {
                    this.myPlayer.gold = msg.newGold;

                    // Aplica o cosmético localmente
                    if (msg.itemType === 'nameEffect') {
                        if (!this.myPlayer.cosmetics) this.myPlayer.cosmetics = {};
                        this.myPlayer.cosmetics.nameEffect = msg.itemId;
                    } else if (msg.itemType === 'tag') {
                        if (!this.myPlayer.cosmetics) this.myPlayer.cosmetics = {};
                        this.myPlayer.cosmetics.tag = msg.itemId;
                    } else if (msg.itemType === 'aura') {
                        if (!this.myPlayer.cosmetics) this.myPlayer.cosmetics = {};
                        this.myPlayer.cosmetics.aura = msg.itemId;
                    } else if (msg.itemType === 'wizard') {
                        this.myPlayer.wizardSkin = msg.itemId;
                    } else if (msg.itemType === 'wand') {
                        this.myPlayer.wandSkin = msg.itemId;
                    }
                }
                this.elements.goldValue.textContent = msg.newGold;
                this.elements.shopGoldValue.textContent = msg.newGold;

                // Marca item como comprado
                const itemEl = document.querySelector(`.shop-item[data-item="${msg.itemId}"]`);
                if (itemEl) {
                    const btn = itemEl.querySelector('.buy-btn');
                    btn.textContent = 'EQUIPADO';
                    btn.classList.add('owned');
                }

                // Feedback visual
                this.showShopMessage(msg.message, 'success');
            } else {
                this.showShopMessage(msg.message, 'error');
            }
        };
    },

    showShopMessage(message, type) {
        const msgEl = document.createElement('div');
        msgEl.className = `shop-message ${type}`;
        msgEl.textContent = message;
        msgEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? 'rgba(0, 200, 0, 0.9)' : 'rgba(200, 0, 0, 0.9)'};
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-family: 'Cinzel', serif;
            font-size: 16px;
            font-weight: 600;
            z-index: 4000;
            animation: shopMsgFade 2s ease forwards;
        `;
        document.body.appendChild(msgEl);
        setTimeout(() => msgEl.remove(), 2000);
    },

    setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });

        document.getElementById('respawnBtn').addEventListener('click', () => {
            this.elements.deathScreen.classList.add('hidden');
        });

        // ========== MENU DIEP.IO STYLE ==========
        // Custom Select Dropdowns
        this.setupCustomSelects();

        // Account button (não funcional por enquanto)
        const accountBtn = document.getElementById('accountBtn');
        if (accountBtn) {
            accountBtn.addEventListener('click', () => {
                console.log('Account: Em breve!');
            });
        }

        // Shop button do menu (não funcional por enquanto)
        const menuShopBtn = document.getElementById('menuShopBtn');
        if (menuShopBtn) {
            menuShopBtn.addEventListener('click', () => {
                console.log('Shop: Em breve!');
            });
        }

        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                document.querySelectorAll('.select-items').forEach(items => {
                    items.classList.add('select-hide');
                });
            }
        });

        // Stats upgrades
        document.querySelectorAll('.stat-row').forEach(row => {
            row.addEventListener('click', () => {
                const stat = row.dataset.stat;
                Network.sendUpgrade(stat);
            });
        });

        // Spell slots click
        this.elements.spellSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const spellNum = slot.dataset.spell;
                Network.sendCastSpell(parseInt(spellNum));
            });
        });

        // Loja
        const shopBtn = document.getElementById('shopBtn');
        if (shopBtn) {
            shopBtn.addEventListener('click', () => this.toggleShop());
        }

        const closeShopBtn = document.getElementById('closeShopBtn');
        if (closeShopBtn) {
            closeShopBtn.addEventListener('click', () => this.closeShop());
        }

        // Tabs da loja
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = tab.dataset.tab;
                document.getElementById('wizardsSection').classList.toggle('hidden', tabName !== 'wizards');
                document.getElementById('wandsSection').classList.toggle('hidden', tabName !== 'wands');
                document.getElementById('cosmeticsSection').classList.toggle('hidden', tabName !== 'cosmetics');
            });
        });

        // Botões de compra
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.shop-item');
                const itemId = item.dataset.item;
                Network.sendBuyItem(itemId);
            });
        });

        // Tecla B para abrir loja
        document.addEventListener('keydown', (e) => {
            if (e.key === 'b' || e.key === 'B') {
                if (this.running && !this.elements.deathScreen.classList.contains('hidden') === false) {
                    this.toggleShop();
                }
            }
            if (e.key === 'Escape' && this.shopOpen) {
                this.closeShop();
            }
        });

        // ========== SPELLBOOK (Livro de Magias) ==========
        const spellbookBtn = document.getElementById('spellbookBtn');
        if (spellbookBtn) {
            spellbookBtn.addEventListener('click', () => Input.toggleSpellbook());
        }

        const closeSpellbookBtn = document.getElementById('closeSpellbookBtn');
        if (closeSpellbookBtn) {
            closeSpellbookBtn.addEventListener('click', () => Input.closeSpellbook());
        }

        // Tabs do Spellbook
        document.querySelectorAll('.spellbook-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.spellbook-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const category = tab.dataset.category;
                document.getElementById('basicCombos').classList.toggle('hidden', category !== 'basic');
                document.getElementById('intermediateCombos').classList.toggle('hidden', category !== 'intermediate');
                document.getElementById('advancedCombos').classList.toggle('hidden', category !== 'advanced');
            });
        });
    },

    // Setup para os custom selects estilo Diep.io
    setupCustomSelects() {
        const selects = document.querySelectorAll('.custom-select');

        selects.forEach(select => {
            const selected = select.querySelector('.select-selected');
            const items = select.querySelector('.select-items');
            const options = select.querySelectorAll('.select-option');

            if (!selected || !items) return;

            // Toggle dropdown ao clicar
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                // Fecha outros dropdowns
                document.querySelectorAll('.select-items').forEach(item => {
                    if (item !== items) item.classList.add('select-hide');
                });
                items.classList.toggle('select-hide');
            });

            // Selecionar opção
            options.forEach(option => {
                option.addEventListener('click', () => {
                    // Atualiza visual
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');

                    // Atualiza texto selecionado
                    if (select.classList.contains('region-select')) {
                        // Para região, mantém a flag e o player count
                        const flag = option.querySelector('.flag-br');
                        const flagHTML = flag ? flag.outerHTML : '';
                        const text = option.textContent.trim();
                        const playerCount = selected.querySelector('.player-count');
                        const countHTML = playerCount ? playerCount.outerHTML : '<span class="player-count">(0)</span>';
                        selected.innerHTML = flagHTML + ' ' + text + ' ' + countHTML;
                    } else {
                        selected.textContent = option.textContent;
                    }

                    // Salva o valor
                    select.dataset.value = option.dataset.value;

                    // Fecha dropdown
                    items.classList.add('select-hide');
                });
            });
        });

        // Valores iniciais
        this.selectedGameMode = 'ffa';
        this.selectedRegion = 'sao-paulo';
    },

    // Atualiza o contador de jogadores na região
    updateRegionPlayerCount(count) {
        const playerCount = document.querySelector('.menu-center .player-count');
        if (playerCount) {
            playerCount.textContent = `(${count})`;
        }
    },

    // Atualiza o scoreboard do menu com os jogadores reais
    updateMenuScoreboard() {
        if (!this.elements.menuLeaderboard) return;

        // Atualiza o contador de jogadores na região
        const playerCount = Object.keys(this.players).length;
        this.updateRegionPlayerCount(playerCount);

        // Limpa e preenche o scoreboard
        this.elements.menuLeaderboard.innerHTML = '';

        if (this.leaderboard && this.leaderboard.length > 0) {
            const maxScore = this.leaderboard[0]?.score || 1;
            const colors = ['#7B68EE', '#9B59B6', '#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C'];

            this.leaderboard.slice(0, 10).forEach((player, index) => {
                const entry = document.createElement('div');
                entry.className = 'score-entry';

                const barWidth = Math.max(10, (player.score / maxScore) * 100);
                const barColor = colors[index % colors.length];

                entry.innerHTML = `
                    <span class="score-bar" style="--bar-width: ${barWidth}%; --bar-color: ${barColor};"></span>
                    <span class="score-name">${player.name} - ${player.score}</span>
                `;
                this.elements.menuLeaderboard.appendChild(entry);
            });
        } else {
            const entry = document.createElement('div');
            entry.className = 'score-entry';
            entry.innerHTML = `
                <span class="score-bar" style="--bar-width: 50%; --bar-color: var(--purple);"></span>
                <span class="score-name">Aguardando jogadores...</span>
            `;
            this.elements.menuLeaderboard.appendChild(entry);
        }
    },

    toggleShop() {
        if (this.shopOpen) {
            this.closeShop();
        } else {
            this.openShop();
        }
    },

    openShop() {
        this.shopOpen = true;
        this.elements.shopPanel.classList.remove('hidden');
        if (this.myPlayer) {
            this.elements.shopGoldValue.textContent = this.myPlayer.gold || 0;
        }
    },

    closeShop() {
        this.shopOpen = false;
        this.elements.shopPanel.classList.add('hidden');
    },

    async startGame() {
        const nameInput = document.getElementById('playerName');
        const name = nameInput.value.trim() || 'Bruxo';

        nameInput.blur();
        this.canvas.focus();

        try {
            await Network.connect();
            Network.join(name, this.selectedWand);
        } catch (error) {
            alert('Erro ao conectar ao servidor. Certifique-se de que o servidor está rodando.');
        }
    },

    gameLoop(currentTime = performance.now()) {
        if (!this.running) return;

        this.deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2);
        this.lastTime = currentTime;
        this.time = currentTime * 0.001;

        Network.sendInput(Input.getState());

        this.updateLocalPlayer();
        this.updateParticles();
        this.updateCamera();
        this.updateMagicTrails();
        this.updateHitEffects();

        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    },

    updateLocalPlayer() {
        if (!this.myPlayer) return;

        const inputState = Input.getState();
        const speed = this.baseSpeed * this.deltaTime;

        let moveX = 0;
        let moveY = 0;

        if (inputState.keys.up) moveY -= 1;
        if (inputState.keys.down) moveY += 1;
        if (inputState.keys.left) moveX -= 1;
        if (inputState.keys.right) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
            const diag = 0.7071;
            moveX *= diag;
            moveY *= diag;
        }

        this.localPlayer.vx = moveX * speed;
        this.localPlayer.vy = moveY * speed;
        this.localPlayer.x += this.localPlayer.vx;
        this.localPlayer.y += this.localPlayer.vy;

        // Interpolação suave do ângulo do jogador local
        this.localPlayer.targetAngle = inputState.angle;
        let angleDiff = this.localPlayer.targetAngle - this.localPlayer.angle;
        // Normaliza para -PI a PI para rotação mais curta
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Velocidade de rotação suave com easing
        const angleInterpSpeed = 0.18 * this.deltaTime;
        const prevAngle = this.localPlayer.angle;
        this.localPlayer.angle += angleDiff * angleInterpSpeed;
        this.localPlayer.angularVelocity = this.localPlayer.angle - prevAngle;

        // Interpolação suave do ângulo do braço (mais rápida e responsiva)
        // Calcula o ângulo alvo do braço baseado na direção do mouse
        let normalizedAngle = this.localPlayer.angle;
        while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
        while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
        const facingLeft = Math.abs(normalizedAngle) > Math.PI / 2;

        let targetArmAngle;
        if (facingLeft) {
            targetArmAngle = Math.PI - normalizedAngle;
            if (targetArmAngle > Math.PI) targetArmAngle -= Math.PI * 2;
            if (targetArmAngle < -Math.PI) targetArmAngle += Math.PI * 2;
        } else {
            targetArmAngle = normalizedAngle;
        }
        // Limitar o ângulo do braço
        const maxArmAngle = Math.PI * 0.45;
        targetArmAngle = Math.max(-maxArmAngle, Math.min(maxArmAngle, targetArmAngle));
        this.localPlayer.targetArmAngle = targetArmAngle;

        // Interpolação suave do braço (mais rápida que o corpo para ser responsivo)
        let armAngleDiff = this.localPlayer.targetArmAngle - this.localPlayer.armAngle;
        while (armAngleDiff > Math.PI) armAngleDiff -= Math.PI * 2;
        while (armAngleDiff < -Math.PI) armAngleDiff += Math.PI * 2;
        const armInterpSpeed = 0.25 * this.deltaTime;
        this.localPlayer.armAngle += armAngleDiff * armInterpSpeed;

        const margin = this.myPlayer.size || 25;
        this.localPlayer.x = Math.max(margin, Math.min(this.mapWidth - margin, this.localPlayer.x));
        this.localPlayer.y = Math.max(margin, Math.min(this.mapHeight - margin, this.localPlayer.y));

        const reconcileSpeed = 0.15 * this.deltaTime;
        const diffX = this.localPlayer.targetX - this.localPlayer.x;
        const diffY = this.localPlayer.targetY - this.localPlayer.y;

        if (Math.abs(diffX) > 1 || Math.abs(diffY) > 1) {
            this.localPlayer.x += diffX * reconcileSpeed;
            this.localPlayer.y += diffY * reconcileSpeed;
        }

        const interpSpeed = 0.2 * this.deltaTime;
        const otherPlayersAngleInterpSpeed = 0.15 * this.deltaTime;
        Object.keys(this.playerInterpolation).forEach(id => {
            const interp = this.playerInterpolation[id];
            interp.x += (interp.targetX - interp.x) * interpSpeed;
            interp.y += (interp.targetY - interp.y) * interpSpeed;

            // Interpolação suave do ângulo (considera wrapping em 2*PI)
            let angleDiff = interp.targetAngle - interp.angle;
            // Normaliza para -PI a PI
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const prevAngle = interp.angle;
            interp.angle += angleDiff * otherPlayersAngleInterpSpeed;
            interp.angularVelocity = interp.angle - prevAngle;
        });
    },

    updateCamera() {
        if (this.myPlayer) {
            const targetX = this.localPlayer.x - this.canvas.width / 2;
            const targetY = this.localPlayer.y - this.canvas.height / 2;

            const lerpFactor = 0.18 * this.deltaTime;
            this.camera.x += (targetX - this.camera.x) * lerpFactor;
            this.camera.y += (targetY - this.camera.y) * lerpFactor;

            if (this.camera.shake > 0.1) {
                this.camera.x += (Math.random() - 0.5) * this.camera.shake;
                this.camera.y += (Math.random() - 0.5) * this.camera.shake;
                this.camera.shake *= this.camera.shakeDecay;
            }
        }
    },

    triggerScreenShake(intensity) {
        this.camera.shake = Math.min(this.camera.shake + intensity, 35);
        // Também aplica ao sistema Pixi se ativo
        this.addPixiShake(intensity);
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx * this.deltaTime;
            p.y += p.vy * this.deltaTime;

            if (p.type !== 'ambient') {
                p.life -= this.deltaTime;
                p.alpha *= 0.94;
                p.size *= 0.97;

                if (p.life <= 0 || p.alpha < 0.01) {
                    this.particles.splice(i, 1);
                }
            } else {
                p.twinkle += 0.03;
                p.alpha = 0.3 + Math.sin(p.twinkle) * 0.2;

                if (p.x < 0) p.x = this.mapWidth;
                if (p.x > this.mapWidth) p.x = 0;
                if (p.y < 0) p.y = this.mapHeight;
                if (p.y > this.mapHeight) p.y = 0;
            }
        }
    },

    updateMagicTrails() {
        for (let i = this.magicTrails.length - 1; i >= 0; i--) {
            const trail = this.magicTrails[i];
            trail.alpha *= 0.85;
            trail.size *= 0.95;
            if (trail.alpha < 0.01) {
                this.magicTrails.splice(i, 1);
            }
        }
    },

    updateHitEffects() {
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.life -= this.deltaTime;
            effect.scale += 0.15 * this.deltaTime;
            effect.alpha *= 0.92;

            if (effect.life <= 0 || effect.alpha < 0.01) {
                this.hitEffects.splice(i, 1);
            }
        }

        // Atualiza explosões de colisão de feitiços
        for (let i = this.spellExplosions.length - 1; i >= 0; i--) {
            const exp = this.spellExplosions[i];
            exp.life -= this.deltaTime;

            if (exp.life <= 0) {
                this.spellExplosions.splice(i, 1);
            }
        }
    },

    createParticle(x, y, vx, vy, color, size, life) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push({
                x, y, vx, vy, color, size, life,
                alpha: 1,
                type: 'effect'
            });
        }
    },

    // NOVA FUNÇÃO: Cria efeito de hit quando magia acerta jogador
    createHitEffect(x, y, damage, playerColor) {
        // Efeito principal de impacto
        this.hitEffects.push({
            x: x,
            y: y,
            scale: 1,
            alpha: 1,
            life: 30,
            type: 'impact',
            color: '#FFFFFF'
        });

        // Flash de dano
        this.hitEffects.push({
            x: x,
            y: y,
            scale: 0.5,
            alpha: 0.8,
            life: 20,
            type: 'flash',
            color: '#FF5252'
        });

        // Número de dano flutuante
        this.hitEffects.push({
            x: x,
            y: y - 20,
            vy: -2,
            scale: 1,
            alpha: 1,
            life: 45,
            type: 'damage',
            damage: Math.round(damage),
            color: '#FF5252'
        });

        // Partículas de impacto
        const particleCount = Math.min(Math.floor(damage / 2) + 5, 20);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const particleColor = Math.random() > 0.5 ? '#FF5252' : '#FFD700';

            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                particleColor,
                3 + Math.random() * 4,
                25 + Math.random() * 15
            );
        }

        // Estrelas de impacto
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4 + Math.random() * 0.3;
            this.createParticle(
                x, y,
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                '#FFFFFF',
                5,
                20
            );
        }
    },

    createSpellCastEffect(spell) {
        const colors = this.spellColors[spell.spellType] || this.spellColors.basic;

        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            this.createParticle(
                spell.x - (spell.vx || 0) * 2,
                spell.y - (spell.vy || 0) * 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors.glow,
                3 + Math.random() * 4,
                20
            );
        }
    },

    createDeathExplosion(x, y, color) {
        // Explosão mágica grande
        for (let i = 0; i < 80; i++) {
            const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
            const speed = 3 + Math.random() * 8;
            const particleColor = Math.random() > 0.4 ? color : '#D4AF37';

            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                particleColor,
                4 + Math.random() * 10,
                50 + Math.random() * 30
            );
        }

        // Flash branco central
        this.hitEffects.push({
            x: x,
            y: y,
            scale: 2,
            alpha: 1,
            life: 30,
            type: 'death',
            color: '#FFFFFF'
        });
    },

    createSpawnEffect(x, y, color) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 4 + Math.sin(i * 0.3) * 2;

            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? color : '#D4AF37',
                5,
                60
            );
        }
    },

    createSpellCollisionExplosion(explosion) {
        const { x, y, color1, color2, size, type1, type2 } = explosion;

        // Adiciona explosão à lista para renderização
        this.spellExplosions.push({
            id: explosion.id,
            x: x,
            y: y,
            color1: color1,
            color2: color2,
            size: size,
            life: 45,
            maxLife: 45,
            rings: []
        });

        // Cria anéis de expansão
        for (let ring = 0; ring < 3; ring++) {
            this.hitEffects.push({
                x: x,
                y: y,
                scale: 0.5 + ring * 0.3,
                alpha: 1,
                life: 35 - ring * 5,
                type: 'spellCollision',
                color: ring % 2 === 0 ? color1 : color2,
                ringDelay: ring * 3
            });
        }

        // Cria partículas coloridas
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const speed = 4 + Math.random() * 7;
            const particleColor = Math.random() > 0.5 ? color1 : color2;

            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                particleColor,
                4 + Math.random() * 8,
                40 + Math.random() * 20
            );
        }

        // Partículas de faísca branca
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;

            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#FFFFFF',
                2 + Math.random() * 3,
                25 + Math.random() * 15
            );
        }

        // Flash central brilhante
        this.hitEffects.push({
            x: x,
            y: y,
            scale: 2.5,
            alpha: 1,
            life: 20,
            type: 'flash',
            color: '#FFFFFF'
        });

        // Screen shake se estiver perto
        const myX = this.localPlayer.x;
        const myY = this.localPlayer.y;
        const dist = Math.sqrt((x - myX) ** 2 + (y - myY) ** 2);
        if (dist < 500) {
            this.triggerScreenShake(15 * (1 - dist / 500));
        }
    },

    render() {
        const ctx = this.ctx;

        // Usa Pixi.js se disponível (WebGL)
        if (this.usePixiRenderer) {
            // Atualiza sistema Pixi.js (terreno, água, partículas, etc)
            this.updatePixiRenderer(this.deltaTime);

            // O Pixi.js renderiza automaticamente via seu próprio ticker
            // Continua para renderizar entidades sobre o mapa Pixi
        }
        // Fallback: Canvas 2D com MapRenderer
        else if (this.mapConfig && typeof MapRenderer !== 'undefined') {
            MapRenderer.update(this.deltaTime * 0.016);
            MapRenderer.render(this.camera.x, this.camera.y);
        } else {
            // Fallback: fundo mágico original
            this.drawBackground();
            // Log apenas uma vez para não spammar
            if (!this._loggedNoMap) {
                console.log('[render] Usando fundo padrão - mapConfig:', this.mapConfig, 'MapRenderer:', typeof MapRenderer);
                this._loggedNoMap = true;
            }
        }

        // Grid estilo Hogwarts
        this.drawGrid();

        // Bordas do mapa
        this.drawMapBounds();

        // Partículas de fundo (estrelas)
        this.drawParticles('ambient');

        // Trilhas mágicas
        this.drawMagicTrails();

        // Criaturas
        this.creatures.forEach(creature => this.drawCreature(creature));

        // Magias
        this.spells.forEach(spell => this.drawSpell(spell));

        // Jogadores (bruxos flutuantes - PIXEL ART)
        Object.values(this.players).forEach(player => this.drawPixelWizard(player));

        // Partículas de efeito
        this.drawParticles('effect');

        // Explosões de colisão de feitiços
        this.drawSpellExplosions();

        // Efeitos de hit
        this.drawHitEffects();

        // Vinheta
        this.drawVignette();

        // Efeito de Speed Boost (desfoque/motion blur)
        if (this.myPlayer && this.myPlayer.speedBoostActive) {
            this.drawSpeedBoostEffect();
        }

        // Minimap
        this.drawMinimap();
    },

    // Efeito visual de velocidade quando o boost está ativo
    drawSpeedBoostEffect() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Linhas de velocidade radiais
        ctx.save();
        ctx.translate(w / 2, h / 2);

        const numLines = 40;
        const time = this.time * 3;

        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2 + time * 0.5;
            const startDist = 100 + Math.sin(time + i) * 50;
            const endDist = Math.max(w, h) * 0.8;
            const lineWidth = 1 + Math.random() * 2;

            const alpha = 0.1 + Math.sin(time * 2 + i) * 0.05;

            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * startDist, Math.sin(angle) * startDist);
            ctx.lineTo(Math.cos(angle) * endDist, Math.sin(angle) * endDist);
            ctx.stroke();
        }

        ctx.restore();

        // Efeito de blur radial nas bordas (vinheta de velocidade)
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Overlay de cor (leve tint dourado/laranja para sensação de velocidade)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.05)';
        ctx.fillRect(0, 0, w, h);

        // Brilho no centro
        const centerGlow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 150);
        centerGlow.addColorStop(0, 'rgba(255, 220, 100, 0.1)');
        centerGlow.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = centerGlow;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 150, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBackground() {
        const ctx = this.ctx;

        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );

        const hue = 265 + Math.sin(this.time * 0.08) * 8;
        gradient.addColorStop(0, `hsl(${hue}, 35%, 22%)`);
        gradient.addColorStop(0.5, `hsl(${hue}, 40%, 16%)`);
        gradient.addColorStop(1, `hsl(${hue}, 45%, 10%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawGrid() {
        const ctx = this.ctx;

        const offsetX = -this.camera.x % this.gridSize;
        const offsetY = -this.camera.y % this.gridSize;

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
        ctx.lineWidth = 1;

        for (let x = offsetX; x < this.canvas.width; x += this.gridSize) {
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = offsetY; y < this.canvas.height; y += this.gridSize) {
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    },

    drawMapBounds() {
        const ctx = this.ctx;

        const left = -this.camera.x;
        const top = -this.camera.y;
        const right = this.mapWidth - this.camera.x;
        const bottom = this.mapHeight - this.camera.y;

        const fogSize = 300;
        // Mudou de roxo para verde escuro para combinar com a floresta
        const fogColor = 'rgba(5, 20, 5, 0.95)';

        // Bordas com névoa
        if (left > -fogSize) {
            const gradient = ctx.createLinearGradient(left, 0, left - fogSize, 0);
            gradient.addColorStop(0, fogColor);
            gradient.addColorStop(1, 'rgba(5, 20, 5, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(left - fogSize, 0, fogSize, this.canvas.height);
            ctx.fillStyle = fogColor;
            ctx.fillRect(0, 0, Math.max(0, left - fogSize), this.canvas.height);
        }

        if (right < this.canvas.width + fogSize) {
            const gradient = ctx.createLinearGradient(right, 0, right + fogSize, 0);
            gradient.addColorStop(0, fogColor);
            gradient.addColorStop(1, 'rgba(5, 20, 5, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(right, 0, fogSize, this.canvas.height);
            ctx.fillStyle = fogColor;
            ctx.fillRect(right + fogSize, 0, this.canvas.width, this.canvas.height);
        }

        if (top > -fogSize) {
            const gradient = ctx.createLinearGradient(0, top, 0, top - fogSize);
            gradient.addColorStop(0, fogColor);
            gradient.addColorStop(1, 'rgba(5, 20, 5, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, top - fogSize, this.canvas.width, fogSize);
            ctx.fillStyle = fogColor;
            ctx.fillRect(0, 0, this.canvas.width, Math.max(0, top - fogSize));
        }

        if (bottom < this.canvas.height + fogSize) {
            const gradient = ctx.createLinearGradient(0, bottom, 0, bottom + fogSize);
            gradient.addColorStop(0, fogColor);
            gradient.addColorStop(1, 'rgba(5, 20, 5, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, bottom, this.canvas.width, fogSize);
            ctx.fillStyle = fogColor;
            ctx.fillRect(0, bottom + fogSize, this.canvas.width, this.canvas.height);
        }

        // Borda dourada
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
        ctx.shadowBlur = 15;
        ctx.strokeRect(left, top, this.mapWidth, this.mapHeight);
        ctx.shadowBlur = 0;
    },

    drawParticles(type) {
        const ctx = this.ctx;

        this.particles.forEach(p => {
            if (p.type !== type) return;

            const x = p.x - this.camera.x;
            const y = p.y - this.camera.y;

            if (x < -50 || x > this.canvas.width + 50 ||
                y < -50 || y > this.canvas.height + 50) {
                return;
            }

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            if (type === 'ambient') {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                // Desenha estrela
                this.drawStar4(ctx, x, y, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
        });

        ctx.globalAlpha = 1;
    },

    drawStar4(ctx, x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) - Math.PI / 4;
            const outerX = x + Math.cos(angle) * size;
            const outerY = y + Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 4;
            const innerX = x + Math.cos(innerAngle) * (size * 0.3);
            const innerY = y + Math.sin(innerAngle) * (size * 0.3);

            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawMagicTrails() {
        const ctx = this.ctx;

        // Adiciona trilhas para cada magia
        this.spells.forEach(spell => {
            const colors = this.spellColors[spell.spellType] || this.spellColors.basic;
            this.magicTrails.push({
                x: spell.x,
                y: spell.y,
                size: spell.size * 0.6,
                color: colors.glow,
                alpha: 0.7
            });
        });

        // Desenha trilhas
        this.magicTrails.forEach(trail => {
            const x = trail.x - this.camera.x;
            const y = trail.y - this.camera.y;

            if (x < -50 || x > this.canvas.width + 50 ||
                y < -50 || y > this.canvas.height + 50) {
                return;
            }

            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = trail.color;
            ctx.shadowColor = trail.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x, y, trail.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        ctx.globalAlpha = 1;
    },

    // NOVA FUNÇÃO: Desenha efeitos de hit
    drawHitEffects() {
        const ctx = this.ctx;

        this.hitEffects.forEach(effect => {
            const x = effect.x - this.camera.x;
            const y = (effect.y + (effect.vy || 0) * (30 - effect.life)) - this.camera.y;

            if (x < -100 || x > this.canvas.width + 100 ||
                y < -100 || y > this.canvas.height + 100) {
                return;
            }

            ctx.globalAlpha = effect.alpha;

            if (effect.type === 'impact' || effect.type === 'death') {
                // Círculo de impacto expandindo
                const radius = 20 * effect.scale;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 4;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();

                // Raios de impacto
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI / 4) + this.time;
                    const innerR = radius * 0.3;
                    const outerR = radius;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
                    ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            } else if (effect.type === 'flash') {
                // Flash brilhante (pode ser branco ou vermelho)
                const radius = 30 * effect.scale;
                const color = effect.color || '#FF5252';
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${effect.alpha})`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${effect.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'spellCollision') {
                // Anéis de colisão de feitiços
                if (effect.ringDelay > 0) {
                    effect.ringDelay--;
                    return;
                }
                const radius = 40 * effect.scale;
                const color = effect.color;

                // Anel externo brilhante
                ctx.strokeStyle = color;
                ctx.lineWidth = 5;
                ctx.shadowColor = color;
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();

                // Anel interno
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();

                // Raios de energia
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI / 6) + this.time * 2;
                    const innerR = radius * 0.2;
                    const outerR = radius;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
                    ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;
            } else if (effect.type === 'damage') {
                // Número de dano flutuante
                ctx.font = 'bold 18px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillText(`-${effect.damage}`, x + 2, y + 2);
                ctx.fillStyle = effect.color;
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 8;
                ctx.fillText(`-${effect.damage}`, x, y);
                ctx.shadowBlur = 0;
            }
        });

        ctx.globalAlpha = 1;
    },

    drawSpellExplosions() {
        const ctx = this.ctx;

        this.spellExplosions.forEach(exp => {
            const x = exp.x - this.camera.x;
            const y = exp.y - this.camera.y;

            if (x < -200 || x > this.canvas.width + 200 ||
                y < -200 || y > this.canvas.height + 200) {
                return;
            }

            const progress = 1 - (exp.life / exp.maxLife);
            const alpha = 1 - progress;
            const baseSize = exp.size * (1 + progress * 2);

            ctx.globalAlpha = alpha;

            // Glow externo
            const outerGradient = ctx.createRadialGradient(x, y, 0, x, y, baseSize * 1.5);
            outerGradient.addColorStop(0, exp.color1);
            outerGradient.addColorStop(0.4, exp.color2);
            outerGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = outerGradient;
            ctx.beginPath();
            ctx.arc(x, y, baseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Núcleo brilhante
            const coreSize = baseSize * 0.6 * (1 - progress * 0.5);
            const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
            coreGradient.addColorStop(0, '#FFFFFF');
            coreGradient.addColorStop(0.3, exp.color1);
            coreGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(x, y, coreSize, 0, Math.PI * 2);
            ctx.fill();

            // Ondas de energia
            for (let wave = 0; wave < 3; wave++) {
                const waveProgress = (progress + wave * 0.15) % 1;
                const waveSize = baseSize * (0.5 + waveProgress * 1.5);
                const waveAlpha = (1 - waveProgress) * 0.5;

                ctx.globalAlpha = waveAlpha * alpha;
                ctx.strokeStyle = wave % 2 === 0 ? exp.color1 : exp.color2;
                ctx.lineWidth = 3 - waveProgress * 2;
                ctx.beginPath();
                ctx.arc(x, y, waveSize, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Raios de energia
            ctx.globalAlpha = alpha * 0.8;
            const rayCount = 8;
            for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI * 2 + this.time * 3;
                const rayLength = baseSize * (0.8 + Math.sin(this.time * 5 + i) * 0.3);

                const rayGrad = ctx.createLinearGradient(
                    x, y,
                    x + Math.cos(angle) * rayLength,
                    y + Math.sin(angle) * rayLength
                );
                rayGrad.addColorStop(0, exp.color1);
                rayGrad.addColorStop(1, 'transparent');

                ctx.strokeStyle = rayGrad;
                ctx.lineWidth = 4 - progress * 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * rayLength,
                    y + Math.sin(angle) * rayLength
                );
                ctx.stroke();
            }
        });

        ctx.globalAlpha = 1;
    },

    drawCreature(creature) {
        const ctx = this.ctx;
        const x = creature.x - this.camera.x;
        const y = creature.y - this.camera.y;

        if (x < -100 || x > this.canvas.width + 100 ||
            y < -100 || y > this.canvas.height + 100) {
            return;
        }

        ctx.save();
        ctx.translate(x, y);

        const rotation = creature.rotation + Math.sin(this.time * 2 + creature.x) * 0.1;
        ctx.rotate(rotation);

        const pulse = 1 + Math.sin(this.time * 3 + creature.y * 0.01) * 0.05;
        ctx.scale(pulse, pulse);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const gradient = ctx.createRadialGradient(
            -creature.size * 0.2, -creature.size * 0.2, 0,
            0, 0, creature.size * 1.3
        );

        gradient.addColorStop(0, this.lightenColor(creature.color, 50));
        gradient.addColorStop(0.5, creature.color);
        gradient.addColorStop(1, this.darkenColor(creature.color, 30));

        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.darkenColor(creature.color, 50);
        ctx.lineWidth = 2;

        if (creature.type === 'pixie') {
            this.drawPixelStar(ctx, creature.size);
        } else if (creature.type === 'fairy') {
            ctx.beginPath();
            ctx.arc(0, 0, creature.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Asas
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(-creature.size * 0.7, 0, creature.size * 0.4, creature.size * 0.25, Math.PI * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(creature.size * 0.7, 0, creature.size * 0.4, creature.size * 0.25, -Math.PI * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (creature.type === 'snitch') {
            // Pomo de ouro
            ctx.beginPath();
            ctx.arc(0, 0, creature.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Asas do pomo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            const wingFlap = Math.sin(this.time * 20) * 0.4;
            ctx.beginPath();
            ctx.ellipse(-creature.size * 0.9, 0, creature.size * 0.6, creature.size * 0.25, wingFlap, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(creature.size * 0.9, 0, creature.size * 0.6, creature.size * 0.25, -wingFlap, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, creature.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        if (creature.hp < creature.maxHp) {
            this.drawHealthBar(x, y + creature.size + 10, creature.size * 1.4, creature.hp, creature.maxHp);
        }
    },

    drawPixelStar(ctx, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * Math.PI * 2 / 5) - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;
            const outerX = Math.cos(outerAngle) * size;
            const outerY = Math.sin(outerAngle) * size;
            const innerX = Math.cos(innerAngle) * (size * 0.4);
            const innerY = Math.sin(innerAngle) * (size * 0.4);

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    drawSpell(spell) {
        const ctx = this.ctx;
        const x = spell.x - this.camera.x;
        const y = spell.y - this.camera.y;

        if (x < -50 || x > this.canvas.width + 50 ||
            y < -50 || y > this.canvas.height + 50) {
            return;
        }

        const colors = this.spellColors[spell.spellType] || this.spellColors.basic;
        const size = spell.size;
        const pulse = 1 + Math.sin(this.time * 8) * 0.1;
        const pulseSize = size * pulse;

        // === AURA EXTERNA (glow suave) ===
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 30;

        const auraGradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 2);
        auraGradient.addColorStop(0, colors.glow);
        auraGradient.addColorStop(0.4, colors.primary + '80');
        auraGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();

        // === ESFERA PRINCIPAL (gradiente 3D) ===
        const mainGradient = ctx.createRadialGradient(
            x - size * 0.3, y - size * 0.3, 0,
            x, y, pulseSize
        );
        mainGradient.addColorStop(0, '#FFFFFF');
        mainGradient.addColorStop(0.2, colors.glow);
        mainGradient.addColorStop(0.5, colors.primary);
        mainGradient.addColorStop(0.8, colors.secondary);
        mainGradient.addColorStop(1, this.darkenColor(colors.secondary, 30));

        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = mainGradient;
        ctx.shadowBlur = 25;
        ctx.fill();

        // === BRILHO INTERNO (núcleo luminoso) ===
        const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.5, colors.glow + 'CC');
        coreGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();

        // === REFLEXO DE LUZ (efeito 3D) ===
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // === BORDA BRILHANTE ===
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // === PARTÍCULAS ORBITANTES (apenas feitiços especiais) ===
        if (spell.spellType !== 'basic') {
            ctx.shadowBlur = 8;
            for (let i = 0; i < 4; i++) {
                const angle = this.time * 5 + (i * Math.PI / 2);
                const orbitRadius = size * 1.6;
                const px = x + Math.cos(angle) * orbitRadius;
                const py = y + Math.sin(angle) * orbitRadius;
                const particleSize = 2.5 + Math.sin(this.time * 10 + i) * 0.5;

                ctx.beginPath();
                ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                ctx.fillStyle = colors.glow;
                ctx.fill();
            }
        }

        ctx.shadowBlur = 0;
    },

    // NOVA FUNÇÃO: Desenha bruxo em PIXEL ART (como na imagem)
    drawPixelWizard(player) {
        if (!player || !player.id) return; // Segurança

        const ctx = this.ctx;
        const isMe = player.id === this.myPlayerId;

        let playerX, playerY, playerVx = 0, playerVy = 0, playerAngle = 0, angularVelocity = 0;
        if (isMe) {
            playerX = this.localPlayer.x;
            playerY = this.localPlayer.y;
            playerVx = this.localPlayer.vx || 0;
            playerVy = this.localPlayer.vy || 0;
            playerAngle = this.localPlayer.angle || 0;
            angularVelocity = this.localPlayer.angularVelocity || 0;
        } else if (this.playerInterpolation[player.id]) {
            const interp = this.playerInterpolation[player.id];
            playerX = interp.x;
            playerY = interp.y;
            // Calcula velocidade baseada na diferença de posição
            playerVx = (interp.targetX - interp.x) * 0.5;
            playerVy = (interp.targetY - interp.y) * 0.5;
            playerAngle = interp.angle || player.angle || 0;
            angularVelocity = interp.angularVelocity || 0;
        } else {
            playerX = player.x;
            playerY = player.y;
            playerAngle = player.angle || 0;
        }

        // ====== ANIMAÇÃO DE VOO REALISTA ======
        const time = this.time || 0;
        const speed = Math.sqrt(playerVx * playerVx + playerVy * playerVy);
        const isMoving = speed > 0.3;

        // Hover bobbing - balanço vertical suave quando parado ou lento
        const hoverAmount = isMoving ? 2 : 4;
        const hoverSpeed = isMoving ? 6 : 3;
        // Usa hash simples do ID para offset único por jogador
        const idOffset = (player.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 0.1;
        const hoverOffset = Math.sin(time * hoverSpeed + idOffset) * hoverAmount;

        // Banking (inclinação lateral) baseado na velocidade angular - mais profissional
        // Quanto mais rápido girar, mais inclina lateralmente
        const bankingIntensity = 25; // Intensidade do banking
        const bankingSmooth = Math.tanh(angularVelocity * bankingIntensity) * 0.35;

        // Inclinação adicional baseada na direção do movimento vs direção que está olhando
        const tiltAngle = Math.atan2(playerVy, playerVx);
        const angleDiff = ((tiltAngle - playerAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const movementTilt = Math.sin(angleDiff) * Math.min(speed * 0.06, 0.15);

        // Banking total = velocidade angular + inclinação de movimento
        const totalBanking = bankingSmooth + movementTilt;

        // Inclinação frontal (pitch) - inclina para frente ao acelerar
        const forwardTilt = Math.min(speed * 0.02, 0.15);

        const camX = this.camera ? this.camera.x : 0;
        const camY = this.camera ? this.camera.y : 0;
        const x = playerX - camX;
        const y = playerY - camY + hoverOffset;

        if (x < -150 || x > this.canvas.width + 150 ||
            y < -150 || y > this.canvas.height + 150) {
            return;
        }

        const scale = (player.size || 28) / 28;
        const pixelSize = 3 * scale;

        // ====== DETERMINAR DIREÇÃO DO MAGO ======
        // Normaliza o ângulo para estar entre -π e π
        let normalizedAngle = playerAngle;
        while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
        while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

        // Flip horizontal baseado na direção do mouse
        const facingLeft = Math.abs(normalizedAngle) > Math.PI / 2;
        const flipX = facingLeft ? -1 : 1;

        // Usar ângulo do braço interpolado para o jogador local (mais suave)
        // Para outros jogadores, calcular na hora
        let armAngle;
        if (isMe && this.localPlayer.armAngle !== undefined) {
            // Usar o valor pré-interpolado para suavidade
            armAngle = this.localPlayer.armAngle;
        } else {
            // Calcular ângulo do braço para outros jogadores
            if (facingLeft) {
                armAngle = Math.PI - normalizedAngle;
                if (armAngle > Math.PI) armAngle -= Math.PI * 2;
                if (armAngle < -Math.PI) armAngle += Math.PI * 2;
            } else {
                armAngle = normalizedAngle;
            }
            // Limitar o ângulo do braço
            const maxArmAngle = Math.PI * 0.45;
            armAngle = Math.max(-maxArmAngle, Math.min(maxArmAngle, armAngle));
        }

        // ====== RASTRO DE VENTO / PARTÍCULAS ======
        if (isMoving) {
            const trailIntensity = Math.min(speed / 3, 1);
            const trailCount = Math.floor(3 + trailIntensity * 4);

            // Direção do movimento (não da mira)
            const moveAngle = Math.atan2(playerVy, playerVx);

            for (let i = 0; i < trailCount; i++) {
                const trailAge = (time * 8 + i * 1.3) % 1;
                const trailDist = 20 + trailAge * 40 * scale;
                const spreadX = (Math.sin(time * 12 + i * 2.5) * 8 + (Math.random() - 0.5) * 6) * scale;
                const spreadY = (Math.cos(time * 10 + i * 1.8) * 8 + (Math.random() - 0.5) * 6) * scale;

                // Posição atrás do bruxo (baseado na direção do movimento, não da mira)
                const trailX = x - Math.cos(moveAngle) * trailDist + spreadX;
                const trailY = y - Math.sin(moveAngle) * trailDist + spreadY;

                const alpha = (1 - trailAge) * 0.4 * trailIntensity;
                const size = (3 - trailAge * 2) * scale;

                ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Linhas de velocidade quando muito rápido (baseado no movimento)
            if (speed > 2) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min((speed - 2) * 0.15, 0.3)})`;
                ctx.lineWidth = 1.5;
                for (let i = 0; i < 3; i++) {
                    const lineOffset = (i - 1) * 12 * scale;
                    const lineStart = 25 * scale;
                    const lineLen = 15 + speed * 5;

                    const perpX = -Math.sin(moveAngle) * lineOffset;
                    const perpY = Math.cos(moveAngle) * lineOffset;

                    ctx.beginPath();
                    ctx.moveTo(
                        x - Math.cos(moveAngle) * lineStart + perpX,
                        y - Math.sin(moveAngle) * lineStart + perpY
                    );
                    ctx.lineTo(
                        x - Math.cos(moveAngle) * (lineStart + lineLen) + perpX,
                        y - Math.sin(moveAngle) * (lineStart + lineLen) + perpY
                    );
                    ctx.stroke();
                }
            }
        }

        ctx.save();
        ctx.translate(x, y);

        // Aura mágica para jogadores de alto nível (desenha antes da rotação para ficar simétrica)
        if (player.level > 3) {
            const auraSize = player.size + 15 + (player.level - 3) * 2;
            const auraAlpha = 0.12 + Math.sin(this.time * 2) * 0.06;
            const auraGradient = ctx.createRadialGradient(0, 0, player.size, 0, 0, auraSize);
            auraGradient.addColorStop(0, `rgba(212, 175, 55, 0)`);
            auraGradient.addColorStop(0.5, `rgba(212, 175, 55, ${auraAlpha})`);
            auraGradient.addColorStop(1, `rgba(212, 175, 55, 0)`);
            ctx.beginPath();
            ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
            ctx.fillStyle = auraGradient;
            ctx.fill();
        }

        // Shield Protego (desenha antes da rotação para ficar simétrico)
        if (player.shieldActive) {
            this.drawProtegoShield(ctx, player.size);
        }

        // Efeito de SLOW (Glacius) - aura de gelo
        if (player.isSlowed) {
            this.drawSlowEffect(ctx, player.size);
        }

        // Efeito de BURN (Incendio) - chamas
        if (player.isBurning) {
            this.drawBurnEffect(ctx, player.size);
        }

        // ====== FLIP HORIZONTAL E INCLINAÇÃO SUAVE ======
        // Flip horizontal baseado na direção do mouse (já calculado acima)
        ctx.scale(flipX, 1);

        // Inclinação suave baseada no movimento (não na mira)
        // O corpo inclina levemente na direção do movimento
        const moveAngle = Math.atan2(playerVy, playerVx);
        const bodyLean = isMoving ? Math.sin(moveAngle) * 0.12 * flipX : 0;

        // Breathing animation - expansão/contração sutil do peito
        const breathingPhase = Math.sin(time * 1.5) * 0.02;

        // Aplicar inclinação suave ao corpo (não rotação completa)
        ctx.rotate(bodyLean + breathingPhase);

        // ====== PIXEL ART WIZARD (FLUTUANTE) ======

        // Sombra flutuante no chão (mais suave e difusa)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        const shadowPulse = 1 + Math.sin(this.time * 3) * 0.1;
        ctx.ellipse(0, 25 * scale, 18 * scale * shadowPulse, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // ====== EFEITO DE LEVITAÇÃO MÁGICA ======
        // Aura mágica de levitação sob o mago
        const levitationGlow = ctx.createRadialGradient(0, 18 * scale, 0, 0, 18 * scale, 25 * scale);
        levitationGlow.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        levitationGlow.addColorStop(0.5, 'rgba(212, 175, 55, 0.15)');
        levitationGlow.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = levitationGlow;
        ctx.beginPath();
        ctx.ellipse(0, 18 * scale, 20 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Partículas mágicas de levitação (brilhos sob o mago)
        for (let i = 0; i < 5; i++) {
            const particleAngle = (this.time * 2 + i * 1.25) % (Math.PI * 2);
            const particleRadius = 12 + Math.sin(this.time * 3 + i) * 4;
            const px = Math.cos(particleAngle) * particleRadius * scale;
            const py = 15 * scale + Math.sin(particleAngle) * 4 * scale;
            const particleSize = 2 + Math.sin(this.time * 5 + i) * 1;
            const particleAlpha = 0.4 + Math.sin(this.time * 4 + i) * 0.3;

            ctx.fillStyle = `rgba(255, 215, 0, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, particleSize * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Obter skin da varinha para efeitos especiais
        const wandShopSkin = this.wandSkins[player.wandSkin] || this.wandSkins.default;

        // ====== CORPO DO BRUXO COM SKIN ======
        const wizSkin = this.wizardSkins[player.wizardSkin] || this.wizardSkins.default;

        // Cores do bruxo
        const robeColor = wizSkin.robe || player.color;
        const robeDark = wizSkin.robeDark || this.darkenColor(player.color, 30);
        const robeLight = wizSkin.robeLight || this.lightenColor(player.color, 20);
        const skinColor = wizSkin.skin;
        const skinDark = wizSkin.skinDark;
        const hatColor = wizSkin.hat || this.darkenColor(player.color, 15);

        // Aura especial da skin
        if (wizSkin.aura) {
            const skinAura = ctx.createRadialGradient(0, 0, player.size * 0.5, 0, 0, player.size * 1.5);
            skinAura.addColorStop(0, `rgba(${this.hexToRgb(wizSkin.aura.color)}, 0)`);
            skinAura.addColorStop(0.5, `rgba(${this.hexToRgb(wizSkin.aura.color)}, ${wizSkin.aura.alpha})`);
            skinAura.addColorStop(1, `rgba(${this.hexToRgb(wizSkin.aura.color)}, 0)`);
            ctx.fillStyle = skinAura;
            ctx.beginPath();
            ctx.arc(0, 0, player.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Efeitos especiais de skin
        if (wizSkin.special === 'darkMist') {
            for (let i = 0; i < 5; i++) {
                const mistX = (Math.random() - 0.5) * 40 * scale;
                const mistY = (Math.random() - 0.5) * 40 * scale;
                const mistSize = 8 + Math.random() * 8;
                ctx.fillStyle = `rgba(74, 0, 128, ${0.1 + Math.random() * 0.15})`;
                ctx.beginPath();
                ctx.arc(mistX, mistY, mistSize * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (wizSkin.special === 'snowflakes') {
            for (let i = 0; i < 4; i++) {
                const snowX = (Math.random() - 0.5) * 50 * scale;
                const snowY = (Math.random() - 0.5) * 50 * scale;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(snowX, snowY, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (wizSkin.special === 'embers') {
            for (let i = 0; i < 4; i++) {
                const emberX = (Math.random() - 0.5) * 40 * scale;
                const emberY = -20 * scale - Math.random() * 30 * scale;
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.5 + Math.random() * 0.5})`;
                ctx.beginPath();
                ctx.arc(emberX, emberY, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (wizSkin.special === 'sparkles') {
            for (let i = 0; i < 5; i++) {
                const sparkX = (Math.random() - 0.5) * 50 * scale;
                const sparkY = (Math.random() - 0.5) * 50 * scale;
                const sparkAlpha = 0.5 + Math.sin(this.time * 5 + i) * 0.5;
                ctx.fillStyle = `rgba(255, 215, 0, ${sparkAlpha})`;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (wizSkin.special === 'runes') {
            ctx.font = `${10 * scale}px serif`;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            const runeChars = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'];
            for (let i = 0; i < 3; i++) {
                const angle = (this.time + i * 2) % (Math.PI * 2);
                const rx = Math.cos(angle) * 35 * scale;
                const ry = Math.sin(angle) * 35 * scale;
                ctx.fillText(runeChars[i % runeChars.length], rx, ry);
            }
        }

        // ====== CAPA FLUTUANTE (balança com o vento) ======
        // Calcula intensidade do balanço baseado na velocidade atual do jogo
        const capeWave = Math.sin(this.time * 4) * 3 + Math.sin(this.time * 7) * 2;
        const capeWave2 = Math.sin(this.time * 5 + 1) * 2;

        // Desenha a capa flutuando atrás
        ctx.save();
        ctx.fillStyle = robeDark;

        // Parte superior da capa (mais estável)
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -3 * scale);
        ctx.lineTo(10 * scale, -3 * scale);
        ctx.lineTo(12 * scale + capeWave2 * scale, 8 * scale);
        ctx.lineTo(-12 * scale + capeWave2 * scale, 8 * scale);
        ctx.closePath();
        ctx.fill();

        // Parte inferior da capa (balança mais)
        ctx.fillStyle = robeColor;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(-12 * scale + capeWave2 * scale, 8 * scale);
        ctx.lineTo(12 * scale + capeWave2 * scale, 8 * scale);
        ctx.quadraticCurveTo(
            14 * scale + capeWave * scale, 18 * scale,
            10 * scale + capeWave * 1.5 * scale, 25 * scale + Math.abs(capeWave) * scale
        );
        ctx.quadraticCurveTo(
            0, 28 * scale + capeWave2 * scale,
            -10 * scale + capeWave * 1.5 * scale, 25 * scale + Math.abs(capeWave) * scale
        );
        ctx.quadraticCurveTo(
            -14 * scale + capeWave * scale, 18 * scale,
            -12 * scale + capeWave2 * scale, 8 * scale
        );
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // ====== BRAÇO ESQUERDO (desenhado ANTES do corpo - fica atrás) ======
        // Animação sutil para o braço livre
        const armWave = Math.sin(this.time * 2) * 0.5;
        const idleArmBob = Math.sin(this.time * 1.8) * 0.08;

        ctx.save();
        ctx.translate(-8 * scale, 0);
        ctx.rotate(-0.3 + armWave * 0.1 + idleArmBob);

        // Manga do braço esquerdo
        ctx.fillStyle = robeDark;
        ctx.beginPath();
        ctx.moveTo(0, -2 * scale);
        ctx.lineTo(-12 * scale, 4 * scale);
        ctx.lineTo(-10 * scale, 8 * scale);
        ctx.lineTo(2 * scale, 2 * scale);
        ctx.closePath();
        ctx.fill();

        // Mão esquerda
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(-11 * scale, 6 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Capa/Robe (corpo principal)
        ctx.fillStyle = robeColor;
        this.drawPixelRect(ctx, -8, -5, 16, 20, pixelSize);

        // Detalhe lateral da capa
        ctx.fillStyle = robeDark;
        this.drawPixelRect(ctx, -10, -3, 3, 18, pixelSize);
        this.drawPixelRect(ctx, 7, -3, 3, 18, pixelSize);

        // Detalhe de luz na capa
        ctx.fillStyle = robeLight;
        this.drawPixelRect(ctx, -5, -5, 4, 3, pixelSize);

        // Barba do Mago Ancestral
        if (wizSkin.hasBeard) {
            ctx.fillStyle = '#e0e0e0';
            this.drawPixelRect(ctx, -4, -6, 8, 8, pixelSize);
            ctx.fillStyle = '#d0d0d0';
            this.drawPixelRect(ctx, -3, 0, 6, 6, pixelSize);
            this.drawPixelRect(ctx, -2, 5, 4, 4, pixelSize);
        }

        // Rosto
        ctx.fillStyle = skinColor;
        this.drawPixelRect(ctx, -5, -15, 10, 10, pixelSize);

        // Sombra no rosto
        ctx.fillStyle = skinDark;
        this.drawPixelRect(ctx, -5, -8, 10, 3, pixelSize);

        // Olhos
        ctx.fillStyle = wizSkin.eyes;
        this.drawPixelRect(ctx, -4, -13, 2, 2, pixelSize);
        this.drawPixelRect(ctx, 2, -13, 2, 2, pixelSize);

        // Brilho dos olhos especiais
        if (wizSkin.eyes !== '#000000') {
            ctx.shadowColor = wizSkin.eyes;
            ctx.shadowBlur = 5;
            ctx.fillStyle = wizSkin.eyes;
            this.drawPixelRect(ctx, -4, -13, 2, 2, pixelSize);
            this.drawPixelRect(ctx, 2, -13, 2, 2, pixelSize);
            ctx.shadowBlur = 0;
        }

        // Chapéu pontudo (com balanço sutil na ponta)
        const hatWobble = Math.sin(this.time * 3) * 1.5;

        ctx.fillStyle = hatColor;
        this.drawPixelRect(ctx, -7, -18, 14, 4, pixelSize);
        this.drawPixelRect(ctx, -5, -23, 10, 5, pixelSize);
        this.drawPixelRect(ctx, -3, -28, 6, 5, pixelSize);

        // Ponta do chapéu (balança com o vento)
        ctx.save();
        ctx.translate(0, -30 * scale);
        ctx.rotate(hatWobble * 0.05);
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.moveTo(-2 * scale, 0);
        ctx.lineTo(2 * scale, 0);
        ctx.lineTo(hatWobble * scale, -8 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Fita do chapéu
        ctx.fillStyle = wizSkin.hatBand;
        this.drawPixelRect(ctx, -7, -18, 14, 2, pixelSize);

        // ====== BRAÇO DIREITO ARTICULADO (desenhado POR CIMA do corpo - segue o mouse) ======
        // Posição do ombro
        const shoulderX = 6 * scale;
        const shoulderY = -4 * scale;

        ctx.save();
        ctx.translate(shoulderX, shoulderY);

        // Rotação suave do braço para apontar para o mouse
        const smoothArmAngle = armAngle;
        ctx.rotate(smoothArmAngle);

        // ====== UPPER ARM (Parte superior do braço) ======
        const upperArmLength = 10 * scale;

        // Manga do braço
        ctx.fillStyle = robeColor;
        ctx.beginPath();
        ctx.moveTo(-2 * scale, -3 * scale);
        ctx.lineTo(upperArmLength, -2 * scale);
        ctx.lineTo(upperArmLength + 2 * scale, 2 * scale);
        ctx.lineTo(-2 * scale, 3 * scale);
        ctx.closePath();
        ctx.fill();

        // Sombra na manga
        ctx.fillStyle = robeDark;
        ctx.beginPath();
        ctx.moveTo(-2 * scale, 1 * scale);
        ctx.lineTo(upperArmLength, 0);
        ctx.lineTo(upperArmLength + 2 * scale, 2 * scale);
        ctx.lineTo(-2 * scale, 3 * scale);
        ctx.closePath();
        ctx.fill();

        // ====== FOREARM + HAND (Antebraço e mão) ======
        ctx.translate(upperArmLength, 0);

        // Antebraço (punho da manga)
        ctx.fillStyle = robeDark;
        ctx.beginPath();
        ctx.moveTo(0, -2 * scale);
        ctx.lineTo(8 * scale, -1.5 * scale);
        ctx.lineTo(8 * scale, 1.5 * scale);
        ctx.lineTo(0, 2 * scale);
        ctx.closePath();
        ctx.fill();

        // Mão segurando a varinha
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(10 * scale, 0, 4 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Dedos
        ctx.fillStyle = skinDark;
        ctx.beginPath();
        ctx.arc(12 * scale, -1.5 * scale, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12 * scale, 1.5 * scale, 1.8 * scale, 0, Math.PI * 2);
        ctx.fill();

        // ====== VARINHA (dentro do contexto do braço rotacionado) ======
        // Cores da varinha
        const wandWood = wandShopSkin.wood || wizSkin.wand;
        const wandWoodLight = wandShopSkin.woodLight || this.lightenColor(wizSkin.wand, 20);
        const wandWoodDark = wandShopSkin.woodDark || this.darkenColor(wizSkin.wand, 20);
        const wandCore = wandShopSkin.core || wizSkin.wandTip;
        const wandCoreGlow = wandShopSkin.coreGlow || wizSkin.wandTip;
        const wandHandle = wandShopSkin.handle || this.darkenColor(wizSkin.wand, 30);

        // Aura da varinha (se tiver skin especial)
        if (wandShopSkin.aura) {
            const wandAuraGlow = ctx.createRadialGradient(35 * scale, 0, 0, 35 * scale, 0, 25 * scale);
            wandAuraGlow.addColorStop(0, `rgba(${this.hexToRgb(wandShopSkin.aura.color)}, ${wandShopSkin.aura.alpha})`);
            wandAuraGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = wandAuraGlow;
            ctx.beginPath();
            ctx.arc(35 * scale, 0, 25 * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cabo da varinha (grip)
        ctx.fillStyle = wandHandle;
        ctx.beginPath();
        ctx.roundRect(14 * scale, -2.5 * scale, 6 * scale, 4 * scale, 1 * scale);
        ctx.fill();

        // Detalhes do cabo
        ctx.strokeStyle = wandWoodDark;
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo((15 + i * 2) * scale, -2.5 * scale);
            ctx.lineTo((15 + i * 2) * scale, 1.5 * scale);
            ctx.stroke();
        }

        // Corpo principal da varinha
        const wandGrad = ctx.createLinearGradient(20 * scale, -2 * scale, 20 * scale, 2 * scale);
        wandGrad.addColorStop(0, wandWoodLight);
        wandGrad.addColorStop(0.5, wandWood);
        wandGrad.addColorStop(1, wandWoodDark);
        ctx.fillStyle = wandGrad;

        ctx.beginPath();
        ctx.moveTo(20 * scale, -2 * scale);
        ctx.lineTo(38 * scale, -1.2 * scale);
        ctx.lineTo(38 * scale, 1.2 * scale);
        ctx.lineTo(20 * scale, 2 * scale);
        ctx.closePath();
        ctx.fill();

        // Brilho na varinha
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(22 * scale, -1.5 * scale);
        ctx.lineTo(35 * scale, -0.8 * scale);
        ctx.lineTo(35 * scale, -0.2 * scale);
        ctx.lineTo(22 * scale, -0.5 * scale);
        ctx.closePath();
        ctx.fill();

        // Efeitos especiais da varinha
        if (wandShopSkin.special === 'deathlyGlow') {
            ctx.shadowColor = '#E8E8E8';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(232, 232, 232, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(20 * scale, 0);
            ctx.lineTo(38 * scale, 0);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (wandShopSkin.special === 'phoenixFeather') {
            ctx.fillStyle = 'rgba(255, 107, 53, 0.6)';
            ctx.beginPath();
            ctx.ellipse(30 * scale, 0, 3 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (wandShopSkin.special === 'dragonHeartstring') {
            ctx.fillStyle = 'rgba(85, 239, 196, 0.4)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc((25 + i * 4) * scale, 0, 1.5 * scale, 0, Math.PI, true);
                ctx.fill();
            }
        } else if (wandShopSkin.special === 'unicornHair') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(30 * scale, 0, 5 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (wandShopSkin.special === 'thestralCore') {
            ctx.fillStyle = 'rgba(139, 0, 255, 0.3)';
            for (let i = 0; i < 4; i++) {
                const px = (25 + Math.sin(this.time * 3 + i) * 4) * scale;
                const py = (Math.cos(this.time * 2 + i) * 2) * scale;
                ctx.beginPath();
                ctx.arc(px, py, 1.5 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Ponta da varinha brilhando
        const tipPulse = 1 + Math.sin(this.time * 4) * 0.2;
        ctx.fillStyle = wandCore;
        ctx.shadowColor = wandCoreGlow;
        ctx.shadowBlur = 12 * tipPulse;
        ctx.beginPath();
        ctx.arc(40 * scale, 0, 3 * scale * tipPulse, 0, Math.PI * 2);
        ctx.fill();

        // Brilho interno da ponta
        ctx.fillStyle = wandCoreGlow;
        ctx.beginPath();
        ctx.arc(40 * scale, -0.8 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore(); // Fim do braço direito rotacionado

        ctx.restore(); // Fim do corpo principal

        // Desenhar aura cosmética (se tiver)
        if (player.cosmetics && player.cosmetics.aura) {
            this.drawCosmeticAura(ctx, x, y, player.size, player.cosmetics.aura);
        }

        // Nome do jogador com efeitos de cosméticos
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.textAlign = 'center';

        let nameY = y - 40 * scale;

        // Desenhar tag (se tiver)
        if (player.cosmetics && player.cosmetics.tag) {
            const tagConfig = this.cosmeticEffects.tags[player.cosmetics.tag];
            if (tagConfig) {
                nameY -= 16; // Move o nome para baixo para dar espaço à tag
                this.drawPlayerTag(ctx, x, nameY, tagConfig);
                nameY += 16;
            }
        }

        // Sombra do nome
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillText(player.name, x + 2, nameY + 2);

        // Nome com efeito ou normal
        if (player.cosmetics && player.cosmetics.nameEffect) {
            this.drawNameWithEffect(ctx, player.name, x, nameY, player.cosmetics.nameEffect, isMe);
        } else {
            ctx.fillStyle = isMe ? '#FFD700' : '#F0F0F0';
            ctx.fillText(player.name, x, nameY);
        }

        // Badge de nível
        if (isMe) {
            const lvlText = `Ano ${player.level}`;
            ctx.font = 'bold 10px Cinzel, serif';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillText(lvlText, x + 1, nameY + 14);
            ctx.fillStyle = '#D4AF37';
            ctx.fillText(lvlText, x, nameY + 13);
        }

        // Barra de HP
        this.drawHealthBarAdvanced(x, y + 25 * scale, player.size * 2, player.hp, player.maxHp, isMe);
    },

    // Desenha tag do jogador
    drawPlayerTag(ctx, x, y, tagConfig) {
        const tagText = tagConfig.text;
        ctx.font = 'bold 10px Cinzel, serif';
        const tagWidth = ctx.measureText(tagText).width + 10;
        const tagHeight = 14;
        const tagX = x - tagWidth / 2;
        const tagY = y - 18;

        // Glow
        ctx.shadowColor = tagConfig.glow;
        ctx.shadowBlur = 8;

        // Background
        ctx.fillStyle = tagConfig.bgColor;
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 3);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Texto
        ctx.fillStyle = tagConfig.textColor;
        ctx.fillText(tagText, x, tagY + 11);
    },

    // Desenha nome com efeito especial
    drawNameWithEffect(ctx, name, x, y, effectId, isMe) {
        const effect = this.cosmeticEffects.nameEffects[effectId];
        if (!effect) {
            ctx.fillStyle = isMe ? '#FFD700' : '#F0F0F0';
            ctx.fillText(name, x, y);
            return;
        }

        if (effect.type === 'rainbow') {
            // Efeito arco-íris animado
            const colors = effect.colors;
            const offset = (this.time * effect.speed * 1000) % colors.length;

            ctx.save();
            const textWidth = ctx.measureText(name).width;
            const startX = x - textWidth / 2;

            for (let i = 0; i < name.length; i++) {
                const colorIndex = Math.floor((i + offset) % colors.length);
                ctx.fillStyle = colors[colorIndex];
                const charX = startX + ctx.measureText(name.substring(0, i)).width;
                ctx.fillText(name[i], charX + ctx.measureText(name[i]).width / 2, y);
            }
            ctx.restore();
        } else if (effect.type === 'gradient') {
            // Efeito gradiente animado
            const colors = effect.colors;
            const offset = Math.sin(this.time * effect.speed * 500) * 0.5 + 0.5;

            if (effect.glow) {
                ctx.shadowColor = effect.glow.color;
                ctx.shadowBlur = effect.glow.blur;
            }

            const textWidth = ctx.measureText(name).width;
            const gradient = ctx.createLinearGradient(x - textWidth / 2, 0, x + textWidth / 2, 0);

            for (let i = 0; i < colors.length; i++) {
                const pos = (i / (colors.length - 1) + offset) % 1;
                gradient.addColorStop(Math.abs(pos), colors[i]);
            }

            ctx.fillStyle = gradient;
            ctx.fillText(name, x, y);
            ctx.shadowBlur = 0;
        }
    },

    // Desenha aura cosmética
    drawCosmeticAura(ctx, x, y, size, auraId) {
        const aura = this.cosmeticEffects.auras[auraId];
        if (!aura) return;

        ctx.save();

        if (aura.type === 'fire') {
            // Aura de fogo
            const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size + 30);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.2 + Math.sin(this.time * 5) * 0.1})`);
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size + 30, 0, Math.PI * 2);
            ctx.fill();

            // Partículas de fogo subindo
            for (let i = 0; i < 6; i++) {
                const angle = (this.time * 2 + i * Math.PI / 3) % (Math.PI * 2);
                const px = x + Math.cos(angle) * (size + 15);
                const py = y + Math.sin(angle) * (size + 15) - Math.sin(this.time * 8 + i) * 10;
                const pSize = 3 + Math.sin(this.time * 6 + i) * 2;

                ctx.fillStyle = `rgba(255, ${150 + i * 20}, 0, ${0.6 - i * 0.08})`;
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (aura.type === 'ice') {
            // Aura de gelo
            const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size + 30);
            gradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
            gradient.addColorStop(0.5, `rgba(135, 206, 250, ${0.2 + Math.sin(this.time * 3) * 0.1})`);
            gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size + 30, 0, Math.PI * 2);
            ctx.fill();

            // Cristais de gelo orbitando
            for (let i = 0; i < 6; i++) {
                const angle = this.time * 1.5 + i * Math.PI / 3;
                const px = x + Math.cos(angle) * (size + 20);
                const py = y + Math.sin(angle) * (size + 20);

                ctx.fillStyle = `rgba(200, 240, 255, ${0.7 - i * 0.1})`;
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(angle);
                ctx.fillRect(-3, -6, 6, 12);
                ctx.fillRect(-6, -3, 12, 6);
                ctx.restore();
            }
        } else if (aura.type === 'lightning') {
            // Aura de raio com flicker
            const flicker = Math.random() > 0.7 ? 1 : 0.6;
            const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size + 25);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
            gradient.addColorStop(0.5, `rgba(255, 255, 0, ${0.25 * flicker})`);
            gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size + 25, 0, Math.PI * 2);
            ctx.fill();

            // Raios elétricos
            if (Math.random() > 0.5) {
                ctx.strokeStyle = `rgba(255, 255, 100, ${0.8 * flicker})`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const startAngle = Math.random() * Math.PI * 2;
                    const startR = size + 5;
                    const endR = size + 25;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.cos(startAngle) * startR, y + Math.sin(startAngle) * startR);
                    const midAngle = startAngle + (Math.random() - 0.5) * 0.5;
                    ctx.lineTo(x + Math.cos(midAngle) * (startR + endR) / 2, y + Math.sin(midAngle) * (startR + endR) / 2);
                    ctx.lineTo(x + Math.cos(startAngle + (Math.random() - 0.5) * 0.3) * endR, y + Math.sin(startAngle) * endR);
                    ctx.stroke();
                }
            }
        } else if (aura.type === 'dark') {
            // Aura das trevas
            const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size + 35);
            gradient.addColorStop(0, 'rgba(75, 0, 130, 0)');
            gradient.addColorStop(0.4, `rgba(75, 0, 130, ${0.3 + Math.sin(this.time * 2) * 0.1})`);
            gradient.addColorStop(1, 'rgba(30, 0, 50, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size + 35, 0, Math.PI * 2);
            ctx.fill();

            // Partículas sombrias
            for (let i = 0; i < 8; i++) {
                const angle = this.time * 0.8 + i * Math.PI / 4;
                const r = size + 20 + Math.sin(this.time * 3 + i) * 8;
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;

                ctx.fillStyle = `rgba(138, 43, 226, ${0.5 - i * 0.05})`;
                ctx.beginPath();
                ctx.arc(px, py, 4 - i * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (aura.type === 'rainbow') {
            // Aura arco-íris rotativa
            const colors = aura.colors;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.time);

            for (let i = 0; i < colors.length; i++) {
                const startAngle = (i / colors.length) * Math.PI * 2;
                const endAngle = ((i + 1) / colors.length) * Math.PI * 2;

                const gradient = ctx.createRadialGradient(0, 0, size + 5, 0, 0, size + 30);
                gradient.addColorStop(0, `${colors[i]}00`);
                gradient.addColorStop(0.5, `${colors[i]}40`);
                gradient.addColorStop(1, `${colors[i]}00`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, size + 30, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        } else if (aura.type === 'stars') {
            // Aura estelar
            const starCount = aura.starCount || 8;

            for (let i = 0; i < starCount; i++) {
                const angle = this.time * 0.5 + i * (Math.PI * 2 / starCount);
                const r = size + 18 + Math.sin(this.time * 3 + i * 2) * 5;
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                const starSize = 2 + Math.sin(this.time * 5 + i) * 1;

                // Desenha estrela
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + Math.sin(this.time * 4 + i) * 0.2})`;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const starAngle = (j * Math.PI * 2 / 5) - Math.PI / 2;
                    const outerX = px + Math.cos(starAngle) * starSize;
                    const outerY = py + Math.sin(starAngle) * starSize;
                    const innerAngle = starAngle + Math.PI / 5;
                    const innerX = px + Math.cos(innerAngle) * (starSize * 0.4);
                    const innerY = py + Math.sin(innerAngle) * (starSize * 0.4);

                    if (j === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();
            }

            // Brilho central
            const glow = ctx.createRadialGradient(x, y, size * 0.8, x, y, size + 15);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0)');
            glow.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, size + 15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // Helper para desenhar retângulos pixelados
    drawPixelRect(ctx, px, py, width, height, pixelSize) {
        ctx.fillRect(
            Math.floor(px * pixelSize / 3),
            Math.floor(py * pixelSize / 3),
            Math.ceil(width * pixelSize / 3),
            Math.ceil(height * pixelSize / 3)
        );
    },

    drawProtegoShield(ctx, size) {
        const time = this.time;

        for (let i = 0; i < 3; i++) {
            const offset = i * 5;
            const alpha = 0.25 - i * 0.06;
            const pulseOffset = i * 0.5;

            ctx.beginPath();
            ctx.arc(0, 0, size + 18 + offset + Math.sin(time * 4 + pulseOffset) * 3, 0, Math.PI * 2);

            const gradient = ctx.createRadialGradient(0, 0, size, 0, 0, size + 22 + offset);
            gradient.addColorStop(0, `rgba(123, 104, 238, 0)`);
            gradient.addColorStop(0.5, `rgba(123, 104, 238, ${alpha})`);
            gradient.addColorStop(1, `rgba(123, 104, 238, 0)`);

            ctx.strokeStyle = `rgba(147, 112, 219, ${alpha + 0.15})`;
            ctx.lineWidth = 3 - i * 0.5;
            ctx.stroke();

            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Runas orbitando
        ctx.font = '12px serif';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
        const runes = ['*', '+', 'o', '*', '+', 'o'];
        for (let i = 0; i < runes.length; i++) {
            const angle = (time * 1.5) + (i * Math.PI / 3);
            const orbitRadius = size + 28;
            const px = Math.cos(angle) * orbitRadius;
            const py = Math.sin(angle) * orbitRadius;
            ctx.fillText(runes[i], px - 4, py + 4);
        }

        // Hexágono
        ctx.save();
        ctx.rotate(time * 0.5);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            const px = Math.cos(angle) * (size + 14);
            const py = Math.sin(angle) * (size + 14);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    },

    // Efeito visual de SLOW (Glacius) - cristais de gelo
    drawSlowEffect(ctx, size) {
        const time = this.time;

        // Aura de gelo azul
        const iceGradient = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size + 25);
        iceGradient.addColorStop(0, 'rgba(129, 212, 250, 0)');
        iceGradient.addColorStop(0.5, 'rgba(129, 212, 250, 0.3)');
        iceGradient.addColorStop(1, 'rgba(129, 212, 250, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, size + 25, 0, Math.PI * 2);
        ctx.fillStyle = iceGradient;
        ctx.fill();

        // Cristais de gelo orbitando
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.8)';
        ctx.fillStyle = 'rgba(129, 212, 250, 0.6)';
        ctx.lineWidth = 2;

        for (let i = 0; i < 6; i++) {
            const angle = time * 2 + (i * Math.PI / 3);
            const dist = size + 15 + Math.sin(time * 4 + i) * 5;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            const crystalSize = 6 + Math.sin(time * 3 + i) * 2;

            // Desenha cristal de gelo (forma de diamante)
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle + Math.PI / 4);

            ctx.beginPath();
            ctx.moveTo(0, -crystalSize);
            ctx.lineTo(crystalSize * 0.6, 0);
            ctx.lineTo(0, crystalSize);
            ctx.lineTo(-crystalSize * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }

        // Partículas de neve/gelo caindo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 8; i++) {
            const snowX = Math.sin(time * 3 + i * 1.5) * (size + 10);
            const snowY = ((time * 30 + i * 20) % (size * 2)) - size;
            const snowSize = 2 + Math.sin(time * 5 + i) * 1;

            ctx.beginPath();
            ctx.arc(snowX, snowY, snowSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Efeito visual de BURN (Incendio) - chamas
    drawBurnEffect(ctx, size) {
        const time = this.time;

        // Aura de fogo
        const fireGradient = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size + 30);
        fireGradient.addColorStop(0, 'rgba(255, 152, 0, 0)');
        fireGradient.addColorStop(0.5, 'rgba(255, 87, 34, 0.3)');
        fireGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');

        ctx.beginPath();
        ctx.arc(0, 0, size + 30, 0, Math.PI * 2);
        ctx.fillStyle = fireGradient;
        ctx.fill();

        // Chamas
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const baseX = Math.cos(angle) * (size + 5);
            const baseY = Math.sin(angle) * (size + 5);

            // Altura da chama animada
            const flameHeight = 15 + Math.sin(time * 10 + i * 2) * 8;
            const flameWidth = 6 + Math.sin(time * 8 + i) * 2;

            // Direção da chama (para cima com variação)
            const flameAngle = -Math.PI / 2 + Math.sin(time * 5 + i) * 0.3;

            ctx.save();
            ctx.translate(baseX, baseY);
            ctx.rotate(flameAngle + angle * 0.3);

            // Gradiente da chama
            const flameGrad = ctx.createLinearGradient(0, 0, 0, -flameHeight);
            flameGrad.addColorStop(0, 'rgba(255, 193, 7, 0.9)');
            flameGrad.addColorStop(0.3, 'rgba(255, 152, 0, 0.8)');
            flameGrad.addColorStop(0.6, 'rgba(255, 87, 34, 0.6)');
            flameGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');

            // Desenha chama
            ctx.beginPath();
            ctx.moveTo(-flameWidth, 0);
            ctx.quadraticCurveTo(-flameWidth * 0.5, -flameHeight * 0.5, 0, -flameHeight);
            ctx.quadraticCurveTo(flameWidth * 0.5, -flameHeight * 0.5, flameWidth, 0);
            ctx.closePath();
            ctx.fillStyle = flameGrad;
            ctx.fill();

            ctx.restore();
        }

        // Faíscas
        ctx.fillStyle = 'rgba(255, 235, 59, 0.9)';
        for (let i = 0; i < 6; i++) {
            const sparkAngle = time * 4 + i * 1.2;
            const sparkDist = size + 10 + ((time * 40 + i * 15) % 25);
            const sparkX = Math.cos(sparkAngle) * sparkDist;
            const sparkY = Math.sin(sparkAngle) * sparkDist - ((time * 30 + i * 10) % 20);
            const sparkSize = 2 + Math.random() * 1.5;

            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawHealthBarAdvanced(x, y, width, hp, maxHp, isMe) {
        const ctx = this.ctx;
        const height = 8;
        const hpPercent = Math.max(0, hp / maxHp);
        const borderRadius = 4;

        const bgGradient = ctx.createLinearGradient(x - width/2, y, x - width/2, y + height);
        bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.roundRect(x - width/2, y, width, height, borderRadius);
        ctx.fill();

        if (hpPercent > 0) {
            const hpColor = isMe ? '#69F0AE' : '#FF5252';
            const hpGradient = ctx.createLinearGradient(x - width/2, y, x - width/2, y + height);
            hpGradient.addColorStop(0, this.lightenColor(hpColor, 30));
            hpGradient.addColorStop(0.5, hpColor);
            hpGradient.addColorStop(1, this.darkenColor(hpColor, 20));

            ctx.fillStyle = hpGradient;

            if (hpPercent > 0.8) {
                ctx.shadowColor = hpColor;
                ctx.shadowBlur = 6;
            }

            ctx.beginPath();
            ctx.roundRect(x - width/2, y, width * hpPercent, height, borderRadius);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - width/2, y, width, height, borderRadius);
        ctx.stroke();
    },

    drawHealthBar(x, y, width, hp, maxHp) {
        this.drawHealthBarAdvanced(x, y, width, hp, maxHp, false);
    },

    drawVignette() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.3,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawMinimap() {
        const ctx = this.minimapCtx;
        const scale = 150 / this.mapWidth;

        // Fundo da floresta proibida
        const gradient = ctx.createLinearGradient(0, 0, 150, 150);
        gradient.addColorStop(0, 'rgba(20, 40, 20, 0.95)');
        gradient.addColorStop(1, 'rgba(10, 20, 10, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 150, 150);

        // Desenha obstaculos do mapa no minimap
        if (this.mapConfig && typeof MapRenderer !== 'undefined') {
            MapRenderer.drawMinimap(ctx, scale);
        }

        // Grid mais escuro para floresta
        ctx.strokeStyle = 'rgba(100, 150, 100, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 150; i += 25) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 150);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(150, i);
            ctx.stroke();
        }

        this.creatures.forEach(creature => {
            const mx = creature.x * scale;
            const my = creature.y * scale;
            ctx.fillStyle = creature.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(mx, my, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        Object.values(this.players).forEach(player => {
            if (player.id === this.myPlayerId) return;
            const mx = player.x * scale;
            const my = player.y * scale;
            ctx.fillStyle = '#FF5252';
            ctx.beginPath();
            ctx.arc(mx, my, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#D32F2F';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        if (this.myPlayer) {
            const mx = this.myPlayer.x * scale;
            const my = this.myPlayer.y * scale;

            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        if (this.myPlayer) {
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            ctx.lineWidth = 1.5;
            const vx = this.camera.x * scale;
            const vy = this.camera.y * scale;
            const vw = this.canvas.width * scale;
            const vh = this.canvas.height * scale;
            ctx.strokeRect(vx, vy, vw, vh);
        }

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 150, 150);
    },

    updateUI() {
        if (!this.myPlayer) return;

        const xpPercent = (this.myPlayer.xp / this.myPlayer.xpNext) * 100;
        this.elements.xpFill.style.width = xpPercent + '%';
        this.elements.levelText.textContent = 'Ano ' + this.myPlayer.level;

        const manaPercent = (this.myPlayer.mana / this.myPlayer.maxMana) * 100;
        this.elements.manaFill.style.width = manaPercent + '%';

        // Atualiza barra de speed boost
        if (this.elements.speedFill && this.myPlayer.speedBoostMaxCharge) {
            const speedPercent = (this.myPlayer.speedBoostCharge / this.myPlayer.speedBoostMaxCharge) * 100;
            this.elements.speedFill.style.width = speedPercent + '%';

            if (this.myPlayer.speedBoostActive) {
                this.elements.speedBar.classList.add('active');
            } else {
                this.elements.speedBar.classList.remove('active');
            }
        }

        if (this.myPlayer.statPoints > 0) {
            this.elements.statsPanel.classList.remove('hidden');
            this.elements.statPoints.textContent = this.myPlayer.statPoints;
        } else {
            this.elements.statsPanel.classList.add('hidden');
        }

        if (this.myPlayer.stats) {
            document.querySelectorAll('.stat-row').forEach(row => {
                const stat = row.dataset.stat;
                const fill = row.querySelector('.stat-fill');
                if (fill && this.myPlayer.stats[stat] !== undefined) {
                    fill.style.width = (this.myPlayer.stats[stat] / 7 * 100) + '%';
                }
            });
        }

        this.elements.scoreDisplay.textContent = this.myPlayer.score;

        // Atualiza gold
        if (this.elements.goldValue) {
            this.elements.goldValue.textContent = this.myPlayer.gold || 0;
        }
        if (this.elements.shopGoldValue && this.shopOpen) {
            this.elements.shopGoldValue.textContent = this.myPlayer.gold || 0;
        }

        if (this.myPlayer.spellCooldowns) {
            this.elements.spellSlots.forEach(slot => {
                const spellNum = parseInt(slot.dataset.spell);
                const cooldown = this.myPlayer.spellCooldowns[spellNum] || 0;
                if (cooldown > 0) {
                    slot.classList.add('on-cooldown');
                } else {
                    slot.classList.remove('on-cooldown');
                }
            });
        }

        this.elements.leaderboardList.innerHTML = '';
        this.leaderboard.forEach((player, index) => {
            const li = document.createElement('li');
            if (player.id === this.myPlayerId) {
                li.classList.add('me');
            }
            li.innerHTML = `
                <span class="leader-rank">${index + 1}</span>
                <span class="leader-name">${player.name}</span>
                <span class="leader-score">${player.score}</span>
            `;
            this.elements.leaderboardList.appendChild(li);
        });
    },

    addKillMessage(killer, victim) {
        const div = document.createElement('div');
        div.className = 'kill-message';
        div.innerHTML = `<span class="killer">${killer}</span> derrotou <span class="victim">${victim}</span>`;
        this.elements.killFeed.appendChild(div);

        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 500);
        }, 4500);

        while (this.elements.killFeed.children.length > 5) {
            this.elements.killFeed.firstChild.remove();
        }
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    // Converte hex para RGB string (para uso em rgba())
    hexToRgb(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `${r}, ${g}, ${b}`;
    },

    // Desenha preview de skin de wizard para a loja
    drawWizardPreview(canvas, skinId) {
        const ctx = canvas.getContext('2d');
        const skin = this.wizardSkins[skinId] || this.wizardSkins.default;
        const size = canvas.width;
        const scale = size / 80;
        const pixelSize = 3 * scale;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2 + 5);

        // Fundo com aura
        if (skin.aura) {
            const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, size * 0.4);
            auraGrad.addColorStop(0, `rgba(${this.hexToRgb(skin.aura.color)}, ${skin.aura.alpha})`);
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cores
        const robeColor = skin.robe || '#740001';
        const robeDark = skin.robeDark || this.darkenColor(robeColor, 30);
        const robeLight = skin.robeLight || this.lightenColor(robeColor, 20);
        const hatColor = skin.hat || this.darkenColor(robeColor, 15);

        // Capa/Robe
        ctx.fillStyle = robeColor;
        this.drawPixelRect(ctx, -8, -5, 16, 20, pixelSize);
        ctx.fillStyle = robeDark;
        this.drawPixelRect(ctx, -10, -3, 3, 18, pixelSize);
        this.drawPixelRect(ctx, 7, -3, 3, 18, pixelSize);
        ctx.fillStyle = robeLight;
        this.drawPixelRect(ctx, -5, -5, 4, 3, pixelSize);

        // Barba (Mago Ancestral)
        if (skin.hasBeard) {
            ctx.fillStyle = '#e0e0e0';
            this.drawPixelRect(ctx, -4, -6, 8, 8, pixelSize);
            ctx.fillStyle = '#d0d0d0';
            this.drawPixelRect(ctx, -3, 0, 6, 6, pixelSize);
        }

        // Rosto
        ctx.fillStyle = skin.skin;
        this.drawPixelRect(ctx, -5, -15, 10, 10, pixelSize);
        ctx.fillStyle = skin.skinDark;
        this.drawPixelRect(ctx, -5, -8, 10, 3, pixelSize);

        // Olhos
        ctx.fillStyle = skin.eyes;
        if (skin.eyes !== '#000000') {
            ctx.shadowColor = skin.eyes;
            ctx.shadowBlur = 5;
        }
        this.drawPixelRect(ctx, -4, -13, 2, 2, pixelSize);
        this.drawPixelRect(ctx, 2, -13, 2, 2, pixelSize);
        ctx.shadowBlur = 0;

        // Chapéu
        ctx.fillStyle = hatColor;
        this.drawPixelRect(ctx, -7, -18, 14, 4, pixelSize);
        this.drawPixelRect(ctx, -5, -23, 10, 5, pixelSize);
        this.drawPixelRect(ctx, -3, -28, 6, 5, pixelSize);
        this.drawPixelRect(ctx, -1, -32, 2, 4, pixelSize);

        // Fita do chapéu
        ctx.fillStyle = skin.hatBand;
        this.drawPixelRect(ctx, -7, -18, 14, 2, pixelSize);

        // Varinha
        ctx.fillStyle = skin.wand;
        ctx.fillRect(10 * scale, 0, 15 * scale, 2 * scale);
        ctx.fillStyle = skin.wandTip;
        ctx.shadowColor = skin.wandTip;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(26 * scale, 1 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // Desenha preview de skin de varinha para a loja
    drawWandPreview(canvas, skinId) {
        const ctx = canvas.getContext('2d');
        const skin = this.wandSkins[skinId] || this.wandSkins.default;
        const size = canvas.width;
        const scale = size / 80;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-Math.PI / 6); // Inclinação para melhor visualização

        // Aura
        if (skin.aura) {
            const auraGrad = ctx.createRadialGradient(10 * scale, 0, 5, 10 * scale, 0, size * 0.35);
            auraGrad.addColorStop(0, `rgba(${this.hexToRgb(skin.aura.color)}, ${skin.aura.alpha})`);
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(10 * scale, 0, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cabo da varinha (grip)
        ctx.fillStyle = skin.handle;
        ctx.beginPath();
        ctx.roundRect(-25 * scale, -3 * scale, 12 * scale, 6 * scale, 2);
        ctx.fill();

        // Detalhes do cabo
        ctx.strokeStyle = skin.woodDark;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo((-22 + i * 3) * scale, -3 * scale);
            ctx.lineTo((-22 + i * 3) * scale, 3 * scale);
            ctx.stroke();
        }

        // Corpo principal da varinha
        const wandGrad = ctx.createLinearGradient(-13 * scale, -2 * scale, -13 * scale, 2 * scale);
        wandGrad.addColorStop(0, skin.woodLight);
        wandGrad.addColorStop(0.5, skin.wood);
        wandGrad.addColorStop(1, skin.woodDark);
        ctx.fillStyle = wandGrad;

        ctx.beginPath();
        ctx.moveTo(-13 * scale, -3 * scale);
        ctx.lineTo(22 * scale, -1.5 * scale);
        ctx.lineTo(22 * scale, 1.5 * scale);
        ctx.lineTo(-13 * scale, 3 * scale);
        ctx.closePath();
        ctx.fill();

        // Brilho na varinha
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-10 * scale, -2 * scale);
        ctx.lineTo(18 * scale, -1 * scale);
        ctx.lineTo(18 * scale, -0.3 * scale);
        ctx.lineTo(-10 * scale, -1 * scale);
        ctx.closePath();
        ctx.fill();

        // Efeitos especiais
        if (skin.special === 'deathlyGlow') {
            ctx.shadowColor = '#E8E8E8';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(232, 232, 232, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-13 * scale, 0);
            ctx.lineTo(22 * scale, 0);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (skin.special === 'phoenixFeather') {
            ctx.fillStyle = 'rgba(255, 107, 53, 0.5)';
            ctx.beginPath();
            ctx.ellipse(5 * scale, 0, 4 * scale, 2 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (skin.special === 'dragonHeartstring') {
            ctx.fillStyle = 'rgba(85, 239, 196, 0.4)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc((-5 + i * 8) * scale, 0, 2 * scale, 0, Math.PI, true);
                ctx.fill();
            }
        } else if (skin.special === 'unicornHair') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(5 * scale, 0, 8 * scale, 2 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (skin.special === 'thestralCore') {
            ctx.fillStyle = 'rgba(139, 0, 255, 0.4)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc((-2 + i * 6) * scale, (i % 2 === 0 ? -1 : 1) * scale, 2 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Ponta brilhante
        ctx.fillStyle = skin.core;
        ctx.shadowColor = skin.coreGlow;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(25 * scale, 0, 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Brilho interno
        ctx.fillStyle = skin.coreGlow;
        ctx.beginPath();
        ctx.arc(25 * scale, -1.5 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    // Inicializa os previews da loja
    initShopPreviews() {
        // Previews de wizards
        document.querySelectorAll('#wizardsSection .shop-item').forEach(item => {
            const skinId = item.dataset.item;
            const previewDiv = item.querySelector('.item-preview');
            if (previewDiv && skinId) {
                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                previewDiv.innerHTML = '';
                previewDiv.appendChild(canvas);
                this.drawWizardPreview(canvas, skinId);
            }
        });

        // Previews de wands
        document.querySelectorAll('#wandsSection .shop-item').forEach(item => {
            const skinId = item.dataset.item;
            const previewDiv = item.querySelector('.item-preview');
            if (previewDiv && skinId) {
                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                previewDiv.innerHTML = '';
                previewDiv.appendChild(canvas);
                this.drawWandPreview(canvas, skinId);
            }
        });
    }
};

// Polyfill para roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

window.addEventListener('load', () => {
    Game.init();
});
