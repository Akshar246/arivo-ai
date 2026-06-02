from fastapi import FastAPI
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="Arivo AI Service", version="1.0.0")

# Connect to Groq LLM
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)

# Arivo AI career coach prompt
prompt = PromptTemplate(
    input_variables=["message"],
    template="""
You are Arivo, an AI career coach helping international 
students navigate the UK job market.

You help with:
- Finding visa sponsored jobs in the UK
- CV and cover letter advice
- Interview preparation
- Skill gap analysis

User message: {message}

Give a helpful, friendly, and specific response.
""",
)

chain = prompt | llm | StrOutputParser()


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def health_check():
    return {"status": "Arivo AI Service is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    response = chain.invoke({"message": request.message})
    return {"response": response}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
