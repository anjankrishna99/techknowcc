import glob

files = glob.glob("projects-*.html")
toast_html = """
    <!-- ========== TOAST NOTIFICATION ========== -->
    <div class="toast" id="toast">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>Thank you for submitting the enquiry! One of our team members will get back to you in 24-48 hours.</span>
    </div>
"""

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if 'id="toast"' not in content:
        target = '<script src="index.js'
        if target in content:
            new_content = content.replace(target, toast_html + target)
            with open(file, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file}")
