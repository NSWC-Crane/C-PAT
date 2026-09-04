#!/bin/bash

SPHINX_IMAGE_W_REQUIREMENTS=sphinx-w-requirements

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

if [[ "$1" = "outdated" ]]; then
    [[ -d .venv ]] || uv venv .venv --python 3.12
    uv pip sync -q requirements.txt --no-build --python .venv && uv pip list --outdated --python .venv
    exit $?
fi

# Create _build if it doesn't exist
mkdir -p _build

# Clean up _build
find _build -type f -not -name '.gitignore' -delete
find _build -type d -empty -delete

docker build -t $SPHINX_IMAGE_W_REQUIREMENTS .

docker run --rm -v $(pwd):/docs $SPHINX_IMAGE_W_REQUIREMENTS