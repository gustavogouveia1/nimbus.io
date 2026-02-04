<?php
namespace NimbusIO\Core;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use React\EventLoop\LoopInterface;
use NimbusIO\Entities\Wizard;
use NimbusIO\Entities\Creature;
use NimbusIO\Entities\Projectile as Spell;

/**
 * Servidor principal do jogo Nimbus.io
 * Batalha de bruxos em vassouras voadoras
 */
class GameEngine implements MessageComponentInterface
{
    protected \SplObjectStorage $clients;

    /** @var Wizard[] */
    protected array $wizards = [];

    /** @var Spell[] */
    protected array $spells = [];

    /** @var Creature[] */
    protected array $creatures = [];

    /** @var array Explosões de colisão de feitiços */
    protected array $explosions = [];

    /** @var array Bots controlados pelo servidor */
    protected array $bots = [];

    // Configurações do mapa (2x maior que original)
    protected float $mapWidth = 6000;
    protected float $mapHeight = 6000;

    /** @var array Obstáculos do mapa com colisão */
    protected array $mapObstacles = [];

    /** @var array Configuração completa do mapa */
    protected array $mapConfig = [];

    // Configurações de criaturas
    protected int $maxCreatures = 80;
    protected int $creatureSpawnRate = 30; // Ticks entre spawns

    // Configurações de bots
    protected int $maxBots = 6;
    protected int $botSpawnDelay = 300; // 5 segundos entre spawn de bots

    protected int $tickCount = 0;

    // Nicknames brasileiros realistas para bots (parecem jogadores reais)
    protected array $brazilianNames = [
        // Nomes comuns + números
        'joao_2008', 'pedro123', 'lucas_gamer', 'matheus2010', 'gabriel_yt',
        'rafaelzin', 'gustavoBR', 'felipegames', 'bruninho_', 'thiagopro',
        'maria_lua', 'julia2009', 'lari_', 'biazinha', 'amandinha_s2',
        'luana.gamer', 'camilasantos', 'isabela_fc', 'fernanda_xd', 'natyzinha',
        // Gamer tags típicos
        'XxLucasxX', 'ProPlayer_BR', 'MLKdoCorre', 'Trevoso_', 'ShadowKiller99',
        'DarkLord_br', 'AnjoMortal', 'ReiDasQuebrada', 'MeijoganaKara', 'Ninja_br',
        'destruidor_', 'killer2012', 'xxgamerxx', 'sniper_pro', 'headshot_br',
        'monstro_pvp', 'lenda_yt', 'mitando_aq', 'ragedquit', 'ggwpbr',
        // Com ano de nascimento
        'davi2011', 'enzo2009', 'miguel_2010', 'arthur2008', 'heitor_12',
        'laura2010', 'helena_2011', 'valentina_', 'alice2009', 'sophia_br',
        // Abreviações e nicknames curtos
        'kzin', 'brzin', 'jvzinho', 'dudabr', 'lele_s2',
        'rafa_', 'gabs', 'vini_', 'leo_yt', 'gui_gamer'
    ];

    public function __construct(LoopInterface $loop)
    {
        $this->clients = new \SplObjectStorage;

        // Carrega configuração do mapa
        $this->loadMapConfig();

        // Inicia o game loop usando o loop passado
        $loop->addPeriodicTimer(1/60, function() {
            $this->gameLoop();
        });

        // Spawn inicial de criaturas
        for ($i = 0; $i < $this->maxCreatures / 2; $i++) {
            $this->spawnCreature();
        }

        // Spawn inicial de bots
        for ($i = 0; $i < $this->maxBots; $i++) {
            $this->spawnBot();
        }

        echo "Nimbus.io - Servidor iniciado (60 ticks/s)\n";
        echo "Mapa: {$this->mapWidth}x{$this->mapHeight}\n";
        echo "Obstáculos: " . count($this->mapObstacles) . " elementos com colisão\n";
        echo "Bots: {$this->maxBots} bruxos IA\n";
        echo "Aguardando bruxos...\n";
    }

    /**
     * Carrega configuração do mapa do arquivo JSON
     */
    protected function loadMapConfig(): void
    {
        $configPath = __DIR__ . '/../../../shared/game-config.json';
        echo "Carregando config do mapa: {$configPath}\n";

        if (file_exists($configPath)) {
            $config = json_decode(file_get_contents($configPath), true);
            if (isset($config['map'])) {
                $this->mapConfig = $config['map'];
                $this->mapWidth = $config['map']['width'] ?? 6000;
                $this->mapHeight = $config['map']['height'] ?? 6000;

                echo "Mapa carregado: tema=" . ($config['map']['theme'] ?? 'default') . "\n";

                // Carrega obstáculos com colisão
                if (isset($config['map']['obstacles'])) {
                    foreach ($config['map']['obstacles'] as $obstacle) {
                        if ($obstacle['collision'] ?? false) {
                            $this->mapObstacles[] = $obstacle;
                        }
                    }
                }
            }
        } else {
            echo "AVISO: Arquivo de config não encontrado: {$configPath}\n";
        }
    }

    /**
     * Verifica se uma posição colide com algum obstáculo do mapa
     */
    public function checkObstacleCollision(float $x, float $y, float $size): ?array
    {
        foreach ($this->mapObstacles as $obstacle) {
            if (isset($obstacle['radius'])) {
                // Obstáculo circular (rochas)
                $dx = $x - $obstacle['x'];
                $dy = $y - $obstacle['y'];
                $distance = sqrt($dx * $dx + $dy * $dy);
                if ($distance < ($size + $obstacle['radius'])) {
                    return $obstacle;
                }
            } else {
                // Obstáculo retangular (árvores, ruínas)
                $obstacleLeft = $obstacle['x'];
                $obstacleRight = $obstacle['x'] + $obstacle['width'];
                $obstacleTop = $obstacle['y'];
                $obstacleBottom = $obstacle['y'] + $obstacle['height'];

                // Encontra o ponto mais próximo no retângulo
                $closestX = max($obstacleLeft, min($x, $obstacleRight));
                $closestY = max($obstacleTop, min($y, $obstacleBottom));

                $dx = $x - $closestX;
                $dy = $y - $closestY;
                $distance = sqrt($dx * $dx + $dy * $dy);

                if ($distance < $size) {
                    return $obstacle;
                }
            }
        }
        return null;
    }

    /**
     * Resolve colisão empurrando a entidade para fora do obstáculo
     */
    public function resolveObstacleCollision(float &$x, float &$y, float $size, float $oldX, float $oldY): void
    {
        $collision = $this->checkObstacleCollision($x, $y, $size);
        if ($collision === null) {
            return;
        }

        if (isset($collision['radius'])) {
            // Colisão com obstáculo circular
            $dx = $x - $collision['x'];
            $dy = $y - $collision['y'];
            $distance = sqrt($dx * $dx + $dy * $dy);

            if ($distance > 0) {
                $overlap = ($size + $collision['radius']) - $distance;
                $nx = $dx / $distance;
                $ny = $dy / $distance;
                $x += $nx * $overlap;
                $y += $ny * $overlap;
            }
        } else {
            // Colisão com obstáculo retangular - tenta resolver por eixo
            $obstacleLeft = $collision['x'];
            $obstacleRight = $collision['x'] + $collision['width'];
            $obstacleTop = $collision['y'];
            $obstacleBottom = $collision['y'] + $collision['height'];

            // Tenta mover apenas no eixo X
            $testX = $x;
            $testY = $oldY;
            if ($this->checkObstacleCollision($testX, $testY, $size) === null) {
                $y = $oldY;
                return;
            }

            // Tenta mover apenas no eixo Y
            $testX = $oldX;
            $testY = $y;
            if ($this->checkObstacleCollision($testX, $testY, $size) === null) {
                $x = $oldX;
                return;
            }

            // Se ambos falharem, volta para posição anterior
            $x = $oldX;
            $y = $oldY;
        }
    }

    /**
     * Verifica se uma posição é válida para spawn (sem colisão com obstáculos)
     */
    public function isValidSpawnPosition(float $x, float $y, float $size): bool
    {
        return $this->checkObstacleCollision($x, $y, $size) === null;
    }

    /**
     * Encontra uma posição válida para spawn
     */
    public function findValidSpawnPosition(float $minX, float $maxX, float $minY, float $maxY, float $size): array
    {
        $maxAttempts = 50;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $x = mt_rand((int)$minX, (int)$maxX);
            $y = mt_rand((int)$minY, (int)$maxY);
            if ($this->isValidSpawnPosition($x, $y, $size)) {
                return [$x, $y];
            }
        }
        // Fallback: retorna posição aleatória mesmo assim
        return [mt_rand((int)$minX, (int)$maxX), mt_rand((int)$minY, (int)$maxY)];
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        $this->clients->attach($conn);
        echo "Nova conexão mágica: {$conn->resourceId}\n";

        // Envia configuração inicial do mapa completa
        $configData = [
            'type' => 'config',
            'mapWidth' => $this->mapWidth,
            'mapHeight' => $this->mapHeight,
            'mapConfig' => $this->mapConfig
        ];
        $jsonConfig = json_encode($configData);
        echo "Enviando config para cliente (tamanho: " . strlen($jsonConfig) . " bytes, mapConfig: " . ($this->mapConfig ? 'SIM' : 'NULL') . ")\n";
        $conn->send($jsonConfig);
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        $data = json_decode($msg, true);
        if (!$data || !isset($data['type'])) {
            return;
        }

        switch ($data['type']) {
            case 'join':
                $this->handleJoin($from, $data);
                break;

            case 'input':
                $this->handleInput($from, $data);
                break;

            case 'upgrade':
                $this->handleUpgrade($from, $data);
                break;

            case 'castSpell':
                $this->handleCastSpell($from, $data);
                break;

            case 'buyItem':
                $this->handleBuyItem($from, $data);
                break;

            case 'combo':
                $this->handleCombo($from, $data);
                break;
        }
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $this->clients->detach($conn);

        // Remove bruxo
        $wizardId = 'wizard_' . $conn->resourceId;
        if (isset($this->wizards[$wizardId])) {
            $wizardName = $this->wizards[$wizardId]->name;
            unset($this->wizards[$wizardId]);
            echo "Bruxo desconectado: {$wizardName}\n";

            // Notifica outros jogadores
            $this->broadcast([
                'type' => 'playerLeft',
                'playerId' => $wizardId
            ]);
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        echo "Erro mágico: {$e->getMessage()}\n";
        $conn->close();
    }

    protected function handleJoin(ConnectionInterface $conn, array $data): void
    {
        $name = $data['name'] ?? 'Bruxo';
        $wand = $data['wand'] ?? 'phoenix';

        // Posição aleatória válida no mapa (evitando obstáculos)
        [$x, $y] = $this->findValidSpawnPosition(100, $this->mapWidth - 100, 100, $this->mapHeight - 100, 28);

        $wizard = new Wizard($conn, $name, $x, $y, $wand);
        $this->wizards[$wizard->id] = $wizard;

        echo "Bruxo entrou: {$name} com varinha de {$wand} ({$wizard->id})\n";

        // Envia confirmação ao jogador
        $conn->send(json_encode([
            'type' => 'joined',
            'playerId' => $wizard->id,
            'player' => $wizard->toArray()
        ]));

        // Notifica outros jogadores
        $this->broadcast([
            'type' => 'playerJoined',
            'player' => $wizard->toArray()
        ], $conn);
    }

    protected function handleInput(ConnectionInterface $from, array $data): void
    {
        $wizardId = 'wizard_' . $from->resourceId;
        if (!isset($this->wizards[$wizardId])) {
            return;
        }

        $wizard = $this->wizards[$wizardId];

        // Atualiza teclas de movimento
        if (isset($data['keys'])) {
            $keys = $data['keys'];
            $wizard->moveUp = (bool)($keys['up'] ?? false);
            $wizard->moveDown = (bool)($keys['down'] ?? false);
            $wizard->moveLeft = (bool)($keys['left'] ?? false);
            $wizard->moveRight = (bool)($keys['right'] ?? false);
            $wizard->shooting = (bool)($keys['shoot'] ?? false);
            $wizard->wantsSpeedBoost = (bool)($keys['speedBoost'] ?? false);
        }

        // Atualiza ângulo do mouse
        if (isset($data['angle'])) {
            $wizard->angle = (float)$data['angle'];
        }
    }

    protected function handleUpgrade(ConnectionInterface $from, array $data): void
    {
        $wizardId = 'wizard_' . $from->resourceId;
        if (!isset($this->wizards[$wizardId])) {
            return;
        }

        $wizard = $this->wizards[$wizardId];
        $stat = $data['stat'] ?? '';

        if ($wizard->statPoints > 0 && isset($wizard->stats[$stat]) && $wizard->stats[$stat] < 7) {
            $wizard->stats[$stat]++;
            $wizard->statPoints--;

            // Aplica efeitos imediatos
            if ($stat === 'maxHealth') {
                $oldMax = $wizard->maxHp;
                $wizard->maxHp = 100 + ($wizard->level - 1) * 5 + ($wizard->stats['maxHealth'] * 15);
                $wizard->hp += ($wizard->maxHp - $oldMax);
            }
            if ($stat === 'maxMana') {
                $oldMax = $wizard->maxMana;
                $wizard->maxMana = 100 + ($wizard->level - 1) * 3 + ($wizard->stats['maxMana'] * 12);
                $wizard->mana += ($wizard->maxMana - $oldMax);
            }
        }
    }

    protected function handleCastSpell(ConnectionInterface $from, array $data): void
    {
        $wizardId = 'wizard_' . $from->resourceId;
        if (!isset($this->wizards[$wizardId])) {
            return;
        }

        $wizard = $this->wizards[$wizardId];
        $spellNum = (int)($data['spell'] ?? 0);

        if ($spellNum >= 1 && $spellNum <= 5) {
            $spell = $wizard->castSpecialSpell($spellNum);
            if ($spell) {
                $this->spells[$spell->id] = $spell;
            }
        }
    }

    // Itens da loja
    protected array $shopItems = [
        // Skins de bruxo
        'wizard_dark' => ['type' => 'wizard', 'name' => 'Bruxo das Trevas', 'price' => 500],
        'wizard_ice' => ['type' => 'wizard', 'name' => 'Mago do Gelo', 'price' => 500],
        'wizard_fire' => ['type' => 'wizard', 'name' => 'Mago do Fogo', 'price' => 500],
        'wizard_gold' => ['type' => 'wizard', 'name' => 'Bruxo Dourado', 'price' => 1000],
        'wizard_shadow' => ['type' => 'wizard', 'name' => 'Bruxo Sombrio', 'price' => 1500],
        'wizard_ancient' => ['type' => 'wizard', 'name' => 'Mago Ancestral', 'price' => 2000],
        // Skins de varinha
        'wand_elder' => ['type' => 'wand', 'name' => 'Varinha de Sabugueiro', 'price' => 2000],
        'wand_phoenix' => ['type' => 'wand', 'name' => 'Pena de Fenix', 'price' => 800],
        'wand_dragon' => ['type' => 'wand', 'name' => 'Coracao de Dragao', 'price' => 600],
        'wand_unicorn' => ['type' => 'wand', 'name' => 'Pelo de Unicornio', 'price' => 500],
        'wand_thestral' => ['type' => 'wand', 'name' => 'Nucleo de Testralio', 'price' => 1500],
        // Cosméticos - Efeitos de Nome
        'name_rainbow' => ['type' => 'nameEffect', 'name' => 'Nome Rainbow', 'price' => 800],
        'name_fire' => ['type' => 'nameEffect', 'name' => 'Nome Flamejante', 'price' => 600],
        'name_ice' => ['type' => 'nameEffect', 'name' => 'Nome Congelante', 'price' => 600],
        'name_golden' => ['type' => 'nameEffect', 'name' => 'Nome Dourado', 'price' => 1000],
        // Cosméticos - Tags
        'tag_vip' => ['type' => 'tag', 'name' => 'Tag VIP', 'price' => 1500],
        'tag_pro' => ['type' => 'tag', 'name' => 'Tag PRO', 'price' => 1200],
        'tag_legend' => ['type' => 'tag', 'name' => 'Tag Lenda', 'price' => 2000],
        'tag_mystic' => ['type' => 'tag', 'name' => 'Tag Mistico', 'price' => 1800],
        // Cosméticos - Auras
        'aura_fire' => ['type' => 'aura', 'name' => 'Aura de Fogo', 'price' => 2000],
        'aura_ice' => ['type' => 'aura', 'name' => 'Aura de Gelo', 'price' => 2000],
        'aura_lightning' => ['type' => 'aura', 'name' => 'Aura de Raio', 'price' => 2500],
        'aura_dark' => ['type' => 'aura', 'name' => 'Aura das Trevas', 'price' => 3000],
        'aura_rainbow' => ['type' => 'aura', 'name' => 'Aura Prismatica', 'price' => 5000],
        'aura_stars' => ['type' => 'aura', 'name' => 'Aura Estelar', 'price' => 2500],
    ];

    // ========== SISTEMA DE SPELL WEAVING (COMBOS) ==========
    protected array $spellCombos = [
        // Combos de 3 teclas (Básicos)
        'stunning_fire' => [
            'name' => 'Fogo Atordoante',
            'sequence' => [1, 2, 1],
            'manaCost' => 45,
            'cooldown' => 360, // 6 segundos
            'damage' => 55,
            'speed' => 15,
            'size' => 20,
            'effects' => ['stun', 'burn'],
            'color' => '#FF6B35',
            'type' => 'stunning_fire'
        ],
        'frozen_paralysis' => [
            'name' => 'Paralisia Gélida',
            'sequence' => [3, 1, 3],
            'manaCost' => 50,
            'cooldown' => 420,
            'damage' => 45,
            'speed' => 14,
            'size' => 22,
            'effects' => ['freeze', 'stun'],
            'color' => '#00D4FF',
            'type' => 'frozen_paralysis'
        ],
        'steam_blast' => [
            'name' => 'Vapor Explosivo',
            'sequence' => [2, 3, 2],
            'manaCost' => 55,
            'cooldown' => 480,
            'damage' => 60,
            'speed' => 12,
            'size' => 28,
            'effects' => ['aoe', 'slow'],
            'color' => '#B8B8B8',
            'type' => 'steam_blast',
            'aoeRadius' => 80
        ],
        'triple_stupefy' => [
            'name' => 'Stupefy Triplo',
            'sequence' => [1, 1, 1],
            'manaCost' => 40,
            'cooldown' => 300,
            'damage' => 20,
            'speed' => 18,
            'size' => 12,
            'effects' => ['spread', 'stun'],
            'color' => '#FF4444',
            'type' => 'triple_stupefy',
            'projectiles' => 3,
            'spreadAngle' => 0.4
        ],
        // Combos de 4 teclas (Intermediários)
        'elemental_storm' => [
            'name' => 'Tempestade Elemental',
            'sequence' => [1, 3, 2, 1],
            'manaCost' => 70,
            'cooldown' => 720,
            'damage' => 80,
            'speed' => 11,
            'size' => 30,
            'effects' => ['burn', 'slow', 'stun'],
            'color' => '#9B59B6',
            'type' => 'elemental_storm'
        ],
        'glacial_inferno' => [
            'name' => 'Inferno Glacial',
            'sequence' => [2, 2, 3, 3],
            'manaCost' => 65,
            'cooldown' => 600,
            'damage' => 70,
            'speed' => 10,
            'size' => 32,
            'effects' => ['burn', 'freeze', 'aoe'],
            'color' => '#E74C3C',
            'type' => 'glacial_inferno',
            'aoeRadius' => 90
        ],
        'arcane_avalanche' => [
            'name' => 'Avalanche Arcana',
            'sequence' => [3, 3, 3, 1],
            'manaCost' => 60,
            'cooldown' => 540,
            'damage' => 55,
            'speed' => 9,
            'size' => 35,
            'effects' => ['freeze', 'knockback', 'aoe'],
            'color' => '#3498DB',
            'type' => 'arcane_avalanche',
            'aoeRadius' => 100
        ],
        'reactive_shield' => [
            'name' => 'Escudo Reativo',
            'sequence' => [5, 1, 2, 3],
            'manaCost' => 75,
            'cooldown' => 900,
            'damage' => 0,
            'speed' => 0,
            'size' => 0,
            'effects' => ['shield', 'reflect', 'thorns'],
            'color' => '#F1C40F',
            'type' => 'reactive_shield',
            'shieldDuration' => 300, // 5 segundos
            'thornsDamage' => 15
        ],
        // Combos de 5 teclas (Avançados)
        'arcane_apocalypse' => [
            'name' => 'Apocalipse Arcano',
            'sequence' => [4, 2, 3, 2, 4],
            'manaCost' => 100,
            'cooldown' => 1200,
            'damage' => 120,
            'speed' => 8,
            'size' => 40,
            'effects' => ['mega_aoe', 'burn', 'slow', 'stun'],
            'color' => '#8E44AD',
            'type' => 'arcane_apocalypse',
            'aoeRadius' => 150
        ],
        'elemental_harmony' => [
            'name' => 'Harmonia dos Elementos',
            'sequence' => [1, 2, 3, 4, 5],
            'manaCost' => 90,
            'cooldown' => 1080,
            'damage' => 100,
            'speed' => 12,
            'size' => 35,
            'effects' => ['all_elements', 'heal_self'],
            'color' => '#00FF88',
            'type' => 'elemental_harmony',
            'healAmount' => 30
        ],
        'explosive_fortress' => [
            'name' => 'Fortaleza Explosiva',
            'sequence' => [5, 5, 4, 4, 1],
            'manaCost' => 85,
            'cooldown' => 960,
            'damage' => 90,
            'speed' => 0,
            'size' => 0,
            'effects' => ['shield', 'delayed_explosion'],
            'color' => '#E67E22',
            'type' => 'explosive_fortress',
            'shieldDuration' => 240,
            'explosionDelay' => 240,
            'aoeRadius' => 120
        ],
        'primordial_cyclone' => [
            'name' => 'Ciclone Primordial',
            'sequence' => [3, 2, 1, 2, 3],
            'manaCost' => 80,
            'cooldown' => 840,
            'damage' => 75,
            'speed' => 6,
            'size' => 45,
            'effects' => ['pull', 'dot', 'aoe'],
            'color' => '#1ABC9C',
            'type' => 'primordial_cyclone',
            'aoeRadius' => 130,
            'pullStrength' => 3
        ]
    ];

    // Cooldowns de combos por jogador
    protected array $comboCooldowns = [];

    protected function handleBuyItem(ConnectionInterface $from, array $data): void
    {
        $wizardId = 'wizard_' . $from->resourceId;
        if (!isset($this->wizards[$wizardId])) {
            return;
        }

        $wizard = $this->wizards[$wizardId];
        $itemId = $data['itemId'] ?? '';

        if (!isset($this->shopItems[$itemId])) {
            $from->send(json_encode([
                'type' => 'shopResult',
                'success' => false,
                'message' => 'Item não encontrado'
            ]));
            return;
        }

        $item = $this->shopItems[$itemId];

        if ($wizard->gold < $item['price']) {
            $from->send(json_encode([
                'type' => 'shopResult',
                'success' => false,
                'message' => 'Gold insuficiente'
            ]));
            return;
        }

        // Deduz gold
        $wizard->gold -= $item['price'];

        // Aplica item
        if ($item['type'] === 'wizard') {
            $wizard->wizardSkin = $itemId;
        } else if ($item['type'] === 'wand') {
            $wizard->wandSkin = $itemId;
        } else if ($item['type'] === 'nameEffect') {
            $wizard->cosmetics['nameEffect'] = $itemId;
        } else if ($item['type'] === 'tag') {
            $wizard->cosmetics['tag'] = $itemId;
        } else if ($item['type'] === 'aura') {
            $wizard->cosmetics['aura'] = $itemId;
        }

        $from->send(json_encode([
            'type' => 'shopResult',
            'success' => true,
            'message' => 'Comprado: ' . $item['name'],
            'itemId' => $itemId,
            'itemType' => $item['type'],
            'newGold' => $wizard->gold
        ]));
    }

    // ========== HANDLER DE COMBOS ==========
    protected function handleCombo(ConnectionInterface $from, array $data): void
    {
        $wizardId = 'wizard_' . $from->resourceId;
        if (!isset($this->wizards[$wizardId])) {
            return;
        }

        $wizard = $this->wizards[$wizardId];
        $comboType = $data['comboType'] ?? '';

        // Verifica se combo existe
        if (!isset($this->spellCombos[$comboType])) {
            return;
        }

        $combo = $this->spellCombos[$comboType];

        // Inicializa cooldowns do jogador se não existir
        if (!isset($this->comboCooldowns[$wizardId])) {
            $this->comboCooldowns[$wizardId] = [];
        }

        // Verifica cooldown do combo
        if (isset($this->comboCooldowns[$wizardId][$comboType]) &&
            $this->comboCooldowns[$wizardId][$comboType] > 0) {
            return;
        }

        // Verifica se tem mana suficiente para o combo
        if ($wizard->mana < $combo['manaCost']) {
            return; // Mana insuficiente
        }

        // Consome mana do combo
        $wizard->mana -= $combo['manaCost'];

        // Aplica cooldown
        $this->comboCooldowns[$wizardId][$comboType] = $combo['cooldown'];

        // Executa o combo baseado no tipo
        $this->executeCombo($wizard, $combo);

        // Log para debug
        echo "COMBO: {$wizard->name} executou {$combo['name']}!\n";
    }

    protected function executeCombo(Wizard $wizard, array $combo): void
    {
        $wandLength = $wizard->size * 1.3;
        $spellX = $wizard->x + cos($wizard->angle) * $wandLength;
        $spellY = $wizard->y + sin($wizard->angle) * $wandLength;

        // Aplica bônus de stats
        $damage = $combo['damage'] + ($wizard->stats['spellPower'] * 4);
        $speed = $combo['speed'] + ($wizard->stats['spellSpeed'] * 0.5);

        switch ($combo['type']) {
            case 'triple_stupefy':
                // Dispara 3 projéteis em leque
                $spreadAngle = $combo['spreadAngle'];
                for ($i = -1; $i <= 1; $i++) {
                    $angle = $wizard->angle + ($i * $spreadAngle);
                    $spell = new Spell(
                        $wizard->id,
                        $spellX,
                        $spellY,
                        $angle,
                        'combo_stupefy',
                        (int)$damage,
                        $speed,
                        $combo['size']
                    );
                    $spell->color = $combo['color'];
                    $spell->hasSlowEffect = false;
                    $spell->isComboSpell = true;
                    $spell->comboType = $combo['type'];
                    $this->spells[$spell->id] = $spell;
                }
                break;

            case 'stunning_fire':
            case 'frozen_paralysis':
            case 'elemental_storm':
            case 'elemental_harmony':
                // Projétil único com efeitos combinados
                $spell = new Spell(
                    $wizard->id,
                    $spellX,
                    $spellY,
                    $wizard->angle,
                    'combo_' . $combo['type'],
                    (int)$damage,
                    $speed,
                    $combo['size']
                );
                $spell->color = $combo['color'];
                $spell->isComboSpell = true;
                $spell->comboType = $combo['type'];

                // Configura efeitos
                if (in_array('burn', $combo['effects'])) $spell->hasBurnEffect = true;
                if (in_array('slow', $combo['effects'])) $spell->hasSlowEffect = true;
                if (in_array('freeze', $combo['effects'])) {
                    $spell->hasSlowEffect = true;
                    $spell->freezeDuration = 120; // 2 segundos de freeze forte
                }
                if (in_array('stun', $combo['effects'])) $spell->hasStunEffect = true;

                // Cura se tiver heal_self
                if (in_array('heal_self', $combo['effects'])) {
                    $wizard->hp = min($wizard->maxHp, $wizard->hp + ($combo['healAmount'] ?? 30));
                }

                $this->spells[$spell->id] = $spell;
                break;

            case 'steam_blast':
            case 'glacial_inferno':
            case 'arcane_avalanche':
            case 'arcane_apocalypse':
            case 'primordial_cyclone':
                // Projéteis com área de efeito
                $spell = new Spell(
                    $wizard->id,
                    $spellX,
                    $spellY,
                    $wizard->angle,
                    'combo_' . $combo['type'],
                    (int)$damage,
                    $speed,
                    $combo['size']
                );
                $spell->color = $combo['color'];
                $spell->isComboSpell = true;
                $spell->comboType = $combo['type'];
                $spell->hasAreaDamage = true;
                $spell->areaRadius = $combo['aoeRadius'] ?? 80;

                if (in_array('burn', $combo['effects'])) $spell->hasBurnEffect = true;
                if (in_array('slow', $combo['effects'])) $spell->hasSlowEffect = true;
                if (in_array('freeze', $combo['effects'])) {
                    $spell->hasSlowEffect = true;
                    $spell->freezeDuration = 120;
                }
                if (in_array('pull', $combo['effects'])) {
                    $spell->hasPullEffect = true;
                    $spell->pullStrength = $combo['pullStrength'] ?? 3;
                }

                $this->spells[$spell->id] = $spell;
                break;

            case 'reactive_shield':
                // Escudo que reflete dano
                $wizard->shieldActive = true;
                $wizard->shieldActiveTimer = $combo['shieldDuration'];
                $wizard->hasReflectShield = true;
                $wizard->thornsDamage = $combo['thornsDamage'] ?? 15;
                break;

            case 'explosive_fortress':
                // Escudo que explode ao acabar
                $wizard->shieldActive = true;
                $wizard->shieldActiveTimer = $combo['shieldDuration'];
                $wizard->explosiveShield = true;
                $wizard->explosiveShieldDamage = $combo['damage'];
                $wizard->explosiveShieldRadius = $combo['aoeRadius'];
                break;
        }
    }

    protected function gameLoop(): void
    {
        $this->tickCount++;

        // Atualiza cooldowns de combos
        foreach ($this->comboCooldowns as $wizardId => &$cooldowns) {
            foreach ($cooldowns as $comboType => &$cd) {
                if ($cd > 0) $cd--;
            }
        }

        // Atualiza bruxos
        $burnDeaths = [];
        foreach ($this->wizards as $wizardId => $wizard) {
            // Guarda posição anterior para resolver colisão
            $oldX = $wizard->x;
            $oldY = $wizard->y;

            $wizard->update($this->mapWidth, $this->mapHeight);

            // Verifica colisão com obstáculos do mapa
            $this->resolveObstacleCollision($wizard->x, $wizard->y, $wizard->size, $oldX, $oldY);

            // Verifica morte por burn
            if ($wizard->checkBurnDeath()) {
                $burnDeaths[$wizardId] = [
                    'victim' => $wizard,
                    'killer' => $wizard->burnOwnerId
                ];
            }

            // Processa tiros básicos
            $spell = $wizard->shoot();
            if ($spell) {
                $this->spells[$spell->id] = $spell;
            }
        }

        // Processa mortes por burn
        foreach ($burnDeaths as $wizardId => $data) {
            $victim = $data['victim'];
            $killerId = $data['killer'];

            // Dá pontos ao matador
            if (isset($this->wizards[$killerId])) {
                $this->wizards[$killerId]->addXP((int)($victim->score / 2));
            } elseif (isset($this->bots[$killerId])) {
                $this->bots[$killerId]['score'] += (int)($victim->score / 2);
            }

            // Respawna a vítima em posição válida
            [$newX, $newY] = $this->findValidSpawnPosition(100, $this->mapWidth - 100, 100, $this->mapHeight - 100, $victim->size);
            $victim->respawn($newX, $newY);

            // Nome do matador
            $killerName = 'Unknown';
            if (isset($this->wizards[$killerId])) {
                $killerName = $this->wizards[$killerId]->name;
            } elseif (isset($this->bots[$killerId])) {
                $killerName = $this->bots[$killerId]['name'];
            }

            // Notifica morte
            $this->broadcast([
                'type' => 'playerKilled',
                'victimId' => $wizardId,
                'killerId' => $killerId,
                'victimName' => $victim->name,
                'killerName' => $killerName
            ]);

            // Envia respawn para a vítima
            $victim->conn->send(json_encode([
                'type' => 'respawn',
                'player' => $victim->toArray()
            ]));
        }

        // Atualiza bots (IA)
        $this->updateBots();

        // Atualiza feitiços
        foreach ($this->spells as $id => $spell) {
            if (!$spell->update() || $spell->isOutOfBounds($this->mapWidth, $this->mapHeight)) {
                unset($this->spells[$id]);
                continue;
            }
            // Verifica colisão com obstáculos do mapa
            if ($this->checkObstacleCollision($spell->x, $spell->y, $spell->size) !== null) {
                unset($this->spells[$id]);
            }
        }

        // Verifica colisão entre feitiços
        $this->checkSpellCollisions();

        // Atualiza explosões (remove expiradas)
        foreach ($this->explosions as $id => $explosion) {
            $this->explosions[$id]['life']--;
            if ($this->explosions[$id]['life'] <= 0) {
                unset($this->explosions[$id]);
            }
        }

        // Atualiza criaturas
        foreach ($this->creatures as $creature) {
            $creature->update($this->mapWidth, $this->mapHeight);
        }

        // Spawn de criaturas
        if ($this->tickCount % $this->creatureSpawnRate === 0 && count($this->creatures) < $this->maxCreatures) {
            $this->spawnCreature();
        }

        // Respawn de bots mortos
        if ($this->tickCount % $this->botSpawnDelay === 0 && count($this->bots) < $this->maxBots) {
            $this->spawnBot();
        }

        // Verifica colisões
        $this->checkCollisions();

        // Envia estado do jogo (a cada 2 ticks)
        if ($this->tickCount % 2 === 0) {
            $this->sendGameState();
        }
    }

    protected function checkSpellCollisions(): void
    {
        $spellList = array_values($this->spells);
        $toDestroy = [];

        for ($i = 0; $i < count($spellList); $i++) {
            for ($j = $i + 1; $j < count($spellList); $j++) {
                $s1 = $spellList[$i];
                $s2 = $spellList[$j];

                // Não colide feitiços do mesmo dono
                if ($s1->ownerId === $s2->ownerId) continue;

                // Apenas 30% de chance de colisão entre projéteis (para não ficar muito difícil)
                // Usa IDs dos spells para manter consistência (mesmo par sempre colide ou não)
                $collisionSeed = crc32($s1->id . $s2->id) % 100;
                if ($collisionSeed > 30) continue;

                // Verifica colisão
                $dx = $s1->x - $s2->x;
                $dy = $s1->y - $s2->y;
                $distance = sqrt($dx * $dx + $dy * $dy);
                $minDist = $s1->size + $s2->size;

                if ($distance < $minDist) {
                    // Colisão! Cria explosão
                    $explosionX = ($s1->x + $s2->x) / 2;
                    $explosionY = ($s1->y + $s2->y) / 2;

                    // Mistura as cores das magias
                    $explosionId = 'explosion_' . $this->tickCount . '_' . $i . '_' . $j;
                    $this->explosions[$explosionId] = [
                        'id' => $explosionId,
                        'x' => $explosionX,
                        'y' => $explosionY,
                        'color1' => $s1->color,
                        'color2' => $s2->color,
                        'size' => ($s1->size + $s2->size) * 1.5,
                        'life' => 30, // Duração em ticks
                        'type1' => $s1->spellType,
                        'type2' => $s2->spellType
                    ];

                    $toDestroy[$s1->id] = true;
                    $toDestroy[$s2->id] = true;
                }
            }
        }

        // Remove feitiços colididos
        foreach ($toDestroy as $id => $_) {
            unset($this->spells[$id]);
        }
    }

    protected function spawnCreature(): void
    {
        // Define tipo baseado em probabilidade
        $rand = mt_rand(1, 100);
        if ($rand <= 65) {
            $type = 'pixie';
        } elseif ($rand <= 92) {
            $type = 'fairy';
        } else {
            $type = 'snitch';
        }

        // Spawn em posição válida (evitando obstáculos)
        $size = $type === 'snitch' ? 32 : ($type === 'fairy' ? 24 : 18);
        [$x, $y] = $this->findValidSpawnPosition(50, $this->mapWidth - 50, 50, $this->mapHeight - 50, $size);

        $creature = new Creature($type, $x, $y);
        $this->creatures[$creature->id] = $creature;
    }

    protected function spawnBot(): void
    {
        static $botCounter = 0;
        $botCounter++;

        $name = $this->brazilianNames[array_rand($this->brazilianNames)];
        $wands = ['phoenix', 'dragon', 'unicorn', 'elder'];
        $wand = $wands[array_rand($wands)];

        // Spawn em posição válida (evitando obstáculos)
        [$x, $y] = $this->findValidSpawnPosition(200, $this->mapWidth - 200, 200, $this->mapHeight - 200, 28);

        $botId = 'bot_' . $botCounter;

        // Cria bot como um objeto similar a wizard mas sem conexão
        $this->bots[$botId] = [
            'id' => $botId,
            'name' => $name,
            'wand' => $wand,
            'x' => $x,
            'y' => $y,
            'velX' => 0,
            'velY' => 0,
            'angle' => mt_rand(0, 628) / 100,
            'hp' => 100,
            'maxHp' => 100,
            'mana' => 100,
            'maxMana' => 100,
            'level' => mt_rand(1, 5),
            'xp' => 0,
            'score' => mt_rand(0, 500),
            'size' => 28,
            'color' => $this->getBotColor(),
            'statPoints' => 0,
            'stats' => [
                'manaRegen' => mt_rand(0, 3),
                'maxMana' => mt_rand(0, 2),
                'spellPower' => mt_rand(0, 3),
                'spellSpeed' => mt_rand(0, 2),
                'castSpeed' => mt_rand(0, 2),
                'movementSpeed' => mt_rand(0, 3),
                'maxHealth' => mt_rand(0, 2),
                'healthRegen' => mt_rand(0, 2)
            ],
            'shieldActive' => false,
            'spellCooldowns' => [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0],
            // AI state
            'targetId' => null,
            'wanderAngle' => mt_rand(0, 628) / 100,
            'wanderTimer' => mt_rand(60, 180),
            'shootCooldown' => 0,
            'aggressiveness' => mt_rand(30, 80) / 100, // 30% a 80% agressivo
            'skillLevel' => mt_rand(40, 90) / 100, // 40% a 90% precisão
            // Status effects
            'slowTimer' => 0,
            'burnTimer' => 0,
            'burnOwnerId' => '',
            // Customização
            'gold' => 0,
            'wizardSkin' => 'default',
            'wandSkin' => 'default',
        ];
    }

    protected function getBotColor(): string
    {
        $colors = ['#740001', '#1A472A', '#0E1A40', '#EEB939', '#7B68EE'];
        return $colors[array_rand($colors)];
    }

    protected function updateBots(): void
    {
        $botsToKill = [];

        foreach ($this->bots as $botId => &$bot) {
            // Regeneração
            $bot['hp'] = min($bot['maxHp'], $bot['hp'] + 0.05);
            $bot['mana'] = min($bot['maxMana'], $bot['mana'] + 0.15);

            // Reduz cooldowns
            if ($bot['shootCooldown'] > 0) $bot['shootCooldown']--;
            foreach ($bot['spellCooldowns'] as $spell => $cd) {
                if ($cd > 0) $bot['spellCooldowns'][$spell]--;
            }

            // Processa slow
            if ($bot['slowTimer'] > 0) {
                $bot['slowTimer']--;
            }

            // Processa burn - ~25 dano total em 2 segundos
            if ($bot['burnTimer'] > 0) {
                $bot['burnTimer']--;
                // Aplica 1 de dano a cada 5 ticks (~24 dano total em 120 ticks)
                if ($bot['burnTimer'] % 5 === 0) {
                    $bot['hp'] -= 1;
                }

                // Verifica morte por burn
                if ($bot['hp'] <= 0) {
                    $botsToKill[$botId] = [
                        'bot' => $bot,
                        'killer' => $bot['burnOwnerId']
                    ];
                }
            }

            // AI: Encontra alvo
            $target = $this->findBotTarget($bot);

            if ($target) {
                $bot['targetId'] = $target['id'];

                // Calcula ângulo para o alvo
                $dx = $target['x'] - $bot['x'];
                $dy = $target['y'] - $bot['y'];
                $targetAngle = atan2($dy, $dx);
                $distance = sqrt($dx * $dx + $dy * $dy);

                // Adiciona imprecisão baseada no skill level
                $imprecision = (1 - $bot['skillLevel']) * 0.5;
                $bot['angle'] = $targetAngle + (mt_rand(-100, 100) / 100) * $imprecision;

                // Move em direção ao alvo se estiver longe
                if ($distance > 300) {
                    $moveAngle = $targetAngle + (mt_rand(-30, 30) / 100);
                    $speed = 2.5 + ($bot['stats']['movementSpeed'] * 0.2);
                    // Aplica slow se ativo
                    if ($bot['slowTimer'] > 0) {
                        $speed *= 0.4;
                    }
                    $bot['velX'] += cos($moveAngle) * $speed * 0.1;
                    $bot['velY'] += sin($moveAngle) * $speed * 0.1;
                } elseif ($distance < 150) {
                    // Foge se muito perto
                    $bot['velX'] -= cos($targetAngle) * 0.3;
                    $bot['velY'] -= sin($targetAngle) * 0.3;
                } else {
                    // Movimento lateral (strafing)
                    $strafeAngle = $targetAngle + M_PI / 2 * (mt_rand(0, 1) ? 1 : -1);
                    $bot['velX'] += cos($strafeAngle) * 0.15;
                    $bot['velY'] += sin($strafeAngle) * 0.15;
                }

                // Atira se agressivo o suficiente e em range
                if ($distance < 500 && mt_rand(0, 100) / 100 < $bot['aggressiveness']) {
                    $this->botShoot($bot);
                }
            } else {
                // Wander - movimento aleatório
                $bot['wanderTimer']--;
                if ($bot['wanderTimer'] <= 0) {
                    $bot['wanderAngle'] = mt_rand(0, 628) / 100;
                    $bot['wanderTimer'] = mt_rand(60, 180);
                }

                $bot['angle'] = $bot['wanderAngle'];
                $speed = 1.5;
                $bot['velX'] += cos($bot['wanderAngle']) * $speed * 0.05;
                $bot['velY'] += sin($bot['wanderAngle']) * $speed * 0.05;

                // Atira em criaturas próximas
                $this->botShootCreatures($bot);
            }

            // Guarda posição anterior para colisão
            $oldX = $bot['x'];
            $oldY = $bot['y'];

            // Aplica velocidade
            $bot['x'] += $bot['velX'];
            $bot['y'] += $bot['velY'];

            // Fricção
            $bot['velX'] *= 0.92;
            $bot['velY'] *= 0.92;

            // Limita ao mapa
            $bot['x'] = max($bot['size'], min($this->mapWidth - $bot['size'], $bot['x']));
            $bot['y'] = max($bot['size'], min($this->mapHeight - $bot['size'], $bot['y']));

            // Verifica colisão com obstáculos do mapa
            $this->resolveObstacleCollision($bot['x'], $bot['y'], $bot['size'], $oldX, $oldY);
        }

        // Processa mortes por burn
        foreach ($botsToKill as $botId => $data) {
            $bot = $data['bot'];
            $killerId = $data['killer'];

            // Dá pontos ao matador
            if (isset($this->wizards[$killerId])) {
                $this->wizards[$killerId]->addXP((int)($bot['score'] / 2) + 50);
            } elseif (isset($this->bots[$killerId])) {
                $this->bots[$killerId]['score'] += (int)($bot['score'] / 2) + 50;
            }

            // Nome do matador
            $killerName = 'Unknown';
            if (isset($this->wizards[$killerId])) {
                $killerName = $this->wizards[$killerId]->name;
            } elseif (isset($this->bots[$killerId])) {
                $killerName = $this->bots[$killerId]['name'];
            }

            // Notifica morte
            $this->broadcast([
                'type' => 'playerKilled',
                'victimId' => $botId,
                'killerId' => $killerId,
                'victimName' => $bot['name'],
                'killerName' => $killerName
            ]);

            unset($this->bots[$botId]);
        }
    }

    protected function findBotTarget(array $bot): ?array
    {
        $closestDist = PHP_FLOAT_MAX;
        $closestTarget = null;

        // Procura jogadores reais primeiro
        foreach ($this->wizards as $wizard) {
            $dx = $wizard->x - $bot['x'];
            $dy = $wizard->y - $bot['y'];
            $dist = sqrt($dx * $dx + $dy * $dy);

            if ($dist < 600 && $dist < $closestDist) {
                $closestDist = $dist;
                $closestTarget = [
                    'id' => $wizard->id,
                    'x' => $wizard->x,
                    'y' => $wizard->y
                ];
            }
        }

        // Se não achou jogador, procura outros bots
        if (!$closestTarget) {
            foreach ($this->bots as $otherId => $other) {
                if ($otherId === $bot['id']) continue;

                $dx = $other['x'] - $bot['x'];
                $dy = $other['y'] - $bot['y'];
                $dist = sqrt($dx * $dx + $dy * $dy);

                if ($dist < 500 && $dist < $closestDist && mt_rand(0, 100) < 30) {
                    $closestDist = $dist;
                    $closestTarget = [
                        'id' => $otherId,
                        'x' => $other['x'],
                        'y' => $other['y']
                    ];
                }
            }
        }

        return $closestTarget;
    }

    protected function botShoot(array &$bot): void
    {
        if ($bot['shootCooldown'] > 0) return;

        $bot['shootCooldown'] = 15;

        // Escolhe magia aleatoriamente às vezes
        if (mt_rand(1, 100) <= 25 && $bot['mana'] >= 15) {
            $spellNum = mt_rand(1, 4);
            $manaCosts = [1 => 15, 2 => 20, 3 => 20, 4 => 35];

            if ($bot['mana'] >= $manaCosts[$spellNum] && $bot['spellCooldowns'][$spellNum] <= 0) {
                $bot['mana'] -= $manaCosts[$spellNum];
                $bot['spellCooldowns'][$spellNum] = [1 => 90, 2 => 150, 3 => 150, 4 => 300][$spellNum];

                $spellTypes = [
                    1 => ['type' => 'stupefy', 'damage' => 15, 'speed' => 16, 'size' => 14],
                    2 => ['type' => 'incendio', 'damage' => 20, 'speed' => 14, 'size' => 16],
                    3 => ['type' => 'glacius', 'damage' => 12, 'speed' => 12, 'size' => 18],
                    4 => ['type' => 'bombarda', 'damage' => 40, 'speed' => 10, 'size' => 22],
                ];

                $spellData = $spellTypes[$spellNum];
                $spell = new Spell(
                    $bot['id'],
                    $bot['x'] + cos($bot['angle']) * 35,
                    $bot['y'] + sin($bot['angle']) * 35,
                    $bot['angle'],
                    $spellData['type'],
                    $spellData['damage'],
                    $spellData['speed'],
                    $spellData['size']
                );
                $this->spells[$spell->id] = $spell;
                return;
            }
        }

        // Tiro básico
        $spell = new Spell(
            $bot['id'],
            $bot['x'] + cos($bot['angle']) * 35,
            $bot['y'] + sin($bot['angle']) * 35,
            $bot['angle'],
            'basic',
            8 + ($bot['stats']['spellPower'] * 2),
            14 + ($bot['stats']['spellSpeed'] * 0.8)
        );
        $this->spells[$spell->id] = $spell;
    }

    protected function botShootCreatures(array &$bot): void
    {
        if ($bot['shootCooldown'] > 0) return;

        // Encontra criatura mais próxima
        foreach ($this->creatures as $creature) {
            $dx = $creature->x - $bot['x'];
            $dy = $creature->y - $bot['y'];
            $dist = sqrt($dx * $dx + $dy * $dy);

            if ($dist < 300) {
                $bot['angle'] = atan2($dy, $dx) + (mt_rand(-20, 20) / 100);
                $bot['shootCooldown'] = 18;

                $spell = new Spell(
                    $bot['id'],
                    $bot['x'] + cos($bot['angle']) * 35,
                    $bot['y'] + sin($bot['angle']) * 35,
                    $bot['angle'],
                    'basic',
                    8,
                    14
                );
                $this->spells[$spell->id] = $spell;
                return;
            }
        }
    }

    protected function checkCollisions(): void
    {
        $destroyedSpells = [];
        $destroyedCreatures = [];
        $killedWizards = [];
        $killedBots = [];

        // Feitiço vs Criatura
        foreach ($this->spells as $spellId => $spell) {
            foreach ($this->creatures as $creatureId => $creature) {
                if ($spell->collidesWith($creature->x, $creature->y, $creature->size)) {
                    if ($creature->takeDamage($spell->damage)) {
                        $destroyedCreatures[$creatureId] = $creature;

                        // Dá XP ao dono do feitiço
                        if (isset($this->wizards[$spell->ownerId])) {
                            $this->wizards[$spell->ownerId]->addXP($creature->xp);
                        }
                    }
                    $destroyedSpells[$spellId] = true;
                    break;
                }
            }

            // Verifica dano em área (Bombarda)
            if ($spell->hasAreaDamage && !isset($destroyedSpells[$spellId])) {
                // Verifica se colidiu com algo para explodir
                $exploded = false;
                foreach ($this->creatures as $creatureId => $creature) {
                    if ($spell->collidesWith($creature->x, $creature->y, $creature->size)) {
                        $exploded = true;
                        break;
                    }
                }
                foreach ($this->wizards as $wizardId => $wizard) {
                    if ($wizardId === $spell->ownerId) continue;
                    if ($spell->collidesWith($wizard->x, $wizard->y, $wizard->size)) {
                        $exploded = true;
                        break;
                    }
                }

                if ($exploded) {
                    // Aplica dano em área às criaturas
                    $areaTargets = $spell->getAreaTargets($this->creatures);
                    foreach ($areaTargets as $creatureId => $damage) {
                        if (!isset($destroyedCreatures[$creatureId]) && isset($this->creatures[$creatureId])) {
                            if ($this->creatures[$creatureId]->takeDamage($damage)) {
                                $destroyedCreatures[$creatureId] = $this->creatures[$creatureId];
                                if (isset($this->wizards[$spell->ownerId])) {
                                    $this->wizards[$spell->ownerId]->addXP($this->creatures[$creatureId]->xp);
                                }
                            }
                        }
                    }

                    // Aplica dano em área aos bruxos
                    $wizardTargets = $spell->getAreaTargets($this->wizards);
                    foreach ($wizardTargets as $wizardId => $damage) {
                        if ($wizardId === $spell->ownerId) continue;
                        if (isset($this->wizards[$wizardId]) && !isset($killedWizards[$wizardId])) {
                            if ($this->wizards[$wizardId]->takeDamage($damage)) {
                                $killedWizards[$wizardId] = [
                                    'victim' => $this->wizards[$wizardId],
                                    'killer' => $spell->ownerId
                                ];
                            }
                        }
                    }

                    $destroyedSpells[$spellId] = true;
                }
            }
        }

        // Feitiço vs Bruxo
        foreach ($this->spells as $spellId => $spell) {
            if (isset($destroyedSpells[$spellId])) continue;

            foreach ($this->wizards as $wizardId => $wizard) {
                // Não atinge o próprio bruxo
                if ($spell->ownerId === $wizardId) continue;

                if ($spell->collidesWith($wizard->x, $wizard->y, $wizard->size)) {
                    // Aplica efeito de slow (Glacius) - 0.3 segundos
                    if ($spell->hasSlowEffect && !$wizard->shieldActive) {
                        $wizard->applySlow();
                    }

                    // Aplica efeito de burn (Incendio) - 0.3 segundos
                    if ($spell->hasBurnEffect && !$wizard->shieldActive) {
                        $wizard->applyBurn($spell->ownerId);
                    }

                    if ($wizard->takeDamage($spell->damage)) {
                        $killedWizards[$wizardId] = [
                            'victim' => $wizard,
                            'killer' => $spell->ownerId
                        ];
                    }
                    $destroyedSpells[$spellId] = true;
                    break;
                }
            }
        }

        // Feitiço vs Bot
        foreach ($this->spells as $spellId => $spell) {
            if (isset($destroyedSpells[$spellId])) continue;

            foreach ($this->bots as $botId => &$bot) {
                // Não atinge o próprio bot
                if ($spell->ownerId === $botId) continue;

                $dx = $spell->x - $bot['x'];
                $dy = $spell->y - $bot['y'];
                $distance = sqrt($dx * $dx + $dy * $dy);

                if ($distance < ($spell->size + $bot['size'])) {
                    // Aplica efeito de slow (Glacius) - 1.5 segundos
                    if ($spell->hasSlowEffect) {
                        $bot['slowTimer'] = 90;
                    }

                    // Aplica efeito de burn (Incendio) - 2 segundos
                    if ($spell->hasBurnEffect) {
                        $bot['burnTimer'] = 120;
                        $bot['burnOwnerId'] = $spell->ownerId;
                    }

                    $bot['hp'] -= $spell->damage;

                    // Recuo
                    $knockback = min($spell->damage * 0.3, 5);
                    $bot['velX'] += (mt_rand(-100, 100) / 100) * $knockback;
                    $bot['velY'] += (mt_rand(-100, 100) / 100) * $knockback;

                    if ($bot['hp'] <= 0) {
                        $killedBots[$botId] = [
                            'bot' => $bot,
                            'killer' => $spell->ownerId
                        ];
                    }
                    $destroyedSpells[$spellId] = true;
                    break;
                }
            }
        }

        // Bot vs Criatura
        foreach ($this->bots as $botId => &$bot) {
            foreach ($this->creatures as $creatureId => $creature) {
                if (isset($destroyedCreatures[$creatureId])) continue;

                $dx = $bot['x'] - $creature->x;
                $dy = $bot['y'] - $creature->y;
                $distance = sqrt($dx * $dx + $dy * $dy);
                $minDist = $bot['size'] + $creature->size;

                if ($distance < $minDist) {
                    if ($distance > 0) {
                        $overlap = $minDist - $distance;
                        $pushX = ($dx / $distance) * $overlap * 0.5;
                        $pushY = ($dy / $distance) * $overlap * 0.5;

                        $bot['velX'] += $pushX * 0.3;
                        $bot['velY'] += $pushY * 0.3;
                        $creature->velX -= $pushX * 0.5;
                        $creature->velY -= $pushY * 0.5;
                    }

                    $bodyDamage = 8 + ($bot['level'] * 0.5);
                    if ($creature->takeDamage((int)$bodyDamage)) {
                        $destroyedCreatures[$creatureId] = $creature;
                        $bot['score'] += $creature->xp;
                    }

                    $bot['hp'] -= 3;
                }
            }
        }

        // Bruxo vs Criatura (colisão de corpo)
        foreach ($this->wizards as $wizard) {
            foreach ($this->creatures as $creatureId => $creature) {
                if (isset($destroyedCreatures[$creatureId])) continue;

                $dx = $wizard->x - $creature->x;
                $dy = $wizard->y - $creature->y;
                $distance = sqrt($dx * $dx + $dy * $dy);
                $minDist = $wizard->size + $creature->size;

                if ($distance < $minDist) {
                    // Empurra para fora
                    if ($distance > 0) {
                        $overlap = $minDist - $distance;
                        $pushX = ($dx / $distance) * $overlap * 0.5;
                        $pushY = ($dy / $distance) * $overlap * 0.5;

                        $wizard->velX += $pushX * 0.3;
                        $wizard->velY += $pushY * 0.3;
                        $creature->velX -= $pushX * 0.5;
                        $creature->velY -= $pushY * 0.5;
                    }

                    // Dano à criatura
                    if ($creature->takeDamage($wizard->getBodyDamage())) {
                        $destroyedCreatures[$creatureId] = $creature;
                        $wizard->addXP($creature->xp);
                    }

                    // Dano ao bruxo (menos que no Diep.io)
                    $wizard->takeDamage(3);
                }
            }
        }

        // Bruxo vs Bruxo
        $wizardList = array_values($this->wizards);
        for ($i = 0; $i < count($wizardList); $i++) {
            for ($j = $i + 1; $j < count($wizardList); $j++) {
                $w1 = $wizardList[$i];
                $w2 = $wizardList[$j];

                $dx = $w1->x - $w2->x;
                $dy = $w1->y - $w2->y;
                $distance = sqrt($dx * $dx + $dy * $dy);
                $minDist = $w1->size + $w2->size;

                if ($distance < $minDist && $distance > 0) {
                    // Empurra para fora
                    $overlap = $minDist - $distance;
                    $pushX = ($dx / $distance) * $overlap * 0.5;
                    $pushY = ($dy / $distance) * $overlap * 0.5;

                    $w1->velX += $pushX * 0.3;
                    $w1->velY += $pushY * 0.3;
                    $w2->velX -= $pushX * 0.3;
                    $w2->velY -= $pushY * 0.3;

                    // Dano mútuo
                    $w1Killed = $w1->takeDamage($w2->getBodyDamage());
                    $w2Killed = $w2->takeDamage($w1->getBodyDamage());

                    if ($w1Killed && !isset($killedWizards[$w1->id])) {
                        $killedWizards[$w1->id] = ['victim' => $w1, 'killer' => $w2->id];
                    }
                    if ($w2Killed && !isset($killedWizards[$w2->id])) {
                        $killedWizards[$w2->id] = ['victim' => $w2, 'killer' => $w1->id];
                    }
                }
            }
        }

        // Remove objetos destruídos
        foreach ($destroyedSpells as $id => $_) {
            unset($this->spells[$id]);
        }
        foreach ($destroyedCreatures as $id => $_) {
            unset($this->creatures[$id]);
        }

        // Processa mortes de jogadores
        foreach ($killedWizards as $wizardId => $data) {
            $victim = $data['victim'];
            $killerId = $data['killer'];

            // Dá pontos ao matador (jogador ou bot)
            if (isset($this->wizards[$killerId])) {
                $this->wizards[$killerId]->addXP((int)($victim->score / 2));
            } elseif (isset($this->bots[$killerId])) {
                $this->bots[$killerId]['score'] += (int)($victim->score / 2);
            }

            // Respawna a vítima em posição válida
            [$newX, $newY] = $this->findValidSpawnPosition(100, $this->mapWidth - 100, 100, $this->mapHeight - 100, $victim->size);
            $victim->respawn($newX, $newY);

            // Nome do matador
            $killerName = 'Unknown';
            if (isset($this->wizards[$killerId])) {
                $killerName = $this->wizards[$killerId]->name;
            } elseif (isset($this->bots[$killerId])) {
                $killerName = $this->bots[$killerId]['name'];
            }

            // Notifica morte
            $this->broadcast([
                'type' => 'playerKilled',
                'victimId' => $wizardId,
                'killerId' => $killerId,
                'victimName' => $victim->name,
                'killerName' => $killerName
            ]);

            // Envia respawn para a vítima
            $victim->conn->send(json_encode([
                'type' => 'respawn',
                'player' => $victim->toArray()
            ]));
        }

        // Processa mortes de bots
        foreach ($killedBots as $botId => $data) {
            $bot = $data['bot'];
            $killerId = $data['killer'];

            // Dá pontos ao matador
            if (isset($this->wizards[$killerId])) {
                $this->wizards[$killerId]->addXP((int)($bot['score'] / 2) + 50);
            } elseif (isset($this->bots[$killerId])) {
                $this->bots[$killerId]['score'] += (int)($bot['score'] / 2) + 50;
            }

            // Nome do matador
            $killerName = 'Unknown';
            if (isset($this->wizards[$killerId])) {
                $killerName = $this->wizards[$killerId]->name;
            } elseif (isset($this->bots[$killerId])) {
                $killerName = $this->bots[$killerId]['name'];
            }

            // Notifica morte do bot
            $this->broadcast([
                'type' => 'playerKilled',
                'victimId' => $botId,
                'killerId' => $killerId,
                'victimName' => $bot['name'],
                'killerName' => $killerName
            ]);

            // Remove o bot (será respawnado depois)
            unset($this->bots[$botId]);
        }
    }

    protected function sendGameState(): void
    {
        if (count($this->wizards) === 0 && count($this->bots) === 0) {
            return;
        }

        // Prepara dados de jogadores reais
        $playersData = [];
        foreach ($this->wizards as $wizard) {
            $playersData[] = $wizard->toArray();
        }

        // Adiciona bots como jogadores (indistinguíveis)
        foreach ($this->bots as $bot) {
            $playersData[] = [
                'id' => $bot['id'],
                'name' => $bot['name'],
                'wand' => $bot['wand'],
                'x' => round($bot['x'], 2),
                'y' => round($bot['y'], 2),
                'angle' => round($bot['angle'], 3),
                'hp' => round($bot['hp']),
                'maxHp' => $bot['maxHp'],
                'mana' => round($bot['mana'], 1),
                'maxMana' => $bot['maxMana'],
                'level' => $bot['level'],
                'xp' => $bot['xp'],
                'xpNext' => 25 + ($bot['level'] * $bot['level'] * 2.5),
                'score' => $bot['score'],
                'size' => $bot['size'],
                'color' => $bot['color'],
                'statPoints' => $bot['statPoints'],
                'stats' => $bot['stats'],
                'shieldActive' => $bot['shieldActive'],
                'spellCooldowns' => $bot['spellCooldowns'],
                'gold' => $bot['gold'] ?? 0,
                'isSlowed' => ($bot['slowTimer'] ?? 0) > 0,
                'isBurning' => ($bot['burnTimer'] ?? 0) > 0,
                'wizardSkin' => $bot['wizardSkin'] ?? 'default',
                'wandSkin' => $bot['wandSkin'] ?? 'default'
            ];
        }

        $spellsData = [];
        foreach ($this->spells as $spell) {
            $spellsData[] = $spell->toArray();
        }

        $creaturesData = [];
        foreach ($this->creatures as $creature) {
            $creaturesData[] = $creature->toArray();
        }

        // Explosões de colisão de feitiços
        $explosionsData = [];
        foreach ($this->explosions as $explosion) {
            $explosionsData[] = $explosion;
        }

        // Leaderboard (top 5) - inclui bots
        $leaderboard = $playersData;
        usort($leaderboard, fn($a, $b) => $b['score'] - $a['score']);
        $leaderboard = array_slice($leaderboard, 0, 5);

        $state = [
            'type' => 'state',
            'players' => $playersData,
            'spells' => $spellsData,
            'creatures' => $creaturesData,
            'explosions' => $explosionsData,
            'leaderboard' => $leaderboard
        ];

        $encoded = json_encode($state);

        // Envia para cada jogador
        foreach ($this->wizards as $wizard) {
            $wizard->conn->send($encoded);
        }
    }

    protected function broadcast(array $data, ?ConnectionInterface $exclude = null): void
    {
        $encoded = json_encode($data);
        foreach ($this->clients as $client) {
            if ($client !== $exclude) {
                $client->send($encoded);
            }
        }
    }
}
