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

//formas de pagamento
// Função para abrir a modal de formas de pagamento
function abrirModalFormasPagamento() {
    const modal = document.getElementById('modalFormasPagamento');
    modal.style.display = 'flex'; // Exibe a modal como flexbox (centralizado)
}

// Função para fechar a modal
function fecharModal() {
    const modal = document.getElementById('modalFormasPagamento');
    modal.style.display = 'none'; // Oculta a modal
}

// Função para listar as formas de pagamento da API
async function listarFormasPagamento(clienteId) {
    const token = getFromLocalStorage('apiRootToken');

    try {
        const response = await fetch(apiRootLink + `/listar-formas-pagamento-cliente/${clienteId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar formas de pagamento');
        }

        const formasPagamento = await response.json();

        // Renderiza as formas de pagamento
        const listaFormasPagamento = document.getElementById('listaFormasPagamento');
        listaFormasPagamento.innerHTML = ''; // Limpa o conteúdo anterior

        // Adiciona as formas de pagamento da API
        formasPagamento.forEach(forma => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');

            // Convertendo descrição para minúsculas para data-id
            const formaId = forma.cliente_forma_pagamento_desc.toLowerCase();

            listItem.setAttribute('data-id', formaId);
            listItem.textContent = forma.cliente_forma_pagamento_desc;
            listItem.addEventListener('click', () => selecionarFormaPagamento(listItem));

            listaFormasPagamento.appendChild(listItem);
        });

        // Abre a modal
        abrirModalFormasPagamento();

    } catch (error) {
        console.error('Erro:', error);
    }
}



// Função para selecionar uma forma de pagamento
function selecionarFormaPagamento(listItem) {
    // Remove a classe 'active' de todos os itens
    document.querySelectorAll('#listaFormasPagamento li').forEach(item => {
        item.classList.remove('active');
    });

    // Adiciona a classe 'active' no item selecionado
    listItem.classList.add('active');
}

// Função para confirmar a escolha da forma de pagamento
async function confirmarPagamento() {
    const formaSelecionada = document.querySelector('#listaFormasPagamento li.active');

    if (formaSelecionada) {
        const formaId = formaSelecionada.getAttribute('data-id');
        const formaDesc = formaSelecionada.textContent.trim().toLowerCase(); // Padroniza a verificação
        console.log("Forma selecionada:", formaDesc); // Adicionando log para depuração

        const clienteId = getFromLocalStorage('apiRootIDCliente');
        const pedidoId = await verificarPedidoAberto(clienteId); // Verifica se há um pedido aberto

        if (!pedidoId) {
            alert('Nenhum pedido aberto encontrado.');
            return;
        }

        if (formaDesc.includes('pagar agora')) {
            console.log("Pagar Agora selecionado, requisitando link de pagamento");
            // Se a opção "Pagar Agora" foi selecionada, faz a requisição para gerar o link de pagamento
            await pagarAgora(formaId, pedidoId);
        } else {
            console.log("Outra forma de pagamento selecionada");
            // Para as outras formas de pagamento, segue o fluxo normal
            await atualizarFormaPagamentoNormal(formaId, pedidoId);
        }
    } else {
        alert('Por favor, selecione uma forma de pagamento.');
    }
}

// Função para seguir o fluxo de "Pagar Agora"
async function pagarAgora(formaId, pedidoId) {
    try {
        console.log("Iniciando o pagamento agora");
        // Fazer a requisição para gerar o link de pagamento
        const token = getFromLocalStorage('apiRootToken');
        const valorTotal = document.getElementById('totalPedido').textContent.replace('R$', '').trim();
        console.log("Valor total:", valorTotal); // Log para verificar o valor total

        const response = await fetch(`${apiRootLink}/gerar-link-pagamento?pedido_id=${pedidoId}&valor=${valorTotal}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            }
        });

        if (!response.ok) throw new Error('Erro ao gerar link de pagamento');

        const data = await response.json();
        const linkPagamento = data.link_pagamento;
       // Atualiza a forma de pagamento para "cartao agora" no backend
        const resultadoForma = await atualizarCampoPedido(pedidoId, 'pedido_forma_pagamento', 'cartao agora');
               // Atualiza a forma de pagamento para "cartao agora" no backend

        console.log("Abrindo link de pagamento:", linkPagamento);

        window.location.href = linkPagamento

        if (!resultadoForma) throw new Error('Falha ao atualizar forma de pagamento');

    } catch (error) {
        console.error('Erro ao gerar link de pagamento:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Ocorreu um erro ao gerar o link de pagamento. Tente novamente.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Função para atualizar as outras formas de pagamento normalmente
async function atualizarFormaPagamentoNormal(formaId, pedidoId) {
    try {
        console.log("Atualizando forma de pagamento para outra opção:", formaId);
        const resultadoForma = await atualizarCampoPedido(pedidoId, 'pedido_forma_pagamento', formaId);
        if (!resultadoForma) throw new Error('Falha ao atualizar forma de pagamento');

        const resultadoStatus = await atualizarCampoPedido(pedidoId, 'pedido_status', 'liberado');
        if (!resultadoStatus) throw new Error('Falha ao atualizar status do pedido');

        Swal.fire({
            icon: 'success',
            title: 'Pedido Finalizado',
            text: 'Seu pedido foi finalizado com sucesso!',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

        setTimeout(() => {
            window.location.href = '/pedidos'; // Redireciona para a página do sistema
        }, 3000);

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Ocorreu um erro ao finalizar o pedido. Tente novamente.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Evento de clique no botão "Finalizar Pedido"
document.getElementById('finalizarPedidoBtn').addEventListener('click', async () => {
    const clienteId = getFromLocalStorage('apiRootIDCliente');
    await listarFormasPagamento(clienteId); // Carregar e abrir a modal com formas de pagamento
});



// Função para atualizar um campo do pedido
async function atualizarCampoPedido(pedidoId, campo, novoValor) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(`${apiRootLink}/atualizar-pedido-campo/?pedido_id=${pedidoId}&campo=${campo}&novo_valor=${novoValor}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar o pedido');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro ao atualizar o campo do pedido:', error);
        return null;
    }
}

// Evento de clique no botão de confirmação de pagamento
document.getElementById('confirmarPagamentoBtn').addEventListener('click', confirmarPagamento);
