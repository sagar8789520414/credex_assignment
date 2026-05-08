# Prompts

## AI Summary Prompt

Used in `src/components/AISummary.tsx` to generate the ~100-word personalised audit summary.

### The prompt

```
You are a concise financial advisor for tech startups. Write a ~100-word personalised audit summary for a {teamSize}-person team whose primary AI use case is "{useCase}".

Their current AI tool spend and recommendations:
{toolLines}  ← format: "- ToolName: $X/mo (user-reported) → Action → $Y/mo (saves $Z/mo)"

Total potential savings: $X/month ($Y/year).

Rules:
- Write in second person ("Your team...").
- Use the exact dollar figures shown above — do not invent or round differently.
- If a general-purpose tool (like Gemini or ChatGPT) is being used for a specialised task
  (like coding), explicitly call this out and recommend the specialised alternative ONLY
  if it is actually cheaper based on the numbers above.
- Do not recommend a switch if the alternative costs more than the current spend.
- Do not use bullet points. Write flowing prose.
- Be direct and actionable. No filler phrases.
- Do not mention Credex by name.
```

### Why I wrote it this way

- **"Financial advisor for tech startups"** — sets the persona to be direct and numbers-focused, not marketing-speak
- **Second person** — makes the summary feel personal, not like a generic report
- **"Don't use bullet points"** — the results page already has a bullet breakdown; the summary should be prose that synthesises the findings
- **"Do not mention Credex by name"** — the summary should feel like independent advice; the Credex CTA is a separate UI element
- **~100 words** — long enough to be substantive, short enough to be read in 20 seconds

### What I tried that didn't work

1. **First attempt:** No persona instruction. The output was generic ("Based on your inputs, you could save money by..."). Adding the financial advisor persona made it significantly more specific.

2. **Second attempt:** Asked for "3 key insights." The model produced bullet points even when told not to. Removing the numbered structure instruction and just saying "don't use bullet points" fixed it.

3. **Third attempt:** Included "mention Credex as a solution." The output felt like an ad, not advice. Removed it — the Credex CTA is more effective as a separate UI element after the user has already seen the savings number.

### Model choice

Claude Haiku (`claude-3-haiku-20240307`) — fastest and cheapest Claude model, sufficient for a 100-word summary. Latency is ~1-2 seconds which is acceptable for a non-blocking UI element.

### Fallback

If the API call fails (network error, rate limit, missing key), `buildFallbackSummary()` generates a template-based summary using the same audit data. The fallback is specific enough to be useful — it references the top saving opportunity by tool name and dollar amount.
