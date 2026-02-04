<?php
namespace DiepIO;

/**
 * Projéteis disparados pelos tanques
 */
class Bullet
{
    public string $id;
    public string $ownerId;
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

    private static int $idCounter = 0;

    public function __construct(
        string $ownerId,
        float $x,
        float $y,
        float $angle,
        int $damage = 7,
        float $speed = 12,
        float $size = 12,
        string $color = '#00B1DE'
    ) {
        $this->id = 'bullet_' . (++self::$idCounter);
        $this->ownerId = $ownerId;
        $this->x = $x;
        $this->y = $y;
        $this->damage = $damage;
        $this->speed = $speed;
        $this->size = $size;
        $this->color = $color;

        // Calcula velocidade baseada no ângulo
        $this->velX = cos($angle) * $speed;
        $this->velY = sin($angle) * $speed;

        // Lifetime em ticks (60 ticks = 1 segundo aproximadamente)
        $this->maxLifetime = 90;
        $this->lifetime = $this->maxLifetime;
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

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'ownerId' => $this->ownerId,
            'x' => round($this->x, 2),
            'y' => round($this->y, 2),
            'size' => $this->size,
            'color' => $this->color
        ];
    }
}
