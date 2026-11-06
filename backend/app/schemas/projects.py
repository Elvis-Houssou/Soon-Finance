from pydantic import BaseModel, ConfigDict, Field


class ProjectTemplateOut(BaseModel):
    id: str
    category_id: str
    label: dict[str, str]
    guidance: dict[str, list[str]]


class ProjectCategoryOut(BaseModel):
    id: str
    label: dict[str, str]


class ProjectCatalogueOut(BaseModel):
    categories: list[ProjectCategoryOut]
    templates: list[ProjectTemplateOut]
