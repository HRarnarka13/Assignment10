#!/bin/bash
curl -XPOST -d "{\"title\": \"Test\", \"description\": \"Test\", \"url\": \"www.test.com\"}" -H "Content-Type: application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies/$1
echo
curl -XPOST -d "{\"title\": \"Test1\", \"description\": \"Test\", \"url\": \"www.test.com\"}" -H "Content-Type: application/json" -H "ADMIN_TOKEN: rass" http://localhost:3000/api/companies/$1
echo
curl -XPOST -d "{\"title\": \"Test1\", \"description\": \"Sama nafn i update\", \"url\": \"www.test.com\"}" -H "Content-Type: application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies/$1
