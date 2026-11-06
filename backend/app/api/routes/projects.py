from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.db.models import User
from app.domain.projects import project_catalogue
from app.schemas.projects import ProjectCatalogueOut

router = APIRouter()


@router.get("/projects/catalogue", response_model=ProjectCatalogueOut)
def get_project_catalogue(_user: User = Depends(current_user)):
    """Catalogue de modèles de projets disponible aux utilisateurs connectés."""
    return project_catalogue()
