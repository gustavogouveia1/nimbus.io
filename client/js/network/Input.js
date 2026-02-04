/**
 * Nimbus.io - Gerenciador de Input
 * Teclado, Mouse e Sistema de Magias
 * Sistema de Spell Weaving (Combos)
 */
const Input = {
    keys: {
        up: false,
        down: false,
        left: false,
        right: false,
        shoot: false,
        speedBoost: false,
        spell1: false,
        spell2: false,
        spell3: false,
        spell4: false,
        spell5: false
    },

    mouse: {
        x: 0,
        y: 0,
        angle: 0
    },

    // Magia atualmente selecionada (1-5, 0 = básica)
    selectedSpell: 0,

    // ========== SISTEMA DE SPELL WEAVING (COMBOS) ==========
    comboBuffer: [],           // Buffer de teclas pressionadas
    comboTimeout: null,        // Timer para resetar combo
    comboWindowMs: 2500,       // Janela de tempo para completar combo (2.5s)
    lastComboTime: 0,          // Timestamp do último input
    activeCombo: null,         // Combo sendo executado atualmente
    comboDisplayTimer: 0,      // Timer para mostrar feedback visual

    // ========== SISTEMA DE COOLDOWN ==========
    spellCooldowns: {},        // Timestamp de quando cada spell fica disponível
    spellCooldownTime: 3000,   // Cooldown padrão de 3 segundos (em ms)
    comboCooldowns: {},        // Cooldowns específicos para combos

    // Definição dos combos disponíveis
    // Formato: { sequência: { nome, descrição, tipo, ... } }
    spellCombos: {
        // === COMBOS DE 3 TECLAS (Básicos) ===
        '1-2-1': {
            name: 'Fogo Atordoante',
            nameEn: 'Stunning Fire',
            description: 'Stupefy potencializado com chamas',
            sequence: [1, 2, 1],
            manaCost: 45,
            cooldown: 6,
            type: 'stunning_fire',
            damage: 55,
            effects: ['stun', 'burn'],
            color: '#FF6B35',
            icon: '🔥⚡'
        },
        '3-1-3': {
            name: 'Paralisia Gélida',
            nameEn: 'Frozen Paralysis',
            description: 'Congela e atordoa o inimigo',
            sequence: [3, 1, 3],
            manaCost: 50,
            cooldown: 7,
            type: 'frozen_paralysis',
            damage: 45,
            effects: ['freeze', 'stun'],
            color: '#00D4FF',
            icon: '❄️⚡'
        },
        '2-3-2': {
            name: 'Vapor Explosivo',
            nameEn: 'Explosive Steam',
            description: 'Fogo e gelo criam vapor devastador',
            sequence: [2, 3, 2],
            manaCost: 55,
            cooldown: 8,
            type: 'steam_blast',
            damage: 60,
            effects: ['aoe', 'slow'],
            color: '#B8B8B8',
            icon: '💨🔥'
        },
        '1-1-1': {
            name: 'Stupefy Triplo',
            nameEn: 'Triple Stupefy',
            description: 'Três raios de atordoamento em leque',
            sequence: [1, 1, 1],
            manaCost: 40,
            cooldown: 5,
            type: 'triple_stupefy',
            damage: 20,
            effects: ['spread', 'stun'],
            color: '#FF4444',
            icon: '⚡⚡⚡'
        },

        // === COMBOS DE 4 TECLAS (Intermediários) ===
        '1-3-2-1': {
            name: 'Tempestade Elemental',
            nameEn: 'Elemental Storm',
            description: 'Canaliza todos os elementos',
            sequence: [1, 3, 2, 1],
            manaCost: 70,
            cooldown: 12,
            type: 'elemental_storm',
            damage: 80,
            effects: ['burn', 'slow', 'stun'],
            color: '#9B59B6',
            icon: '🌪️✨'
        },
        '2-2-3-3': {
            name: 'Inferno Glacial',
            nameEn: 'Glacial Inferno',
            description: 'Paradoxo de fogo e gelo',
            sequence: [2, 2, 3, 3],
            manaCost: 65,
            cooldown: 10,
            type: 'glacial_inferno',
            damage: 70,
            effects: ['burn', 'freeze', 'aoe'],
            color: '#E74C3C',
            icon: '🔥❄️'
        },
        '3-3-3-1': {
            name: 'Avalanche Arcana',
            nameEn: 'Arcane Avalanche',
            description: 'Onda de gelo devastadora',
            sequence: [3, 3, 3, 1],
            manaCost: 60,
            cooldown: 9,
            type: 'arcane_avalanche',
            damage: 55,
            effects: ['freeze', 'knockback', 'aoe'],
            color: '#3498DB',
            icon: '❄️🏔️'
        },
        '5-1-2-3': {
            name: 'Escudo Reativo',
            nameEn: 'Reactive Shield',
            description: 'Escudo que reflete dano',
            sequence: [5, 1, 2, 3],
            manaCost: 75,
            cooldown: 15,
            type: 'reactive_shield',
            damage: 0,
            effects: ['shield', 'reflect', 'thorns'],
            color: '#F1C40F',
            icon: '🛡️⚡'
        },

        // === COMBOS DE 5 TECLAS (Avançados) ===
        '4-2-3-2-4': {
            name: 'Apocalipse Arcano',
            nameEn: 'Arcane Apocalypse',
            description: 'Devastação total em área',
            sequence: [4, 2, 3, 2, 4],
            manaCost: 100,
            cooldown: 20,
            type: 'arcane_apocalypse',
            damage: 120,
            effects: ['mega_aoe', 'burn', 'slow', 'stun'],
            color: '#8E44AD',
            icon: '💀🔥'
        },
        '1-2-3-4-5': {
            name: 'Harmonia dos Elementos',
            nameEn: 'Elemental Harmony',
            description: 'Fusão perfeita de todas as magias',
            sequence: [1, 2, 3, 4, 5],
            manaCost: 90,
            cooldown: 18,
            type: 'elemental_harmony',
            damage: 100,
            effects: ['all_elements', 'heal_self'],
            color: '#00FF88',
            icon: '✨🌈'
        },
        '5-5-4-4-1': {
            name: 'Fortaleza Explosiva',
            nameEn: 'Explosive Fortress',
            description: 'Escudo que explode ao acabar',
            sequence: [5, 5, 4, 4, 1],
            manaCost: 85,
            cooldown: 16,
            type: 'explosive_fortress',
            damage: 90,
            effects: ['shield', 'delayed_explosion'],
            color: '#E67E22',
            icon: '🛡️💥'
        },
        '3-2-1-2-3': {
            name: 'Ciclone Primordial',
            nameEn: 'Primordial Cyclone',
            description: 'Vórtice elemental que puxa inimigos',
            sequence: [3, 2, 1, 2, 3],
            manaCost: 80,
            cooldown: 14,
            type: 'primordial_cyclone',
            damage: 75,
            effects: ['pull', 'dot', 'aoe'],
            color: '#1ABC9C',
            icon: '🌀⚡'
        }
    },

    // Mapeamento de teclas para upgrades
    upgradeKeys: {
        'u': 'manaRegen',
        'i': 'maxMana',
        'o': 'spellPower',
        'p': 'spellSpeed',
        'j': 'castSpeed',
        'k': 'movementSpeed',
        'l': 'maxHealth',
        ';': 'healthRegen'
    },

    // Nomes das magias
    spellNames: {
        1: 'stupefy',
        2: 'incendio',
        3: 'glacius',
        4: 'bombarda',
        5: 'protego'
    },

    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Previne menu de contexto no canvas
        document.getElementById('gameCanvas').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // ========== BLOQUEIO DE SCROLL E ZOOM ==========

        // Previne scroll em toda a página
        document.addEventListener('scroll', (e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
        }, { passive: false });

        // Previne zoom com Ctrl+scroll (wheel)
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });

        // Previne zoom com teclado (Ctrl+Plus, Ctrl+Minus, Ctrl+0)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
                e.preventDefault();
            }
        });

        // Previne zoom com touch (pinch zoom)
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Previne gesture events (Safari)
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    },

    onKeyDown(e) {
        // Ignora se estiver digitando em um input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key.toLowerCase();

        // Movimento (WASD e setas)
        if (key === 'w' || key === 'arrowup') {
            this.keys.up = true;
            e.preventDefault();
        }
        if (key === 's' || key === 'arrowdown') {
            this.keys.down = true;
            e.preventDefault();
        }
        if (key === 'a' || key === 'arrowleft') {
            this.keys.left = true;
            e.preventDefault();
        }
        if (key === 'd' || key === 'arrowright') {
            this.keys.right = true;
            e.preventDefault();
        }

        // Tiro básico com espaço
        if (key === ' ') {
            this.keys.shoot = true;
            this.selectedSpell = 0;
            e.preventDefault();
        }

        // Speed Boost com Shift
        if (key === 'shift') {
            this.keys.speedBoost = true;
            e.preventDefault();
        }

        // Magias especiais (1-5)
        if (key === '1') {
            this.castSpell(1);
            e.preventDefault();
        }
        if (key === '2') {
            this.castSpell(2);
            e.preventDefault();
        }
        if (key === '3') {
            this.castSpell(3);
            e.preventDefault();
        }
        if (key === '4') {
            this.castSpell(4);
            e.preventDefault();
        }
        if (key === '5') {
            this.castSpell(5);
            e.preventDefault();
        }

        // Upgrades
        if (this.upgradeKeys[key] && typeof Game !== 'undefined' && Game.myPlayer) {
            Network.sendUpgrade(this.upgradeKeys[key]);
        }

        // Auto-fire toggle com E
        if (key === 'e') {
            this.keys.shoot = !this.keys.shoot;
        }

        // Abre Spellbook com Tab ou G
        if (key === 'tab' || key === 'g') {
            this.toggleSpellbook();
            e.preventDefault();
        }

        // Fecha menus com Escape
        if (key === 'escape') {
            this.closeSpellbook();
            this.resetCombo();
        }
    },

    onKeyUp(e) {
        // Ignora se estiver digitando em um input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key.toLowerCase();

        // Movimento
        if (key === 'w' || key === 'arrowup') {
            this.keys.up = false;
        }
        if (key === 's' || key === 'arrowdown') {
            this.keys.down = false;
        }
        if (key === 'a' || key === 'arrowleft') {
            this.keys.left = false;
        }
        if (key === 'd' || key === 'arrowright') {
            this.keys.right = false;
        }

        // Reset speed boost
        if (key === 'shift') {
            this.keys.speedBoost = false;
        }

        // Reset spell keys
        if (key === '1') this.keys.spell1 = false;
        if (key === '2') this.keys.spell2 = false;
        if (key === '3') this.keys.spell3 = false;
        if (key === '4') this.keys.spell4 = false;
        if (key === '5') this.keys.spell5 = false;
    },

    castSpell(spellNum) {
        this.selectedSpell = spellNum;
        this.keys[`spell${spellNum}`] = true;

        // SEMPRE adiciona ao buffer de combo (permite combos mesmo com cooldown)
        this.addToComboBuffer(spellNum);

        // Atualiza visual dos slots de magia
        document.querySelectorAll('.spell-slot').forEach(slot => {
            slot.classList.remove('active');
            if (parseInt(slot.dataset.spell) === spellNum) {
                slot.classList.add('active');
            }
        });

        // Verifica se completou um combo
        const combo = this.checkCombo();
        if (combo) {
            // Combo detectado! Tenta executar (verifica mana)
            this.executeCombo(combo);
        } else {
            // Verifica cooldown antes de lançar magia individual
            if (this.isSpellOnCooldown(spellNum)) {
                // Mostra feedback de cooldown
                this.showCooldownFeedback(spellNum);
            } else {
                // Envia comando de magia normal ao servidor
                if (typeof Network !== 'undefined') {
                    Network.sendCastSpell(spellNum);
                }
                // Aplica cooldown
                this.applySpellCooldown(spellNum);
            }
        }

        // Reset visual após um tempo
        setTimeout(() => {
            document.querySelectorAll('.spell-slot').forEach(slot => {
                slot.classList.remove('active');
            });
        }, 300);
    },

    // ========== FUNÇÕES DE SPELL WEAVING ==========

    // Adiciona uma tecla ao buffer de combo
    addToComboBuffer(spellNum) {
        const now = Date.now();

        // Se passou muito tempo desde o último input, reseta o buffer
        if (now - this.lastComboTime > this.comboWindowMs) {
            this.comboBuffer = [];
        }

        this.lastComboTime = now;
        this.comboBuffer.push(spellNum);

        // Limita o buffer a 5 teclas (tamanho máximo de combo)
        if (this.comboBuffer.length > 5) {
            this.comboBuffer.shift();
        }

        // Atualiza display do combo
        this.updateComboDisplay();

        // Reseta o timer de timeout
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, this.comboWindowMs);
    },

    // Verifica se o buffer atual corresponde a algum combo
    checkCombo() {
        const bufferStr = this.comboBuffer.join('-');

        // Verifica combos de diferentes tamanhos (5, 4, 3)
        for (let len = 5; len >= 3; len--) {
            if (this.comboBuffer.length >= len) {
                const subBuffer = this.comboBuffer.slice(-len);
                const subStr = subBuffer.join('-');

                if (this.spellCombos[subStr]) {
                    return this.spellCombos[subStr];
                }
            }
        }

        return null;
    },

    // Executa um combo
    executeCombo(combo) {
        // Verifica se o combo está em cooldown
        if (this.isCombOnCooldown(combo.type)) {
            this.showComboCooldownFeedback(combo);
            return;
        }

        // Verifica mana do jogador (verifica se Game e myPlayer existem)
        if (typeof Game !== 'undefined' && Game.myPlayer) {
            const playerMana = Game.myPlayer.mana || 0;
            if (playerMana < combo.manaCost) {
                // Mana insuficiente - mostra feedback
                this.showManaInsuficientFeedback(combo);
                return;
            }
        }

        console.log(`🔮 COMBO EXECUTADO: ${combo.name}! (Custo: ${combo.manaCost} mana)`);

        // Limpa o buffer
        this.comboBuffer = [];
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }

        // Armazena combo ativo para feedback visual
        this.activeCombo = combo;
        this.comboDisplayTimer = 120; // 2 segundos de display

        // Envia combo ao servidor (o servidor irá consumir a mana)
        if (typeof Network !== 'undefined') {
            Network.sendCombo(combo.type);
        }

        // Aplica cooldown do combo
        this.applyComboCooldown(combo);

        // Mostra feedback visual do combo
        this.showComboFeedback(combo);

        // Atualiza HUD
        this.updateComboDisplay();
    },

    // Reseta o buffer de combo
    resetCombo() {
        this.comboBuffer = [];
        this.updateComboDisplay();
    },

    // Atualiza o display visual do combo no HUD
    updateComboDisplay() {
        const comboDisplay = document.getElementById('comboDisplay');
        if (!comboDisplay) return;

        if (this.comboBuffer.length === 0) {
            comboDisplay.classList.add('hidden');
            return;
        }

        comboDisplay.classList.remove('hidden');

        // Mostra as teclas no buffer
        const keysHtml = this.comboBuffer.map(num => {
            const spellName = this.spellNames[num] || num;
            return `<span class="combo-key ${spellName}">${num}</span>`;
        }).join('');

        const bufferEl = comboDisplay.querySelector('.combo-buffer');
        if (bufferEl) {
            bufferEl.innerHTML = keysHtml;
        }

        // Verifica se está formando algum combo parcial
        const partialMatch = this.getPartialComboMatch();
        const hintEl = comboDisplay.querySelector('.combo-hint');
        if (hintEl && partialMatch) {
            hintEl.textContent = `→ ${partialMatch.name}`;
            hintEl.style.color = partialMatch.color;
        } else if (hintEl) {
            hintEl.textContent = '';
        }
    },

    // Verifica se o buffer atual é início de algum combo
    getPartialComboMatch() {
        const bufferStr = this.comboBuffer.join('-');

        for (const [key, combo] of Object.entries(this.spellCombos)) {
            if (key.startsWith(bufferStr) && key !== bufferStr) {
                return combo;
            }
        }
        return null;
    },

    // Mostra feedback visual quando um combo é executado
    showComboFeedback(combo) {
        // Cria elemento de feedback
        let feedback = document.getElementById('comboFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'comboFeedback';
            document.body.appendChild(feedback);
        }

        feedback.innerHTML = `
            <div class="combo-icon">${combo.icon}</div>
            <div class="combo-name" style="color: ${combo.color}">${combo.name}</div>
            <div class="combo-description">${combo.description}</div>
        `;

        feedback.className = 'combo-feedback-active';

        // Remove após animação
        setTimeout(() => {
            feedback.className = '';
        }, 2000);
    },

    // ========== FUNÇÕES DE COOLDOWN ==========

    // Verifica se uma spell está em cooldown
    isSpellOnCooldown(spellNum) {
        const cooldownEnd = this.spellCooldowns[spellNum] || 0;
        return Date.now() < cooldownEnd;
    },

    // Retorna tempo restante de cooldown em ms
    getSpellCooldownRemaining(spellNum) {
        const cooldownEnd = this.spellCooldowns[spellNum] || 0;
        return Math.max(0, cooldownEnd - Date.now());
    },

    // Aplica cooldown a uma spell
    applySpellCooldown(spellNum) {
        this.spellCooldowns[spellNum] = Date.now() + this.spellCooldownTime;
        this.updateCooldownVisuals();
    },

    // Verifica se um combo está em cooldown
    isCombOnCooldown(comboType) {
        const cooldownEnd = this.comboCooldowns[comboType] || 0;
        return Date.now() < cooldownEnd;
    },

    // Aplica cooldown a um combo (usando o cooldown específico do combo)
    applyComboCooldown(combo) {
        const cooldownMs = (combo.cooldown || 5) * 1000;
        this.comboCooldowns[combo.type] = Date.now() + cooldownMs;
    },

    // Mostra feedback quando spell está em cooldown
    showCooldownFeedback(spellNum) {
        const remaining = this.getSpellCooldownRemaining(spellNum) / 1000;
        const spellName = this.spellNames[spellNum] || `Spell ${spellNum}`;

        // Feedback visual rápido
        let feedback = document.getElementById('cooldownFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'cooldownFeedback';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                font-family: 'Cinzel', serif;
                font-size: 18px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(feedback);
        }

        feedback.textContent = `⏳ ${spellName} em cooldown (${remaining.toFixed(1)}s)`;
        feedback.style.opacity = '1';

        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 800);
    },

    // Mostra feedback quando combo está em cooldown
    showComboCooldownFeedback(combo) {
        const cooldownEnd = this.comboCooldowns[combo.type] || 0;
        const remaining = Math.max(0, (cooldownEnd - Date.now()) / 1000);

        let feedback = document.getElementById('cooldownFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'cooldownFeedback';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 100, 0, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-family: 'Cinzel', serif;
                font-size: 20px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(feedback);
        }

        feedback.innerHTML = `⏳ <strong>${combo.name}</strong> em cooldown (${remaining.toFixed(1)}s)`;
        feedback.style.background = 'rgba(255, 100, 0, 0.9)';
        feedback.style.opacity = '1';

        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 1000);
    },

    // Mostra feedback quando mana é insuficiente
    showManaInsuficientFeedback(combo) {
        let feedback = document.getElementById('cooldownFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'cooldownFeedback';
            feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 100, 255, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-family: 'Cinzel', serif;
                font-size: 20px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(feedback);
        }

        const playerMana = (typeof Game !== 'undefined' && Game.myPlayer) ? Math.floor(Game.myPlayer.mana || 0) : 0;
        feedback.innerHTML = `💧 <strong>${combo.name}</strong> - Mana insuficiente! (${playerMana}/${combo.manaCost})`;
        feedback.style.background = 'rgba(0, 100, 255, 0.9)';
        feedback.style.opacity = '1';

        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 1200);
    },

    // Atualiza visualização de cooldowns nos slots de spell
    updateCooldownVisuals() {
        document.querySelectorAll('.spell-slot').forEach(slot => {
            const spellNum = parseInt(slot.dataset.spell);
            if (!spellNum) return;

            const remaining = this.getSpellCooldownRemaining(spellNum);
            let cooldownOverlay = slot.querySelector('.cooldown-overlay');

            if (remaining > 0) {
                if (!cooldownOverlay) {
                    cooldownOverlay = document.createElement('div');
                    cooldownOverlay.className = 'cooldown-overlay';
                    cooldownOverlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #ff6b6b;
                        font-size: 14px;
                        font-weight: bold;
                        border-radius: inherit;
                        pointer-events: none;
                    `;
                    slot.style.position = 'relative';
                    slot.appendChild(cooldownOverlay);
                }
                cooldownOverlay.textContent = (remaining / 1000).toFixed(1);
            } else if (cooldownOverlay) {
                cooldownOverlay.remove();
            }
        });

        // Continua atualizando enquanto houver cooldowns ativos
        const hasActiveCooldowns = Object.values(this.spellCooldowns).some(cd => Date.now() < cd);
        if (hasActiveCooldowns) {
            requestAnimationFrame(() => this.updateCooldownVisuals());
        }
    },

    // Abre o livro de magias (Spellbook)
    openSpellbook() {
        const spellbook = document.getElementById('spellbookPanel');
        if (spellbook) {
            spellbook.classList.remove('hidden');
        }
    },

    // Fecha o livro de magias
    closeSpellbook() {
        const spellbook = document.getElementById('spellbookPanel');
        if (spellbook) {
            spellbook.classList.add('hidden');
        }
    },

    // Toggle do livro de magias
    toggleSpellbook() {
        const spellbook = document.getElementById('spellbookPanel');
        if (spellbook) {
            spellbook.classList.toggle('hidden');
        }
    },

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        // Calcula ângulo em relação ao centro da tela
        if (typeof Game !== 'undefined') {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.mouse.angle = Math.atan2(
                this.mouse.y - centerY,
                this.mouse.x - centerX
            );
        }
    },

    onMouseDown(e) {
        if (e.button === 0) { // Botão esquerdo - tiro básico
            this.keys.shoot = true;
            this.selectedSpell = 0;
        }
    },

    onMouseUp(e) {
        if (e.button === 0) {
            this.keys.shoot = false;
        }
    },

    // Retorna o estado atual para enviar ao servidor
    getState() {
        return {
            keys: { ...this.keys },
            angle: this.mouse.angle,
            selectedSpell: this.selectedSpell
        };
    }
};
