import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the SVG arrow from all project-card-cta sections in index.html
html = re.sub(
    r'<div class="project-card-cta">\s*<span>View Projects</span>\s*<svg.*?</svg>\s*</div>',
    '<div class="project-card-cta">\n                        <span>View Projects</span>\n                    </div>',
    html,
    flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Find and replace the .project-card-cta CSS rules
old_cta_css = '''
.project-card-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 18px 18px;
    margin: 0 18px 18px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--c-text);
    font-family: var(--font-heading);
    font-size: 0.92rem;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.project-card-cta svg {
    transition: transform 0.3s ease;
}

.project-card:hover .project-card-cta {
    background: var(--c-primary);
    color: #121417;
    border-color: var(--c-primary);
}

.project-card:hover .project-card-cta svg {
    transform: translateX(4px);
}
'''

new_cta_css = '''
.project-card-cta {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 32px;
    background: var(--c-primary);
    color: #121417;
    border: none;
    font-family: var(--font-heading);
    font-size: 0.95rem;
    font-weight: 700;
    border-radius: 50px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s var(--ease-out);
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.project-card:hover .project-card-cta {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, -50%) scale(1);
}
'''

# The CSS might not exactly match due to line endings or spacing, so we can replace using regex or just appending if replacing fails.

