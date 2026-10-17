from app.domain.methods import get_method
from app.domain.money import split
from app.schemas.simulation import SimulationIn, Suggestion


def suggest(sim: SimulationIn) -> list[Suggestion]:
    if sim.method == "custom":
        pairs = [(e.kind, e.pct) for e in sim.envelopes or []]
    else:
        pairs = [(e.kind, e.pct) for e in get_method(sim.method).envelopes]
    amounts = split(sim.income, [p for _, p in pairs])
    live = sum(a for (k, _), a in zip(pairs, amounts) if k in ("need", "want", "learn"))
    saved = sum(a for (k, _), a in zip(pairs, amounts) if k in ("save", "save2"))
    ess, sav = sim.essentials, sim.savings
    out: list[Suggestion] = []
    if ess is not None and live < ess:
        out.append(Suggestion(id="essentials-not-covered", params={"live": live, "essentials": ess}))
    if sim.has_debt is True:
        out.append(Suggestion(id="repay-debt-first"))
    if ess is not None and sav is not None and sav < 3 * ess:
        out.append(Suggestion(id="build-emergency-fund", params={"min": 3 * ess, "max": 6 * ess}))
    if sim.income > 0 and saved * 10 < sim.income:
        out.append(Suggestion(id="start-saving-10"))
    if ess is not None and sav is not None and sav >= 3 * ess and sim.has_debt is not True:
        out.append(Suggestion(id="learn-investing"))
    return out
