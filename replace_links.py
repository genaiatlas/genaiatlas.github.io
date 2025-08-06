import os

def replace_text_in_md_files(base_path, old_str, new_str):
    for foldername, subfolders, filenames in os.walk(base_path):
        for filename in filenames:
            if filename.endswith(".md"):
                filepath = os.path.join(foldername, filename)

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if old_str in content:
                        updated = content.replace(old_str, new_str)

                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(updated)

                        print(f"✅ Updated: {filepath}")
                    else:
                        print(f"🔍 No change: {filepath}")

                except Exception as e:
                    print(f"❌ Error reading/writing {filepath}: {e}")

# 🔧 Change path if needed — relative to where you run this script
docs_path = "docs"
replace_text_in_md_files(docs_path, "(../../i", "(../../../i")