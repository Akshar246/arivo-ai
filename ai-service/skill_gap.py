import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

# ─────────────────────────────────────────────
# STEP 1 — Define the skills we track
# These 12 skills become the input features
# for our ML model. 1 = has skill, 0 = does not
# ─────────────────────────────────────────────
SKILLS = [
    "python",
    "javascript",
    "react",
    "node",
    "machine_learning",
    "deep_learning",
    "sql",
    "docker",
    "aws",
    "langchain",
    "nlp",
    "pytorch",
]

# ─────────────────────────────────────────────
# STEP 2 — Training data
# Each row = one candidate profile
# [skill_scores_list, role, readiness_score]
# The model learns: given these skills → predict this score
# ─────────────────────────────────────────────
training_data = [
    # ML Engineer profiles
    ([1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1], "ml_engineer", 90),
    ([1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1], "ml_engineer", 60),
    ([1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], "ml_engineer", 40),
    ([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], "ml_engineer", 20),
    # Fullstack profiles
    ([1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0], "fullstack", 90),
    ([1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], "fullstack", 65),
    ([0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], "fullstack", 40),
    ([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "fullstack", 20),
    # Data Scientist profiles
    ([1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0], "data_scientist", 80),
    ([1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], "data_scientist", 55),
    ([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], "data_scientist", 30),
    ([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], "data_scientist", 15),
]

# ─────────────────────────────────────────────
# STEP 3 — Prepare features and target scores
# X = the skill vectors (what the model reads)
# y = the readiness scores (what the model predicts)
# ─────────────────────────────────────────────
X = np.array([row[0] for row in training_data])
y = np.array([row[2] for row in training_data])

# ─────────────────────────────────────────────
# STEP 4 — Split into train and test sets
# 80% trains the model, 20% tests how accurate it is
# random_state=42 means the split is always the same
# so results are reproducible
# ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ─────────────────────────────────────────────
# STEP 5 — Train the model
# RandomForestRegressor builds 100 decision trees
# Each tree learns different patterns
# Final prediction = average of all 100 trees
# We use Regressor (not Classifier) because we
# predict a NUMBER (score), not a category
# ─────────────────────────────────────────────
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ─────────────────────────────────────────────
# STEP 6 — Test the model on unseen data
# Mean Absolute Error = average prediction mistake
# Lower is better. 12 means predictions are
# roughly 12 points off on average
# ─────────────────────────────────────────────
predictions = model.predict(X_test)
error = mean_absolute_error(y_test, predictions)
print(f"Model trained! Mean absolute error: {error:.1f} points")

# ─────────────────────────────────────────────
# STEP 7 — Save the model to disk
# joblib saves the trained model as a .pkl file
# We load this file in main.py — no retraining needed
# Train once, use forever
# ─────────────────────────────────────────────
joblib.dump(model, "skill_gap_model.pkl")
print("Model saved to skill_gap_model.pkl")

# ─────────────────────────────────────────────
# STEP 8 — Test a real prediction (Akshar's skills)
# This shows the model working end to end
# ─────────────────────────────────────────────
akshar_skills = {
    "python": 1,
    "javascript": 1,
    "react": 1,
    "node": 1,
    "machine_learning": 0,
    "deep_learning": 0,
    "sql": 1,
    "docker": 1,
    "aws": 1,
    "langchain": 0,
    "nlp": 0,
    "pytorch": 0,
}

# Convert dict to array in the same order as SKILLS
# This is critical — order must always match
akshar_vector = [akshar_skills[skill] for skill in SKILLS]

# Load saved model and predict
loaded_model = joblib.load("skill_gap_model.pkl")
score = loaded_model.predict([akshar_vector])[0]

# Show results
missing = [skill for skill, val in akshar_skills.items() if val == 0]
print(f"\nSkill gap result for ML Engineer role:")
print(f"Readiness score: {score:.0f}/100")
print(f"Missing skills: {missing}")
