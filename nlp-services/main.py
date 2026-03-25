from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
import os
import datetime
from dotenv import load_dotenv

# ------------------ Setup ------------------

load_dotenv()
app = FastAPI()

model = SentenceTransformer('all-MiniLM-L6-v2')

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME  = os.getenv("DB_NAME", "project_connect")  # set DB_NAME in .env to match your Atlas DB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

skill_vectors = db["skillvectors"]   # SkillVector model → collection 'skillvectors'
profiles      = db["profiles"]        # Profile model → skills live here, NOT in 'users'
projects      = db["projects"]
match_scores  = db["skillmatchscores"]

# ------------------ Models ------------------

class SkillRequest(BaseModel):
    skills: list[str]

class MatchRequest(BaseModel):
    userId: str
    projectId: str

# ------------------ Helpers ------------------

def normalize(skill):
    return skill.strip().lower()

def get_embedding(text):
    return model.encode(text).tolist()

def cosine_similarity(v1, v2):
    v1 = np.array(v1)
    v2 = np.array(v2)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

# ------------------ APIs ------------------

# 1️⃣ Ensure SkillVector exists
@app.post("/api/vectors/generate")
def generate_vectors(data: SkillRequest):
    created_names: list[str] = []

    for skill in data.skills:
        name = normalize(skill)
        if not skill_vectors.find_one({"name": name}):
            vector = get_embedding(name)
            skill_vectors.insert_one({
                "name": name,
                "aliases": [],
                "category": "technical",
                "vector": vector,
                "modelVersion": "all-MiniLM-L6-v2",
            })
            created_names.append(name)

    return {
        "message": "Skill vectors ensured",
        "created": len(created_names),
    }


# 2️⃣ Compute SkillMatchScore
@app.post("/api/match/compute")
def compute_match(data: MatchRequest):

    # Skills are stored in the Profile document, keyed by userId
    profile = profiles.find_one({"userId": ObjectId(data.userId)})
    project = projects.find_one({"_id": ObjectId(data.projectId)})

    if not profile or not project:
        return {"error": "Profile or Project not found"}

    user_skills    = profile.get("skills", [])          # [{name, level, ...}]
    project_skills = project.get("requiredSkills", [])  # [{name, importance, ...}]

    if not user_skills or not project_skills:
        return {"error": "Missing skills"}

    breakdown = []
    matched = []
    missing = []

    similarities = []

    for u in user_skills:
        u_name = normalize(u.get("name", ""))
        u_vec_doc = skill_vectors.find_one({"name": u_name})

        if not u_vec_doc:
            continue

        best_score = 0
        best_match = None

        for p in project_skills:
            p_name = normalize(p.get("name", ""))
            p_vec_doc = skill_vectors.find_one({"name": p_name})

            if not p_vec_doc:
                continue

            score = cosine_similarity(u_vec_doc["vector"], p_vec_doc["vector"])

            if score > best_score:
                best_score = score
                best_match = p_name

        if best_match:
            breakdown.append({
                "userSkill": u_name,
                "projectSkill": best_match,
                "similarity": best_score
            })

            similarities.append(best_score)

            if best_score >= 0.7:
                matched.append(u_name)
            else:
                missing.append(u_name)

    if not similarities:
        return {"error": "No valid comparisons"}

    final_score = sum(similarities) / len(similarities)

    # UPSERT SkillMatchScore
    match_scores.update_one(
        {
            "userId": ObjectId(data.userId),
            "projectId": ObjectId(data.projectId)
        },
        {
            "$set": {
                "cosineSimilarity": final_score,
                "skillBreakdown": breakdown,
                "matchedSkills": matched,
                "missingSkills": missing,
                "modelVersion": "all-MiniLM-L6-v2",
                "computedAt": datetime.datetime.utcnow(),
                "stale": False
            }
        },
        upsert=True
    )

    return {
        "message": "Match computed",
        "score": final_score,
        "matchedSkills": matched,
        "missingSkills": missing
    }


@app.get("/")
def root():
    return {"status": "NLP service running"}