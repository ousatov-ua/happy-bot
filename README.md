# happy-bot

## Register a new command

Bulk overwrite Discord commands after command schema changes:

```sh
curl --fail-with-body -X PUT \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @discord-commands.json \
  "https://discord.com/api/v10/applications/YOUR_APPLICATION_ID/commands"
```
