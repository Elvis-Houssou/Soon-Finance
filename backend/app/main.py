from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings

app = FastAPI(title="Soon Finance API")
# The website calls the API directly from the browser, with the session cookie.
app.add_middleware(CORSMiddleware, allow_origins=[get_settings().app_url], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router)
