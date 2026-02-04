<?php
namespace NimbusIO\Tests;

use PHPUnit\Framework\TestCase;
use NimbusIO\Entities\Wizard;

/**
 * Testes para a entidade Wizard
 */
class WizardTest extends TestCase
{
    /**
     * Testa se o dano e aplicado corretamente
     */
    public function testTakeDamage(): void
    {
        // Este teste precisa de um mock da ConnectionInterface
        $this->markTestIncomplete('Necessita implementacao com mocks');
    }

    /**
     * Testa calculo de XP para proximo nivel
     */
    public function testXpForNextLevel(): void
    {
        // Formula: 25 + (level * level * 2.5)
        // Level 1: 25 + (1 * 1 * 2.5) = 27.5 -> 27
        // Level 5: 25 + (5 * 5 * 2.5) = 87.5 -> 87
        // Level 10: 25 + (10 * 10 * 2.5) = 275

        $this->markTestIncomplete('Necessita implementacao com mocks');
    }

    /**
     * Testa aplicacao de slow
     */
    public function testApplySlow(): void
    {
        $this->markTestIncomplete('Necessita implementacao com mocks');
    }

    /**
     * Testa aplicacao de burn
     */
    public function testApplyBurn(): void
    {
        $this->markTestIncomplete('Necessita implementacao com mocks');
    }
}
