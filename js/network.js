/**
 * Nimbus.io - Gerenciador de Rede
 * WebSocket para comunicação com servidor
 */
const Network = {
    socket: null,
    connected: false,
    playerId: null,
    serverUrl: 'ws://26.12.134.180:8080',

    // Callbacks
    onConnected: null,
    onDisconnected: null,
    onGameState: null,
    onJoined: null,
    onPlayerJoined: null,
    onPlayerLeft: null,
    onPlayerKilled: null,
    onRespawn: null,
    onConfig: null,
    onShopResult: null,

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.serverUrl);

                this.socket.onopen = () => {
                    console.log('Conectado ao servidor Nimbus.io');
                    this.connected = true;
                    if (this.onConnected) this.onConnected();
                    resolve();
                };

                this.socket.onclose = () => {
                    console.log('Desconectado do servidor');
                    this.connected = false;
                    if (this.onDisconnected) this.onDisconnected();
                };

                this.socket.onerror = (error) => {
                    console.error('Erro WebSocket:', error);
                    reject(error);
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

            } catch (error) {
                reject(error);
            }
        });
    },

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    },

    handleMessage(data) {
        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'config':
                    if (this.onConfig) this.onConfig(msg);
                    break;

                case 'joined':
                    this.playerId = msg.playerId;
                    if (this.onJoined) this.onJoined(msg);
                    break;

                case 'state':
                    if (this.onGameState) this.onGameState(msg);
                    break;

                case 'playerJoined':
                    if (this.onPlayerJoined) this.onPlayerJoined(msg);
                    break;

                case 'playerLeft':
                    if (this.onPlayerLeft) this.onPlayerLeft(msg);
                    break;

                case 'playerKilled':
                    if (this.onPlayerKilled) this.onPlayerKilled(msg);
                    break;

                case 'respawn':
                    if (this.onRespawn) this.onRespawn(msg);
                    break;

                case 'shopResult':
                    if (this.onShopResult) this.onShopResult(msg);
                    break;
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    },

    send(data) {
        if (this.connected && this.socket) {
            this.socket.send(JSON.stringify(data));
        }
    },

    // Entra no jogo com nome e varinha escolhida
    join(name, wand = 'phoenix') {
        this.send({
            type: 'join',
            name: name,
            wand: wand
        });
    },

    // Envia estado de input
    sendInput(inputState) {
        this.send({
            type: 'input',
            keys: inputState.keys,
            angle: inputState.angle,
            selectedSpell: inputState.selectedSpell
        });
    },

    // Envia pedido de upgrade
    sendUpgrade(stat) {
        this.send({
            type: 'upgrade',
            stat: stat
        });
    },

    // Envia comando para lançar magia especial
    sendCastSpell(spellNum) {
        this.send({
            type: 'castSpell',
            spell: spellNum
        });
    },

    // Envia comando para comprar item na loja
    sendBuyItem(itemId) {
        this.send({
            type: 'buyItem',
            itemId: itemId
        });
    },

    // ========== SISTEMA DE SPELL WEAVING ==========

    // Envia combo executado ao servidor
    sendCombo(comboType) {
        this.send({
            type: 'combo',
            comboType: comboType
        });
    }
};
