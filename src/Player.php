<?php
namespace DiepIO;

use Ratchet\ConnectionInterface;

/**
 * Jogador/Tanque básico
 */
class Player
{
    public string $id;
    public ConnectionInterface $conn;
    public string $name;
    public float $x;
    public float $y;
    public float $velX = 0;
    public float $velY = 0;
    public float $angle = 0;
    public int $hp;
    public int $maxHp = 100;
    public int $xp = 0;
    public int $level = 1;
    public int $score = 0;
    public float $size = 30;
    public string $color;
    public string $bodyColor;

    // Movimento
    public bool $moveUp = false;
    public bool $moveDown = false;
    public bool $moveLeft = false;
    public bool $moveRight = false;
    public float $speed = 3.5;

    // Ataque
    public bool $shooting = false;
    public int $shootCooldown = 0;
    public int $shootDelay = 15; // Ticks entre tiros
    public int $bulletDamage = 7;
    public float $bulletSpeed = 12;

    // Regeneração
    public int $regenCooldown = 0;
    public int $regenDelay = 180; // 3 segundos sem levar dano

    // Shield
    public float $shieldCharge = 0;        // Carga atual (0-100)
    public float $shieldMaxCharge = 100;   // Carga máxima
    public bool $shieldActive = false;      // Shield ativo?
    public int $shieldDuration = 210;       // 3.5 segundos a 60fps
    public int $shieldActiveTimer = 0;      // Timer do shield ativo
    public float $shieldChargeRate = 0.15;  // Taxa de carregamento por tick
    public bool $shieldActivateRequest = false; // Pedido de ativação

    // Stats upgrades
    public array $stats = [
        'healthRegen' => 0,
        'maxHealth' => 0,
        'bodyDamage' => 0,
        'bulletSpeed' => 0,
        'bulletPenetration' => 0,
        'bulletDamage' => 0,
        'reload' => 0,
        'movementSpeed' => 0
    ];
    public int $statPoints = 0;

    private static array $colors = [
        ['body' => '#00B1DE', 'barrel' => '#999999'],
        ['body' => '#F04F54', 'barrel' => '#999999'],
        ['body' => '#BE7FF5', 'barrel' => '#999999'],
        ['body' => '#00E06C', 'barrel' => '#999999'],
        ['body' => '#FFCC00', 'barrel' => '#999999'],
    ];
    private static int $colorIndex = 0;

    public function __construct(ConnectionInterface $conn, string $name, float $x, float $y)
    {
        $this->id = 'player_' . $conn->resourceId;
        $this->conn = $conn;
        $this->name = substr($name, 0, 15) ?: 'Unnamed';
        $this->x = $x;
        $this->y = $y;
        $this->hp = $this->maxHp;

        // Atribui cor
        $colorSet = self::$colors[self::$colorIndex % count(self::$colors)];
        $this->color = $colorSet['body'];
        $this->bodyColor = $colorSet['body'];
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

        // Calcula velocidade com stats
        $actualSpeed = $this->speed + ($this->stats['movementSpeed'] * 0.2);

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

        // Cooldowns
        if ($this->shootCooldown > 0) {
            $this->shootCooldown--;
        }

        // Regeneração de HP
        if ($this->regenCooldown > 0) {
            $this->regenCooldown--;
        } else if ($this->hp < $this->maxHp) {
            $regenRate = 0.1 + ($this->stats['healthRegen'] * 0.15);
            $this->hp = min($this->maxHp, $this->hp + $regenRate);
        }

        // Shield logic
        if ($this->shieldActive) {
            // Shield está ativo, decrementa timer
            $this->shieldActiveTimer--;
            if ($this->shieldActiveTimer <= 0) {
                $this->shieldActive = false;
                $this->shieldCharge = 0; // Reseta a carga após uso
            }
        } else {
            // Carrega o shield quando não está ativo
            if ($this->shieldCharge < $this->shieldMaxCharge) {
                $this->shieldCharge = min($this->shieldMaxCharge, $this->shieldCharge + $this->shieldChargeRate);
            }

            // Verifica se jogador quer ativar o shield
            if ($this->shieldActivateRequest && $this->shieldCharge >= $this->shieldMaxCharge) {
                $this->shieldActive = true;
                $this->shieldActiveTimer = $this->shieldDuration;
                $this->shieldActivateRequest = false;
            }
        }
    }

    public function canShoot(): bool
    {
        return $this->shooting && $this->shootCooldown <= 0;
    }

    public function shoot(): ?Bullet
    {
        if (!$this->canShoot()) {
            return null;
        }

        // Calcula delay com stats de reload
        $actualDelay = max(5, $this->shootDelay - ($this->stats['reload'] * 1.5));
        $this->shootCooldown = (int)$actualDelay;

        // Calcula stats da bala
        $damage = $this->bulletDamage + ($this->stats['bulletDamage'] * 2);
        $speed = $this->bulletSpeed + ($this->stats['bulletSpeed'] * 0.8);

        // Posição inicial da bala (na ponta do canhão)
        $barrelLength = $this->size * 1.2;
        $bulletX = $this->x + cos($this->angle) * $barrelLength;
        $bulletY = $this->y + sin($this->angle) * $barrelLength;

        return new Bullet(
            $this->id,
            $bulletX,
            $bulletY,
            $this->angle,
            (int)$damage,
            $speed
        );
    }

    public function takeDamage(int $damage): bool
    {
        // Shield bloqueia dano
        if ($this->shieldActive) {
            // Pequeno recuo mesmo com shield
            $knockback = min($damage * 0.1, 2);
            $this->velX += (mt_rand(-100, 100) / 100) * $knockback;
            $this->velY += (mt_rand(-100, 100) / 100) * $knockback;
            return false; // Não morreu
        }

        $this->hp -= $damage;
        $this->regenCooldown = $this->regenDelay;

        // Recuo
        $knockback = min($damage * 0.3, 5);
        // Direção oposta ao dano (simplificado)
        $this->velX += (mt_rand(-100, 100) / 100) * $knockback;
        $this->velY += (mt_rand(-100, 100) / 100) * $knockback;

        return $this->hp <= 0;
    }

    public function addXP(int $amount): void
    {
        $this->xp += $amount;
        $this->score += $amount;

        // Verifica level up
        $xpNeeded = $this->getXPForNextLevel();
        while ($this->xp >= $xpNeeded && $this->level < 45) {
            $this->xp -= $xpNeeded;
            $this->level++;
            $this->statPoints++;

            // Aumenta HP máximo a cada level
            $this->maxHp = 100 + ($this->level - 1) * 4;
            $this->hp = min($this->hp + 10, $this->maxHp);

            $xpNeeded = $this->getXPForNextLevel();
        }
    }

    public function getXPForNextLevel(): int
    {
        // Fórmula de XP progressiva
        return (int)(20 + ($this->level * $this->level * 2));
    }

    public function getBodyDamage(): int
    {
        return 10 + ($this->stats['bodyDamage'] * 3);
    }

    public function respawn(float $x, float $y): void
    {
        $this->x = $x;
        $this->y = $y;
        $this->velX = 0;
        $this->velY = 0;
        $this->hp = $this->maxHp;
        $this->xp = 0;
        $this->level = max(1, (int)($this->level * 0.5)); // Perde metade dos levels
        $this->statPoints = $this->level - 1;
        $this->stats = array_fill_keys(array_keys($this->stats), 0);
        $this->maxHp = 100 + ($this->level - 1) * 4;
        $this->hp = $this->maxHp;
        // Reseta shield
        $this->shieldCharge = 0;
        $this->shieldActive = false;
        $this->shieldActiveTimer = 0;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'x' => round($this->x, 2),
            'y' => round($this->y, 2),
            'angle' => round($this->angle, 3),
            'hp' => round($this->hp),
            'maxHp' => $this->maxHp,
            'level' => $this->level,
            'xp' => $this->xp,
            'xpNext' => $this->getXPForNextLevel(),
            'score' => $this->score,
            'size' => $this->size,
            'color' => $this->color,
            'statPoints' => $this->statPoints,
            'shieldCharge' => round($this->shieldCharge, 1),
            'shieldMaxCharge' => $this->shieldMaxCharge,
            'shieldActive' => $this->shieldActive
        ];
    }
}
