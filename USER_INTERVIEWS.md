# User Interviews

Three conversations conducted between 2026-05-04 and 2026-05-05. Each was 12–15 minutes via video call or voice note exchange.

---

## Interview 1 — A.K., Engineering Manager, Series A SaaS (45 people)

**Role:** EM managing a team of 8 engineers. Responsible for tooling budget.

**Direct quotes:**

> "I approved Cursor for the team in January, then someone asked for Copilot in March because they preferred it. I just said yes. I didn't realise we were paying for both until you asked me just now."

> "I look at the AWS bill every month. I never look at the SaaS line items. They're small individually."

> "If something showed me the total and said 'you're paying for two things that do the same job,' I'd act on that immediately. That's embarrassing."

**Most surprising thing:** He had no idea his team was running Cursor Business ($40/seat × 8 = $320/mo) AND GitHub Copilot Business ($19/seat × 8 = $152/mo) simultaneously. $472/month in overlap. He found out during our conversation.

**What it changed about my design:** I had originally planned to show the overlap warning only in the AI summary paragraph. After this conversation, I made it a prominent badge on the affected tool cards — it needs to be impossible to miss.

---

## Interview 2 — S.R., Solo Founder, Pre-seed (2 people)

**Role:** Technical founder, building a B2B analytics tool. Paying for AI tools personally.

**Direct quotes:**

> "I'm on Claude Pro, ChatGPT Plus, and Cursor Pro. That's $60 a month. I keep meaning to cancel one but I never know which one to cut."

> "The problem isn't the price, it's that I don't know if I'm getting value. Like, am I actually using Claude enough to justify $20?"

> "I'd use a tool like this if it told me which one to keep, not just which one is cheaper. Cheaper isn't always better."

**Most surprising thing:** She wasn't primarily motivated by saving money — she was motivated by reducing cognitive overhead. She wanted permission to cancel something. The audit's "keep current plan" verdict for well-optimised stacks is actually valuable to her, not just the savings cases.

**What it changed about my design:** Added the "You're spending well" hero card for low-savings audits. Originally I had planned to always show a savings number, even if it was $0. Her feedback made clear that a positive verdict ("your stack is optimised") is itself a useful output.

---

## Interview 3 — M.T., CTO, Seed-stage startup (12 people)

**Role:** CTO, manages a team of 4 engineers plus contractors. Raised $1.2M seed 6 months ago.

**Direct quotes:**

> "We're on Claude Team, which I signed up for because I thought we needed the team features. I just found out the minimum is 5 seats and we only have 3 people using it. So we're paying for 5."

> "I'd want to see the reasoning, not just the recommendation. If you just say 'switch to X,' I'm going to Google it anyway. Show me why."

> "The shareable link is actually really useful. I'd send this to my co-founder and say 'look at this.' It's a conversation starter."

**Most surprising thing:** He was paying for 5 Claude Team seats ($150/mo) for 3 users because he didn't know about the minimum. Switching to 3 individual Pro plans ($60/mo) saves $90/month. He said "I would have fixed this months ago if I'd known." The seat minimum logic in the audit engine is directly validated by this conversation.

**What it changed about my design:** The "1-sentence reason" on each recommendation card was originally going to be very short ("Team plan requires 5 seats minimum"). After this conversation, I made the reasons more explanatory — they now include the specific numbers and the logic, not just the conclusion.
