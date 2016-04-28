import os
import xlrd
import datetime
import json
from flask import Flask, render_template
from flask_bootstrap import Bootstrap
from flask.ext.pymongo import PyMongo

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
    transactions = mongo.db.transactions.find()
    return render_template('transactions.html', transactions=transactions)

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
