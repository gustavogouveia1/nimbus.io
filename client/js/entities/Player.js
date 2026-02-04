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

    getWandSkin(skinId) {
        return this.wandSkins[skinId] || this.wandSkins.default;
    },

    getWandColor(wandType) {
        return this.wandColors[wandType] || this.wandColors.phoenix;
    }
};
