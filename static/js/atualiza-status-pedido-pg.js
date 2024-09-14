
    // Função para extrair os parâmetros da URL
    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const preference_id = params.get('preference_id');
        const status = params.get('status');
        const payment_type = params.get('payment_type');  // Extrai o tipo de pagamento da URL
        const IDpedido = params.get('IDpedido');  // Extrai o ID do pedido da URL
        return { preference_id, status, payment_type, IDpedido };
    }

    // Função para atualizar um campo de um pedido
    async function atualizarCampoPedido(pedidoId, campo, novoValor) {
        const token = getFromLocalStorage('apiRootToken');
        try {
            // Executa a requisição PUT para atualizar o campo do pedido
            const response = await fetch(`${apiRootLink}/atualizar-pedido-campo/?pedido_id=${pedidoId}&campo=${campo}&novo_valor=${novoValor}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'token': token  // Passa o token corretamente no cabeçalho
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar o campo ${campo}`);
            }

            const data = await response.json();
            console.log(`Campo ${campo} atualizado para ${novoValor}:`, data);

        } catch (error) {
            console.error(`Erro ao atualizar o campo ${campo}:`, error);
            // Exibe a mensagem de erro usando SweetAlert2
            Swal.fire({
                icon: 'error',
                title: 'Erro!',
                text: `Erro ao atualizar o campo ${campo}. Tente novamente.`,
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
            const { preference_id, status, payment_type, IDpedido } = getQueryParams();

            // Verifica se todos os parâmetros necessários estão presentes
            if (preference_id && status && IDpedido && payment_type) {
                const token = getFromLocalStorage('apiRootToken');  // Obtém o token como normalmente fazemos

                // Faz a requisição ao backend para verificar o pagamento
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

                // Atualiza o status do pedido para 'liberado'
                await atualizarCampoPedido(IDpedido, 'pedido_status', 'liberado');

                // Atualiza a forma de pagamento com base no tipo de pagamento
                if (payment_type === 'credit_card') {
                    await atualizarCampoPedido(IDpedido, 'pedido_forma_pagamento', 'online-cartao-credito');
                } else if (payment_type === 'bank_transfer') {
                    await atualizarCampoPedido(IDpedido, 'pedido_forma_pagamento', 'online-pix');
                } else {
                    console.log('Tipo de pagamento desconhecido:', payment_type);
                }

            } else {
                console.log('Parâmetros ausentes na URL. Nenhuma ação será executada.');
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

