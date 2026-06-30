export function discordCommandResponse(commandResult) {
  if (commandResult === null) {
    return new Response(null, { status: 204 });
  }

  const data = typeof commandResult === 'string'
    ? { content: commandResult }
    : commandResult;

  return new Response(
    JSON.stringify({
      type: 4,
      data,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function verifyDiscordSignature(request, publicKeyHex) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.clone().text();

  if (!signature || !timestamp || !publicKeyHex) return false;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyHex.match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16))),
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'Ed25519',
      key,
      new Uint8Array(signature.match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16))),
      new TextEncoder().encode(timestamp + body)
    );
  } catch (err) {
    console.log(`Exception while verifyDiscordSignature: ${err}`);
    return false;
  }
}
