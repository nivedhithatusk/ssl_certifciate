#!/bin/bash
# Called by acme.sh to save DNS challenge token

DOMAIN="_acme-challenge.$1"
TOKEN_VALUE="$3"

FILE="/tmp/certbot-dns-challenge-$1"
echo "$TOKEN_VALUE" > "$FILE"
