from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

# Load model and encoder
model = joblib.load('career_recommender_model.pkl')
mlb = joblib.load('subject_encoder.pkl')

# Cameroon subjects list
CAMEROON_SUBJECTS = [
    'english', 'french', 'general paper', 'religious studies', 'philosophy', 'logic',
    'mathematics', 'further mathematics', 'physics', 'chemistry', 'biology', 'computer science',
    'ict', 'geology', 'technical drawing', 'food science', 'nutrition', 'agricultural science',
    'physical education', 'environmental management',
    'history', 'geography', 'literature', 'education', 'art', 'music',
    'economics', 'accounting', 'business mathematics', 'management', 'law', 'commerce'
]

@app.route('/')
def index():
    return render_template('index.html', subjects=CAMEROON_SUBJECTS)

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        
        # Prepare features
        features = pd.DataFrame(0, index=[0], columns=model.feature_names_in_)
        
        # Set subjects
        for subject in data['subjects']:
            subject = subject.lower()
            if subject in features.columns:
                features[subject] = 1
        
        # Set interest responses
        for q, response in data['interests'].items():
            feature_name = f'q_{q}'
            if feature_name in features.columns:
                features[feature_name] = response
        
        # Get predictions
        probas = model.predict_proba(features)[0]
        careers = model.classes_
        
        # Prepare results
        results = pd.DataFrame({
            'career': careers,
            'confidence': probas
        }).sort_values('confidence', ascending=False).head(5)
        
        return jsonify({
            'success': True,
            'recommendations': results.to_dict('records')
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)