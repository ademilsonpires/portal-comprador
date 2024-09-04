from typing import Optional

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from config import *

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class CategoriaImagemDB(Base):
    __tablename__ = "c_categorias_imagens"
    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria_id = Column(Integer)
    caminho_img = Column(String(255))

# Função para gerar um nome de arquivo único
def gerar_nome_arquivo_unico(filename: str) -> str:
    extensao = filename.split(".")[-1]
    nome_unico = f"{uuid.uuid4()}.{extensao}"
    return nome_unico

def salvar_imagem_categoria(categoria_id: int, imagem: UploadFile, db: Session):
    try:
        # Obter o diretório base do projeto
        diretorio_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        # Construir o caminho completo para salvar a imagem na pasta "categorias"
        caminho_pasta_imagens = os.path.join(diretorio_base, "static", "assets", "img", "categorias")
        nome_arquivo = gerar_nome_arquivo_unico(imagem.filename)
        caminho_arquivo = os.path.join(caminho_pasta_imagens, nome_arquivo)

        # Criar diretórios se não existirem
        os.makedirs(caminho_pasta_imagens, exist_ok=True)

        # Salvar a imagem no diretório especificado
        with open(caminho_arquivo, "wb") as f:
            f.write(imagem.file.read())

        # Registrar o caminho relativo da imagem no banco de dados
        caminho_relativo = f"static/assets/img/categorias/{nome_arquivo}"
        nova_imagem = CategoriaImagemDB(caminho_img=caminho_relativo, categoria_id=categoria_id)
        db.add(nova_imagem)
        db.commit()
        db.refresh(nova_imagem)

        return {"message": "Imagem salva com sucesso", "imagem_id": nova_imagem.id}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}


def buscar_imagens_categoria(categoria_id: Optional[int] = None):
    """
    Função para buscar imagens de categorias no banco de dados.

    Args:
        categoria_id (int, optional): ID da categoria para filtrar as imagens. Se None, retorna todas as imagens.

    Returns:
        List[dict]: Lista de dicionários contendo os dados das imagens.
    """
    db = SessionLocal()
    if categoria_id:
        imagens = db.query(CategoriaImagemDB).filter(CategoriaImagemDB.categoria_id == categoria_id).all()
    else:
        imagens = db.query(CategoriaImagemDB).all()

    return [{"id": imagem.id, "caminho_img": imagem.caminho_img, "categoria_id": imagem.categoria_id} for imagem in imagens]

def deletar_imagem_categoria(imagem_id: int, db: Session):
    try:
        imagem = db.query(CategoriaImagemDB).filter(CategoriaImagemDB.id == imagem_id).first()
        if imagem:
            # Deletar o arquivo do sistema
            if os.path.exists(imagem.caminho_img):
                os.remove(imagem.caminho_img)

            # Deletar o registro do banco de dados
            db.delete(imagem)
            db.commit()
            return {"message": "Imagem deletada com sucesso"}
        else:
            return {"error": "Imagem não encontrada"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}
