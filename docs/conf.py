import sphinx_rtd_theme

# Project information
project = 'C-PAT'
copyright = '2025 U.S. Federal Government (in countries where recognized)'
author = 'Christian Rodriguez'
release = '1.2.13'
version = '1.2.13'

# Extensions
extensions = [
    'sphinx_rtd_theme',
    'sphinxcontrib.images',
    'sphinx.ext.todo',
    'myst_parser',
    'sphinx_tabs.tabs'
]

# Todo configuration
todo_include_todos = True

# Images configuration
images_config = {
    'override_image_directive': True,
    'default_image_width': '50%',
    'default_group': 'default'
}

# Path configuration
templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
github_doc_root = 'https://github.com/NSWC-Crane/C-PAT/tree/main/docs'
html_static_path = ['_static']
html_output_dir = '_build/html'

# Theme configuration
html_theme = "sphinx_rtd_theme"
html_logo = 'assets/images/cpat.svg'
html_theme_options = {
    'logo_only': True,
    'prev_next_buttons_location': 'both',
    'sticky_navigation': True
}

# Additional HTML configuration
html_css_files = ['css/custom.css']
html_show_sphinx = False
epub_show_urls = 'footnote'