from pydantic import BaseModel
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, session
import json
from starlette.responses import JSONResponse
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_
from config import engine
from typing import Optional, List

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Modelo Pydantic para Forma de Pagamento
class FormaPagamento(BaseModel):
    cliente_id: Optional[int]
    cliente_forma_pagamento_id: int
    cliente_forma_pagamento_desc: str
    data_cadastro: Optional[datetime]
    cliente_status_financeiro: Optional[str]

Base = declarative_base()
# Modelo ORM (SQLAlchemy) para a tabela de formas de pagamento
class FormaPagamentoDB(Base):
    __tablename__ = 'c_cliente_financeiro'

    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer)
    cliente_forma_pagamento_id = Column(Integer)
    cliente_forma_pagamento_desc = Column(String)
    data_cadastro = Column(String)  # Armazenar como string no formato 'YYYY-MM-DD'
    cliente_status_financeiro = Column(String)

    def as_dict(self):
        return {
            "id": self.id,
            "cliente_id": self.cliente_id,
            "cliente_forma_pagamento_id": self.cliente_forma_pagamento_id,
            "cliente_forma_pagamento_desc": self.cliente_forma_pagamento_desc,
            "data_cadastro": self.data_cadastro,
            "cliente_status_financeiro": self.cliente_status_financeiro
        }

def listar_formas_pagamento_por_cliente(cliente_id: int, db: Session):
    """
    Função para listar as formas de pagamento de um cliente específico.
    """
    try:
        formas_pagamento = db.query(FormaPagamentoDB).filter(FormaPagamentoDB.cliente_id == cliente_id).all()
        return [forma_pagamento.as_dict() for forma_pagamento in formas_pagamento]
    except SQLAlchemyError as e:
        return {"error": str(e)}



# Função para inserir múltiplas formas de pagamento no banco de dados
def inserir_formas_pagamento_list(formas_pagamento: List[FormaPagamento], db: Session):
    """
    Função para inserir múltiplas formas de pagamento no banco de dados.
    Esta função limpa a tabela antes de inserir novos dados.
    """
    try:
        # Limpar a tabela de formas de pagamento antes de inserir novos registros
        limpar_tabela_formas_pagamento(db)

        # Inserir novas formas de pagamento
        for forma_pagamento in formas_pagamento:
            nova_forma_pagamento = FormaPagamentoDB(
                cliente_id=forma_pagamento.cliente_id,
                cliente_forma_pagamento_id=forma_pagamento.cliente_forma_pagamento_id,
                cliente_forma_pagamento_desc=forma_pagamento.cliente_forma_pagamento_desc,
                data_cadastro=datetime.now().strftime('%Y-%m-%d'),  # Data atual
                cliente_status_financeiro=forma_pagamento.cliente_status_financeiro
            )
            db.add(nova_forma_pagamento)
        db.commit()
        return {"message": "Formas de pagamento adicionadas com sucesso"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}

# Função para limpar a tabela de formas de pagamento
def limpar_tabela_formas_pagamento(db: Session):
    """
    Função para deletar todas as formas de pagamento da tabela.
    Esta função é chamada automaticamente antes de uma nova inserção.
    """
    try:
        db.execute(text("DELETE FROM c_formas_pagamento"))
        db.commit()
        return {"message": "Todas as formas de pagamento foram deletadas com sucesso"}
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": str(e)}