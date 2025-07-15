#!/bin/bash
echo "$CERTBOT_VALIDATION" > "/tmp/certbot-dns-challenge-${CERTBOT_DOMAIN}"
