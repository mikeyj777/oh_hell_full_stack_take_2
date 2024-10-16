import random

class GameLogic:
    def __init__(self):
        self.games = {}

    def create_game(self, player_id, num_players):
        game_id = str(random.randint(1000, 9999))
        players = [player_id] + [f"AI_{i}" for i in range(1, num_players)]
        self.games[game_id] = {
            "players": players,
            "current_player": 0,
            "hands": {},
            "bids": {},
            "tricks": [],
            "scores": {player: 0 for player in players},
            "current_round": 1,
            "cards_dealt": 1,  # Start with 1 card in the first round
            "trump_card": None,
        }
        self._deal_cards(game_id)
        return game_id

    def _deal_cards(self, game_id):
        game = self.games[game_id]
        deck = list(range(52))
        random.shuffle(deck)
        
        for player in game["players"]:
            game["hands"][player] = deck[:game["cards_dealt"]]
            deck = deck[game["cards_dealt"]:]
        
        if deck:
            game["trump_card"] = deck[0]

    @staticmethod
    def get_card_suit(card):
        return card // 13

    @staticmethod
    def get_card_rank(card):
        return card % 13

    def get_public_game_state(self, game_id, player_id=None):
        game = self.games.get(game_id)
        if not game:
            return None

        public_state = {
            "players": game["players"],
            "current_player": game["current_player"],
            "current_round": game["current_round"],
            "cards_dealt": game["cards_dealt"],
            "trump_suit": self.get_card_suit(game["trump_card"]) if game["trump_card"] is not None else None,
            "trump_card": game["trump_card"],
            "scores": game["scores"],
            "bids": game["bids"],
            "tricks": game["tricks"],
            "hands": {}
        }

        if player_id:
            public_state["hands"][player_id] = game["hands"].get(player_id, [])
        
        return public_state

    def make_bid(self, game_id, player_id, bid, is_restricted):
        game = self.games.get(game_id)
        if not game or player_id not in game["players"]:
            return False, "Invalid game or player"
        
        if len(game["bids"]) >= len(game["players"]):
            return False, "All players have already bid"
        
        cards_dealt = game["cards_dealt"]
        
        if bid < 0 or bid > cards_dealt:
            return False, f"Bid must be between 0 and {cards_dealt}"
        
        if is_restricted:
            current_sum = sum(game["bids"].values())
            if current_sum + bid == cards_dealt:
                return False, "Restricted player cannot make bid equal to number of cards dealt"
        
        game["bids"][player_id] = bid
        
        # Check if this was the last bid
        if len(game["bids"]) == len(game["players"]):
            total_bids = sum(game["bids"].values())
            if total_bids == cards_dealt:
                return False, "Total bids cannot equal number of cards dealt"
        
        return True, "Bid placed successfully"

    def play_card(self, game_id, player_id, card):
        game = self.games.get(game_id)
        if not game or player_id not in game["players"]:
            return False, "Invalid game or player"
        
        if card not in game["hands"][player_id]:
            return False, "Card not in player's hand"
        
        # Remove the card from the player's hand
        game["hands"][player_id].remove(card)
        
        # Add the card to the current trick
        if len(game["tricks"]) == 0 or len(game["tricks"][-1]) == len(game["players"]):
            game["tricks"].append([])
        game["tricks"][-1].append((player_id, card))
        
        # If this completes a trick, determine the winner
        if len(game["tricks"][-1]) == len(game["players"]):
            trick = game["tricks"][-1]
            winning_card = max(trick, key=lambda x: self._card_value(x[1], game["trump_card"], trick[0][1]))
            winning_player = winning_card[0]
            game["scores"][winning_player] += 1
        
        return True, "Card played successfully"

    def _card_value(self, card, trump_card, lead_card):
        trump_suit = self.get_card_suit(trump_card)
        lead_suit = self.get_card_suit(lead_card)
        card_suit = self.get_card_suit(card)
        card_rank = self.get_card_rank(card)
        
        if card_suit == trump_suit:
            return 100 + card_rank
        elif card_suit == lead_suit:
            return card_rank
        else:
            return 0

    def start_new_round(self, game_id):
        game = self.games.get(game_id)
        if not game:
            return False, "Invalid game"
        
        game["current_round"] += 1
        game["cards_dealt"] = min(game["current_round"], 52 // len(game["players"]))
        game["bids"] = {}
        game["tricks"] = []
        self._deal_cards(game_id)
        
        return True, "New round started successfully"