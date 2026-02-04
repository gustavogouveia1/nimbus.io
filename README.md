# Nimbus.io - Batalha de Bruxos

Um jogo multiplayer em tempo real inspirado em Diep.io, onde bruxos em vassouras voadoras batalham usando feiticos magicos.

## Estrutura do Projeto

```
nimbus-io/
├── client/                # Front-end (HTML, CSS, JS)
│   ├── assets/            # Sprites, sons e fontes
│   ├── css/               # Estilos CSS
│   ├── js/
│   │   ├── core/          # Game.js, Renderer.js
│   │   ├── entities/      # Player.js, Spell.js
│   │   └── network/       # Network.js, Input.js
│   └── index.html
├── server/                # Back-end PHP
│   ├── src/
│   │   ├── Core/          # GameEngine.php
│   │   ├── Entities/      # Wizard.php, Creature.php, Projectile.php
│   │   ├── Mechanics/     # SpellWeaving.php (futuro)
│   │   └── Protocols/     # Pacotes binarios (futuro)
│   ├── vendor/            # Dependencias Composer
│   └── server.php         # Entry point
├── shared/                # Configuracoes compartilhadas (JSON)
├── tests/                 # Testes unitarios PHPUnit
├── composer.json
├── phpunit.xml
└── README.md
```

## Requisitos

- PHP 8.0+
- Composer
- Navegador moderno com suporte a WebSocket

## Instalacao

1. Clone o repositorio
2. Instale as dependencias do servidor:
```bash
cd server
composer install
```

3. Configure o endereco IP no `server/server.php`

4. Inicie o servidor:
```bash
cd server
php server.php
```

5. Abra `client/index.html` no navegador

## Gameplay

### Controles
- **WASD** - Movimento
- **Mouse** - Mirar
- **Click Esquerdo** - Feitico basico
- **1-5** - Feiticos especiais
- **Shift** - Speed Boost
- **Tab/G** - Grimorio de combos
- **B** - Loja

### Feiticos
1. **Stupefy** - Atordoamento rapido
2. **Incendio** - Dano + Queimadura
3. **Glacius** - Dano + Lentidao
4. **Bombarda** - Dano em area
5. **Protego** - Escudo protetor

### Sistema de Combos (Spell Weaving)
Pressione sequencias de teclas rapidamente para desencadear feiticos poderosos!

Exemplos:
- **1-2-1** = Fogo Atordoante
- **3-1-3** = Paralisia Gelida
- **1-2-3-4-5** = Harmonia dos Elementos (Lendario)

## Testes

```bash
./vendor/bin/phpunit
```

## Tecnologias

- **Frontend**: JavaScript vanilla, Canvas API
- **Backend**: PHP 8, Ratchet (WebSocket)
- **Comunicacao**: WebSocket JSON

## Licenca

Projeto educacional - uso livre.
