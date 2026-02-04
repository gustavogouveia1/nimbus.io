<?php
namespace NimbusIO\Entities;

use Ratchet\ConnectionInterface;

/**
 * Bruxo - Jogador flutuante com varinha mágica
 */
class Wizard
{
    public string $id;
    public ConnectionInterface $conn;
    public string $name;
    public string $wand; // Tipo de varinha
    public float $x;
    public float $y;
    public float $velX = 0;
    public float $velY = 0;
    public float $angle = 0;
    public float $hp;
    public float $maxHp = 100;
    public float $mana;
    public float $maxMana = 100;
    public int $xp = 0;
    public int $level = 1;
    public int $score = 0;
    public float $size = 28;
    public string $color;

    // Movimento
    public bool $moveUp = false;
    public bool $moveDown = false;
    public bool $moveLeft = false;
    public bool $moveRight = false;
    public float $speed = 3.8;

    // Ataque básico (mais lento e menor dano - habilidades são o foco)
    public bool $shooting = false;
    public int $shootCooldown = 0;
    public int $shootDelay = 20;      // Era 12 - mais lento agora
    public int $spellDamage = 5;      // Era 8 - menor dano
    public float $spellSpeed = 11;    // Era 14 - projétil mais lento

    // Magias especiais
    public array $spellCooldowns = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
    public int $pendingSpell = 0; // Magia a ser lançada

    // Custos de mana das magias (baixos para permitir combos)
    public array $spellManaCosts = [
        1 => 8,   // Stupefy - barato
        2 => 10,  // Incendio
        3 => 10,  // Glacius
        4 => 15,  // Bombarda - um pouco mais caro por ser AOE
        5 => 20   // Protego - escudo custa mais
    ];

    // Cooldowns das magias (em ticks - 60 ticks = 1 segundo)
    // SEM COOLDOWN - foco em combos! Habilidades individuais são fracas
    public array $spellCooldownTimes = [
        1 => 0,   // Stupefy - sem cooldown
        2 => 0,   // Incendio - sem cooldown
        3 => 0,   // Glacius - sem cooldown
        4 => 0,   // Bombarda - sem cooldown
        5 => 60   // Protego - 1s (único com cooldown mínimo para não ser abusado)
    ];

    // Regeneração
    public int $regenCooldown = 0;
    public int $regenDelay = 180;

    // Shield (Protego)
    public bool $shieldActive = false;
    public int $shieldDuration = 180; // 3 segundos
    public int $shieldActiveTimer = 0;

    // ========== ESCUDOS DE COMBO ==========
    public bool $hasReflectShield = false;    // Escudo Reativo - reflete dano
    public int $thornsDamage = 0;             // Dano refletido
    public bool $explosiveShield = false;     // Fortaleza Explosiva
    public int $explosiveShieldDamage = 0;    // Dano da explosão
    public float $explosiveShieldRadius = 0;  // Raio da explosão

    // Efeitos de status
    public int $slowTimer = 0;        // Glacius - slow
    public int $burnTimer = 0;        // Incendio - burn
    public int $burnDamageOwner = 0;  // ID do dono do burn para dar kill credit
    public string $burnOwnerId = '';

    // Sistema de Speed Boost (Shift)
    public int $speedBoostCharge = 600;    // Carga atual (máx 600 = 10s para carregar)
    public int $speedBoostMaxCharge = 600; // 10 segundos para carregar completamente
    public int $speedBoostTimer = 0;       // Tempo restante do boost ativo
    public int $speedBoostDuration = 180;  // 3 segundos de duração
    public bool $speedBoostActive = false;
    public bool $wantsSpeedBoost = false;  // Se o jogador está segurando Shift

    // Sistema de Gold (para loja)
    public int $gold = 0;

    // Customização
    public string $wizardSkin = 'default';
    public string $wandSkin = 'default';

    // Cosméticos
    public array $cosmetics = [
        'nameEffect' => null,  // name_rainbow, name_fire, name_ice, name_golden
        'tag' => null,         // tag_vip, tag_pro, tag_legend, tag_mystic
        'aura' => null         // aura_fire, aura_ice, aura_lightning, aura_dark, aura_rainbow, aura_stars
    ];

    // Stats upgrades
    public array $stats = [
        'manaRegen' => 0,
        'maxMana' => 0,
        'spellPower' => 0,
        'spellSpeed' => 0,
        'castSpeed' => 0,
        'movementSpeed' => 0,
        'maxHealth' => 0,
        'healthRegen' => 0
    ];
    public int $statPoints = 0;

    // Cores das casas de Hogwarts
    private static array $houseColors = [
        ['color' => '#740001', 'name' => 'Gryffindor'],  // Vermelho escuro
        ['color' => '#1A472A', 'name' => 'Slytherin'],   // Verde escuro
        ['color' => '#0E1A40', 'name' => 'Ravenclaw'],   // Azul escuro
        ['color' => '#EEB939', 'name' => 'Hufflepuff'],  // Amarelo
        ['color' => '#7B68EE', 'name' => 'Purple'],      // Roxo
    ];
    private static int $colorIndex = 0;

    public function __construct(ConnectionInterface $conn, string $name, float $x, float $y, string $wand = 'phoenix')
    {
        $this->id = 'wizard_' . $conn->resourceId;
        $this->conn = $conn;
        $this->name = substr($name, 0, 15) ?: 'Bruxo';
        $this->wand = $wand;
        $this->x = $x;
        $this->y = $y;
        $this->hp = $this->maxHp;
        $this->mana = $this->maxMana;

        // Atribui cor baseada nas casas
        $colorSet = self::$houseColors[self::$colorIndex % count(self::$houseColors)];
        $this->color = $colorSet['color'];
        self::$colorIndex++;
    }

    public function update(float $mapWidth, float $mapHeight): void
    {
        // Calcula direção do movimento
        $dx = 0;
        $dy = 0;

        if ($this->moveUp) $dy -= 1;
        if ($this->moveDown) $dy += 1;
        if ($this->moveLeft) $dx -= 1;
        if ($this->moveRight) $dx += 1;

        // Normaliza movimento diagonal
        if ($dx !== 0 && $dy !== 0) {
            $length = sqrt($dx * $dx + $dy * $dy);
            $dx /= $length;
            $dy /= $length;
        }

        // Calcula velocidade com stats (velocidade de voo)
        $actualSpeed = $this->speed + ($this->stats['movementSpeed'] * 0.25);

        // Sistema de Speed Boost (Shift)
        if ($this->wantsSpeedBoost && $this->speedBoostCharge >= $this->speedBoostMaxCharge && !$this->speedBoostActive) {
            // Ativa o boost se tem carga total e está segurando Shift
            $this->speedBoostActive = true;
            $this->speedBoostTimer = $this->speedBoostDuration;
            $this->speedBoostCharge = 0;
        }

        if ($this->speedBoostActive) {
            $this->speedBoostTimer--;
            $actualSpeed *= 2.0; // 2x mais rápido durante o boost
            if ($this->speedBoostTimer <= 0) {
                $this->speedBoostActive = false;
            }
        } else if ($this->speedBoostCharge < $this->speedBoostMaxCharge) {
            // Recarrega a barra quando não está usando boost
            $this->speedBoostCharge++;
        }

        // Aplica slow do Glacius
        if ($this->slowTimer > 0) {
            $actualSpeed *= 0.4; // 60% mais lento
            $this->slowTimer--;
        }

        // Aplica aceleração
        $this->velX += $dx * $actualSpeed * 0.15;
        $this->velY += $dy * $actualSpeed * 0.15;

        // Aplica fricção
        $this->velX *= 0.9;
        $this->velY *= 0.9;

        // Aplica velocidade
        $this->x += $this->velX;
        $this->y += $this->velY;

        // Mantém dentro do mapa
        $this->x = max($this->size, min($mapWidth - $this->size, $this->x));
        $this->y = max($this->size, min($mapHeight - $this->size, $this->y));

        // Cooldown do tiro básico
        if ($this->shootCooldown > 0) {
            $this->shootCooldown--;
        }

        // Cooldowns das magias especiais
        foreach ($this->spellCooldowns as $spell => $cooldown) {
            if ($cooldown > 0) {
                $this->spellCooldowns[$spell]--;
            }
        }

        // Regeneração de HP
        if ($this->regenCooldown > 0) {
            $this->regenCooldown--;
        } else if ($this->hp < $this->maxHp) {
            $regenRate = 0.08 + ($this->stats['healthRegen'] * 0.12);
            $this->hp = min($this->maxHp, $this->hp + $regenRate);
        }

        // Regeneração de Mana
        $manaRegenRate = 0.15 + ($this->stats['manaRegen'] * 0.1);
        $this->mana = min($this->maxMana, $this->mana + $manaRegenRate);

        // Shield ativo
        if ($this->shieldActive) {
            $this->shieldActiveTimer--;
            if ($this->shieldActiveTimer <= 0) {
                $this->shieldActive = false;
            }
        }

        // Dano de burn (Incendio) - ~25 dano total em 2 segundos
        if ($this->burnTimer > 0) {
            $this->burnTimer--;
            // Não causa dano se tem shield
            // Aplica 1 de dano a cada 5 ticks (~24 dano total em 120 ticks)
            if (!$this->shieldActive && $this->burnTimer % 5 === 0) {
                $this->hp -= 1;
            }
        }
    }

    /**
     * Aplica efeito slow (Glacius)
     */
    public function applySlow(): void
    {
        $this->slowTimer = 90; // 1.5 segundos a 60fps
    }

    /**
     * Aplica efeito burn (Incendio)
     */
    public function applyBurn(string $ownerId): void
    {
        $this->burnTimer = 120; // 2 segundos a 60fps
        $this->burnOwnerId = $ownerId;
    }

    /**
     * Verifica se morreu de burn
     */
    public function checkBurnDeath(): bool
    {
        return $this->hp <= 0 && $this->burnOwnerId !== '';
    }

    public function canShoot(): bool
    {
        return $this->shooting && $this->shootCooldown <= 0;
    }

    public function shoot(): ?Projectile
    {
        if (!$this->canShoot()) {
            return null;
        }

        // Calcula delay com stats
        $actualDelay = max(4, $this->shootDelay - ($this->stats['castSpeed'] * 1.2));
        $this->shootCooldown = (int)$actualDelay;

        // Calcula stats do feitiço
        $damage = $this->spellDamage + ($this->stats['spellPower'] * 2);
        $speed = $this->spellSpeed + ($this->stats['spellSpeed'] * 0.8);

        // Posição inicial (na ponta da varinha)
        $wandLength = $this->size * 1.2;
        $spellX = $this->x + cos($this->angle) * $wandLength;
        $spellY = $this->y + sin($this->angle) * $wandLength;

        return new Projectile(
            $this->id,
            $spellX,
            $spellY,
            $this->angle,
            'basic',
            (int)$damage,
            $speed
        );
    }

    public function castSpecialSpell(int $spellNum): ?Projectile
    {
        // Verifica se a magia está em cooldown
        if ($this->spellCooldowns[$spellNum] > 0) {
            return null;
        }

        // Verifica mana
        $manaCost = $this->spellManaCosts[$spellNum] ?? 20;
        if ($this->mana < $manaCost) {
            return null;
        }

        // Protego é especial - ativa escudo ao invés de lançar projétil
        if ($spellNum === 5) {
            $this->activateProtego();
            $this->mana -= $manaCost;
            $this->spellCooldowns[$spellNum] = $this->spellCooldownTimes[$spellNum];
            return null;
        }

        // Consome mana
        $this->mana -= $manaCost;

        // Aplica cooldown
        $cooldownReduction = $this->stats['castSpeed'] * 5;
        $this->spellCooldowns[$spellNum] = max(10, $this->spellCooldownTimes[$spellNum] - $cooldownReduction);

        // Tipos de magia e suas propriedades (DANO BAIXO - combos são o foco!)
        // Habilidades individuais são fracas, players precisam combar para matar
        $spellTypes = [
            1 => ['type' => 'stupefy', 'damage' => 8, 'speed' => 18, 'size' => 12],   // Rápido, fraco
            2 => ['type' => 'incendio', 'damage' => 10, 'speed' => 16, 'size' => 14], // Burn ajuda
            3 => ['type' => 'glacius', 'damage' => 6, 'speed' => 14, 'size' => 16],   // Slow é útil
            4 => ['type' => 'bombarda', 'damage' => 18, 'speed' => 12, 'size' => 20], // AOE mas fraco
        ];

        $spellData = $spellTypes[$spellNum] ?? $spellTypes[1];

        // Aplica bônus de stats
        $damage = $spellData['damage'] + ($this->stats['spellPower'] * 3);
        $speed = $spellData['speed'] + ($this->stats['spellSpeed'] * 0.6);

        // Posição inicial
        $wandLength = $this->size * 1.3;
        $spellX = $this->x + cos($this->angle) * $wandLength;
        $spellY = $this->y + sin($this->angle) * $wandLength;

        return new Projectile(
            $this->id,
            $spellX,
            $spellY,
            $this->angle,
            $spellData['type'],
            (int)$damage,
            $speed,
            $spellData['size']
        );
    }

    public function activateProtego(): void
    {
        $this->shieldActive = true;
        $this->shieldActiveTimer = $this->shieldDuration;
    }

    public function takeDamage(int $damage): bool
    {
        // Protego bloqueia dano
        if ($this->shieldActive) {
            // Pequeno recuo
            $knockback = min($damage * 0.1, 2);
            $this->velX += (mt_rand(-100, 100) / 100) * $knockback;
            $this->velY += (mt_rand(-100, 100) / 100) * $knockback;
            return false;
        }

        $this->hp -= $damage;
        $this->regenCooldown = $this->regenDelay;

        // Recuo
        $knockback = min($damage * 0.3, 5);
        $this->velX += (mt_rand(-100, 100) / 100) * $knockback;
        $this->velY += (mt_rand(-100, 100) / 100) * $knockback;

        return $this->hp <= 0;
    }

    public function addXP(int $amount): void
    {
        $this->xp += $amount;
        $this->score += $amount;

        // Ganha gold proporcional ao XP
        $this->gold += (int)($amount * 0.5);

        // Verifica level up
        $xpNeeded = $this->getXPForNextLevel();
        while ($this->xp >= $xpNeeded && $this->level < 45) {
            $this->xp -= $xpNeeded;
            $this->level++;
            $this->statPoints++;

            // Aumenta HP e Mana máximos a cada level
            $this->maxHp = 100 + ($this->level - 1) * 5;
            $this->maxMana = 100 + ($this->level - 1) * 3;
            $this->hp = min($this->hp + 15, $this->maxHp);
            $this->mana = min($this->mana + 10, $this->maxMana);

            $xpNeeded = $this->getXPForNextLevel();
        }
    }

    public function getXPForNextLevel(): int
    {
        return (int)(25 + ($this->level * $this->level * 2.5));
    }

    public function getBodyDamage(): int
    {
        return 8 + ($this->level * 0.5);
    }

    public function respawn(float $x, float $y): void
    {
        $this->x = $x;
        $this->y = $y;
        $this->velX = 0;
        $this->velY = 0;
        $this->hp = $this->maxHp;
        $this->mana = $this->maxMana;
        $this->xp = 0;
        $this->level = max(1, (int)($this->level * 0.5));
        $this->statPoints = $this->level - 1;
        $this->stats = array_fill_keys(array_keys($this->stats), 0);
        $this->maxHp = 100 + ($this->level - 1) * 5;
        $this->maxMana = 100 + ($this->level - 1) * 3;
        $this->hp = $this->maxHp;
        $this->mana = $this->maxMana;
        // Reset shield
        $this->shieldActive = false;
        $this->shieldActiveTimer = 0;
        // Reset escudos de combo
        $this->hasReflectShield = false;
        $this->thornsDamage = 0;
        $this->explosiveShield = false;
        $this->explosiveShieldDamage = 0;
        $this->explosiveShieldRadius = 0;
        // Reset efeitos de status
        $this->slowTimer = 0;
        $this->burnTimer = 0;
        $this->burnOwnerId = '';
        // Reset speed boost
        $this->speedBoostCharge = $this->speedBoostMaxCharge;
        $this->speedBoostActive = false;
        $this->speedBoostTimer = 0;
        // Reset cooldowns
        $this->spellCooldowns = array_fill_keys(array_keys($this->spellCooldowns), 0);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'wand' => $this->wand,
            'x' => round($this->x, 2),
            'y' => round($this->y, 2),
            'angle' => round($this->angle, 3),
            'hp' => round($this->hp),
            'maxHp' => $this->maxHp,
            'mana' => round($this->mana, 1),
            'maxMana' => $this->maxMana,
            'level' => $this->level,
            'xp' => $this->xp,
            'xpNext' => $this->getXPForNextLevel(),
            'score' => $this->score,
            'size' => $this->size,
            'color' => $this->color,
            'statPoints' => $this->statPoints,
            'stats' => $this->stats,
            'shieldActive' => $this->shieldActive,
            'hasReflectShield' => $this->hasReflectShield,
            'explosiveShield' => $this->explosiveShield,
            'spellCooldowns' => $this->spellCooldowns,
            'gold' => $this->gold,
            'isSlowed' => $this->slowTimer > 0,
            'isBurning' => $this->burnTimer > 0,
            'wizardSkin' => $this->wizardSkin,
            'wandSkin' => $this->wandSkin,
            'speedBoostCharge' => $this->speedBoostCharge,
            'speedBoostMaxCharge' => $this->speedBoostMaxCharge,
            'speedBoostActive' => $this->speedBoostActive,
            'cosmetics' => $this->cosmetics
        ];
    }
}
