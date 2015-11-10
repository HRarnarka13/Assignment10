#!/bin/bash
curl -XGET http://localhost:3000/api/companies/$1 | python -m json.tool
