//
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
        // Envia a nova quantidade para o backend
        const response = await fetch(apiRootLink + `/atualizar-qtde-itens-de-pedidos?item_id=${itemId}&nova_quantidade=${novaQuantidade}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao alterar a quantidade do item');
        }

        const data = await response.json();

        // Exibe a mensagem de sucesso usando SweetAlert2
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: data.message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

        // Recarrega o carrinho após a atualização da quantidade
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
        const response = await fetch(apiRootLink + `/deletar-itens-de-pedidos?item_id=${itemId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao remover o item do pedido');
        }

        const data = await response.json();

        // Exibe a mensagem de sucesso usando SweetAlert2
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: data.message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

        // Atualiza a lista de itens no carrinho
        const clienteId = getFromLocalStorage('apiRootIDCliente');
        const pedidoId = await verificarPedidoAberto(clienteId);
        const itens = await carregarItensDoPedido(pedidoId);
        renderizarItensDoCarrinho(itens); // Atualiza o carrinho após remover o item

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para esvaziar o carrinho
async function limparCarrinho() {
    const clienteId = getFromLocalStorage('apiRootIDCliente');
    const pedidoId = await verificarPedidoAberto(clienteId); // Verifica se há um pedido aberto

    if (pedidoId) {
        const token = getFromLocalStorage('apiRootToken');
        try {
            const response = await fetch(apiRootLink + `/limpar-itens-de-pedidos?pedido_id=${pedidoId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'token': token
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao limpar o carrinho');
            }

            // Exibe a mensagem de sucesso usando SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Carrinho esvaziado com sucesso!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

            // Atualiza a lista de itens no carrinho
            renderizarItensDoCarrinho([]);
            document.getElementById('totalPedido').textContent = 'R$0.00'; // Reseta o total

        } catch (error) {
            console.error('Erro:', error);
        }
    }
}

// Evento de clique no botão "Esvaziar Carrinho"
document.getElementById('esvaziarCarrinhoBtn').addEventListener('click', limparCarrinho);
