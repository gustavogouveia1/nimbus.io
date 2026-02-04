/**
 * Nimbus.io - Spell Entity (Client-side)
 * Representacao visual dos feiticos
 */
const SpellEntity = {
    // Cores das magias
    colors: {
        stupefy: { primary: '#FF5252', secondary: '#D32F2F', glow: '#FF8A80' },
        incendio: { primary: '#FF9800', secondary: '#F57C00', glow: '#FFCC80' },
        glacius: { primary: '#81D4FA', secondary: '#29B6F6', glow: '#B3E5FC' },
        bombarda: { primary: '#8D6E63', secondary: '#5D4037', glow: '#D7CCC8' },
        protego: { primary: '#7B68EE', secondary: '#5C6BC0', glow: '#B39DDB' },
        basic: { primary: '#D4AF37', secondary: '#AA8C2C', glow: '#F4D03F' },
        // Combos de Spell Weaving
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

    getColor(spellType) {
        return this.colors[spellType] || this.colors.basic;
    },

    isComboSpell(spellType) {
        const color = this.colors[spellType];
        return color && color.combo === true;
    }
};

// Definicoes de combos para o cliente
const SpellCombos = {
    // Combos de 3 teclas (Basicos)
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
        name: 'Paralisia Gelida',
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
        description: 'Tres raios de atordoamento em leque',
        sequence: [1, 1, 1],
        manaCost: 40,
        cooldown: 5,
        type: 'triple_stupefy',
        damage: 20,
        effects: ['spread', 'stun'],
        color: '#FF4444',
        icon: '⚡⚡⚡'
    },

    // Combos de 4 teclas (Intermediarios)
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

    // Combos de 5 teclas (Avancados)
    '4-2-3-2-4': {
        name: 'Apocalipse Arcano',
        nameEn: 'Arcane Apocalypse',
        description: 'Devastacao total em area',
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
        description: 'Fusao perfeita de todas as magias',
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
        description: 'Vortice elemental que puxa inimigos',
        sequence: [3, 2, 1, 2, 3],
        manaCost: 80,
        cooldown: 14,
        type: 'primordial_cyclone',
        damage: 75,
        effects: ['pull', 'dot', 'aoe'],
        color: '#1ABC9C',
        icon: '🌀⚡'
    }
};
