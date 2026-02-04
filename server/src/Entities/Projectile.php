<?php
namespace NimbusIO\Entities;

/**
 * Feitiços lançados pelos bruxos
 * Tipos: basic, stupefy, incendio, glacius, bombarda
 * + Combos de Spell Weaving
 */
class Projectile
{
    public string $id;
    public string $ownerId;
    public string $spellType;
    public float $x;
    public float $y;
    public float $velX;
    public float $velY;
    public int $damage;
    public float $size;
    public float $speed;
    public int $lifetime;
    public int $maxLifetime;
    public string $color;

    // Efeitos especiais
    public bool $hasSlowEffect = false;  // Glacius
    public bool $hasBurnEffect = false;  // Incendio
    public bool $hasAreaDamage = false;  // Bombarda
    public float $areaRadius = 0;

    // ========== SISTEMA DE SPELL WEAVING ==========
    public bool $isComboSpell = false;      // Se é um feitiço de combo
    public string $comboType = '';          // Tipo do combo
    public bool $hasStunEffect = false;     // Atordoamento
    public int $freezeDuration = 0;         // Duração do freeze (mais forte que slow)
    public bool $hasPullEffect = false;     // Puxa inimigos
    public float $pullStrength = 0;         // Força da atração

    private static int $idCounter = 0;

    // Cores das magias (base + combos)
    private static array $spellColors = [
        'basic' => '#D4AF37',     // Dourado
        'stupefy' => '#FF5252',   // Vermelho
        'incendio' => '#FF9800',  // Laranja/Fogo
        'glacius' => '#81D4FA',   // Azul gelo
        'bombarda' => '#8D6E63',  // Marrom
        // Combos
        'combo_stupefy' => '#FF4444',
        'combo_stunning_fire' => '#FF6B35',
        'combo_frozen_paralysis' => '#00D4FF',
        'combo_steam_blast' => '#B8B8B8',
        'combo_elemental_storm' => '#9B59B6',
        'combo_glacial_inferno' => '#E74C3C',
        'combo_arcane_avalanche' => '#3498DB',
        'combo_arcane_apocalypse' => '#8E44AD',
        'combo_elemental_harmony' => '#00FF88',
        'combo_primordial_cyclone' => '#1ABC9C',
    ];

    public function __construct(
        string $ownerId,
        float $x,
        float $y,
        float $angle,
        string $spellType = 'basic',
        int $damage = 8,
        float $speed = 14,
        float $size = 12
    ) {
        $this->id = 'spell_' . (++self::$idCounter);
        $this->ownerId = $ownerId;
        $this->spellType = $spellType;
        $this->x = $x;
        $this->y = $y;
        $this->damage = $damage;
        $this->speed = $speed;
        $this->size = $size;
        $this->color = self::$spellColors[$spellType] ?? self::$spellColors['basic'];

        // Calcula velocidade baseada no ângulo
        $this->velX = cos($angle) * $speed;
        $this->velY = sin($angle) * $speed;

        // Lifetime varia por tipo de magia
        $lifetimes = [
            'basic' => 75,
            'stupefy' => 90,
            'incendio' => 80,
            'glacius' => 100,
            'bombarda' => 120,
        ];
        $this->maxLifetime = $lifetimes[$spellType] ?? 75;
        $this->lifetime = $this->maxLifetime;

        // Configura efeitos especiais
        $this->configureEffects();
    }

    private function configureEffects(): void
    {
        switch ($this->spellType) {
            case 'glacius':
                $this->hasSlowEffect = true;
                break;
            case 'incendio':
                $this->hasBurnEffect = true;
                break;
            case 'bombarda':
                $this->hasAreaDamage = true;
                $this->areaRadius = 60;
                break;
        }
    }

    public function update(): bool
    {
        $this->x += $this->velX;
        $this->y += $this->velY;
        $this->lifetime--;

        return $this->lifetime > 0;
    }

    public function isOutOfBounds(float $mapWidth, float $mapHeight): bool
    {
        return $this->x < 0 || $this->x > $mapWidth ||
               $this->y < 0 || $this->y > $mapHeight;
    }

    public function collidesWith(float $targetX, float $targetY, float $targetSize): bool
    {
        $dx = $this->x - $targetX;
        $dy = $this->y - $targetY;
        $distance = sqrt($dx * $dx + $dy * $dy);
        return $distance < ($this->size + $targetSize);
    }

    /**
     * Retorna entidades atingidas pela área de Bombarda
     */
    public function getAreaTargets(array $targets): array
    {
        if (!$this->hasAreaDamage) {
            return [];
        }

        $hit = [];
        foreach ($targets as $id => $target) {
            if ($id === $this->ownerId) continue;

            $dx = $this->x - $target->x;
            $dy = $this->y - $target->y;
            $distance = sqrt($dx * $dx + $dy * $dy);

            if ($distance < $this->areaRadius + $target->size) {
                // Dano diminui com distância
                $damageMultiplier = 1 - ($distance / ($this->areaRadius + $target->size)) * 0.5;
                $hit[$id] = max(1, (int)($this->damage * $damageMultiplier));
            }
        }

        return $hit;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'ownerId' => $this->ownerId,
            'spellType' => $this->spellType,
            'x' => round($this->x, 2),
            'y' => round($this->y, 2),
            'size' => $this->size,
            'color' => $this->color,
            // Dados de combo para renderização especial
            'isComboSpell' => $this->isComboSpell,
            'comboType' => $this->comboType,
            'hasAreaDamage' => $this->hasAreaDamage,
            'areaRadius' => $this->areaRadius
        ];
    }
}
