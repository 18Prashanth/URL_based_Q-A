from fastapi import FastAPI
from .schemas import models
import os
import langchain
from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA, RetrievalQAWithSourcesChain
from langchain.chains.question_answering import load_qa_chain
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from fastapi import Request
from fastapi.responses import HTMLResponse
# load_dotenv()
# api_key = os.getenv("..."")
# print("GEMINI_API_KEY:", api_key)  # This should print your key, not None

# if api_key is None:
#     raise ValueError("GEMINI_API_KEY is not set in environment or .env file")

os.environ["GOOGLE_API_KEY"] = "add your api key"


app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index")


TEMPLATES_DIR = BASE_DIR.parent / "templates"
STATIC_DIR = BASE_DIR.parent / "static"

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TEMPLATES_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def get_homepage(request: Request):
    """Serve the main HTML page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post('/process_urls/')
def process_urls(request:models.URLRequest):
    try:
        urls = [request.url1]
        if request.url2:
            urls.append(request.url2)
        if request.url3:
            urls.append(request.url3)
    
        all_docs = []
        for url in urls:
            loader = UnstructuredURLLoader(urls=[url.strip()])
            docs = loader.load()
            all_docs.extend(docs)

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = splitter.split_documents(all_docs)

        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        db = FAISS.from_documents(chunks, embeddings)
        db.save_local(INDEX_PATH)

        return JSONResponse(status_code=200, content={
            "status": "success",
            "message": "URLs processed and indexed."
        })

    except Exception as e:
        print("URL Processing Error:", str(e))  # helpful server log
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
    

@app.post("/ask_question/", response_model = models.questionResponse)
def ask_question(request:models.question):
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever()

        llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash-preview-05-20", temperature = 0.7)
        qa_chain = RetrievalQAWithSourcesChain.from_chain_type(
        llm=llm,
        retriever=retriever)

        result = qa_chain.invoke({"question": request.Question})
        return {
        "answer": result["answer"],
        "sources": result.get("sources", "")
        }

    except Exception as e:
        return {
    "answer": "An error occurred.",
    "sources": str(e)
}

