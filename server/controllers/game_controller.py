from flask import request, jsonify
from services.game_logic import GameLogic

game_logic = GameLogic()

def start_new_game():
    player_id = request.json.get('player_id')
    num_players = request.json.get('num_players', 2)  # Default to 2 players if not specified
    game_id = game_logic.create_game(player_id, num_players)
    return jsonify({"game_id": game_id}), 201

def get_game_state(game_id):
    player_id = request.args.get('player_id')
    state = game_logic.get_public_game_state(game_id, player_id)
    if state:
        return jsonify(state), 200
    return jsonify({"error": "Game not found"}), 404

def make_bid():
    game_id = request.json.get('game_id')
    player_id = request.json.get('player_id')
    bid = request.json.get('bid')
    is_restricted = request.json.get('is_restricted', False)
    success, message = game_logic.make_bid(game_id, player_id, bid, is_restricted)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 400

def play_card():
    game_id = request.json.get('game_id')
    player_id = request.json.get('player_id')
    card = request.json.get('card')
    success, message = game_logic.play_card(game_id, player_id, card)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 400

def start_new_round():
    game_id = request.json.get('game_id')
    success, message = game_logic.start_new_round(game_id)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 400