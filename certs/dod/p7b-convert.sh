#!/bin/bash

file_in=$1
file_base="${file_in%.*}"
openssl pkcs7 -print_certs -in $file_in -out $file_base.pem
openssl pkcs12 -export -nokeys  -out $file_base.p12 -in $file_base.pem