"""Montants en unités mineures (entiers) et répartition par pourcentages."""

CURRENCIES: dict[str, int] = {
    "XOF": 0,
    "XAF": 0,
    "EUR": 2,
    "USD": 2,
    "GBP": 2,
    "CAD": 2,
    "CHF": 2,
    "MAD": 2,
    "NGN": 2,
    "GHS": 2,
    "KES": 2,
    "ZAR": 2,
}

MAX_INCOME_MINOR = 1_000_000_000_000


def split(income_minor: int, pcts: list[int]) -> list[int]:
    """Répartit `income_minor` selon `pcts` (somme 100) en entiers exacts.

    Chaque part est arrondie au plus proche ; le reliquat part sur le plus
    grand pourcentage (premier en cas d'égalité) pour que la somme soit exacte.
    """
    if sum(pcts) != 100 or any(not 0 <= p <= 100 for p in pcts):
        raise ValueError("pcts doit contenir des pourcentages 0-100 dont la somme vaut 100")
    if not 0 <= income_minor <= MAX_INCOME_MINOR:
        raise ValueError("income_minor hors limites")

    parts = [(income_minor * p + 50) // 100 for p in pcts]
    largest = max(range(len(pcts)), key=lambda i: pcts[i])
    parts[largest] += income_minor - sum(parts)
    return parts
