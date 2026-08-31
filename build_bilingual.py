import json
import urllib.request
import urllib.parse
import time

categories_id = {
    "diatomic nonmetal": "Nonlogam Diatomik",
    "noble gas": "Gas Mulia",
    "alkali metal": "Logam Alkali",
    "alkaline earth metal": "Logam Alkali Tanah",
    "metalloid": "Metaloid",
    "polyatomic nonmetal": "Nonlogam Poliatomik",
    "post-transition metal": "Logam Pasca-Transisi",
    "transition metal": "Logam Transisi",
    "lanthanide": "Lantanida",
    "actinide": "Aktinida"
}

names_id = {
    "Hydrogen": "Hidrogen", "Carbon": "Karbon", "Nitrogen": "Nitrogen", "Oxygen": "Oksigen",
    "Sodium": "Natrium", "Potassium": "Kalium", "Iron": "Besi", "Copper": "Tembaga",
    "Silver": "Perak", "Gold": "Emas", "Mercury": "Raksa", "Lead": "Timbal", "Tin": "Timah",
    "Sulfur": "Belerang", "Phosphorus": "Fosfor", "Calcium": "Kalsium", "Magnesium": "Magnesium",
    "Silicon": "Silikon", "Aluminum": "Aluminium", "Chlorine": "Klorin", "Fluorine": "Fluorin",
    "Zinc": "Seng", "Platinum": "Platina", "Nickel": "Nikel", "Cobalt": "Kobal",
    "Iodine": "Yodium", "Helium": "Helium", "Neon": "Neon", "Argon": "Argon",
    "Uranium": "Uranium", "Plutonium": "Plutonium"
}

def trans(text):
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        return "".join([s[0] for s in data[0]])
    except:
        return text

try:
    print("Mendownload JSON mentah...")
    req = urllib.request.Request("https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json", headers={'User-Agent': 'Mozilla/5.0'})
    raw_data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

    new_elements = []
    print("Mulai menerjemahkan 118 elemen...")
    for i, el in enumerate(raw_data.get('elements', [])):
        cat_en = el.get('category', '').lower()
        cat_id = categories_id.get(cat_en, "Tidak Diketahui")
        if "unknown" in cat_en: cat_id = "Tidak Diketahui"

        name_en = el.get('name', '')
        name_id = names_id.get(name_en, name_en)

        summary_en = el.get('summary', '')
        # Translate description
        summary_id = trans(summary_en)
        
        new_elements.append({
            "number": el.get("number"),
            "symbol": el.get("symbol"),
            "name_en": name_en,
            "name_id": name_id,
            "category_en": cat_en.title(),
            "category_id": cat_id,
            "category_css": cat_en.replace(" ", "-").replace(",", ""),
            "summary_en": summary_en,
            "summary_id": summary_id,
            "xpos": el.get("xpos"),
            "ypos": el.get("ypos"),
            "atomic_mass": el.get("atomic_mass"),
            "melt": el.get("melt"),
            "boil": el.get("boil"),
            "discovered_by": el.get("discovered_by", "Unknown")
        })
        time.sleep(0.1)  # Prevent Google Translation API rate limits

    with open('d:/Produk-Sell/learning/Periodic-Table/bilingual-wbt.json', 'w', encoding='utf-8') as f:
        json.dump({"elements": new_elements}, f, indent=2)
    print("Selesai membuat bilingual-wbt.json!")

except Exception as e:
    print("Error utama:", e)
