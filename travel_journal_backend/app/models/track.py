from app import db
from datetime import datetime

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200))
    points = db.Column(db.JSON, nullable=False)  # [{lat, lng, timestamp}]
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    distance = db.Column(db.Float)  # 单位：米
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) 