from flask import Flask, jsonify
from flask_cors import CORS
from controllers.user_controller import get_user

import logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://ohhell.riskspace.net", "localhost:3000"]}})

@app.route('/')
def home():
  return jsonify({"message": "Welcome to OHHELL!"}), 200

@app.route('/api/users', methods=['POST'])
def user():
  logging.debug("in user controller")
  return get_user()

if __name__ == '__main__':
  app.run(debug=True)