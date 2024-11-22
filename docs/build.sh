#!/bin/bash

SPHINX_IMAGE_W_REQUIREMENTS=sphinx-w-requirements

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

# Create _build if it doesn't exist
mkdir -p _build

# Clean up _build
find _build -type f -not -name '.gitignore' -delete
find _build -type d -empty -delete

docker build -t $SPHINX_IMAGE_W_REQUIREMENTS .

docker run --rm -v $(pwd):/docs $SPHINX_IMAGE_W_REQUIREMENTS