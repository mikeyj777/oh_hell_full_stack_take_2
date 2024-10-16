from flask import request, jsonify
from config.db import get_db_connection
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def create_daily_log():
    data = request.get_json()
    user_id = data.get('user_id')
    date = data.get('date')
    points = data.get('points')
    hands_played = data.get('hands_played')

    if not all([user_id, date, points, hands_played]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # First, create or get the daily_log
        cur.execute("""
            INSERT INTO daily_logs (user_id, date)
            VALUES (%s, %s)
            ON CONFLICT (user_id, date) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """, (user_id, date))
        daily_log_id = cur.fetchone()['id']

        # Then, create the daily_score
        cur.execute("""
            INSERT INTO daily_scores (daily_log_id, points, hands_played)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (daily_log_id, points, hands_played))
        
        daily_score_id = cur.fetchone()['id']

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Daily log created successfully", "daily_score_id": daily_score_id}), 201
    except (Exception, psycopg2.Error) as error:
        logging.error(f"Error in create_daily_log: {error}")
        return jsonify({"error": "Internal server error"}), 500

def get_user_logs(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT dl.date, ds.points, ds.hands_played
            FROM daily_logs dl
            JOIN daily_scores ds ON dl.id = ds.daily_log_id
            WHERE dl.user_id = %s
            ORDER BY dl.date DESC
        """, (user_id,))
        
        logs = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify(logs), 200
    except (Exception, psycopg2.Error) as error:
        logging.error(f"Error in get_user_logs: {error}")
        return jsonify({"error": "Internal server error"}), 500