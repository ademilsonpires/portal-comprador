// Função para salvar dados no localStorage
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, value);
}
// Função para recuperar dados do localStorage
function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

// Função para obter o ID da categoria a partir da URL
function getCategoriaIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('categoria'); // Retorna o ID da categoria
}

// Função para obter a tabela de preços para o cliente
async function obterTabelaDePrecoCliente() {
    try {
        const token = getFromLocalStorage('apiRootToken'); // Obtém o token do localStorage
        const clienteId = getFromLocalStorage('apiRootIDCliente'); // Obtém o ID do cliente do localStorage

        // Requisição para buscar tabelas de preço do cliente
        const response = await fetch(apiRootLink + `/cliente-tabelas-de-preco?cliente_id=${clienteId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar a tabela de preço do cliente');
        }

        const tabelasCliente = await response.json();
        const tabelaPrecoId = tabelasCliente[0]?.cliente_tabela_preco_id; // Assume que há ao menos uma tabela de preço

        if (!tabelaPrecoId) {
            throw new Error('Tabela de preço não encontrada para o cliente');
        }

        // Requisição para buscar os preços dos produtos com base na tabela de preço do cliente
        const precoResponse = await fetch(apiRootLink + `/buscar-tabelas-de-preco?tabela_id=${tabelaPrecoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!precoResponse.ok) {
            throw new Error('Erro ao carregar os preços dos produtos');
        }

        return await precoResponse.json(); // Retorna a lista de produtos e seus preços
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// Função para carregar produtos por embalagem (declarada antes de ser usada)
async function buscarProdutosPorEmbalagem(embalagem) {
    try {
        const token = getFromLocalStorage('apiRootToken');
        const categoriaId = getCategoriaIdFromURL(); // Obtém o ID da categoria a partir da URL

        // Requisição para buscar produtos por categoria e embalagem
        const response = await fetch(apiRootLink + `/buscar-produtos-categoria?categoria_id=${categoriaId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar os produtos');
        }

        const produtos = await response.json();

        // Filtra os produtos pela embalagem
        return produtos.filter(produto => produto.produto_embalagem === embalagem);

    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

async function carregarEmbalagens() {
    try {
        const token = getFromLocalStorage('apiRootToken'); // Pega o token salvo no localStorage

        // Requisição para buscar embalagens distintas
        const response = await fetch(apiRootLink + '/buscar-embalagens-distintas', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar as embalagens');
        }

        const embalagens = await response.json();

        const navTabs = document.querySelector('.nav-tabs'); // Seleciona a lista de embalagens
        navTabs.innerHTML = ''; // Limpa o conteúdo atual

        // Carregar os preços de acordo com a tabela de preço do cliente
        const precos = await obterTabelaDePrecoCliente();
        const tabelaDePrecoId = precos.length > 0 ? precos[0].tabela_id : null;

        if (!tabelaDePrecoId) {
            console.error('Tabela de preço não encontrada');
            return;
        }

        // Loop para cada embalagem
        for (let index = 0; index < embalagens.length; index++) {
            const embalagem = embalagens[index];

            // Verifica se há produtos para essa embalagem
            const produtos = await buscarProdutosPorEmbalagem(embalagem.produto_embalagem);

            if (produtos.length > 0) { // Adiciona a aba somente se houver produtos
                const tabItem = document.createElement('li');
                tabItem.classList.add('nav-item');

                const navLink = document.createElement('a');
                navLink.classList.add('nav-link');
                if (index === 0) {
                    navLink.classList.add('active'); // Adiciona 'active' separadamente
                    navLink.classList.add('show');   // Adiciona 'show' separadamente
                }
                navLink.setAttribute('data-bs-toggle', 'tab');
                navLink.setAttribute('data-bs-target', `#menu-embalagem${index + 1}`);
                navLink.innerHTML = `<h4>${embalagem.produto_embalagem}</h4>`;

                tabItem.appendChild(navLink);
                navTabs.appendChild(tabItem);

                // Cria a área onde os produtos dessa embalagem serão listados
                const tabContent = document.querySelector('.tab-content');
                const tabPane = document.createElement('div');
                tabPane.classList.add('tab-pane', 'fade');
                if (index === 0) {
                    tabPane.classList.add('active'); // Adiciona 'active' separadamente
                    tabPane.classList.add('show');   // Adiciona 'show' separadamente
                }
                tabPane.id = `menu-embalagem${index + 1}`;

                tabPane.innerHTML = `
                    <div class="tab-header text-center">
                      <p>Menu</p>
                      <h3>${embalagem.produto_embalagem}</h3>
                    </div>
                    <div class="row gy-5" id="produtos-embalagem-${index + 1}">
                      <!-- Produtos serão carregados aqui -->
                    </div>
                `;

                tabContent.appendChild(tabPane);

                // Carrega os produtos ao clicar na aba, passando tabelaDePrecoId
                navLink.addEventListener('click', () => carregarProdutosPorEmbalagem(embalagem.produto_embalagem, index + 1, precos, tabelaDePrecoId));
            }
        }

        // Carregar os produtos para a primeira embalagem por padrão
        if (embalagens.length > 0) {
            carregarProdutosPorEmbalagem(embalagens[0].produto_embalagem, 1, precos, tabelaDePrecoId);
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

async function carregarProdutosPorEmbalagem(embalagem, tabIndex, precos, tabelaDePrecoId) {
    try {
        const token = getFromLocalStorage('apiRootToken');
        const categoriaId = getCategoriaIdFromURL(); // Obtém o ID da categoria a partir da URL

        // Requisição para buscar produtos por categoria e embalagem
        const response = await fetch(apiRootLink + `/buscar-produtos-categoria?categoria_id=${categoriaId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar os produtos');
        }

        const produtos = await response.json();
        const produtosContainer = document.querySelector(`#produtos-embalagem-${tabIndex}`);

        if (produtosContainer) {
            produtosContainer.innerHTML = ''; // Limpa os produtos anteriores

            // Para cada produto, buscar a imagem correspondente e o preço correto e criar o item
            for (const produto of produtos) {
                if (produto.produto_embalagem === embalagem) {
                    const imagemProduto = await buscarImagemProduto(produto.produto_id);

                    // Procura o preço do produto na lista de preços pela tabela de preço do cliente
                    const precoProduto = precos.find(preco => preco.tabela_produto_id === produto.produto_id);

                    const produtoDiv = document.createElement('div');
                    produtoDiv.classList.add('col-lg-4', 'menu-item');

                    produtoDiv.innerHTML = `
                        <div class="produto-click" style="cursor: pointer;">
                          <img src="${imagemProduto}" class="menu-img img-fluid" alt="${produto.produto_desc}">
                          <h4>${produto.produto_desc}</h4>
                          <p class="ingredients">
                            ${produto.produto_unidade_venda}
                          </p>
                          <p class="price">
                            R$${precoProduto ? precoProduto.tabela_vlr_unit.toFixed(2) : '0.00'}
                          </p>
                        </div>
                    `;

                    // Adiciona o event listener para clicar no produto e abrir a modal
                    produtoDiv.querySelector('.produto-click').addEventListener('click', () => {
                        handleProdutoClick(produto.produto_id, precoProduto ? precoProduto.tabela_vlr_unit : 0, tabelaDePrecoId);
                    });

                    produtosContainer.appendChild(produtoDiv);
                }
            }
        } else {
            console.error('Elemento de produtos não encontrado para a aba:', tabIndex);
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para buscar a imagem de um produto
async function buscarImagemProduto(produto_id) {
    try {
        const token = getFromLocalStorage('apiRootToken');

        const response = await fetch(apiRootLink + `/imagens/?produto_id=${produto_id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar a imagem do produto');
        }

        const imagens = await response.json();

        // Retorna o caminho da primeira imagem encontrada
        if (imagens.length > 0) {
            return imagens[0].caminho_img;
        } else {
            return '../static/assets/img/produtos/default-image.png'; // Caminho da imagem padrão, caso não encontre
        }

    } catch (error) {
        console.error('Erro:', error);
        return 'default-image.png';
    }
}

// Chama a função ao carregar a página
window.onload = carregarEmbalagens;

// Função para filtrar produtos com base na busca
function filtrarProdutos() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase(); // Obtém o valor digitado e converte para minúsculo
    const produtos = document.querySelectorAll('.menu-item'); // Seleciona todos os itens de produto listados

    produtos.forEach(produto => {
        const descricao = produto.querySelector('h4').textContent.toLowerCase(); // Obtém a descrição do produto

        if (descricao.includes(searchQuery)) {
            // Se a descrição do produto contiver o texto digitado, mostra o produto
            produto.style.display = 'block';
        } else {
            // Caso contrário, esconde o produto
            produto.style.display = 'none';
        }
    });
}

// Captura o evento de pressionar a tecla "Enter" na barra de pesquisa
document.getElementById('search-bar').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita o comportamento padrão do "Enter" (submeter o formulário)
        filtrarProdutos(); // Chama a função de filtro
    }
});


//---------------------------
async function verificarPedidoAberto(clienteId) {
    const token = getFromLocalStorage('apiRootToken');
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

async function abrirNovoPedido(clienteId) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink + `/add-pedidos/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({
                pedido_id_app: 0,
                pedido_cliente_id: clienteId,
                data_programada: "0",
                tipo_de_venda: 0,
                forma_de_pagamento: 0,
                vendedor_id: 0,
                pedido_id_gestao: 0,
                pedido_status: "aberto"
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao abrir novo pedido');
        }

        const data = await response.json();
        return data.id_pedido_app_criado; // Retorna o ID do pedido criado
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
}

async function adicionarItemAoPedido(pedidoId, produtoId, quantidade, vlrUnitario, tabelaDePrecoId) {
    const token = getFromLocalStorage('apiRootToken');
    try {
        const response = await fetch(apiRootLink + `/add-itens-de-pedidos/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'token': token
            },
            body: JSON.stringify({
                item_id: 0,
                pedido_id_app: pedidoId,
                produto_id: produtoId,
                unidade_venda: "0",
                quantidade: quantidade,
                vlr_unit_item: vlrUnitario,
                vlr_total_item: quantidade * vlrUnitario,
                tabela_de_preco_id: tabelaDePrecoId,
                pedido_id_gestao: 0
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao adicionar item ao pedido');
        }
        // Exibe a mensagem de confirmação com SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Produto adicionado ao carrinho!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        obterTotalItensPedido(pedidoId);
        atualizarCarrinho();
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
}

async function handleProdutoClick(produtoId, vlrUnitario, tabelaDePrecoId) {
    const clienteId = getFromLocalStorage('apiRootIDCliente');
    let pedidoId = await verificarPedidoAberto(clienteId);
    //salva pedido no local storage
    saveToLocalStorage('apiRootIDPedido', pedidoId);


    // Se não houver um pedido aberto, cria um novo pedido
    if (!pedidoId) {
        pedidoId = await abrirNovoPedido(clienteId);
    }

    if (!pedidoId) {
        console.error('Erro ao criar ou recuperar pedido');
        return;
    }

    // Abre a modal para escolha de quantidade
    abrirModalEscolhaQuantidade(produtoId, vlrUnitario, pedidoId, tabelaDePrecoId);
}

// Função para abrir modal e permitir ao usuário escolher a quantidade
function abrirModalEscolhaQuantidade(produtoId, vlrUnitario, pedidoId, tabelaDePrecoId) {
    // Exibe a modal de quantidade com um input e botões de incremento
    const modalHtml = `
        <div class="modal" id="modalQuantidade">
            <div class="modal-content">
                <button class="close" onclick="fecharModal()">&times;</button>
                <h2>Escolha a Quantidade</h2>
                <div class="button-group">
                    <button id="btnDiminuir">-</button>
                    <input type="number" id="inputQuantidade" value="1" min="1" />
                    <button id="btnAumentar">+</button>
                </div>
                <button id="btnAdicionar" class="btn">Adicionar</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const inputQuantidade = document.getElementById('inputQuantidade');
    document.getElementById('btnDiminuir').addEventListener('click', () => {
        if (inputQuantidade.value > 1) {
            inputQuantidade.value--;
        }
    });

    document.getElementById('btnAumentar').addEventListener('click', () => {
        inputQuantidade.value++;
    });

    document.getElementById('btnAdicionar').addEventListener('click', async () => {
        const quantidade = parseInt(inputQuantidade.value);
        await adicionarItemAoPedido(pedidoId, produtoId, quantidade, vlrUnitario, tabelaDePrecoId);
        fecharModal(); // Fecha a modal após adicionar o item
    });
}

// Função para fechar a modal
function fecharModal() {
    const modal = document.getElementById('modalQuantidade');
    if (modal) {
        modal.remove();
    }
}

