import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Load the data
df = pd.read_csv('data/oh_hell_simulation_data.csv')

# Basic statistics
print(df.describe())

# Analyze bidding accuracy
# mj - commenting out the code below that was throwing an error.
# df['bid_accuracy'] = df.apply(lambda row: sum([1 for bid, trick in zip(row['player_bids'], row['trick_winner']) if bid == sum([1 for winner in trick if winner == player]) for player in range(row['num_players'])]) / row['num_players'], axis=1)

# attempting to try with the following
df['bid_accuracy'] = df.apply(lambda row: sum([1 for trick in row['trick_winner'] if trick == player]) for player in range(row['num_players'])] / row['num_players'], axis=1)

# Plot bidding accuracy distribution
sns.histplot(df['bid_accuracy'], kde=True)
plt.title('Distribution of Bidding Accuracy')
plt.xlabel('Bid Accuracy')
plt.show()

# Analyze the effect of number of players on bidding accuracy
sns.boxplot(x='num_players', y='bid_accuracy', data=df)
plt.title('Bidding Accuracy vs Number of Players')
plt.show()

# Analyze the effect of round number on bidding accuracy
df['round_number'] = df.groupby('simulation').cumcount() + 1
sns.lineplot(x='round_number', y='bid_accuracy', data=df)
plt.title('Bidding Accuracy over Rounds')
plt.show()

# Analyze trick-winning patterns
trick_winners = df['trick_winner'].apply(pd.Series).stack().value_counts(normalize=True)
sns.barplot(x=trick_winners.index, y=trick_winners.values)
plt.title('Distribution of Trick Winners')
plt.xlabel('Player Number')
plt.ylabel('Proportion of Tricks Won')
plt.show()