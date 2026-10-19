"""Plan d'enveloppes d'un mois, taux d'épargne et marches du soleil."""
import re

from app.domain.methods import get_method
from app.domain.money import split

YM = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
SAVE_KINDS = ("save", "save2")


def plan_envelopes(income: int, method: str, custom: list[dict] | None = None) -> list[dict]:
    """Enveloppes prévues (+ sous-enveloppes) ; montants toujours recalculés via `split`."""
    if method == "custom":
        base = [{"label": c.get("label") or c["kind"], "kind": c["kind"], "pct": c["pct"], "children": []} for c in custom or []]
    else:
        base = [{"label": e.key, "kind": e.kind, "pct": e.pct, "children": e.children} for e in get_method(method).envelopes]
    out = []
    for env, planned in zip(base, split(income, [e["pct"] for e in base]), strict=True):
        kids = env["children"]
        amounts = split(planned, [k.pct for k in kids]) if kids else []
        out.append({
            "label": env["label"], "kind": env["kind"], "pct": env["pct"], "planned": planned, "actual": None,
            "children": [{"key": k.key, "pct": k.pct, "planned": a} for k, a in zip(kids, amounts, strict=True)],
        })
    return out


def _saved(envelopes: list[dict], field: str) -> int:
    return sum(e[field] for e in envelopes if e["kind"] in SAVE_KINDS)


def rate_bp(income: int, envelopes: list[dict]) -> int:
    return _saved(envelopes, "actual") * 10000 // income if income else 0


def kept(envelopes: list[dict]) -> bool:
    return _saved(envelopes, "actual") >= _saved(envelopes, "planned")


def sun_steps(rates_bp: list[int]) -> int:
    """Mois clos du plus ancien au plus récent : le 1er compte 1, chaque suivant 1 si son taux dépasse strictement le précédent ; max 12."""
    if not rates_bp:
        return 0
    return min(12, 1 + sum(b > a for a, b in zip(rates_bp, rates_bp[1:])))


def next_ym(ym: str) -> str:
    y, m = int(ym[:4]), int(ym[5:])
    return f"{y + 1}-01" if m == 12 else f"{y}-{m + 1:02d}"
