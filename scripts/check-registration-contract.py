#!/usr/bin/env python3
"""Static contracts for the Star Singers registration data model."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
code = (root / "Code.gs").read_text(encoding="utf-8")
client = (root / "backend-client.js").read_text(encoding="utf-8")
index = (root / "index.html").read_text(encoding="utf-8")
admin = (root / "admin.html").read_text(encoding="utf-8")
readme = (root / "README.md").read_bytes()
backup = (root / "README.md.backup").read_bytes()
checks = {
    "28-column registration schema": "Age Category'" in code and "Gender','Date of Birth','Age at 31-Dec-2026','Age Category'" in code,
    "registration payload carries gender and DOB": "gender:form.elements.gender.value,dateOfBirth:form.elements.dateOfBirth.value" in client,
    "DOB and gender fields exist in public form": 'name="gender"' in index and 'name="dateOfBirth"' in index,
    "backend row mapping reads category columns 25–28": "gender:gender,dateOfBirth:dob,age:ageInfo?ageInfo.age:'',ageCategory:ageInfo?ageInfo.category:''" in code,
    "registration row uses named headers instead of fragile positional indexes": "function registrationRow_(record)" in code and "REG_HEADERS.map(header=>" in code and "'Gender':gender" in code and "'Age Category':ageInfo.category" in code,
    "legacy repair makes backup before editing": code.index("copyTo(db_())") < code.index("sh.getRange(row,25,1,4).setValues"),
    "DOB normalizer uses a digit regex": r"/^\\d{4}-\\d{2}-\\d{2}$/" in code,
    "category filter normalizes whitespace correctly": r"replace(/\\s+/g,'-')" in code,
    "invalid gender is not inferred": "Gender could not be recovered from the stored value" in code,
    "six category filters exist in backend and admin": all(x in code and x in admin for x in ["male-junior","male-senior","male-super-senior","female-junior","female-senior","female-super-senior"]),
    "admin audit and repair controls are wired": "auditcategorydata" in code and "repaircategorydata" in code and 'id="auditCategoryData"' in admin and 'id="repairCategoryData"' in admin,
    "README backup exactly matches": readme == backup,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + name)
if failed:
    raise SystemExit("Contract checks failed: " + ", ".join(failed))
print(f"All {len(checks)} registration contracts passed.")
