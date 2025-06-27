# 🌐 URL-Based Q&A System using FastAPI + LangChain + Gemini + FAISS

This project is an AI-powered web application that allows users to:

1. Input up to 3 URLs containing content (e.g., articles, blogs).
2. Process and index the text from those URLs.
3. Ask natural language questions about the content.
4. Get accurate answers along with source references using Google's Gemini LLM and LangChain.

---

## 🔧 Tech Stack

| Component  | Technology                                         |
| ---------- | -------------------------------------------------- |
| Backend    | [FastAPI](https://fastapi.tiangolo.com/)           |
| Frontend   | HTML, CSS, JavaScript                              |
| LLM        | [Gemini (GenerativeAI)](https://ai.google.dev/)    |
| Vector DB  | [FAISS](https://github.com/facebookresearch/faiss) |
| Embeddings | `GoogleGenerativeAIEmbeddings`                     |
| Loader     | `UnstructuredURLLoader` (LangChain)                |
| Chain      | `RetrievalQAWithSourcesChain`                      |

---

## 🏗️ Project Architecture Overview

```
                        ┌────────────────────────────┐
                        │        User Frontend       │
                        │  (HTML/CSS + JS frontend)  │
                        │----------------------------│
                        │ - Input: URLs, Questions   │
                        │ - Output: Chat Responses   │
                        └─────────────┬──────────────┘
                                      │
                           HTTP POST/GET via Fetch
                                      │
                                      ▼
                    ┌────────────────────────────────┐
                    │            FastAPI             │
                    │     (Backend Application)      │
                    │────────────────────────────────│
                    │ Endpoints:                     │
                    │ - `/process_urls/`             │
                    │ - `/ask_question/`             │
                    └──────┬────────────┬────────────┘
                           │            │
                           ▼            ▼
     ┌────────────────────────┐   ┌─────────────────────────────┐
     │   UnstructuredURLLoader│   │ Google Generative AI (Gemini)│
     │ (LangChain Loader)     │   │ via `langchain-google-genai`│
     └────────────────────────┘   └─────────────────────────────┘
                │                            ▲
                ▼                            │
   ┌────────────────────────────┐     ┌──────────────────────────────┐
   │ RecursiveCharacterSplitter │     │ ChatGoogleGenerativeAI (LLM) │
   └────────────┬───────────────┘     └──────────────────────────────┘
                │
                ▼
     ┌────────────────────────────┐
     │ GoogleGenerativeAIEmbeddings│
     └────────────┬───────────────┘
                  ▼
     ┌────────────────────────────┐
     │        FAISS VectorStore   │
     │ - Save embeddings locally  │
     │ - Path: app/faiss_index    │
     └────────────┬───────────────┘
                  │
                  ▼
     ┌────────────────────────────┐
     │ RetrievalQAWithSourcesChain│
     └────────────────────────────┘
```

## 📂 Folder Structure

```
main_project/

│
├── app/
│ ├── main.py # FastAPI backend
│ ├── schemas/models.py # Pydantic schemas
│ ├── static/ # Frontend assets (CSS, JS)
│ ├── templates/ # HTML templates using Jinja2
│ └── faiss_index/ # Saved FAISS index
│
├── requirements.txt # Python dependencies
└── README.md # Project documentation
```

---

## 🚀 How to Run Locally

### 1. Clone the Repository

```
git clone https://github.com/your-username/url-qa-langchain.git

```

### 2. Create and Activate a Virtual Environment

```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```
pip install -r requirements.txt

```

### 4. Set Your API Key

In main.py

```
os.environ["GOOGLE_API_KEY"] = "your-gemini-api-key"

```

### 5. Start the Server

```
uvicorn app.main:app --reload

```

## Open Browser

```
http://localhost:8000
```

✨ Features
🔗 Accept up to 3 web URLs.

🧠 Extract content using LangChain's UnstructuredURLLoader.

🧩 Split and embed using RecursiveCharacterTextSplitter and Gemini Embeddings.

💾 Store and retrieve chunks using FAISS Vector Store.

❓ Ask natural language questions and receive accurate answers.

📚 Return source references along with answers.

## 📸 Screenshots

## ![App Screenshot](/img2.png)

🛠 Future Improvements

- File upload for PDF/Docx.

- Chat history + user sessions.

- Docker + CI/CD pipeline.

- Streamed answer rendering (already supported in JS).

- Switch to OpenAI if needed.

🙌 Acknowledgements

- LangChain

- Google Generative AI

- FastAPI

- FAISS

💡 Author

Prashanth Gowda A S

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?logo=linkedin)](https://www.linkedin.com/in/prashanthgowdaas/)
