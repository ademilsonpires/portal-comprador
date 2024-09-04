from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from config import engine

# Inicializar a sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Definir a base
Base = declarative_base()

# Modelo Pydantic para c_clientes_tabelas_de_preco
class ClienteTabelaPreco(BaseModel):
    id: Optional[int]
    cliente_id: int
    tabela_preco_id: int
    data_validade: Optional[str]

# Modelo ORM para c_clientes_tabelas_de_preco
class ClienteTabelaPrecoDB(Base):
    __tablename__ = "c_clientes_tabelas_de_preco"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer)  # Removida a ForeignKey
    tabela_preco_id = Column(Integer)
    data_validade = Column(DateTime)

    def as_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "tabela_preco_id": self.tabela_preco_id,
            "data_validade": self.data_validade
        }

# Operações CRUD para c_clientes_tabelas_de_preco

def listar_tabela_preco_cliente(cliente_id: Optional[int] = None, tabela_preco_id: Optional[int] = None):
    """
    Função para listar entradas da tabela c_clientes_tabelas_de_preco com filtros opcionais.
    A busca é feita da seguinte maneira:
    - Se `cliente_id` for passado, filtra por `cliente_id`.
    - Se `cliente_id` não for passado e `tabela_preco_id` for passado, filtra por `tabela_preco_id`.
    - Se nenhum dos dois for passado, retorna todos os registros.
    """
    db = SessionLocal()
    try:
        query = db.query(ClienteTabelaPrecoDB)

        # Verifica se o `cliente_id` foi passado
        if cliente_id is not None:
            query = query.filter(ClienteTabelaPrecoDB.cliente_id == cliente_id)

        # Caso `cliente_id` não seja passado, verifica se `tabela_preco_id` foi passado
        elif tabela_preco_id is not None:
            query = query.filter(ClienteTabelaPrecoDB.tabela_preco_id == tabela_preco_id)

        # Se nenhum dos parâmetros for passado, retorna todos os registros
        resultados = query.all()

        return [resultado.as_dict() for resultado in resultados]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


def inserir_tabela_preco_cliente(tabela_preco: ClienteTabelaPreco):
    """
    Função para inserir uma nova entrada na tabela c_clientes_tabelas_de_preco.
    """
    db = SessionLocal()
    try:
        nova_tabela = ClienteTabelaPrecoDB(
            cliente_id=tabela_preco.cliente_id,
            tabela_preco_id=tabela_preco.tabela_preco_id,
            data_validade=tabela_preco.data_validade
        )
        db.add(nova_tabela)
        db.commit()
        db.refresh(nova_tabela)
        return {"message": "Tabela de preço inserida com sucesso"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def deletar_tabela_preco_cliente(id: int):
    """
    Função para deletar uma entrada da tabela c_clientes_tabelas_de_preco.
    """
    db = SessionLocal()
    try:
        tabela_existente = db.query(ClienteTabelaPrecoDB).filter(ClienteTabelaPrecoDB.id == id).first()
        if tabela_existente:
            db.delete(tabela_existente)
            db.commit()
            return {"message": "Tabela de preço deletada com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Tabela de preço não encontrada")
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
