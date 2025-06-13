#!/bin/sh
set -e

if [ -n "$CPAT_CLIENT_BASE_HREF" ] && [ "$CPAT_CLIENT_BASE_HREF" != "/" ]; then
    echo "Configuring base href to: $CPAT_CLIENT_BASE_HREF"

    BASE_HREF="$CPAT_CLIENT_BASE_HREF"
    case "$BASE_HREF" in
        */) ;;
        *) BASE_HREF="$BASE_HREF/" ;;

    find ../client/dist/browser -name "index.html" -type f -exec \
        sed -i "s|<base href=\"/\">|<base href=\"$BASE_HREF\">|g" {} +

    echo "Base href updated to: $BASE_HREF"
else
    echo "Using default base href: /"
fi

exec "$@"