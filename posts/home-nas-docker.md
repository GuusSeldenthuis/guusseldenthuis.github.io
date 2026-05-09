# The OS Should Be Disposable

I have a thing where I assume everything is about to fail.

Not in a paranoid way. More in a "this has been working for six months, so statistically something is due" kind of way. Drives fail. SSDs fail. Power supplies fail at 2am on a Sunday. I've lost data before, and the specific feeling of realising something is gone forever has a way of permanently adjusting how you think about infrastructure.

So when I set up my home server, I designed it around the assumption that parts of it will break. The question was just: which parts can I afford to lose, and which ones can't I?

The answer, when you think about it honestly, is almost never the operating system. Nobody has ever cried over a lost Debian install. What matters is the data, and the data almost never lives where the OS lives.

Which made it weird that my setup was arranged in a way where losing the OS drive meant losing everything.

I had a RAID 5 array. Three drives, hardware redundancy, the whole thing. And then I'd mounted all my Docker volumes on the same SSD as the operating system, which completely defeated the point. One bad sector on the wrong drive and I'd lose Plex, Transmission, my shares, my Home Assistant config, everything. The RAID was decorative.

## The Idea

The concept is simple once you say it out loud. The OS lives on the SSD. The SSD is considered expendable. Everything that matters lives on the RAID array. Docker volumes point into `/mnt/raid5`. If the SSD dies, you buy a new one, reinstall Debian, run `docker compose up -d`, and you're back in twenty minutes.

The OS becomes a bootloader with extra steps.

The stack: Transmission, Samba, PostgreSQL, Plex, Home Assistant with a Sonoff Zigbee antenna. All of it pointing its volumes into the RAID, none of it caring what's on the SSD. Deliberately simple. The more moving parts something has, the more things can go wrong at 2am on a Sunday.

## The Part Where Things Went Wrong

The RAID didn't assemble cleanly. Running `mdadm --assemble --scan` returned nothing, which is a slightly terrifying experience when you're looking at three drives containing several terabytes of things you'd prefer to keep.

It turned out fine. The arrays had assembled as `/dev/md126` and `/dev/md127` instead of `md0` and `md1`. mdadm does this when it auto-assembles without a config file. Once you know that, it's obvious. Before you know it, it looks like your data is gone.

The UEFI issue was less subtle. I'd enabled Secure Boot, and the machine stopped posting entirely. Black screen, no BIOS, nothing. The fix was pulling the CMOS battery for a minute. Thirty seconds of actual work preceded by twenty minutes of increasingly anxious Googling.

Plex needed `network_mode: host` for device discovery to work. Home Assistant needed `privileged: true` and a USB passthrough for the Zigbee adapter. Both are the kind of details that cost you an hour the first time.

## What the Recovery Actually Looks Like

Each service's state lives in `/mnt/raid5/docker/servicename`. The compose file is in a git repo. Everything else is reproducible.

One `mdadm --assemble --scan` and a `docker compose up -d` and you have your whole server back. The SSD has Debian, Docker, and the compose file. That's it.

One thing worth saying explicitly: RAID is not a backup. It protects you from a drive failure, not from accidentally deleting something or a fire. The offsite backup is a separate concern, and confusing the two is how people lose things they thought were safe. I use rclone to sync the important shares to Cloudflare R2.

## The Midnight Mindset

The Doomsday Clock is a symbolic clock maintained by a group of atomic scientists since 1947. It represents how close humanity is to a global catastrophe. Midnight is the end. Right now it sits at 89 seconds to midnight, the closest it's ever been.

I think about infrastructure the same way. Not because I'm dramatic about it, but because it's accurate. The clock is always closer to midnight than you think. The drive that's been running fine for four years is four years closer to failing than it was when you bought it. The SSD you're booting from is one bad sector away from a very bad morning.

Designing for that isn't pessimism. It's just honesty about how hardware works.

I built this setup the way I did because I wanted recovery to be boring. Not clever, not impressive, just boring. The SSD fails, you buy a new one, you reinstall Debian, you run one command. The blast radius is small. The process is documented. Nothing depends on you remembering something you configured eighteen months ago.

Simple systems fail in simple ways. That's the whole point.

The SSD will fail eventually. When it does I'll reinstall Debian, clone the repo, and run one command. I'm genuinely looking forward to it in a slightly unhealthy way, just to confirm the theory holds.
