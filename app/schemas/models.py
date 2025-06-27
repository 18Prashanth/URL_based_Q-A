from pydantic import BaseModel
from typing import Optional, List

class URLRequest(BaseModel):
    url1: str
    url2: Optional[str] = None
    url3: Optional[str] = None

class question(BaseModel):
    Question: str

class questionResponse(BaseModel):
    answer: str
    sources: str
