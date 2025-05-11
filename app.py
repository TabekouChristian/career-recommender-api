from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

# Load model and subject encoder
model = joblib.load('career_recommender_model.pkl')
mlb = joblib.load('subject_encoder.pkl')

# Cameroon subjects (optional for frontend display)
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

        # 1. Subjects → one-hot encoding using trained encoder
        selected_subjects = [s.lower() for s in data.get('subjects', [])]
        subject_df = pd.DataFrame(
            mlb.transform([selected_subjects]),
            columns=mlb.classes_
        )

        # 2. Interests (yes/no → 1/0)
        interests = {
            f'q_{k}': 1 if v.lower() == 'yes' else 0
            for k, v in data.get('interests', {}).items()
        }
        interest_df = pd.DataFrame([interests])

        # Ensure all 30 interest columns exist
        for i in range(1, 31):
            col = f'q_{i}'
            if col not in interest_df.columns:
                interest_df[col] = 0

        # 3. Sector one-hot dummy (you can improve later)
        sector_df = pd.DataFrame({'Other': [1]})

        # 4. Employment rate dummy (default 0 for students)
        employment_df = pd.DataFrame({'employment_rate': [0]})

        # 5. Combine all inputs
        full_input = pd.concat([subject_df, interest_df, sector_df, employment_df], axis=1)

        # Ensure correct columns and order
        for col in model.feature_names_in_:
            if col not in full_input.columns:
                full_input[col] = 0  # add missing
        full_input = full_input[model.feature_names_in_]  # reorder

        # 6. Predict
        probs = model.predict_proba(full_input)[0]
        careers = model.classes_

        results = pd.DataFrame({
            'career': careers,
            'confidence': probs
        }).sort_values(by='confidence', ascending=False).head(5)

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
