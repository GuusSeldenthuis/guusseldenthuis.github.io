# I Made Patrick Bateman My Personal Trainer

Fitness apps have a UX problem that no amount of gamification fixes: they require you to care about the app.

You have to open it. Navigate to the right screen. Log the right things in the right fields. Keep a streak alive. The app becomes the thing you're maintaining instead of your fitness. I've watched myself spend more mental energy on whether I'd logged yesterday's run than on whether I'd actually gone for a run.

What I wanted was something I could just talk to. Tell it how last week went, ask it what I should do today, and have it sort out the schedule. So I built that. A Telegram bot backed by the Claude API that generates weekly workout plans, syncs them to my task manager, and checks in with me to adjust as the weeks go on.

And because a neutral assistant with a calm, supportive tone was not going to get me out of bed at 7am, I made Patrick Bateman the trainer.

## Why the Persona Matters

Patrick Bateman, for those unfamiliar, is the protagonist of American Psycho. He is also, incidentally, obsessed with his fitness routine. The character has a very specific energy: meticulous, intense, slightly unhinged, deeply judgmental about effort and form.

It turns out this is exactly the right energy for a personal trainer.

The bot introduces itself, keeps clinical notes on your progress, and does not accept excuses with any particular warmth. When you check in and report a bad week, it responds the way Patrick would: acknowledging the information, adjusting the schedule, and making clear that this will not become a pattern. There's something about a strong, specific persona that makes the accountability feel real in a way a neutral assistant never quite manages.

The practical reason it works is that a distinct character forces consistent behavior from the model. Instead of the tone drifting between interactions, the persona anchors it. Every response sounds like the same trainer, because it's always the same character.

## How It Actually Works

The architecture is straightforward. Telegram handles the interface, Claude handles the reasoning, SQLite handles the memory, and Vikunja gets the tasks.

![Vikunja fitness tasks](./images/ai_personal_trainer.jpg "My vikunja's fitness-project")

When you send a message, the bot assembles a context package: your last weekly schedule, the two most recent check-in summaries, and Patrick's latest notebook entry (a 2-4 sentence first-person clinical note he writes after each interaction). That all goes into the system prompt alongside the persona and scheduling rules. Claude responds in character, and if the response contains a JSON block, the bot extracts the tasks and syncs them to Vikunja automatically.

The schedule format is a JSON array of tasks with a title, description, due date, and priority. Priority 2 is a workout day, priority 1 is rest. The bot clears the old tasks before uploading the new ones, so your task list stays clean. (I had some pagination issues with Vikunja)

```python
async def _handle_schedule_response(self, response: str) -> list[dict]:
    match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
    if not match:
        return []
    tasks = json.loads(match.group(1))
    await self.vikunja.clear_all_tasks()
    await self.vikunja.upload_tasks(tasks)
    return tasks
```

The conversation window is the last 20 messages, persisted in SQLite. This means Patrick remembers what you told him last week without you having to repeat yourself, which is the main thing that makes it feel like an actual coach rather than a stateless chatbot.

## The Prompt System

The behavior lives in a `prompts/` directory, not in the Python. Persona, tone, scheduling rules, conversation guidelines — all separate markdown files assembled at runtime. This turned out to be the right call. Tuning the trainer's behavior is just editing text files, and the iteration loop is fast enough that you actually do it.

The scheduling rules in particular went through a lot of iterations. Getting Claude to generate consistent, realistic schedules that respect rest day frequency and progressive overload percentages required being very explicit about the output format and the constraints. The prompt now specifies the exact JSON shape expected, the priority convention, and rules like "schedule always starts tomorrow and runs for 7 days."

```
prompts/
  persona.md        # Patrick Bateman character definition
  schedule.md       # JSON output format and scheduling rules
  tone.md           # Good vs bad tone examples
  conversation.md   # Chat rules, exercise focus
  context.md        # Runtime variable injection
  settings.json     # Client config: activities, overload %, rest frequency
```

`settings.json` is where you configure the actual training parameters: which exercises are allowed, how often rest days should appear, the progressive overload percentage. Change those and the next generated schedule reflects them, no code changes needed.

## What It's Like to Use

I've been using it every day for over two months now. That alone tells you more than anything else I could say about it.

The thing I didn't expect to enjoy is the rest days. Patrick frames them as something you've earned, and when you've actually completed the week's tasks, that lands differently than a generic "recovery is important" notification from an app. It's a small thing, but it makes you want to finish the week so the rest day means something. If I miss a session, I don't just skip it and move on. I'll go for a run instead, or repeat a portion of the workout. The streak isn't in the app, it's in my head and for Patrick my fictional personal trainer, and that turns out to be way more motivating for me.

After two months the results are visible. More muscle, noticeably better shape. I also got a treadmill recently, which Patrick has folded into the schedule, so now it's not just strength work. The stamina side is coming along too, which wasn't really something I was focused on before having easy access to one.

The whole thing runs as a systemd service on the NAS. It has been running without issues since day one, which by my personal infrastructure standards means it's basically production-grade.
