from fastapi import FastAPI
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="Arivo AI Service", version="1.0.0")

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)

# Store conversation history per session
sessions = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


@app.get("/")
def health_check():
    return {"status": "Arivo AI Service is running"}


@app.post("/chat")
def chat(request: ChatRequest):
    if request.session_id not in sessions:
        sessions[request.session_id] = []

    history = sessions[request.session_id]

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are Arivo, an AI career coach helping
        international students navigate the UK job market.
        You help with visa sponsored jobs, CV advice,
        interview preparation and skill gap analysis.""",
            ),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ]
    )

    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({"history": history, "input": request.message})

    # Save messages to history
    history.append(HumanMessage(content=request.message))
    history.append(AIMessage(content=response))

    return {"response": response, "session_id": request.session_id}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
