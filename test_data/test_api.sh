#!/bin/sh
ACCEPT_JSON="-H 'Content-Type: application/json' -H 'Accept: application/json'"
ENDPOINT='http://localhost:8080/api/lists'

echo "Adding a new list"
result=$(curl -sd @new_list.json "$ACCEPT_JSON" $ENDPOINT/create/list)
echo $result
read -p ""

echo "Adding a broken list"
curl -d @broken_new_list.json "$ACCEPT_JSON" $ENDPOINT/create/list
read -p ""

created_list_id=${result:24:24}
