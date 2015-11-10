#!/bin/bash
echo
curl -i -XPOST -d "{ \"title\" : \"Saffran\", \"description\" : \"sama nafn og hitt saffran\", \"url\" : \"http://www.saffran.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies
