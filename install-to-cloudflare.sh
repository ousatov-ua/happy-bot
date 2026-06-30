# create a namespace
wrangler kv namespace create USED_VIDEOS
wrangler kv namespace create WISHES

wrangler secret put DISCORD_PUBLIC_KEY --name happy-bot
# (Paste your Discord Public Key)

wrangler secret put YOUTUBE_API_KEY --name happy-bot
# (Paste your YouTube Data API Key)

# Deploy
wrangler deploy \
  --kv-binding "USED_VIDEOS=$CLOUDFLARE_WRANGLER_USED_VIDEOS_ID" \
  --kv-binding "WISHES=$CLOUDFLARE_WRANGLER_WISHES_ID"
