#!/usr/bin/env python3
"""
package.py - builds the two zip files you hand around.

    python3 tools/package.py            (writes into ./dist/)

  dist/iskcon-juja-DEPLOY.zip   ONLY the website files (the contents of site/). This is what you upload to
                                Netlify. It deliberately excludes supabase/ (database scripts), tools/, docs/
                                and this README, so none of that is ever published on the internet.
  dist/iskcon-juja-PROJECT.zip  EVERYTHING (site, database scripts, tools, docs, README). This is what you give
                                to a new AI agent so it can continue the work exactly.
Runs the checker first and refuses to package if it finds errors.
"""
import pathlib, subprocess, sys, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main():
    if subprocess.run([sys.executable, str(ROOT / "tools" / "check_site.py")]).returncode != 0:
        sys.exit("Not packaging: fix the errors above first.")
    DIST.mkdir(exist_ok=True)

    deploy = DIST / "iskcon-juja-DEPLOY.zip"
    with zipfile.ZipFile(deploy, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted((ROOT / "site").rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(ROOT / "site"))

    project = DIST / "iskcon-juja-PROJECT.zip"
    skip = {"dist", "__pycache__", ".git"}
    with zipfile.ZipFile(project, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(ROOT.rglob("*")):
            if f.is_file() and not (set(f.relative_to(ROOT).parts) & skip):
                z.write(f, pathlib.Path("iskcon-juja-project") / f.relative_to(ROOT))
    print("wrote", deploy.name, "and", project.name, "in", DIST)


if __name__ == "__main__":
    main()
