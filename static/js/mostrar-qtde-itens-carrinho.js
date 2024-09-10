// Função para obter o token do localStorage
function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

// Função para verificar se há um pedido aberto para o cliente
async function verificarPedidoAberto(clienteId) {
    const token = getFromLocalStorage('apiRootToken');
    const cliente_id = getFromLocalStorage('apiRootIDCliente');
    try {
        const response = await fetch(apiRootLink + `/verificar-pedidos-aberto?cliente_id=${clienteId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao verificar pedido aberto');
        }

        const pedidos = await response.json();
        if (pedidos.length > 0 && pedidos[0].pedido_status === 'aberto') {
            return pedidos[0].pedido_id_app;
        }
        return null; // Retorna null se não houver pedido aberto
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
}

// Função para obter o total de itens do pedido
async function obterTotalItensPedido(pedidoId) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink+`/total-pedidos?pedido_pedido_id=${pedidoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter total de itens do pedido');
        }

        const data = await response.json();

        // Verifica se o campo total_itens existe
        if (data && data.total_itens !== undefined && data.total_itens !== null) {
            return data.total_itens; // Retorna o total de itens
        } else {
            return 0; // Retorna 0 se não houver itens no pedido
        }
    } catch (error) {
        console.error('Erro:', error);
        return 0; // Retorna 0 se houver erro
    }
}

// Função para atualizar o botão do carrinho com o total de itens
async function atualizarCarrinho() {
    const clienteId = getFromLocalStorage('apiRootIDCliente'); // Obtém o ID do cliente do localStorage

    // Verifica se há um pedido aberto
    const pedidoId = await verificarPedidoAberto(clienteId);

    if (pedidoId) {
        // Se houver um pedido aberto, obtém o total de itens
        const totalItens = await obterTotalItensPedido(pedidoId);

        // Seleciona o botão do carrinho e atualiza com o total de itens
        const botaoCarrinho = document.getElementById('carrinho');
        if (totalItens > 0) {
            botaoCarrinho.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> <span class="badge">${totalItens}</span>`;
        } else {
            botaoCarrinho.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> <span class="badge">0</span>`;
        }
    } else {
        // Se não houver pedido aberto, exibe o carrinho vazio
        const botaoCarrinho = document.getElementById('carrinho');
        botaoCarrinho.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> <span class="badge">0</span>`;
    }
}

// Usa addEventListener para garantir que a função seja chamada ao carregar a página
window.addEventListener('load', atualizarCarrinho);
