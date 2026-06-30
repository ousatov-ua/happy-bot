# This is example for ytshort

curl -X POST \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ytshort",
    "description": "Get a random, age-safe YouTube Short link"
  }' \
  "https://discord.com/api/v10/applications/YOUR_APPLICATION_ID/commands"
