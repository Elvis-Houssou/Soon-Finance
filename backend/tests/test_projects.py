def test_project_catalogue_requires_authentication(client):
    assert client.get("/api/projects/catalogue").status_code == 401


def test_project_catalogue_contains_categories_and_guidance(client, login):
    response = login("projects@example.com").get("/api/projects/catalogue")
    assert response.status_code == 200
    body = response.json()
    assert {item["id"] for item in body["categories"]} >= {"equipment", "business", "education", "personal"}
    computer = next(item for item in body["templates"] if item["id"] == "computer")
    assert computer["category_id"] == "equipment"
    assert len(computer["guidance"]["fr"]) >= 2
