import sphinx_rtd_theme

project = 'C-PAT'
copyright = '2024 U.S. Federal Government (in countries where recognized)'
author = 'Christian Rodriguez'

release = '1.0.0-beta.1'
version = '1.0.0-beta.1'

html_css_files = [
    'css/custom.css',
]

extensions = [
    'sphinx_rtd_theme',
    'sphinx.ext.todo',
    'myst_parser',    
    'sphinx_tabs.tabs',
    'sphinxcontrib.images'
]
html_logo = 'assets/images/cpat.svg'
images_config = {
    'override_image_directive': True,
    'default_image_width': '50%',
    'default_group': 'default'
}

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

html_theme = "sphinx_rtd_theme"

html_theme_options = {
    'logo_only': True,
    'prev_next_buttons_location': 'both',
    'sticky_navigation': True
}
html_show_sphinx = False
html_static_path = ['_static']
html_output_dir = '_build/html'
epub_show_urls = 'footnote'
