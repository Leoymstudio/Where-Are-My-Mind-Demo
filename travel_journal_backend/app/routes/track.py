from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.track import Track
from app import db
from datetime import datetime

bp = Blueprint('track', __name__, url_prefix='/api/track')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_tracks():
    try:
        user_id = get_jwt_identity()
        tracks = Track.query.filter_by(user_id=user_id).all()
        return jsonify([{
            'id': track.id,
            'name': track.name,
            'points': track.points,
            'start_time': track.start_time.isoformat(),
            'end_time': track.end_time.isoformat() if track.end_time else None,
            'distance': track.distance
        } for track in tracks])
    except Exception as e:
        print(f"Error getting tracks: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_track():
    try:
        data = request.get_json()
        track = Track(
            name=data.get('name', f'路线 {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            points=data['points'],
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
            distance=data.get('distance', 0),
            user_id=get_jwt_identity()
        )
        
        db.session.add(track)
        db.session.commit()
        
        return jsonify({
            'id': track.id,
            'name': track.name,
            'points': track.points,
            'start_time': track.start_time.isoformat(),
            'end_time': track.end_time.isoformat() if track.end_time else None,
            'distance': track.distance
        }), 201
    except Exception as e:
        print(f"Error creating track: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:track_id>', methods=['DELETE'])
@jwt_required()
def delete_track(track_id):
    try:
        user_id = get_jwt_identity()
        track = Track.query.filter_by(id=track_id, user_id=user_id).first_or_404()
        
        db.session.delete(track)
        db.session.commit()
        
        return jsonify({'message': '路线已删除'}), 200
    except Exception as e:
        print(f"Error deleting track: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 