/**
 * Nimbus.io - Configuração do Mapa
 * Floresta Proibida - Estilo Summoner's Rift
 */
console.log('!!! MapConfig.js CARREGADO !!!');

const MAP_CONFIG = {
    width: 6000,
    height: 6000,
    gridSize: 60,
    theme: "forbidden_forest",
    lanes: {
        width: 280,
        paths: [
            { name: "top", points: [[200, 200], [200, 800], [800, 200]] },
            { name: "mid", points: [[200, 200], [3000, 3000], [5800, 5800]] },
            { name: "bot", points: [[5800, 5800], [5800, 5200], [5200, 5800]] }
        ]
    },
    obstacles: [
        { type: "trees", id: "jungle_top_left", x: 400, y: 1200, width: 800, height: 600, collision: true },
        { type: "trees", id: "jungle_top_right", x: 1200, y: 400, width: 600, height: 800, collision: true },
        { type: "trees", id: "jungle_top_mid1", x: 600, y: 2000, width: 500, height: 700, collision: true },
        { type: "trees", id: "jungle_top_mid2", x: 2000, y: 600, width: 700, height: 500, collision: true },

        { type: "trees", id: "jungle_bot_left", x: 4000, y: 5400, width: 600, height: 400, collision: true },
        { type: "trees", id: "jungle_bot_right", x: 5400, y: 4000, width: 400, height: 600, collision: true },
        { type: "trees", id: "jungle_bot_mid1", x: 3300, y: 5000, width: 500, height: 600, collision: true },
        { type: "trees", id: "jungle_bot_mid2", x: 5000, y: 3300, width: 600, height: 500, collision: true },

        { type: "trees", id: "jungle_center_top", x: 1800, y: 1800, width: 700, height: 700, collision: true },
        { type: "trees", id: "jungle_center_bot", x: 3500, y: 3500, width: 700, height: 700, collision: true },

        { type: "trees", id: "jungle_left_wall", x: 1000, y: 2800, width: 400, height: 1200, collision: true },
        { type: "trees", id: "jungle_right_wall", x: 4600, y: 2000, width: 400, height: 1200, collision: true },
        { type: "trees", id: "jungle_top_wall", x: 2800, y: 1000, width: 1200, height: 400, collision: true },
        { type: "trees", id: "jungle_bot_wall", x: 2000, y: 4600, width: 1200, height: 400, collision: true },

        { type: "rocks", id: "rock_river_1", x: 2400, y: 2600, radius: 80, collision: true },
        { type: "rocks", id: "rock_river_2", x: 3600, y: 3400, radius: 80, collision: true },
        { type: "rocks", id: "rock_mid_1", x: 2800, y: 3200, radius: 60, collision: true },
        { type: "rocks", id: "rock_mid_2", x: 3200, y: 2800, radius: 60, collision: true },

        { type: "ruins", id: "ruins_top", x: 1400, y: 1400, width: 200, height: 200, collision: true },
        { type: "ruins", id: "ruins_bot", x: 4400, y: 4400, width: 200, height: 200, collision: true },
        { type: "ruins", id: "ruins_center", x: 2900, y: 2900, width: 200, height: 200, collision: true }
    ],
    river: {
        start: [1800, 4200],
        end: [4200, 1800],
        width: 300,
        color: "#040810"
    },
    bases: {
        team1: { x: 300, y: 300, radius: 400, color: "#150a20" },
        team2: { x: 5700, y: 5700, radius: 400, color: "#200a15" }
    },
    decorations: [
        { type: "mushroom_cluster", x: 500, y: 2500, scale: 1.0 },
        { type: "mushroom_cluster", x: 3500, y: 5500, scale: 0.8 },
        { type: "mushroom_cluster", x: 1800, y: 4200, scale: 0.6 },
        { type: "fallen_log", x: 2200, y: 1600, rotation: 45 },
        { type: "fallen_log", x: 3800, y: 4400, rotation: -30 },
        { type: "fallen_log", x: 1500, y: 3200, rotation: 15 },
        { type: "ancient_tree", x: 800, y: 800, scale: 1.5 },
        { type: "ancient_tree", x: 5200, y: 5200, scale: 1.5 },
        { type: "ancient_tree", x: 2500, y: 4500, scale: 1.2 },
        { type: "glowing_flowers", x: 3000, y: 3000, count: 8 },
        { type: "fireflies", x: 2000, y: 4000, count: 15 },
        { type: "fireflies", x: 4000, y: 2000, count: 15 },
        { type: "fireflies", x: 3000, y: 3000, count: 10 },
        { type: "mist", x: 3000, y: 3000, radius: 1200, density: 0.5 },
        { type: "mist", x: 1500, y: 1500, radius: 800, density: 0.4 },
        { type: "mist", x: 4500, y: 4500, radius: 800, density: 0.4 }
    ],
    ambientColors: {
        primary: "#050a05",
        secondary: "#0a120a",
        accent: "#101810",
        glow: "#152015",
        mist: "rgba(20, 30, 20, 0.2)",
        darkness: "rgba(0, 0, 0, 0.3)"
    }
};
