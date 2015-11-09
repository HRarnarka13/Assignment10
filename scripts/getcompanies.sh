#!/bin/bash
curl -XGET http://localhost:3000/api/companies | python -m json.tool
curl -XGET http://localhost:3000/api/companies\?page\=1\&max\=1 | python -m json.tool
