
    // Função para extrair os parâmetros da URL
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const preference_id = params.get('preference_id');
        const status = params.get('status');
        const payment_type = params.get('payment_type');
        const IDpedido = params.get('IDpedido');  // Extrai o ID do pedido da URL
        return { preference_id, status, IDpedido, payment_type };
    }

    // Função para atualizar o campo 'pedido_status' para 'liberado'
    async function atualizarStatusPedido(pedidoId) {
        const token = getFromLocalStorage('apiRootToken');
        try {
            // Executa a requisição PUT para atualizar o campo 'pedido_status' para 'liberado'
            const response = await fetch(`${apiRootLink}/atualizar-pedido-campo/?pedido_id=${pedidoId}&campo=pedido_status&novo_valor=liberado`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'token': token  // Passa o token corretamente no cabeçalho
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar o status do pedido');
            }

            const data = await response.json();
            console.log('Status do pedido atualizado para liberado:', data);

            // Exibe a mensagem de sucesso usando SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Pedido liberado com sucesso!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (error) {
            console.error('Erro ao atualizar o status do pedido:', error);
            // Exibe a mensagem de erro usando SweetAlert2
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: 'Erro ao atualizar o status do pedido. Tente novamente.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    }

    // Função para verificar e enviar os dados para o backend
    async function verificarEEnviarDados() {
        try {
            const { preference_id, status, IDpedido } = getQueryParams();

            // Se ambas variáveis existirem
            if (preference_id && status) {
                const token = getFromLocalStorage('apiRootToken');  // Obtém o token como normalmente fazemos
                
                // Faz a requisição ao backend
                const response = await fetch(`${apiRootLink}/retorno-status-pg?topic=${status}&id=${preference_id}`, {
                    method: 'POST', 
                    headers: {
                        'Accept': 'application/json',
                        'token': token  
                    },
                    body: ''  // Corpo vazio como no curl (-d '')
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Erro ao processar a requisição.');
                }

                const data = await response.json();

                // Exibe a mensagem de sucesso usando SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Pagamento efetuado com sucesso!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });

                // Chama a função para atualizar o status do pedido
                if (IDpedido) {
                    await atualizarStatusPedido(IDpedido);  // Atualiza o status do pedido para 'liberado'
                } else {
                    console.log('ID do pedido ausente na URL.');
                }

            } else {
                console.log('Parâmetros "preference_id" ou "status" ausentes na URL.');
            }
        } catch (error) {
            // Captura e exibe qualquer erro
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: error.message || 'Ocorreu um erro ao se conectar ao servidor.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            console.error('Erro ao verificar pagamento:', error);
        }
    }

    // Executa após o DOM estar completamente carregado
    document.addEventListener('DOMContentLoaded', function() {
        verificarEEnviarDados(); // Chama a função assim que o DOM estiver pronto
    });

