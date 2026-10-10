# Reading Someone Else's Hardware

I've been thinking about unfinished things a lot lately.

Not in a frustrated, this-project-has-been-on-my-list-for-six-months kind of way. More in a "what does a half-built thing actually contain" kind of way. Because I think unfinished things hold more information than finished ones. A finished product shows you what someone decided. An unfinished one shows you how they thought.

There's something exposed about work-in-progress that completion seals off. When you're done, you polish the edges, clean up the traces, hide the scaffolding. When you're not done and something gets left in the middle, all of that is still visible. The thinking is still there in the material.

Together with a friend who was also close to Marco, we inherited a piece of unfinished hardware from someone who died too early. And over the past few weeks we've been trying to read what he left behind.

## The Clock

Marco was an amateur filmmaker. Every year he competed in the 48 Hour Film Project, a competition where teams make a complete short film from scratch in 48 hours. Concept, script, shooting, editing, sound, delivered. Forty-eight hours. That's the whole thing.

In typical Marco fashion, he was building a countdown clock for it.

Not a phone timer. Not a laptop with a tab open. A physical clock with six custom seven-segment LED displays, hand-wired on perfboard, driven by a Raspberry Pi, housed in what looked like a scoreboard. It was the kind of thing you build when you care too much about something to just use a normal solution.

The displays are enormous. Each digit is made of 24 red 3mm LEDs per segment, wired in series chains to run off 12V. Seven segments per digit, 168 LEDs per digit, six digits total. When it eventually counts down, it's going to count down *loudly*. The kind of red that fills a room.

He never finished it. Too much work had gone into it to just leave it in a box.

## What Hardware Remembers

When we opened the box he left behind, the Pi was gone. Maybe it failed and he pulled it. Maybe it's in another box somewhere. The driver board was there though: green perfboard, hand-soldered, 74HC595 shift registers daisy-chained together, ULN2003A Darlington arrays to sink the current for the LED chains. Point-to-point wiring between through-hole components, the kind of work that takes patience.

A few weeks later, the friend backed up one of Marco's old Raspberry Pi images without thinking much of it. It was probably the missing controller for this clock.

And there was a Python file. Dated 2018-07-17. His name in the header comment. Team Aperture.

The code wasn't complete. There was a `loop()` function that started but didn't finish. A `hc595_shift()` that had a `pdb.set_trace()` left in it, a debugging breakpoint he never removed, frozen in the middle of figuring something out. The GPIO mode was set to `BOARD` but the pin numbers used `BCM` numbering. A subtle bug. The kind of thing you catch on the next session.

There was no next session.

## What Reverse Engineering Actually Is

I spent an evening tracing the hardware against the code comments he left. The comments were generous. He'd documented the segment mapping, the display order, the pin connections. He was writing for a future version of himself who might need to pick this back up. He was writing for me, it turns out, just without knowing it.

The architecture was clean. Six shift registers in a chain, clock, latch, and data lines from the Pi to all of them simultaneously. Send six bytes, pulse the latch, and each display lights up. The ULN2003As sink current through the segment lines to ground, which is why no current-limiting resistors were needed: the LED chains themselves drop almost exactly 12V in series.

He'd thought it through carefully. Every decision made sense once I understood the constraints he was working within.

That's the thing about reverse engineering someone else's hardware: it's not really about the hardware. It's about reconstructing a sequence of decisions. Why did he use 74HC595s instead of a direct GPIO expander? Because he needed more outputs than the Pi had pins, and shift registers let you drive many lines from just three. Why six separate displays instead of multiplexing? Probably because at 168 LEDs per digit, multiplexing would have required more complex current management, and he wanted the thing to be bright.

Every component is an answer to a question. When you reverse engineer something, you're working backwards from the answers to reconstruct the questions.

## The Unfinished Part

The `loop()` function was supposed to do the actual countdown. Calculate hours, minutes, seconds remaining. Convert each digit to the right segment byte. Shift it all out. Sleep one second. Repeat.

It's not complicated code. An afternoon's work, probably less. He had all the hard parts done: the hardware abstraction, the segment encoding table, the shift function. He just needed to wire them together into a timer.

We're not there yet, but we know exactly what's left. The missing loop, a Pi to replace the one that disappeared, and some work on the housing. It's the kind of task list where you can see the finish line. One or two more evenings and the clock counts down for the first time.

## What I Keep Thinking About

There's a version of this story where I say something about how finishing Marco's clock is a way of remembering him, which is true, but it's also a little too clean. The real thing I keep coming back to is the `pdb.set_trace()`.

He was debugging. He hit a problem, inserted a breakpoint to understand what was happening, and then something happened. The session ended. Maybe the competition started. Maybe he got pulled away. The breakpoint was never removed because there was never a next session to remove it in.

That one line tells me more about how he worked than anything else in the file. He wasn't the kind of programmer who thought debugging was beneath him. He dropped into the REPL, poked at the live state, figured things out interactively. The code has that quality too: pragmatic, direct, written to work rather than to impress.

I think a lot about what it means to leave work behind. Not in a morbid way. More in a practical, what-does-your-code-say-about-you way. The comments he wrote were clear and specific. The variable names made sense. The hardware was documented in the source.

He wrote code that a stranger could pick back up. He just didn't know the stranger would need to.
