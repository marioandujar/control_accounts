import os
import xlrd
import datetime
from bson.objectid import ObjectId
import json
from flask import Flask, render_template
from flask_bootstrap import Bootstrap
from flask.ext.pymongo import PyMongo
from bson.son import SON

# create our little application :)
app = Flask(__name__)
Bootstrap(app)
app.debug = True

mongo = None
SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
with open(os.path.join(SITE_ROOT, "mongo.json")) as data_file:
    mongo_conf = json.load(data_file)

app.config.update(dict(
    MONGO_URI=mongo_conf["env"]["dev"]["uri"]
))


def connect_db():
    """Connects to the specific database."""
    mongo = PyMongo(app)
    return mongo


@app.route('/')
def home_page():
    return render_template('index.html')


@app.route('/transactions')
def transactions():
    transactions = list(mongo.db.transactions.find().sort('date'))
    accounts = sorted(mongo.db.transactions.distinct('account_name'), reverse=True)
    balance = {}
    for account in accounts:
        balance[account] = {'expenses': 0, 'income': 0}
        trans_account = list(filter(lambda t: t['account_name'] == account, transactions))
        balance[account]['expenses'] = sum([t3['amount'] for t3 in filter(lambda t2: t2['amount'] < 0, trans_account)])
        balance[account]['incomes'] = sum([t3['amount'] for t3 in filter(lambda t2: t2['amount'] > 0, trans_account)])
    return render_template('transactions.html',
                           transactions=transactions, accounts=accounts, balance=balance)

@app.route('/transactions/<account_name>')
def transactions_account_name(account_name):
    transactions = list(mongo.db.transactions.find({"account_name": account_name}).sort('date'))
    accounts = sorted(mongo.db.transactions.distinct('account_name'), reverse=True)
    balance = {}
    balance[account_name] = {'expenses': 0, 'income': 0}
    trans_account = list(filter(lambda t: t['account_name'] == account_name, transactions))
    balance[account_name]['expenses'] = sum([t3['amount'] for t3 in filter(lambda t2: t2['amount'] < 0, trans_account)])
    balance[account_name]['incomes'] = sum([t3['amount'] for t3 in filter(lambda t2: t2['amount'] > 0, trans_account)])
    return render_template('transactions.html',
                           transactions=transactions, accounts=accounts, balance=balance)

@app.route('/transaction/<transaction_id>')
def transaction_edit(transaction_id):
    transaction = mongo.db.transactions.find_one_or_404({"_id": ObjectId(transaction_id)})
    return render_template('transaction_edit.html',
                           transaction=transaction)


@app.route('/report')
def report():
    command_expensive = [
        {"$match": {"amount": {"$lte": 0}}},
        {"$project": {
            "month": {"$month": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$group": {
            # "_id": {"month": "$month", "tag": "$tag", "account_name": "$account_name"},
            "_id": {"month": "$month", "account_name": "$account_name", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    command_income = [
        {"$match": {"amount": {"$gte": 0}}},
        {"$project": {
            "month": {"$month": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$group": {
            # "_id": {"month": "$month", "tag": "$tag", "account_name": "$account_name"},
            "_id": {"month": "$month", "account_name": "$account_name", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    expensives = list(mongo.db.transactions.aggregate(command_expensive))
    incomes = list(mongo.db.transactions.aggregate(command_income))
    return render_template('report.html',
                           expensives=json.dumps(expensives, ensure_ascii=False), incomes=json.dumps(incomes, ensure_ascii=False))

@app.route('/report/<account_name>')
def report_account_name(account_name):
    command_expensive = [
        {"$match": {"amount": {"$lte": 0}, "account_name": account_name}},
        {"$project": {
            "month": {"$month": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$group": {
            "_id": {"month": "$month", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    command_income = [
        {"$match": {"amount": {"$gte": 0}, "account_name": account_name}},
        {"$project": {
            "month": {"$month": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$group": {
            "_id": {"month": "$month", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    expensives = list(mongo.db.transactions.aggregate(command_expensive))
    incomes = list(mongo.db.transactions.aggregate(command_income))
    return render_template('report.html',
                           expensives=json.dumps(expensives, ensure_ascii=False), incomes=json.dumps(incomes, ensure_ascii=False))

@app.route('/month/<year>/<month>')
def month_year(year, month):
    command_expensive = [
        {"$project": {
            "month": {"$month": "$date"},
            "year": {"$year": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$match": {"amount": {"$lte": 0}, "year": year, "month": month}},
        {"$group": {
            "_id": {"month": "$month", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    command_income = [
        {"$project": {
            "month": {"$month": "$date"},
            "year": {"$year": "$date"},
            "tag": "$tag",
            "amount": "$amount",
            "account_name": "$account_name"
        }
        },
        {"$match": {"amount": {"$gte": 0}, "year": year, "month": month}},
        {"$group": {
            "_id": {"month": "$month", "tag": "$tag"},
            "total": {"$sum": "$amount"}
        }
        },
        {"$sort": SON([("_id.month", 1)])}
    ]
    expensives = list(mongo.db.transactions.aggregate(command_expensive))
    incomes = list(mongo.db.transactions.aggregate(command_income))
    return render_template('month.html',
                           expensives=json.dumps(expensives, ensure_ascii=False),
                           incomes=json.dumps(incomes, ensure_ascii=False))
# @app.route('/import_excel', methods=['GET'])
# def import_excel():
#     path = '/home/marioandujar/Dropbox/Documentos hipotecarios/Cuentas.xlsx'
#     book = xlrd.open_workbook(path)
#     sheet_names = book.sheet_names()
#     print(sheet_names)
#     transactions = []
#
#     sheets_name = ['Cuenta Hipoteca', 'Cuenta Nomina Mario', 'Cuenta Nomina Cristina', 'Cuenta Ahorro', 'Caja']
#     for sheet_name in sheets_name:
#         sheet = book.sheet_by_name(sheet_name)
#         row = 1
#         while True:
#             try:
#                 values = sheet.row_slice(rowx=row, start_colx=0, end_colx=7)
#                 if values[1].ctype == 0:
#                    break
#                 else:
#                     date = datetime.datetime(1899, 12, 30)
#                     get_ = datetime.timedelta(values[1].value)
#                     get_col2 = str(date + get_)[:10]
#                     d = datetime.datetime.strptime(get_col2, '%Y-%m-%d')
#                     transactions.append({
#                         'operation_id': values[0].value,
#                         'date': d,
#                         'concept': values[3].value,
#                         'amount': values[4].value,
#                         'balance': values[5].value,
#                         'tag': values[6].value,
#                         'account_name': sheet_name
#                     })
#                 row += 1
#             except:
#                 break
#         row = 0
#     mongo.db.transactions.insert_many(transactions)
#     return ''

if __name__ == '__main__':
    mongo = connect_db()
    app.run()
