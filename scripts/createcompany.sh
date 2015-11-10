#!/bin/bash
curl -i -XPOST -d "{ \"title\" : \"Glo\", \"description\" : \"glo er gott\", \"url\" : \"http://www.glo.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies
echo
curl -i -XPOST -d "{ \"title\" : \"Sambio\", \"description\" : \"flott bio\", \"url\" : \"http://www.sambioin.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies
echo
curl -i -XPOST -d "{ \"title\" : \"Saffran\", \"description\" : \"rusl\", \"url\" : \"http://www.saffran.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies
echo
curl -i -XPOST -d "{ \"title\" : \"Wrong adminToken Company\", \"description\" : \"should fail\", \"url\" : \"http://www.fail.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: siggisaeti" http://localhost:3000/api/companies
echo
curl -i -XPOST -d "{ \"title\" : \"Saffran\", \"description\" : \"sama nafn og hitt saffran\", \"url\" : \"http://www.saffran.is\" }" -H "Content-Type: Application/json" -H "ADMIN_TOKEN: rssiprmp" http://localhost:3000/api/companies
