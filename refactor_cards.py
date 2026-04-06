import re

html_file = 'index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    html = f.read()

# Array of background images to use iteratively
bg_imgs = [
    'assets/residential-face.jpg',
    'assets/Hero_new.jpg',         # Vastu / Consultants logic
    'assets/commercial.png',       # Industrial
    'assets/project-d.png',        # Structural
    'assets/school-building-face.png', # Institutional
    'assets/Religious-Projects.png',   # Religious
    'assets/Laminate-Hub.png',     # Commercial spaces
    'assets/farmhouse.jpg'         # Farmhouse
]

# We need to find the <div class="services-track"> and change all .service-card inside it.
start_marker = '<div class="services-track" id="services-track">'
end_marker = '<!-- ========== WHY CHOOSE US ========== -->'
start_idx = html.find(start_marker)
end_idx = html.find(end_marker)

if start_idx != -1 and end_idx != -1:
    track_html = html[start_idx:end_idx]
    
    # regex to find each card
    # <div class="service-card"> ... </div>
    # we know there are no nested cards.
    # The structure:
    # <div class="service-card">
    #     <div class="service-icon"> ... </div>
    #     <h3>Title</h3>
    #     <p>Description</p>
    #     <span class="service-arrow">&rarr;</span>
    # </div>
    
    # We will split by '<div class="service-card">'
    parts = track_html.split('<div class="service-card">')
    new_track_html = parts[0]
    
    for i in range(1, len(parts)):
        card_content = parts[i]
        
        # Determine light or dark
        is_odd = (i % 2 != 0)
        card_class = "light-card" if is_odd else "dark-card"
        bg_img = bg_imgs[(i-1) % len(bg_imgs)]
        
        # Remove the <div class="service-icon">...</div> block
        card_content = re.sub(r'<div class="service-icon">.*?</div>\s*', '', card_content, flags=re.DOTALL)
        
        # Find h3, p, span
        title_m = re.search(r'<h3>(.*?)</h3>', card_content)
        title = title_m.group(1) if title_m else "Service"
        
        desc_m = re.search(r'<p>(.*?)</p>', card_content, flags=re.DOTALL)
        desc = desc_m.group(1).strip() if desc_m else ""
        
        # Extract everything after the span ends (to preserve closing div properly, although it's just '</div>')
        rest_m = re.search(r'<span class="service-arrow">.*?</span>(.*)', card_content, flags=re.DOTALL)
        rest = rest_m.group(1) if rest_m else "</div>"

        cta_text = "Learn More &rarr;" if is_odd else "&larr; Explore Tech"
        
        new_card = f"""<div class="service-card {card_class}" style="background-image: url('{bg_img}');">
                        <div class="card-overlay"></div>
                        <div class="card-content">
                            <h3>{title}</h3>
                            <p>{desc}</p>
                            <span class="service-arrow">{cta_text}</span>
                        </div>
                    {rest}"""
        
        new_track_html += new_card
    
    final_html = html[:start_idx] + new_track_html + html[end_idx:]
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(final_html)
    print("Services cards updated in index.html")
    
