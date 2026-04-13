import glob

files = glob.glob("*.html")
replaced = 0

old_text = "<span>Thank you! We'll contact you soon.</span>"
new_text = "<span>Thank you for submitting the enquiry! One of our team members will get back to you in 24-48 hours.</span>"

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if old_text in content:
        new_content = content.replace(old_text, new_text)
        with open(file, "w", encoding="utf-8") as f:
            f.write(new_content)
        replaced += 1
        print(f"Updated {file}")

print(f"Total files updated: {replaced}")
