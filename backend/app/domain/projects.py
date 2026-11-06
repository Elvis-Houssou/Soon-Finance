"""Catalogue stable de catégories et modèles de projets d'épargne Soon Finance."""

PROJECT_CATEGORIES = [
    {"id": "equipment", "label": {"fr": "Équipement", "en": "Equipment"}},
    {"id": "housing", "label": {"fr": "Logement", "en": "Housing"}},
    {"id": "business", "label": {"fr": "Entrepreneuriat", "en": "Business"}},
    {"id": "education", "label": {"fr": "Formation et études", "en": "Education"}},
    {"id": "mobility", "label": {"fr": "Mobilité", "en": "Mobility"}},
    {"id": "family", "label": {"fr": "Famille et événements", "en": "Family and events"}},
    {"id": "travel", "label": {"fr": "Voyage", "en": "Travel"}},
    {"id": "home", "label": {"fr": "Maison", "en": "Home"}},
    {"id": "agriculture", "label": {"fr": "Agriculture et activités productives", "en": "Agriculture and productive activities"}},
    {"id": "personal", "label": {"fr": "Projet personnel", "en": "Personal project"}},
]

PROJECT_TEMPLATES = [
    {"id": "computer", "category_id": "equipment", "label": {"fr": "Acheter un ordinateur", "en": "Buy a computer"}, "guidance": {"fr": ["Comparer les caractéristiques et les prix", "Définir un budget réaliste", "Fixer une contribution mensuelle"], "en": ["Compare specifications and prices", "Set a realistic budget", "Choose a monthly contribution"]}},
    {"id": "phone", "category_id": "equipment", "label": {"fr": "Acheter un téléphone", "en": "Buy a phone"}, "guidance": {"fr": ["Comparer les modèles", "Inclure les accessoires nécessaires", "Définir le montant à épargner"], "en": ["Compare models", "Include necessary accessories", "Set the amount to save"]}},
    {"id": "housing", "category_id": "housing", "label": {"fr": "Préparer un logement", "en": "Prepare housing"}, "guidance": {"fr": ["Lister les frais initiaux", "Estimer les charges récurrentes", "Établir une réserve de départ"], "en": ["List initial costs", "Estimate recurring costs", "Set an initial cash target"]}},
    {"id": "business-launch", "category_id": "business", "label": {"fr": "Lancer une activité", "en": "Launch a business"}, "guidance": {"fr": ["Lister les équipements et formalités", "Estimer le coût de démarrage", "Séparer budget personnel et professionnel"], "en": ["List equipment and setup requirements", "Estimate startup costs", "Separate personal and business budgets"]}},
    {"id": "training", "category_id": "education", "label": {"fr": "Financer une formation", "en": "Fund training"}, "guidance": {"fr": ["Vérifier le programme et les prérequis", "Inclure les frais annexes", "Planifier les échéances"], "en": ["Check the curriculum and prerequisites", "Include additional costs", "Plan payment dates"]}},
    {"id": "trip", "category_id": "travel", "label": {"fr": "Préparer un voyage", "en": "Plan a trip"}, "guidance": {"fr": ["Estimer transport et hébergement", "Prévoir les dépenses sur place", "Ajouter une marge pour imprévus"], "en": ["Estimate transport and lodging", "Budget for on-site expenses", "Add a contingency margin"]}},
    {"id": "vehicle", "category_id": "mobility", "label": {"fr": "Acheter un véhicule", "en": "Buy a vehicle"}, "guidance": {"fr": ["Comparer le coût total", "Inclure entretien et assurance", "Définir un plafond d'achat"], "en": ["Compare total ownership costs", "Include maintenance and insurance", "Set a purchase ceiling"]}},
    {"id": "custom", "category_id": "personal", "label": {"fr": "Projet personnalisé", "en": "Custom project"}, "guidance": {"fr": ["Décrire le résultat attendu", "Chiffrer les étapes", "Définir une échéance réaliste"], "en": ["Describe the intended outcome", "Estimate each step", "Set a realistic deadline"]}},
]


def project_catalogue() -> dict:
    return {"categories": PROJECT_CATEGORIES, "templates": PROJECT_TEMPLATES}
