#!/bin/bash
curl -XPOST -d "{ \"search\": \"$1\" }" -H "Content-Type: application/json" -H "ADMIN_TOKEN: rass" http://localhost:3000/api/companies/search
