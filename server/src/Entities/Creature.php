<?php
namespace NimbusIO\Entities;

/**
 * Criaturas mágicas que dão XP quando derrotadas
 * - Pixie (brilhante): 10 XP - Comum
 * - Fairy (fada): 25 XP - Incomum
 * - Snitch (pomo de ouro): 130 XP - Raro
 */
class Creature
{
    public string $id;
    public string $type;
    public float $x;
    public float $y;
    public float $velX = 0;
    public float $velY = 0;
    public int $hp;
    public int $maxHp;
    public int $xp;
    public float $size;
    public string $color;
    public float $rotation = 0;
    public float $rotationSpeed;

    private static int $idCounter = 0;

    public function __construct(string $type, float $x, float $y)
    {
        $this->id = 'creature_' . (++self::$idCounter);
        $this->type = $type;
        $this->x = $x;
        $this->y = $y;
        $this->rotation = mt_rand(0, 360) * (M_PI / 180);
        $this->rotationSpeed = (mt_rand(-100, 100) / 1000);

        // Velocidade inicial aleatória (criaturas voam!)
        $this->velX = (mt_rand(-80, 80) / 100);
        $this->velY = (mt_rand(-80, 80) / 100);

        switch ($type) {
            case 'pixie':
                // Pixies - pequenas fadas brilhantes
                $this->hp = 10;
                $this->maxHp = 10;
                $this->xp = 10;
                $this->size = 18;
                $this->color = '#E8D4A8'; // Dourado claro
                break;

            case 'fairy':
                // Fadas - criaturas mágicas médias
                $this->hp = 30;
                $this->maxHp = 30;
                $this->xp = 25;
                $this->size = 24;
                $this->color = '#B39DDB'; // Roxo claro
                break;

            case 'snitch':
                // Pomo de Ouro - raro e valioso
                $this->hp = 80;
                $this->maxHp = 80;
                $this->xp = 130;
                $this->size = 32;
                $this->color = '#FFD700'; // Dourado
                // Pomo se move mais rápido
                $this->velX *= 2;
                $this->velY *= 2;
                break;

            default:
                $this->hp = 10;
                $this->maxHp = 10;
                $this->xp = 10;
                $this->size = 18;
                $this->color = '#E8D4A8';
        }
    }

    public function update(float $mapWidth, float $mapHeight, float $friction = 0.995): void
    {
        // Atualiza rotação
        $this->rotation += $this->rotationSpeed;

        // Criaturas se movem erraticamente (como voo de insetos)
        if ($this->type === 'snitch') {
            // Pomo se move mais erraticamente
            if (mt_rand(1, 30) === 1) {
                $this->velX += (mt_rand(-100, 100) / 50);
                $this->velY += (mt_rand(-100, 100) / 50);
            }
        } else {
            if (mt_rand(1, 60) === 1) {
                $this->velX += (mt_rand(-50, 50) / 100);
                $this->velY += (mt_rand(-50, 50) / 100);
            }
        }

        // Limita velocidade máxima
        $maxSpeed = $this->type === 'snitch' ? 3 : 1.5;
        $currentSpeed = sqrt($this->velX * $this->velX + $this->velY * $this->velY);
        if ($currentSpeed > $maxSpeed) {
            $this->velX = ($this->velX / $currentSpeed) * $maxSpeed;
            $this->velY = ($this->velY / $currentSpeed) * $maxSpeed;
        }

        // Aplica velocidade
        $this->x += $this->velX;
        $this->y += $this->velY;

        // Aplica fricção leve
        $this->velX *= $friction;
        $this->velY *= $friction;

        // Rebate nas bordas do mapa
        if ($this->x < $this->size) {
            $this->x = $this->size;
            $this->velX = abs($this->velX) * 0.8;
        }
        if ($this->x > $mapWidth - $this->size) {
            $this->x = $mapWidth - $this->size;
            $this->velX = -abs($this->velX) * 0.8;
        }
        if ($this->y < $this->size) {
            $this->y = $this->size;
            $this->velY = abs($this->velY) * 0.8;
        }
        if ($this->y > $mapHeight - $this->size) {
            $this->y = $mapHeight - $this->size;
            $this->velY = -abs($this->velY) * 0.8;
        }
    }

    public function takeDamage(int $damage): bool
    {
        $this->hp -= $damage;

        // Recuo ao tomar dano
        $knockback = 2.5;
        $this->velX += (mt_rand(-100, 100) / 100) * $knockback;
        $this->velY += (mt_rand(-100, 100) / 100) * $knockback;

        return $this->hp <= 0;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'x' => round($this->x, 2),
            'y' => round($this->y, 2),
            'hp' => $this->hp,
            'maxHp' => $this->maxHp,
            'size' => $this->size,
            'color' => $this->color,
            'rotation' => round($this->rotation, 3)
        ];
    }
}
