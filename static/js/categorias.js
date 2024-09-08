    // Função para recuperar dados do localStorage
    function getFromLocalStorage(key) {
        return localStorage.getItem(key);
    }
  async function carregarImagensCategorias() {
    try {
      const token = getFromLocalStorage('apiRootToken'); // Pega o token salvo no localStorage

      const response = await fetch(apiRootLink + '/buscar-imagens-categoria', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'token': token
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar as imagens');
      }

      const imagens = await response.json();

      const swiperWrapper = document.querySelector('.swiper-wrapper');

      // Limpa o conteúdo atual
      swiperWrapper.innerHTML = '';

      // Itera sobre as imagens e cria as divs com as imagens
      imagens.forEach(imagem => {
        const imagemDiv = document.createElement('div');
        imagemDiv.classList.add('swiper-slide');
        imagemDiv.innerHTML = `
          <a class="glightbox" data-gallery="images-gallery" href="/produtos-portifolio?categoria=${imagem.categoria_id}">
            <img src="${imagem.caminho_img}" class="img-fluid" alt="Categoria ${imagem.categoria_id}">
          </a>`;
        swiperWrapper.appendChild(imagemDiv);
      });

      // Ajusta o loop baseado na quantidade de slides
      if (imagens.length < 3) { // Define um número mínimo de slides para ativar o loop
        const swiperConfig = document.querySelector('.swiper-config');
        let config = JSON.parse(swiperConfig.textContent);
        config.loop = false; // Desativa o loop
        swiperConfig.textContent = JSON.stringify(config); // Atualiza o JSON de configuração
      }

      // Inicializa o Swiper
      const swiper = new Swiper('.swiper', JSON.parse(document.querySelector('.swiper-config').textContent));

    } catch (error) {
      console.error('Erro:', error);
    }
  }

  window.onload = carregarImagensCategorias;
