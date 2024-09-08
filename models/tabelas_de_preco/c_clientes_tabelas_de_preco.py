from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from config import engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Definição da base
Base = declarative_base()

# Modelo Pydantic para c_clientes_tabelas_de_preco
class ClienteTabelaPreco(BaseModel):
    id: Optional[int]
    cliente_id: int
    cliente_loja: Optional[str]
    cliente_tabela_preco_id: Optional[int]

# Modelo ORM para c_clientes_tabelas_de_preco
class ClienteTabelaPrecoDB(Base):
    __tablename__ = "c_clientes_tabelas_preco"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer)
    cliente_loja = Column(String(255))
    cliente_tabela_preco_id = Column(Integer)

    def as_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "cliente_loja": self.cliente_loja,
            "cliente_tabela_preco_id": self.cliente_tabela_preco_id
        }

# Função para listar as entradas da tabela c_clientes_tabelas_de_preco
def listar_clientes_tabelas_preco(cliente_id):
    db = SessionLocal()
    try:
        clientes = db.query(ClienteTabelaPrecoDB).filter(ClienteTabelaPrecoDB.cliente_id == cliente_id).all()
        return [cliente.as_dict() for cliente in clientes]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))

# Função para inserir vários registros na tabela c_clientes_tabelas_de_preco
def inserir_clientes_tabelas_preco(clientes: List[ClienteTabelaPreco]):
    db = SessionLocal()
    try:
        # Percorre todos os registros e adiciona à sessão do banco de dados
        for cliente in clientes:
            novo_cliente = ClienteTabelaPrecoDB(
                cliente_id=cliente.cliente_id,
                cliente_loja=cliente.cliente_loja,
                cliente_tabela_preco_id=cliente.cliente_tabela_preco_id
            )
            db.add(novo_cliente)
        db.commit()
        return {"message": "Clientes e tabelas de preços inseridos com sucesso"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}

# Função para deletar todos os registros da tabela c_clientes_tabelas_de_preco
def deletar_todos_clientes_tabelas_preco():
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM c_clientes_tabelas_de_preco"))
        db.commit()
        return {"message": "Todos os registros de clientes e tabelas de preços foram deletados com sucesso"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}
