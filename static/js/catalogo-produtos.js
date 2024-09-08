// Função para recuperar dados do localStorage
function getFromLocalStorage(key) {
    return localStorage.getItem(key);
}

// Função para listar produtos e suas imagens
async function listarProdutos() {
    try {
        const token = getFromLocalStorage('apiRootToken'); // Pega o token salvo no localStorage

        const response = await fetch(apiRootLink + '/buscar-produtos', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'token': token
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar os produtos');
        }

        const produtos = await response.json();
        const tbody = document.getElementById('produtos-tbody');
        tbody.innerHTML = ''; // Limpa o conteúdo anterior

        for (const produto of produtos) {
            const tr = document.createElement('tr');

            // Buscando a imagem do produto
            const imagemProduto = await buscarImagemProduto(produto.produto_id);

            tr.innerHTML = `
                <td>${produto.produto_id}</td>
                <td>${produto.produto_desc}</td>
                <td>${produto.produto_desc_categoria || 'Sem Categoria'}</td>
                <td>${produto.produto_embalagem || 'Sem Embalagem'}</td>
                <td>
                    <a href="${imagemProduto}" class="glightbox">
                      <img src="${imagemProduto}" class="img-thumbnail" width="50" height="50" alt="Imagem do produto">
                    </a>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-info mx-1" onclick="abrirModalImagem(${produto.produto_id})">
                            <i class="fa fa-plus"></i> Adicionar Imagem
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
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

        // Retorna o caminho da primeira imagem encontrada ou uma imagem padrão
        if (imagens.length > 0) {
            return imagens[0].caminho_img;
        } else {
            return './static/assets/img/produtos/default-image.png'; // Caminho da imagem padrão, caso não encontre
        }

    } catch (error) {
        console.error('Erro:', error);
        return 'default-image.png';
    }
}

// Função para abrir o modal de adicionar imagem
function abrirModalImagem(produtoId) {
    document.getElementById('produto-id').value = produtoId;
    $('#uploadImagemModal').modal('show');
}

// Chama a função para listar os produtos ao carregar a página
window.onload = listarProdutos;


// Função para abrir o modal de adicionar imagem
function abrirModalImagem(produtoId) {
    document.getElementById('produto-id').value = produtoId;
    $('#uploadImagemModal').modal('show');
}

// Função para realizar o upload da imagem do produto
async function uploadImagemProduto() {
    const produtoId = document.getElementById('produto-id').value;
    const imagemUpload = document.getElementById('imagem-upload').files[0];

    if (!imagemUpload) {
        alert('Por favor, selecione uma imagem para upload.');
        return;
    }

    const formData = new FormData();
    formData.append('imagem', imagemUpload);

    try {
        const token = getFromLocalStorage('apiRootToken'); // Recupera o token do localStorage

        const response = await fetch(`${apiRootLink}/upload-imagem/?produto_id=${produtoId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'token': token
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao fazer o upload da imagem.');
        }

        const data = await response.json();
//        alert(data.message); // Exibe uma mensagem de sucesso
        Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: data.message,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

        // Fechar o modal após o upload
        $('#uploadImagemModal').modal('hide');

        // Atualizar a lista de produtos para mostrar a nova imagem
        listarProdutos();

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer o upload da imagem.');
    }
}


