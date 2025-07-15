#!/bin/bash
# Called to clean up DNS token

rm -f "/tmp/certbot-dns-challenge-$1"
