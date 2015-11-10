#!/bin/bash
curl -XPOST -d "{\"title\": \"Test\", \"description\": \"Test\", \"url\": \"www.test.com\"}" -H "Content-Type: application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies/$1
