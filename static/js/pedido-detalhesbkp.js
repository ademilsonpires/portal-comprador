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

// Função para renderizar os itens do pedido no HTML (apenas para visualização)
function renderizarItensDoPedido(itens) {
    const cartItemsList = document.getElementById('cartItemsList');
    cartItemsList.innerHTML = ''; // Limpa o conteúdo anterior

    // Itera sobre os itens do pedido e insere no HTML
    itens.forEach(item => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        listItem.innerHTML = `
            <span>${item.produto_desc} - Quantidade: ${item.quantidade}</span>
            <span class="badge bg-primary rounded-pill mx-2">R$${item.vlr_total_item.toFixed(2)}</span>
        `;

        cartItemsList.appendChild(listItem);
    });

    // Calcula e exibe o total do pedido
    const totalPedido = calcularTotalPedido(itens);
    document.getElementById('totalPedido').textContent = `R$${totalPedido.toFixed(2)}`;
}

async function carregarPedidoDetalhes() {
    const pedidoId = new URLSearchParams(window.location.search).get('id_pedido'); // Obtém o id_pedido da URL

    if (pedidoId) {
        const itens = await carregarItensDoPedido(pedidoId);
        renderizarItensDoPedido(itens);
    } else {
        console.log('ID do pedido não encontrado');
    }
}

// Chama a função ao carregar a página
window.onload = carregarPedidoDetalhes;


//-------------------------------------------------------------------------
// Função para alterar o status da timeline com base no pedido_status
function atualizarTimelineStatus(pedidoStatus) {
  const steps = {
    pedido: document.getElementById('step-pedido'),
    nota: document.getElementById('step-nota'),
    entrega: document.getElementById('step-entrega'),
    recebido: document.getElementById('step-recebido')
  };

  // Definir cores
  const cores = {
    cinza: '#ccc',
    verde: '#4caf50',
    amarelo: '#ffc107'
  };

  // Resetar todas as etapas para cinza
  Object.values(steps).forEach(step => {
    step.querySelector('.icon-wrapper').style.backgroundColor = cores.cinza;
    step.querySelector('.icon-wrapper i').style.color = cores.cinza;
  });

  // Atualizar as cores baseadas no status
  switch (pedidoStatus) {
    case 'aberto':
    case 'liberado':
      steps.pedido.querySelector('.icon-wrapper').style.backgroundColor = cores[pedidoStatus === 'aberto' ? 'amarelo' : 'verde'];
      steps.pedido.querySelector('.icon-wrapper i').style.color = '#fff';
      break;
    case 'importado':
    case 'faturado':
      steps.pedido.querySelector('.icon-wrapper').style.backgroundColor = cores.verde;
      steps.pedido.querySelector('.icon-wrapper i').style.color = '#fff';
      steps.nota.querySelector('.icon-wrapper').style.backgroundColor = cores[pedidoStatus === 'importado' ? 'amarelo' : 'verde'];
      steps.nota.querySelector('.icon-wrapper i').style.color = '#fff';
      break;
    case 'entrega':
      steps.pedido.querySelector('.icon-wrapper').style.backgroundColor = cores.verde;
      steps.pedido.querySelector('.icon-wrapper i').style.color = '#fff';
      steps.nota.querySelector('.icon-wrapper').style.backgroundColor = cores.verde;
      steps.nota.querySelector('.icon-wrapper i').style.color = '#fff';
      steps.entrega.querySelector('.icon-wrapper').style.backgroundColor = cores.amarelo;
      steps.entrega.querySelector('.icon-wrapper i').style.color = '#fff';
      break;
    case 'entregue':
      Object.values(steps).forEach(step => {
        step.querySelector('.icon-wrapper').style.backgroundColor = cores.verde;
        step.querySelector('.icon-wrapper i').style.color = '#fff';
      });
      break;
    default:
      // Se o status não for reconhecido, mantenha tudo cinza
      console.log('Status desconhecido');
  }
}

// Simulação da chamada da função com base no status do pedido
//const pedidoStatus = 'faturado'; // Exemplo: status retornado pela API
timeline_pedido_status = new URLSearchParams(window.location.search).get('pedido_status'); // Obtém o id_pedido da URL

atualizarTimelineStatus(timeline_pedido_status);
