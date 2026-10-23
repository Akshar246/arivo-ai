# First users: how I'm testing Arivo with real students

Everything so far was tested by me. This is the plan for finding out whether it is useful, understandable and trusted by someone who is not me.

## What I want to learn

1. Can a student sign up and find a job they would apply for, without help?
2. Do they understand the sponsor badge, the salary check and what "not confirmed" means?
3. Do students outside tech find enough jobs?
4. Do they use the Sponsorship Scout, and is its email useful?
5. What is missing that I have not thought of?

**It is working if** most testers finish sign-up, find at least one role they would apply for, and explain the sponsor badge correctly in their own words. If non-tech students find little, wider employer coverage is the next build.

## Who to ask

Aim for 5 to 10 people with different fields and visa situations: Graduate visa, Student visa, and some who will need sponsorship later. Good places: the university's international student office or careers team, course group chats, student societies, and friends of friends. Do not test only with people who already like me.

## Messages

### A. Email to the international office or careers team

> **Subject:** A free tool for international students job hunting in the UK: could I ask for 10 minutes?
>
> Hi [name],
>
> I'm [your name], an international MSc student at [university]. I've built a free website, Arivo AI, for international students looking for UK jobs. It shows roles from employers that hold a Skilled Worker licence (checked against the Home Office register), flags roles whose published salary might meet the visa minimum, and helps with CV checks and interview practice.
>
> It's early, and I want honest feedback from 5 to 10 students before sharing it more widely. Could you either point me to students who'd try it for 15 to 20 minutes, or share a short note with them?
>
> A few things you'll want to know: it's free; it does not give immigration advice, says so clearly, and tells students to confirm with your team; it stores only what students enter, they can delete everything with one click, and the privacy policy is here: [link]/#/privacy. I'm happy to show you first, before anything goes to students.
>
> Thank you,
> [name] · [link] · [email]

### B. Post for a group chat or society

> Hi all, I'm an international MSc student building a free site to help us find UK jobs from employers that actually hold a sponsor licence: [link]
>
> It's early, so I need honest feedback. 15 minutes of your time, then tell me what's confusing or missing (there's a Feedback button inside). If you're on the Graduate visa or heading that way, you're exactly who I need.
>
> It doesn't give immigration advice and says so. You can delete your account any time.

### C. Personal message to one student

> Hey [name], could I ask a favour? I've built a free site to help international students find UK jobs from sponsor-licensed employers, and I'm testing it with a few people. Could you try it for 20 minutes, ideally on a call where you share your screen? I won't help or explain, because I'm testing the site, not you. If anything confuses you, that's exactly what I need to hear.

### D. After they've tried it

> Thank you, that was really useful. If you have two minutes: what was the most confusing moment, what did you trust or not trust, and would you use it again? I'll fix the top issues and let you know when they're done.

## Running a session (about 20 minutes)

**Before:** send the link and ask them to use their own laptop or phone. Tell them what will happen, that they can stop any time, and that you'll take notes. **Only record if they say yes.** They can use a fresh account, and they never have to upload a real CV.

**Say as little as possible during the tasks.** If they ask "what do I do?", answer "what would you do if I wasn't here?"

| Task | What to watch |
|---|---|
| 1. "Sign up and tell me what you expect this site to do." | Do they read the landing page? Is sign-up clear? Time to finish onboarding. |
| 2. "Find a job you'd consider applying for." | Time to the first job they like. Do they change the search? Do they give up? |
| 3. "Does that employer sponsor visas? How do you know?" | Do they find the badge? Do they read it correctly? Do they understand "not confirmed"? |
| 4. "What does this label mean?" (point at the salary check) | Their own words. Fear, confusion, or "this is helpful"? |
| 5. "Open the Scout and tell me what you think it does." | Do they turn it on? Do they understand what it will email? |

Write down every pause, wrong click, and sentence they say out loud. **Quotes are more useful than opinions.**

## Five questions at the end

1. What was the most confusing moment?
2. What did you trust, and what didn't you trust?
3. What did you find most useful?
4. What's missing that you expected?
5. Would you use it again, or recommend it? Why or why not?

## Reading what comes in

Students can send notes with the Feedback button in the app. To read them, run this on your own computer:

```bash
cd backend
node scripts/feedback.js        # latest 30 notes
node scripts/feedback.js 100    # latest 100
```

To also get an email each time one arrives, set `FEEDBACK_NOTIFY_EMAIL` on the backend. A student's email is only included if they ticked the box saying you may reply.

## Turning notes into decisions

Keep a simple table. When the same problem appears in three or more sessions, it is real.

| Problem | Seen in | What I'll change | Done |
|---|---|---|---|
| | | | |

Fix the top three, then test again with new people. Tell testers when their problem is fixed: that is the best way to keep them.

## Looking after the people who help

Tell them what happens to their data and link the privacy policy. Do not use anything they type or say beyond improving Arivo. Thank them. If they want their data deleted, do it the same day.
