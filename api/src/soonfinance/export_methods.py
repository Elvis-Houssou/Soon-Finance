import json
import sys
from pathlib import Path

from soonfinance.methods import catalogue


def render_methods_json() -> str:
    return json.dumps(catalogue(), indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def main() -> None:
    target = Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8", newline="\n") as file:
        file.write(render_methods_json())


if __name__ == "__main__":
    main()
