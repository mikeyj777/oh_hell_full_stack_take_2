import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.game_logic import GameLogic
from controllers.game_controller import start_new_game, get_game_state, make_bid, play_card, start_new_round
from flask import Flask, jsonify, request
from werkzeug.test import Client
from werkzeug.wrappers import Response

app = Flask(__name__)

def test_game_logic():
    game_logic = GameLogic()
    test_player = "player1"

    # Test create_game
    game_id = game_logic.create_game(test_player, 2)
    assert game_id is not None, "Failed to create game"
    assert len(game_logic.games[game_id]["players"]) == 2, "Incorrect number of players"
    print("Create game test passed")

    # Test get_public_game_state
    public_state = game_logic.get_public_game_state(game_id, "player1")
    assert public_state is not None, "Failed to get public game state"
    assert "hands" in public_state, "Player hands not in public state"
    assert len(public_state["hands"].get("player1", [])) == 1, "Incorrect number of cards in player's hand"
    print("Get public game state test passed")

    # Test make_bid
    success, message = game_logic.make_bid(game_id, "player1", 0, False)
    assert success, f"Failed to make valid bid: {message}"
    
    success, message = game_logic.make_bid(game_id, "player1", 2, False)
    assert not success, "Should not allow bid greater than cards dealt"
    
    success, message = game_logic.make_bid(game_id, "AI_1", 1, True)
    assert not success, "Restricted player should not be allowed to make total bid equal to cards dealt"
    
    success, message = game_logic.make_bid(game_id, "AI_1", 0, True)
    assert success, f"Failed to make valid restricted bid: {message}"
    
    print("Make bid tests passed")

    # Test play_card
    player_hand = game_logic.games[game_id]["hands"]["player1"]
    card_to_play = player_hand[0]
    success, message = game_logic.play_card(game_id, "player1", card_to_play)
    assert success, f"Failed to play card: {message}"
    assert card_to_play not in game_logic.games[game_id]["hands"]["player1"], "Card not removed from hand"
    print("Play card test passed")

    # Test start_new_round
    success, message = game_logic.start_new_round(game_id)
    assert success, f"Failed to start new round: {message}"
    state = game_logic.get_public_game_state(game_id)
    assert state["current_round"] == 2, "Failed to increment round"
    assert state["cards_dealt"] == 2, "Failed to increase cards dealt"
    assert len(state["bids"]) == 0, "Failed to reset bids"
    print("Start new round test passed")

    print("All GameLogic tests passed!")

def test_game_controller():
    client = Client(app, Response)

    # Test start_new_game
    response = client.post('/api/game/start', json={"player_id": "player1", "num_players": 2})
    assert response.status_code == 201, "Incorrect status code for start_new_game"
    game_id = response.get_json()["game_id"]
    print("Start new game test passed")

    # Test get_game_state
    response = client.get(f'/api/game/{game_id}?player_id=player1')
    assert response.status_code == 200, "Incorrect status code for get_game_state"
    game_state = response.get_json()
    assert "players" in game_state, "Game state doesn't contain players"
    assert "hands" in game_state, "Game state doesn't contain hands"
    print("Get game state test passed")

    # Test make_bid
    response = client.post('/api/game/bid', json={"game_id": game_id, "player_id": "player1", "bid": 0, "is_restricted": False})
    assert response.status_code == 200, "Incorrect status code for make_bid"
    print("Make bid test passed")

    # Test play_card
    player_hand = game_state["hands"]["player1"]
    card_to_play = player_hand[0]
    response = client.post('/api/game/play', json={"game_id": game_id, "player_id": "player1", "card": card_to_play})
    assert response.status_code == 200, "Incorrect status code for play_card"
    print("Play card test passed")

    # Test start_new_round
    response = client.post('/api/game/new-round', json={"game_id": game_id})
    assert response.status_code == 200, "Incorrect status code for start_new_round"
    print("Start new round test passed")

    print("All GameController tests passed!")

# Make sure to update your app.py to include these routes:

@app.route('/api/game/start', methods=['POST'])
def start_game_route():
    return start_new_game()

@app.route('/api/game/<game_id>', methods=['GET'])
def get_game_state_route(game_id):
    return get_game_state(game_id)

@app.route('/api/game/bid', methods=['POST'])
def make_bid_route():
    return make_bid()

@app.route('/api/game/play', methods=['POST'])
def play_card_route():
    return play_card()

@app.route('/api/game/new-round', methods=['POST'])
def start_new_round_route():
    return start_new_round()

if __name__ == "__main__":
    test_game_logic()
    test_game_controller()