
// Função para obter o token do localStorage
function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

// Função para buscar os itens do pedido
async function carregarItensDoPedido(pedidoId) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink + `/buscar-itens-de-pedidos?pedido_pedido_id=${pedidoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar itens do pedido');
        }

        const itens = await response.json();
        return itens;
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// Função para calcular o total do pedido
function calcularTotalPedido(itens) {
    return itens.reduce((total, item) => total + item.vlr_total_item, 0);
}

// Função para renderizar os itens do pedido no HTML
function renderizarItensDoCarrinho(itens) {
    const cartItemsList = document.getElementById('cartItemsList');
    cartItemsList.innerHTML = ''; // Limpa o conteúdo anterior

    // Itera sobre os itens do pedido e insere no HTML
    itens.forEach(item => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        listItem.innerHTML = `
            <span>${item.produto_desc}</span>
            <div class="d-flex align-items-center">
                <button class="btn btn-outline-secondary btn-sm" onclick="alterarQuantidade(${item.item_id}, ${item.quantidade - 1})">-</button>
                <span class="px-2">${item.quantidade}</span>
                <button class="btn btn-outline-secondary btn-sm" onclick="alterarQuantidade(${item.item_id}, ${item.quantidade + 1})">+</button>
                <button class="btn btn-danger btn-sm mx-2" onclick="removerItem(${item.item_id})">
                  <i class="fa-solid fa-trash"></i>
                </button>
                <span class="badge bg-primary rounded-pill mx-2">R$${item.vlr_total_item.toFixed(2)}</span>
            </div>
        `;

        cartItemsList.appendChild(listItem);
    });

    // Calcula e exibe o total do pedido
    const totalPedido = calcularTotalPedido(itens);
    document.getElementById('totalPedido').textContent = `R$${totalPedido.toFixed(2)}`;
}

// Função para carregar o carrinho ao abrir a página
async function carregarCarrinho() {
    const clienteId = getFromLocalStorage('apiRootIDCliente');
    const pedidoId = await verificarPedidoAberto(clienteId); // Função que já usamos antes para verificar pedido

    if (pedidoId) {
        const itens = await carregarItensDoPedido(pedidoId);
        renderizarItensDoCarrinho(itens);
    } else {
        console.log('Nenhum pedido aberto encontrado');
    }
}

// Chama a função ao carregar a página
window.onload = carregarCarrinho;

// Função para alterar a quantidade de um item no pedido
async function alterarQuantidade(itemId, novaQuantidade) {
    if (novaQuantidade <= 0) {
        removerItem(itemId); // Remove o item se a quantidade for 0 ou menos
        return;
    }

    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink + `/alterar-quantidade-item`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({
                item_id: itemId,
                nova_quantidade: novaQuantidade
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao alterar a quantidade do item');
        }

        const clienteId = getFromLocalStorage('apiRootIDCliente');
        const pedidoId = await verificarPedidoAberto(clienteId);
        const itens = await carregarItensDoPedido(pedidoId);
        renderizarItensDoCarrinho(itens); // Atualiza o carrinho após alterar a quantidade

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para remover um item do pedido
async function removerItem(itemId) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink + `/remover-item`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({ item_id: itemId })
        });

        if (!response.ok) {
            throw new Error('Erro ao remover o item do pedido');
        }

        const clienteId = getFromLocalStorage('apiRootIDCliente');
        const pedidoId = await verificarPedidoAberto(clienteId);
        const itens = await carregarItensDoPedido(pedidoId);
        renderizarItensDoCarrinho(itens); // Atualiza o carrinho após remover o item

    } catch (error) {
        console.error('Erro:', error);
    }
}