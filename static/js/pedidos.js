
// Função para obter o token do localStorage
function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

// Função para buscar os pedidos do cliente
async function carregarPedidosDoCliente(clienteId) {
    const token = getFromLocalStorage('apiRootToken');

    try {
        const response = await fetch(apiRootLink + `/listar-todos-pedidos-por_cliente?cliente_id=${clienteId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar pedidos');
        }

        const pedidos = await response.json();
        return pedidos;

    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// Função para formatar a data no formato DD/MM/YYYY HH:MM
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Meses começam do zero
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

// Função para renderizar os pedidos na tela
function renderizarPedidos(pedidos) {
    const listaPedidos = document.getElementById('listaPedidos');
    listaPedidos.innerHTML = ''; // Limpa o conteúdo anterior

    // Ordena os pedidos do maior para o menor com base no pedido_id_app
    pedidos.sort((a, b) => b.pedido_id_app - a.pedido_id_app);

    pedidos.forEach(pedido => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        // Formatar a data de cadastro
        const dataCadastro = pedido.data_cadastro ? formatarData(pedido.data_cadastro) : 'Data não disponível';

        // Exibir detalhes do pedido
        listItem.innerHTML = `
            <span>Pedido #${pedido.pedido_id_app} - Data: ${dataCadastro} - Forma de Pagamento: ${pedido.pedido_forma_pagamento ? pedido.pedido_forma_pagamento : 'Não informado'} - Status: ${pedido.pedido_status ? pedido.pedido_status : 'Pendente'}</span>
            <button class="btn btn-outline-success btn-sm" onclick="window.location.href='/pedido-detalhes?id_pedido=${pedido.pedido_id_app}&pedido_status=${pedido.pedido_status}'">Ver Pedido</button>
        `;


        // Adicionar o item à lista
        listaPedidos.appendChild(listItem);
    });
}

// Função para carregar e exibir os pedidos ao abrir a página
async function carregarPedidos() {
    const clienteId = getFromLocalStorage('apiRootIDCliente');

    if (clienteId) {
        const pedidos = await carregarPedidosDoCliente(clienteId);
        renderizarPedidos(pedidos);
    } else {
        console.log('ID do cliente não encontrado');
    }
}

// Carregar pedidos ao abrir a página
window.onload = carregarPedidos;
