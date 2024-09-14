import mercadopago
from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, DateTime, func, select
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import engine
from models.pedidos.m_pedidos import atualizar_pedido_campo

# Configuração da sessão do SQLAlchemy usando o engine do config
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

# Definindo o SDK globalmente
#SDK_MERCADOPAGO = mercadopago.SDK("TEST-1521274793653166-101000-cfa82c94fa63a733fb1908f696942204-523038360")
SDK_MERCADOPAGO = mercadopago.SDK("APP_USR-5824881716758400-091207-2b55f408b9f9c5374023cb17c036dd95-523038360")
#SDK_MERCADOPAGO = mercadopago.SDK("APP_USR-4449777012413056-091210-59167f026ca446831924071fdf37a02f-1988981540")

# Definição da tabela
pagamentos_mp = Table('c_pedidos_pagamentos_mp', metadata,
                      Column('id', Integer, primary_key=True, autoincrement=True),
                      Column('id_pagamento', String(255), nullable=False),
                      Column('data_cad', DateTime, default=func.now()),
                      Column('id_pedido_app', Integer, nullable=False),
                      Column('status_retorno', String(255), nullable=False),
                      Column('data_status', DateTime),
                      Column('link_preference_id', String(255), nullable=True),
                      Column('tipo', String(255), nullable=True)
                      )


from sqlalchemy import select

from sqlalchemy import select

# Função para gerar link de pagamento e salvar no banco de dados
def gerar_link_pagamento(pedido: int, valor: float):
    db = SessionLocal()  # Inicia uma nova sessão

    # Verifica se já existe um link gerado para o pedido
    query = select(pagamentos_mp.c.link_preference_id).where(
        (pagamentos_mp.c.id_pedido_app == pedido) &
        (pagamentos_mp.c.tipo == 'link_mp_eiva')
    )
    result = db.execute(query).fetchone()

    # Se já existe um link, retorna o link existente
    if result and result[0]:  # Aqui acessamos o primeiro item da tupla
        db.close()  # Fecha a sessão
        return {
            "link_pagamento": result[0],  # O link está na primeira posição da tupla
            "pedido_id": pedido
        }

    # Se não existe um link, gera um novo
    # Dados do pagamento
    payment_data = {
        "items": [
            {
                "id": "1",
                "title": f"Meu Pedido - Nº{pedido}",
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": valor,
            }
        ],
        "back_urls": {
            "success": f"http://portalcompradorv1.eivasistemas.com.br/pedidos?IDpedido={pedido}",
            "failure": "http://portalcompradorv1.eivasistemas.com.br/sistema",
            "pending": f"http://portalcompradorv1.eivasistemas.com.br/pedidos?IDpedido={pedido}",
        },
        "auto_return": "all",
        "payment_methods": {
            "excluded_payment_types": [
                {
                    "id": "ticket",
                },
            ],
        },
        "notification_url": f"http://portalcompradorv1.eivasistemas.com.br/notifications?IDpedido={pedido}",
    }

    # Criação da preferência de pagamento utilizando a variável global SDK
    result = SDK_MERCADOPAGO.preference().create(payment_data)
    payment = result["response"]

    # Dados do pagamento retornado
    link_iniciar_pagamento = payment["init_point"]
    id_unico_pagamento = payment["id"]

    # Inserção dos dados no banco de dados
    novo_pagamento = pagamentos_mp.insert().values(
        id_pagamento=id_unico_pagamento,
        id_pedido_app=pedido,
        status_retorno='pending',  # Status inicial
        tipo='link_mp_eiva',
        link_preference_id=link_iniciar_pagamento,
        data_status=datetime.now()
    )
    db.execute(novo_pagamento)
    db.commit()
    db.close()  # Fecha a sessão

    # Retorno dos dados como JSON
    return {
        "link_pagamento": link_iniciar_pagamento,
        "id_unico_pagamento": id_unico_pagamento,
        "pedido_id": pedido
    }

# # Função para gerar link de pagamento e salvar no banco de dados
# def gerar_link_pagamento(pedido: int, valor: float):
#     db = SessionLocal()  # Inicia uma nova sessão
#
#     # Dados do pagamento
#     payment_data = {
#         "items": [
#             {
#                 "id": "1",
#                 "title": f"Meu Pedido - Nº{pedido}",
#                 "quantity": 1,
#                 "currency_id": "BRL",
#                 "unit_price": valor,
#             }
#         ],
#         "back_urls": {
#             "success": f"http://portalcompradorv1.eivasistemas.com.br/pedidos?IDpedido={pedido}",
#             "failure": "http://portalcompradorv1.eivasistemas.com.br/sistema",
#             "pending": f"http://portalcompradorv1.eivasistemas.com.br/pedidos?IDpedido={pedido}",
#         },
#         "auto_return": "all",
#         "payment_methods": {
#             "excluded_payment_types": [
#                 {
#                     "id": "ticket",
#                 },
#             ],
#         },
#         "notification_url": f"http://portalcompradorv1.eivasistemas.com.br/notifications?IDpedido={pedido}",
#     }
#
#     # Criação da preferência de pagamento utilizando a variável global SDK
#     result = SDK_MERCADOPAGO.preference().create(payment_data)
#     payment = result["response"]
#
#     # Dados do pagamento retornado
#     link_iniciar_pagamento = payment["init_point"]
#     id_unico_pagamento = payment["id"]
#
#     # Inserção dos dados no banco de dados
#     novo_pagamento = pagamentos_mp.insert().values(
#         id_pagamento=id_unico_pagamento,
#         id_pedido_app=pedido,
#         status_retorno='pending',  # Status inicial
#         tipo='link_mp_eiva',
#         link_preference_id=link_iniciar_pagamento,
#         data_status=datetime.now()
#     )
#     db.execute(novo_pagamento)
#     db.commit()
#     db.close()  # Fecha a sessão
#
#     # Retorno dos dados como JSON
#     return {
#         "link_pagamento": link_iniciar_pagamento,
#         "id_unico_pagamento": id_unico_pagamento,
#         "pedido_id": pedido
#     }
#

def atualizar_status_por_id(id_pagamento: str, topic: str):
    db = SessionLocal()  # Inicia uma nova sessão

    # Busca o pagamento utilizando query
    pagamento = db.query(pagamentos_mp).filter(pagamentos_mp.c.id_pagamento == id_pagamento).first()

    if pagamento:
        # Atualizar o status no banco
        db.query(pagamentos_mp).filter(pagamentos_mp.c.id_pagamento == id_pagamento).update({
            "status_retorno": topic,
            "data_status": datetime.now()
        })
        db.commit()  # Salva as mudanças no banco
        db.close()  # Fecha a sessão

        return {"status": 200, "message": "Status atualizado com sucesso."}
    else:
        db.close()  # Fecha a sessão
        return {"status": 404, "message": "Pagamento não encontrado."}


# Função para buscar um pagamento pelo ID do pedido
def buscar_pagamento_por_pedido(pedido: int):
    db = SessionLocal()  # Inicia uma nova sessão
    query = db.execute(db.select([pagamentos_mp]).where(pagamentos_mp.c.id_pedido_app == pedido)).fetchone()

    if query:
        result = {
            "id_pagamento": query["id_pagamento"],
            "pedido_id": query["id_pedido_app"],
            "status_retorno": query["status_retorno"],
            "data_status": query["data_status"]
        }
        db.close()
        return result
    db.close()
    return None


# Função para buscar um pagamento pelo ID do pagamento
def buscar_pagamento_por_id(id_pagamento: str):
    db = SessionLocal()  # Inicia uma nova sessão
    query = db.execute(db.select([pagamentos_mp]).where(pagamentos_mp.c.id_pagamento == id_pagamento)).fetchone()

    if query:
        result = {
            "id_pagamento": query["id_pagamento"],
            "pedido_id": query["id_pedido_app"],
            "status_retorno": query["status_retorno"],
            "data_status": query["data_status"]
        }
        db.close()
        return result
    db.close()
    return None


# Função para requisitar o status final do pagamento via API do Mercado Pago
def requisitar_status_final_pagamento(id_pagamento: str):
    db = SessionLocal()  # Inicia uma nova sessão

    # Verificar se o tipo é 'payment' antes de continuar
    pagamento = db.query(pagamentos_mp).filter(
        pagamentos_mp.c.id_pagamento == id_pagamento,
        pagamentos_mp.c.status_retorno == 'payment'  # Verifica se o status é 'payment'
    ).first()

    # Se o tipo não for 'payment', não faz nada e retorna
    if not pagamento:
        db.close()  # Fecha a sessão
        return {"status": 200, "message": "O tipo do pagamento não é 'payment'. Nenhuma atualização realizada."}

    # Fazer a requisição para a API do Mercado Pago utilizando a variável global SDK
    payment = SDK_MERCADOPAGO.payment().get(id_pagamento)

    # Verifica se a requisição foi bem-sucedida
    if payment["status"] == 200:
        payment_info = payment["response"]

        # Obter o status do pagamento (ex.: "approved", "pending", "rejected", etc.)
        status_pagamento = payment_info.get("status")

        # Se o status for "approved", atualizar no banco de dados
        if status_pagamento == "approved":
            db.query(pagamentos_mp).filter(pagamentos_mp.c.id_pagamento == id_pagamento).update({
                "status_retorno": "approved",
                "data_status": datetime.now()
            })
            db.commit()
            db.close()  # Fecha a sessão
            return {"status": 200, "message": "Pagamento aprovado e status atualizado."}
        else:
            # Se o pagamento não estiver aprovado, atualizar com o status atual
            db.query(pagamentos_mp).filter(pagamentos_mp.c.id_pagamento == id_pagamento).update({
                "status_retorno": status_pagamento,
                "data_status": datetime.now()
            })
            db.commit()
            db.close()  # Fecha a sessão

            return {"status": 200, "message": f"Pagamento com status: {status_pagamento}"}
    else:
        db.close()  # Fecha a sessão
        return {"status": payment["status"], "message": "Erro ao verificar o status do pagamento."}

# # Função para inserir dados de pagamento no banco de dados
# def inserir_pagamento(id_pagamento: str, status_retorno: str, pedido_id: int, type: str = None):
#     db = SessionLocal()  # Inicia uma nova sessão
#
#     novo_pagamento = pagamentos_mp.insert().values(
#         id_pagamento=id_pagamento,
#         id_pedido_app=pedido_id,  # Agora salva o valor de IDpedido
#         status_retorno=status_retorno,  # O valor do 'topic' será usado como status_retorno
#         data_status=datetime.now(),  # Data e hora atuais
#         tipo=type  # Insere None se 'type' não for fornecido
#     )
#     db.execute(novo_pagamento)
#     db.commit()
#     db.close()  # Fecha a sessão
# Função para inserir dados de pagamento no banco de dados
def inserir_pagamento(id_pagamento: str, status_retorno: str, pedido_id: int, type: str = None):
    db = SessionLocal()  # Inicia uma nova sessão
    atualizar_pedido_campo(db, pedido_id=pedido_id,campo= 'pedido_status',novo_valor='liberado')
    # Inserção dos dados no banco de dados
    novo_pagamento = pagamentos_mp.insert().values(
        id_pagamento=id_pagamento,
        id_pedido_app=pedido_id,  # Agora salva o valor de IDpedido
        status_retorno=status_retorno,  # O valor do 'topic' ou 'type' será usado como status_retorno
        data_status=datetime.now(),  # Data e hora atuais
        tipo=type  # Insere None se 'type' não for fornecido
    )
    db.execute(novo_pagamento)
    db.commit()

    # Após o insert, requisita o status final do pagamento
    print(requisitar_status_final_pagamento(id_pagamento))

    db.close()  # Fecha a sessão




#print(requisitar_status_final_pagamento('87744480456')) #deve ser enviado o payament_id
print(requisitar_status_final_pagamento('87550069195')) #deve ser enviado o payament_id
# print(requisitar_status_final_pagamento('1b985f1e98bd')) #deve ser enviado o payament_id
# print(requisitar_status_final_pagamento('f185')) #deve ser enviado o payament_id
#print(gerar_link_pagamento(3569, 15.5))
#523038360---435b-8c74-