/**
 * Nimbus.io - Player Entity (Client-side)
 * Representacao visual e interpolacao do jogador
 */
const PlayerEntity = {
    // Cores das casas/varinhas
    wandColors: {
        phoenix: { primary: '#FF6B35', secondary: '#FF4444', trail: '#FFD700' },
        dragon: { primary: '#2ECC71', secondary: '#27AE60', trail: '#98FB98' },
        unicorn: { primary: '#E8E8E8', secondary: '#C0C0C0', trail: '#FFFFFF' },
        elder: { primary: '#8B4513', secondary: '#654321', trail: '#DEB887' }
    },

    // Designs de skins de bruxos
    wizardSkins: {
        default: {
            robe: null,
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

    // Designs de skins de vassouras
    broomSkins: {
        default: {
            handle: ['#5D3A1A', '#8B4513', '#A0522D', '#CD853F'],
            metal: '#D4AF37',
            metalShine: '#FFD700',
            bristles: ['#DEB887', '#D2B48C', '#C4A574', '#DAA520'],
            binding: '#8B4513',
            special: null
        },
        broom_nimbus: {
            handle: ['#c0c0c0', '#dfe6e9', '#ecf0f1', '#ffffff'],
            metal: '#bdc3c7',
            metalShine: '#ecf0f1',
            bristles: ['#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e'],
            binding: '#95a5a6',
            special: 'speedLines',
            aura: { color: '#dfe6e9', alpha: 0.3 }
        },
        broom_firebolt: {
            handle: ['#8b0000', '#b22222', '#cd5c5c', '#e74c3c'],
            metal: '#f39c12',
            metalShine: '#ffd700',
            bristles: ['#ff6b35', '#ff4500', '#ff6347', '#dc143c'],
            binding: '#8b0000',
            special: 'flames',
            aura: { color: '#e74c3c', alpha: 0.25 }
        },
        broom_lightning: {
            handle: ['#f1c40f', '#f39c12', '#e67e22', '#d35400'],
            metal: '#fff9c4',
            metalShine: '#ffffff',
            bristles: ['#fff59d', '#ffee58', '#fdd835', '#f9a825'],
            binding: '#f39c12',
            special: 'electricSparks',
            aura: { color: '#f1c40f', alpha: 0.3 }
        },
        broom_phoenix: {
            handle: ['#c0392b', '#e74c3c', '#ff6b6b', '#ff8e8e'],
            metal: '#ffd700',
            metalShine: '#fff5cc',
            bristles: ['#ff6b6b', '#fd79a8', '#fab1a0', '#ffeaa7'],
            binding: '#d63031',
            special: 'phoenixFeathers',
            aura: { color: '#fd79a8', alpha: 0.3 },
            hasFeathers: true
        },
        broom_dragon: {
            handle: ['#006266', '#009432', '#00b894', '#55efc4'],
            metal: '#2d3436',
            metalShine: '#636e72',
            bristles: ['#00b894', '#1abc9c', '#55efc4', '#81ecec'],
            binding: '#006266',
            special: 'dragonScales',
            aura: { color: '#00b894', alpha: 0.25 },
            hasScales: true
        }
    },

    // Definicoes de cosmeticos
    cosmeticEffects: {
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
        tags: {
            tag_vip: { text: 'VIP', bgColor: '#ffd700', textColor: '#000', glow: '#ffd700' },
            tag_pro: { text: 'PRO', bgColor: '#1e90ff', textColor: '#fff', glow: '#00bfff' },
            tag_legend: { text: 'LENDA', bgColor: '#9400d3', textColor: '#fff', glow: '#ff1493' },
            tag_mystic: { text: 'MISTICO', bgColor: '#4b0082', textColor: '#fff', glow: '#8a2be2' }
        },
        auras: {
            aura_fire: { type: 'fire', color: '#ff6600', particles: true, particleColor: '#ff4500' },
            aura_ice: { type: 'ice', color: '#00bfff', particles: true, particleColor: '#87ceeb' },
            aura_lightning: { type: 'lightning', color: '#ffff00', flicker: true },
            aura_dark: { type: 'dark', color: '#4b0082', particles: true, particleColor: '#8a2be2' },
            aura_rainbow: { type: 'rainbow', colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'], rotate: true },
            aura_stars: { type: 'stars', color: '#ffffff', starCount: 8 }
        }
    },

    getSkin(skinId) {
        return this.wizardSkins[skinId] || this.wizardSkins.default;
    },

    getBroomSkin(skinId) {
        return this.broomSkins[skinId] || this.broomSkins.default;
    },

    getWandColor(wandType) {
        return this.wandColors[wandType] || this.wandColors.phoenix;
    }
};
