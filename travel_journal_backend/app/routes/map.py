from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.marker import Marker
from app import db

bp = Blueprint('map', __name__, url_prefix='/api/map')

@bp.route('/markers', methods=['GET', 'POST'])
@jwt_required()
def markers():
    user_id = get_jwt_identity()
    
    if request.method == 'GET':
        try:
            user_markers = Marker.query.filter_by(user_id=user_id).all()
            return jsonify([{
                'id': marker.id,
                'position': [marker.latitude, marker.longitude],
                'description': marker.description
            } for marker in user_markers])
        except Exception as e:
            print(f"GET Error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    try:
        data = request.get_json()
        print(f"Received data: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        if 'position' not in data:
            return jsonify({'error': 'Position is required'}), 400
            
        position = data['position']
        print(f"Position data: {position}")
        
        if not isinstance(position, list) or len(position) != 2:
            return jsonify({'error': 'Position must be an array with 2 elements'}), 400
            
        try:
            latitude = float(position[0])
            longitude = float(position[1])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid coordinate values'}), 400
            
        marker = Marker(
            latitude=latitude,
            longitude=longitude,
            description=data.get('description', ''),
            user_id=user_id
        )
        
        db.session.add(marker)
        db.session.commit()
        
        response_data = {
            'id': marker.id,
            'position': [marker.latitude, marker.longitude],
            'description': marker.description
        }
        print(f"Response data: {response_data}")
        return jsonify(response_data), 201
        
    except Exception as e:
        print(f"POST Error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/markers/<int:marker_id>', methods=['DELETE'])
@jwt_required()
def delete_marker(marker_id):
    user_id = get_jwt_identity()
    try:
        marker = Marker.query.filter_by(id=marker_id, user_id=user_id).first_or_404()
        db.session.delete(marker)
        db.session.commit()
        return jsonify({'message': '标记已删除'})
    except Exception as e:
        print(f"DELETE Error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500