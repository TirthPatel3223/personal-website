// Test a few Claude models to find which one this account has access to
const key = process.env.ANTHROPIC_API_KEY;
const models = [
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'claude-haiku-4-5',
];

async function testModel(model) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with just the word: works' }],
    }),
  });
  const data = await r.json();
  if (data.error) {
    console.log(`❌ ${model}: ${data.error.type} — ${data.error.message}`);
  } else {
    console.log(`✅ ${model}: "${data.content?.[0]?.text}"`);
  }
}

(async () => {
  for (const m of models) await testModel(m);
})();
