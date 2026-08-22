# SESH preprocessing

`build_sesh.py` потоково читає дві оригінальні книги SESH з `data/raw/` через `openpyxl` у read-only mode і створює чотири файли в `public/data/`.

```bash
python -m pip install -r prep/requirements.txt
python prep/build_sesh.py
python prep/build_sesh.py --check
```

Перевірки перед записом:

- рівно 18 837 людей і 8 023 домогосподарства;
- унікальні cluster/person-позиції та узгоджені household weights;
- сума ваг людей ≈31,143 млн, домогосподарств ≈13,575 млн;
- жодного `KEY_QUEST`, `RAJON`, телефона, відкритого тексту професії або точної локації у виході;
- regression anchors для доходів формуються в `overview.json` і перевіряються JS-тестами.

Вхідні `.xlsx` не змінюються. `--check` читає й валідує їх, але не перезаписує JSON.
