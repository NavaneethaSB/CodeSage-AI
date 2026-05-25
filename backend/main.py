from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os
from dotenv import load_dotenv

app = FastAPI()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ MODELS ------------------
class CodeRequest(BaseModel):
    code: str

class ConvertRequest(BaseModel):
    code: str
    targetLang: str


# ------------------ GROQ HELPER ------------------
from groq import Groq
import json

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

import json
import re

def call_groq_response(prompt):

    try:

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.2,
            max_completion_tokens=4096
        )

        text = completion.choices[0].message.content.strip()

        # Remove markdown wrappers
        text = re.sub(r"```python", "", text)
        text = re.sub(r"```", "", text).strip()

        # Split explanation and code
        # Split explanation and updated code
# Split explanation and updated code
        if "UPDATED_CODE:" in text:

            parts = text.split("UPDATED_CODE:")

            explanation = parts[0]
            updated_code = parts[1]

            explanation = explanation.replace(
                "EXPLANATION:",
                ""
            ).strip()

            updated_code = updated_code.strip()

        else:

            explanation = text
            updated_code = ""

        return {
            "explanation": explanation,
            "updatedCode": updated_code
        }

    except Exception as e:

        return {
            "explanation": f"Server Error: {str(e)}",
            "updatedCode": ""
        }

# ------------------ EXPLAIN (UNCHANGED) ------------------
# ------------------ EXPLAIN CODE ------------------
@app.post("/explain")
def explain_code(req: CodeRequest):

    code = req.code.strip()

    # Empty code validation
    if not code:
        raise HTTPException(
            status_code=400,
            detail="No code provided."
        )

    # Large input validation
    if len(code) > 20000:
        raise HTTPException(
            status_code=400,
            detail="Code too large. Please reduce size."
        )

    # AI Prompt
    prompt = f"""
You are an expert programming tutor.

Analyze the given code and explain it in a clean, beginner-friendly way.

Your explanation should:
- Automatically identify the programming language
- Explain what the program does
- Explain the logic step by step
- Explain loops, conditions, functions, and variables clearly
- Mention the final output or behavior
- Be easy for students and beginners to understand
- Use proper formatting with headings and bullet points

Avoid:
- Repeating unnecessary statements
- Saying things like "the provided code"
- Giving robotic explanations
- Overly short explanations

Return explanation in this format:

# 📌 Programming Language

# 🎯 What This Program Does

# ⚙️ Step-by-Step Logic

# 🧠 Important Concepts Used

# 📤 Final Output

Code:
{code}
"""

    try:

        # Groq API Call
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.2,
            max_completion_tokens=1024
        )

        # Extract AI response
        explanation = (
            completion.choices[0]
            .message.content
            .strip()
        )

        # Empty response check
        if not explanation:
            return {
                "explanation": "No explanation generated."
            }

        # Final response
        return {
            "explanation": explanation
        }

    except Exception as e:
        print("========== FULL ERROR ==========")
        print(e)
        print(type(e))
        print("================================")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ------------------ FIX BUGS ------------------
@app.post("/fix-bugs")
def fix_bugs(req: CodeRequest):

    prompt = f"""
You are an elite software debugger.

Analyze the code carefully.

VERY IMPORTANT RULES:

1. Keep the explanation SHORT and CLEAN
2. Do NOT include code inside explanation
3. Put ALL corrected code ONLY after UPDATED_CODE:
4. Keep explanation concise
5. Use bullet points only
6. Do NOT use markdown code blocks
7. Do NOT add language names like c, python, java before the code
 

RETURN FORMAT EXACTLY:

# 🐞 Bugs Found
- Mention bugs briefly

# ❓ Why The Bug Occurs
- Mention reason briefly

# ✅ Fix Applied
- Mention fixes briefly

# 💡 Best Practice Suggestions
- Mention 2-3 short suggestions

UPDATED_CODE:

corrected code here

Code:
{req.code}
"""

    return call_groq_response(prompt)


# ------------------ CONVERT CODE ------------------
@app.post("/convert-code")
def convert_code(req: ConvertRequest):

    prompt = f"""
You are an elite code conversion assistant.

Convert the code into {req.targetLang}.

STRICT RULES:

- Keep explanation VERY SHORT
- NEVER include code inside explanation
- NEVER explain syntax
- NEVER add extra sections
- NEVER add IMPORTANT notes
- NEVER include examples
- Put ALL converted code ONLY after UPDATED_CODE:
- Do NOT use markdown code blocks

RETURN FORMAT EXACTLY:

EXPLANATION:

# 🔄 Code Conversion

Source Language: ...
Converted Language: ...

# 💡 Conversion Notes
- Short concise notes only

UPDATED_CODE:

converted code here

Code:
{req.code}
"""

    return call_groq_response(prompt)
    

# ------------------ OPTIMIZE CODE ------------------
@app.post("/optimize-code")
def optimize_code(req: CodeRequest):

    prompt = f"""
You are an elite code optimization assistant.

Your task is to optimize the code and provide a SHORT professional explanation.

STRICT RULES:

- Keep explanation SHORT
- Maximum 4 sections
- Maximum 2 bullet points per section
- NEVER include code inside explanation
- NEVER include examples
- NEVER include docstrings
- NEVER include tutorial-style content
- Put ALL optimized code ONLY after UPDATED_CODE:
- Do NOT use markdown code blocks

RETURN FORMAT EXACTLY:

EXPLANATION:

# 🚀 Optimization Summary
- Short concise points only

# ⏱ Complexity Improvements
- Short concise points only

# 🧠 Readability Improvements
- Short concise points only

# 💡 Best Practices
- Short concise points only

UPDATED_CODE:

optimized code here

Code:
{req.code}
"""

    return call_groq_response(prompt)


# ------------------ HEALTH ------------------
@app.get("/health")
def health():
    return {"status": "ok"}
