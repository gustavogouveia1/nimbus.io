<?php
namespace NimbusIO\Tests;

use PHPUnit\Framework\TestCase;
use NimbusIO\Entities\Projectile;

/**
 * Testes para a entidade Projectile (Spell)
 */
class ProjectileTest extends TestCase
{
    /**
     * Testa criacao de projétil basico
     */
    public function testBasicProjectileCreation(): void
    {
        $projectile = new Projectile(
            'wizard_1',
            100.0,
            100.0,
            0.0, // angulo
            'basic',
            10,   // damage
            14.0, // speed
            12.0  // size
        );

        $this->assertEquals('wizard_1', $projectile->ownerId);
        $this->assertEquals(100.0, $projectile->x);
        $this->assertEquals(100.0, $projectile->y);
        $this->assertEquals('basic', $projectile->spellType);
        $this->assertEquals(10, $projectile->damage);
    }

    /**
     * Testa movimento do projetil
     */
    public function testProjectileMovement(): void
    {
        $projectile = new Projectile(
            'wizard_1',
            0.0,
            0.0,
            0.0, // angulo 0 = direita
            'basic',
            10,
            10.0, // speed
            12.0
        );

        $initialX = $projectile->x;
        $projectile->update();

        // Projetil deve ter se movido para a direita
        $this->assertGreaterThan($initialX, $projectile->x);
    }

    /**
     * Testa colisao com alvo
     */
    public function testCollision(): void
    {
        $projectile = new Projectile(
            'wizard_1',
            100.0,
            100.0,
            0.0,
            'basic',
            10,
            14.0,
            10.0
        );

        // Alvo muito proximo - deve colidir
        $this->assertTrue($projectile->collidesWith(105.0, 100.0, 10.0));

        // Alvo distante - nao deve colidir
        $this->assertFalse($projectile->collidesWith(200.0, 200.0, 10.0));
    }

    /**
     * Testa verificacao de limites do mapa
     */
    public function testOutOfBounds(): void
    {
        $projectile = new Projectile(
            'wizard_1',
            -10.0, // fora do mapa
            100.0,
            0.0,
            'basic',
            10,
            14.0,
            12.0
        );

        $this->assertTrue($projectile->isOutOfBounds(1000.0, 1000.0));

        $projectile->x = 500.0;
        $projectile->y = 500.0;
        $this->assertFalse($projectile->isOutOfBounds(1000.0, 1000.0));
    }

    /**
     * Testa configuracao de efeitos especiais
     */
    public function testSpecialEffects(): void
    {
        // Glacius deve ter efeito slow
        $glacius = new Projectile('wizard_1', 0, 0, 0, 'glacius', 10, 14, 12);
        $this->assertTrue($glacius->hasSlowEffect);
        $this->assertFalse($glacius->hasBurnEffect);

        // Incendio deve ter efeito burn
        $incendio = new Projectile('wizard_1', 0, 0, 0, 'incendio', 10, 14, 12);
        $this->assertTrue($incendio->hasBurnEffect);
        $this->assertFalse($incendio->hasSlowEffect);

        // Bombarda deve ter dano em area
        $bombarda = new Projectile('wizard_1', 0, 0, 0, 'bombarda', 10, 14, 12);
        $this->assertTrue($bombarda->hasAreaDamage);
        $this->assertEquals(60, $bombarda->areaRadius);
    }
}
