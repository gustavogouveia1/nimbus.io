<?php
namespace DiepIO;

/**
 * Formas geométricas que dão XP quando destruídas
 * - Square (amarelo): 10 XP
 * - Triangle (vermelho): 25 XP
 * - Pentagon (azul): 130 XP
 */
class Shape
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
        $this->id = 'shape_' . (++self::$idCounter);
        $this->type = $type;
        $this->x = $x;
        $this->y = $y;
        $this->rotation = mt_rand(0, 360) * (M_PI / 180);
        $this->rotationSpeed = (mt_rand(-100, 100) / 1000);

        // Pequena velocidade inicial aleatória
        $this->velX = (mt_rand(-50, 50) / 100);
        $this->velY = (mt_rand(-50, 50) / 100);

        switch ($type) {
            case 'square':
                $this->hp = 10;
                $this->maxHp = 10;
                $this->xp = 10;
                $this->size = 20;
                $this->color = '#FFE869';
                break;
            case 'triangle':
                $this->hp = 30;
                $this->maxHp = 30;
                $this->xp = 25;
                $this->size = 25;
                $this->color = '#FC7677';
                break;
            case 'pentagon':
                $this->hp = 100;
                $this->maxHp = 100;
                $this->xp = 130;
                $this->size = 40;
                $this->color = '#768DFC';
                break;
            default:
                $this->hp = 10;
                $this->maxHp = 10;
                $this->xp = 10;
                $this->size = 20;
                $this->color = '#FFE869';
        }
    }

    public function update(float $mapWidth, float $mapHeight, float $friction = 0.98): void
    {
        // Atualiza rotação
        $this->rotation += $this->rotationSpeed;

        // Aplica velocidade
        $this->x += $this->velX;
        $this->y += $this->velY;

        // Aplica fricção
        $this->velX *= $friction;
        $this->velY *= $friction;

        // Mantém dentro do mapa
        $this->x = max($this->size, min($mapWidth - $this->size, $this->x));
        $this->y = max($this->size, min($mapHeight - $this->size, $this->y));
    }

    public function takeDamage(int $damage): bool
    {
        $this->hp -= $damage;

        // Recuo ao tomar dano
        $knockback = 2;
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
