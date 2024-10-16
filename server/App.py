from flask import Flask, jsonify, request
from flask_cors import CORS
from controllers.user_controller import get_user
from controllers.daily_logs_controller import create_daily_log, get_user_logs
from controllers.game_controller import start_new_game, get_game_state, make_bid, play_card

import logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://ohhell.riskspace.net", "http://localhost:3000"]}})

@app.route('/')
def home():
    return jsonify({"message": "Welcome to OHHELL!"}), 200

@app.route('/api/users', methods=['POST', 'OPTIONS'])
def user():
    logging.debug("app.py - user route")
    if request.method == 'OPTIONS':
        return '', 200
    return get_user()

@app.route('/api/daily-logs', methods=['POST', 'OPTIONS'])
def create_log():
    if request.method == 'OPTIONS':
        return '', 200
    return create_daily_log()

@app.route('/api/daily-logs/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_logs(user_id):
    if request.method == 'OPTIONS':
        return '', 200
    return get_user_logs(user_id)

@app.route('/api/game/start', methods=['POST'])
def new_game():
    return start_new_game()

@app.route('/api/game/<game_id>', methods=['GET'])
def game_state(game_id):
    return get_game_state(game_id)

@app.route('/api/game/bid', methods=['POST'])
def bid():
    return make_bid()

@app.route('/api/game/play', methods=['POST'])
def play():
    return play_card()

if __name__ == '__main__':
    app.run(debug=True)