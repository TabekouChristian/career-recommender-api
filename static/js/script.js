// Complete set of 30 interest questions
const INTEREST_QUESTIONS = {
    1: "Do you enjoy solving problems and thinking logically?",
    2: "Do you like helping people with their health or emotions?",
    3: "Do you enjoy teaching, mentoring, or guiding others?",
    4: "Would you like to start or manage a business?",
    5: "Are you interested in working with machines, electronics, or fixing things?",
    6: "Do you enjoy creating art, music, or visual designs?",
    7: "Are you interested in writing, reading, or telling stories?",
    8: "Do you want to travel and explore new cultures?",
    9: "Are you passionate about justice, laws, or human rights?",
    10: "Would you like to work with money, budgeting, or finance?",
    11: "Do you enjoy working outdoors or with nature?",
    12: "Do you want to help improve your community or country?",
    13: "Do you like managing people, schedules, or resources?",
    14: "Are you interested in understanding how the human body works?",
    15: "Do you enjoy building or designing physical structures?",
    16: "Would you like to protect others and enforce rules?",
    17: "Are you passionate about computers, coding, or software?",
    18: "Do you want to make discoveries in science or research?",
    19: "Are you interested in the economy, trade, or entrepreneurship?",
    20: "Do you enjoy using social media or creating online content?",
    21: "Would you like to work with animals?",
    22: "Are you interested in fashion, beauty, or personal care?",
    23: "Do you like helping people with personal issues?",
    24: "Do you enjoy working with numbers and patterns?",
    25: "Would you like to work in the media or entertainment industry?",
    26: "Are you passionate about the environment and sustainability?",
    27: "Do you enjoy making or fixing electronic gadgets?",
    28: "Do you want to help children learn and grow?",
    29: "Would you like to explore space or aviation?",
    30: "Are you interested in using AI or robotics to solve problems?"
};

document.addEventListener('DOMContentLoaded', function() {
    // Load all 30 interest questions
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = ''; // Clear any existing content
    
    for (let q = 1; q <= 30; q++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.dataset.questionId = q;
        questionDiv.innerHTML = `
            <p class="question-text">${q}. ${INTEREST_QUESTIONS[q]}</p>
            <div class="btn-group">
                <button class="interest-btn yes-btn" data-q="${q}" data-response="1">Yes</button>
                <button class="interest-btn no-btn" data-q="${q}" data-response="0">No</button>
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    }

    // Set up subject selection
    const subjectContainer = document.getElementById('subjectContainer');
    subjectContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') {
            const label = e.target.nextElementSibling;
            if (e.target.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        }
    });

    // Set up interest question selection
    questionsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('interest-btn')) {
            const btnGroup = e.target.parentNode;
            const questionId = e.target.dataset.q;
            
            // Remove active class from all buttons in this group
            btnGroup.querySelectorAll('.interest-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Highlight the question card
            const questionCard = e.target.closest('.question-item');
            questionCard.classList.add('answered');
            
            // Store the response
            questionCard.dataset.response = e.target.dataset.response;
        }
    });

    // Recommendation button
    document.getElementById('recommendBtn').addEventListener('click', getRecommendations);
});

function getRecommendations() {
    // Get selected subjects
    const selectedSubjects = [];
    document.querySelectorAll('#subjectContainer input:checked').forEach(checkbox => {
        selectedSubjects.push(checkbox.value);
    });

    // Validate at least 3 subjects selected
    if (selectedSubjects.length < 3) {
        alert('Please select at least 3 subjects you have studied');
        return;
    }

    // Get interest responses
    const interestResponses = {};
    let answeredCount = 0;
    
    document.querySelectorAll('.question-item').forEach(question => {
        const questionId = question.dataset.questionId;
        const response = question.dataset.response;
        
        if (response !== undefined) {
            interestResponses[questionId] = parseInt(response);
            answeredCount++;
        }
    });

    // Validate at least 10 questions answered
    if (answeredCount < 10) {
        alert('Please answer at least 10 interest questions');
        return;
    }

    // Show loading state
    const btn = document.getElementById('recommendBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';

    // Send data to backend
    fetch('/recommend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            subjects: selectedSubjects,
            interests: interestResponses
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayResults(data.recommendations);
        } else {
            showError(data.error || 'Unknown error occurred');
        }
    })
    .catch(error => {
        showError('Network error: ' + error.message);
    })
    .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Get Career Recommendations';
    });
}

function displayResults(recommendations) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '<h2>Your Top Career Matches</h2>';
    
    recommendations.forEach((item, index) => {
        const confidencePercent = Math.round(item.confidence * 100);
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        resultDiv.innerHTML = `
            <div class="career-rank">${index + 1}</div>
            <div class="career-details">
                <h3>${formatCareerName(item.career)}</h3>
                <div class="confidence-meter">
                    <div class="meter-bar" style="width: ${confidencePercent}%"></div>
                    <span class="confidence-value">${confidencePercent}% match</span>
                </div>
            </div>
        `;
        container.appendChild(resultDiv);
    });
    
    container.style.display = 'block';
    window.scrollTo({
        top: container.offsetTop,
        behavior: 'smooth'
    });
}

function formatCareerName(career) {
    return career.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    container.appendChild(errorDiv);
    container.style.display = 'block';
}