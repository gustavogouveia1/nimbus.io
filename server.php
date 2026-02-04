<?php
/**
 * Nimbus.io - Servidor WebSocket
 * Batalha de Bruxos em Vassouras
 *
 * Para iniciar: php server.php
 * O servidor escuta na porta 8080
 */

require __DIR__ . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Loop;
use React\Socket\SocketServer;
use NimbusIO\Core\GameEngine;

$host = getenv('SERVER_HOST') ?: '0.0.0.0';
$port = (int)(getenv('SERVER_PORT') ?: 8080);

// Obtém o loop global do React
$loop = Loop::get();

// Cria o GameEngine passando o loop
$gameServer = new GameEngine($loop);

// Cria o servidor WebSocket usando o mesmo loop
$socket = new SocketServer("{$host}:{$port}", [], $loop);

$server = new IoServer(
    new HttpServer(
        new WsServer($gameServer)
    ),
    $socket,
    $loop
);

echo "=====================================\n";
echo "   NIMBUS.IO - BATALHA DE BRUXOS\n";
echo "=====================================\n";
echo "Servidor WebSocket iniciado!\n";
echo "Endereco: ws://{$host}:{$port}\n";
echo "Aguardando bruxos...\n";
echo "=====================================\n";

$loop->run();
