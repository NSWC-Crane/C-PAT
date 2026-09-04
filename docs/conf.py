# Project information
project = 'C-PAT'
copyright = '2026 U.S. Federal Government (in countries where recognized)'
author = 'Christian Rodriguez'
release = '1.4.5'
version = '1.4.5'

# Extensions
extensions = [
    'sphinxcontrib.images',
    'sphinx.ext.todo',
    'myst_parser',
    'sphinx_tabs.tabs'
]

# To do configuration
todo_include_todos = True

# Images configuration
images_config = {
    'override_image_directive': True,
    'default_image_width': '50%',
    'default_group': 'default'
}

# Path configuration
templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', '.venv']
github_doc_root = 'https://github.com/NSWC-Crane/C-PAT/tree/main/docs'
html_static_path = ['_static']
html_output_dir = '_build/html'

# Theme configuration
# Layer 2 of the documentation theme: the semantic adapter. Every value below
# resolves to a primitive declared in _static/css/00-tokens.css, so the palette
# has exactly one source of truth and this file holds no colour literals.
html_theme = 'furo'

pygments_style = 'a11y-high-contrast-light'
pygments_dark_style = 'a11y-high-contrast-dark'

html_theme_options = {
    'light_logo': 'img/cpat-on-light.svg',
    'dark_logo': 'img/cpat-on-dark.svg',
    'sidebar_hide_name': True,
    'top_of_page_buttons': [],
    'light_css_variables': {
        'color-background-primary': 'var(--cpat-surface-0)',
        'color-background-secondary': 'var(--cpat-surface-50)',
        'color-background-hover': 'var(--cpat-surface-100)',
        'color-background-hover--transparent': 'var(--cpat-surface-100-a0)',
        'color-background-border': 'var(--cpat-surface-200)',
        'color-background-item': 'var(--cpat-surface-200)',
        'color-foreground-primary': 'var(--cpat-surface-700)',
        'color-foreground-secondary': 'var(--cpat-surface-600)',
        'color-foreground-muted': 'var(--cpat-surface-600)',
        'color-foreground-border': 'var(--cpat-surface-400)',
        'color-brand-primary': 'var(--cpat-surface-900)',
        'color-brand-content': 'var(--cpat-surface-900)',
        'color-brand-visited': 'var(--cpat-surface-700)',
        'color-card-background': 'var(--cpat-surface-0)',
        'color-card-border': 'var(--cpat-surface-200)',
        'color-admonition-background': 'var(--cpat-surface-0)',
        'color-highlighted-background': 'var(--cpat-surface-200)',
        'color-highlight-on-target': 'var(--cpat-surface-100)',
        'color-code-background': 'var(--cpat-surface-50)',
        'color-code-foreground': 'var(--cpat-surface-900)',
        'color-inline-code-background': 'var(--cpat-surface-50)',
        'color-topic-title': 'var(--cpat-surface-900)',
        'cpat-heading-color': 'var(--cpat-surface-900)',
        'cpat-rail-active': 'var(--cpat-surface-600)',
        'cpat-card-border-color': 'var(--cpat-surface-200)',
        'cpat-focus-color': 'var(--cpat-surface-950)',
        'cpat-glow-image': 'none',
        'cpat-glow-blend': 'normal',
        'color-problematic': 'var(--cpat-severity-critical)',
        'color-link-underline': 'var(--cpat-surface-400)',
        'color-link-underline--hover': 'var(--cpat-surface-900)',
        'color-link-underline--visited': 'var(--cpat-surface-400)',
        'color-link-underline--visited--hover': 'var(--cpat-surface-700)',
        'color-admonition-title': 'var(--color-foreground-muted)',
        'color-admonition-title-background': 'transparent',
        'color-admonition-title--note': 'var(--color-foreground-muted)',
        'color-admonition-title-background--note': 'transparent',
        'color-admonition-title--seealso': 'var(--color-foreground-muted)',
        'color-admonition-title-background--seealso': 'transparent',
        'color-admonition-title--admonition-todo': 'var(--cpat-severity-unknown)',
        'color-admonition-title-background--admonition-todo': 'transparent',
        'color-admonition-title--tip': 'var(--cpat-severity-very-low)',
        'color-admonition-title-background--tip': 'transparent',
        'color-admonition-title--hint': 'var(--cpat-severity-very-low)',
        'color-admonition-title-background--hint': 'transparent',
        'color-admonition-title--important': 'var(--cpat-severity-high)',
        'color-admonition-title-background--important': 'transparent',
        'color-admonition-title--attention': 'var(--cpat-severity-medium)',
        'color-admonition-title-background--attention': 'transparent',
        'color-admonition-title--caution': 'var(--cpat-severity-medium)',
        'color-admonition-title-background--caution': 'transparent',
        'color-admonition-title--warning': 'var(--cpat-severity-medium)',
        'color-admonition-title-background--warning': 'transparent',
        'color-admonition-title--danger': 'var(--cpat-severity-critical)',
        'color-admonition-title-background--danger': 'transparent',
        'color-admonition-title--error': 'var(--cpat-severity-critical)',
        'color-admonition-title-background--error': 'transparent',
        'admonition-font-size': '1rem',
        'admonition-title-font-size': '1rem',
        'font-stack': 'var(--cpat-font-sans)',
        'font-stack--monospace': 'var(--cpat-font-mono)',
    },
    'dark_css_variables': {
        'color-background-primary': 'var(--cpat-surface-900)',
        'color-background-secondary': 'var(--cpat-surface-950)',
        'color-background-hover': 'var(--cpat-surface-800)',
        'color-background-hover--transparent': 'var(--cpat-surface-800-a0)',
        'color-background-border': 'var(--cpat-surface-700)',
        'color-background-item': 'var(--cpat-surface-700)',
        'color-foreground-primary': 'var(--cpat-surface-0)',
        'color-foreground-secondary': 'var(--cpat-surface-400)',
        'color-foreground-muted': 'var(--cpat-surface-400)',
        'color-foreground-border': 'var(--cpat-surface-500)',
        'color-brand-primary': 'var(--cpat-surface-0)',
        'color-brand-content': 'var(--cpat-surface-0)',
        'color-brand-visited': 'var(--cpat-surface-200)',
        'color-card-background': 'var(--cpat-surface-900)',
        'color-card-border': 'var(--cpat-surface-700)',
        'color-admonition-background': 'var(--cpat-surface-900)',
        'color-highlighted-background': 'var(--cpat-surface-700)',
        'color-highlight-on-target': 'var(--cpat-surface-800)',
        'color-code-background': 'var(--cpat-surface-950)',
        'color-code-foreground': 'var(--cpat-surface-100)',
        'color-inline-code-background': 'var(--cpat-surface-950)',
        'color-topic-title': 'var(--cpat-surface-0)',
        'cpat-heading-color': 'var(--cpat-surface-0)',
        'cpat-rail-active': 'var(--cpat-surface-400)',
        'cpat-card-border-color': 'transparent',
        'cpat-focus-color': 'var(--cpat-surface-50)',
        'cpat-glow-image': 'var(--cpat-pattern-image), radial-gradient(50% 50% at center -25px, var(--cpat-surface-50) 0%, var(--cpat-glow-falloff) 100%)',
        'cpat-glow-blend': 'hard-light, color-dodge',
        'color-problematic': 'var(--cpat-severity-critical)',
        'color-link-underline': 'var(--cpat-surface-500)',
        'color-link-underline--hover': 'var(--cpat-surface-0)',
        'color-link-underline--visited': 'var(--cpat-surface-500)',
        'color-link-underline--visited--hover': 'var(--cpat-surface-200)',
    },
}

# Additional HTML configuration
html_css_files = [
    'css/00-tokens.css',
    'css/10-constructs.css',
    ('css/20-print.css', {'media': 'print'})
]
html_show_sphinx = False
epub_show_urls = 'footnote'