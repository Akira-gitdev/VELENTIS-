/* VELENTIS guide: what every part of the app does, in plain words. Works offline. Search at the top. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var SK = 'velentis.manual.open';

  var S = [
    ['start', 'The big idea', [
      ['What Velentis is', 'Velentis turns your real life into a game. You do real things: study, cook, exercise, save money, keep habits. The app gives you XP for them. XP raises your level and your six skills. Nothing is pretend. The harder you work, the stronger your hero.'],
      ['XP and levels', 'Every useful action gives XP. Level 2 needs 100 XP in total, level 3 needs 300, level 5 needs 1000, level 10 needs 4500. Each action type has a daily limit so you cannot just repeat one thing all day. The same item only counts once a day.'],
      ['Your six skills', 'Strength, Endurance, Knowledge, Discipline, Practical skills and Communication. Each tool feeds one or more of them. Each skill levels up on its own (level 2 at 25 XP). Your strongest skill gives your class title on the Inventory screen: Vanguard, Wayfarer, Scholar, Warden, Artisan or Bard.'],
      ['Daily quests', 'Three quests every day, the same for everyone. Each gives a one time bonus of 6 to 14 XP. You see them on Home and on the Quest board.'],
      ['Weekly goal and streaks', 'Be active on 5 different days in a week and you get +40 XP once. Habits also count a streak of days in a row. The app suggests a rest day if you were active 6 or more days.'],
      ['Badges', '25 badges to collect for milestones, like your first step, levels 3, 5 and 10, a 7 day streak, and trying many tools. Badges give no XP. They are for pride.']
    ]],
    ['home', 'Getting around', [
      ['The bottom bar', 'Home, Inventory, World, Workshop and Messages. Inventory is your hero and profile. World is the map with Run, Dungeon, Reps and Workout. Workshop holds all the tools. Messages is friends, chats, guilds, invites and alerts.'],
      ['Home scene', 'The painted home has tappable spots: World, Library, Planner, Habits, Vel, Countdown, Quest board, Notes and Market. The top card shows your level, XP and days active this week. The bottom card shows today’s three quests and a next step.'],
      ['Workshop', 'Tools in five groups: Self, Mind, Life, World and Intelligence. "All tools" lists everything. This guide is in All tools too.']
    ]],
    ['vel', 'Vel and AI', [
      ['Who Vel is', 'Vel is your AI companion. Vel knows your name, level and today’s quests, and talks like a friend who wants you to improve. Vel needs internet and a free AI key.'],
      ['Setting up the AI key', 'Open Workshop, Intelligence, and tap Add key. Get a free Gemini key at aistudio.google.com/apikey, paste it, Save, then Test Vel. A second free key from Groq is optional. It is a backup that takes over when Gemini is busy. Without a key the AI tools do not work, but the rest of the app does.'],
      ['"Error 503" or "Vel is busy"', 'That is Google’s free AI being crowded, not your app. Vel waits and retries twice by itself. Adding a Groq backup key fixes it for good.'],
      ['Friend and Commander mode', 'Friend is the kind default. Commander is stricter and gives orders, with an intensity slider from 1 to 5. Commander costs 20 crystals to unlock in the Market. It softens by itself if your mood log has been low for 3 days.'],
      ['Memories', 'If you switch on "Let Vel remember", Vel can keep lasting, harmless facts about you (up to 40). You can read, add or delete them on the Vel personality screen.'],
      ['Text adventure', 'Pick a genre: Fantasy, Mystery, Sci-fi, Survival, Funny or Spooky. Vel writes a short scene and gives 3 choices, or you type your own move. Pictures are optional and come from an outside picture service, so your picture descriptions are sent there.'],
      ['Writing helper', 'Ask for a story, poem, lyrics or help fixing your writing. Short answers.'],
      ['Your AI key and privacy', 'Your key is only used to talk to the AI service. If you are logged in, a private copy is saved in your account so a new phone gets it back. You can turn that off in Vel settings.']
    ]],
    ['learn', 'Learn', [
      ['Language buddy', 'Practice 19 languages with Vel. Pick your level and a daily goal. Three modes: free chat, role-play (8 scenes like cafe and airport) and Teach me. Every reply shows the sentence, how to say it in English letters, and the English meaning. Mistakes get a gentle fix. Tap Save on new words to keep them. The Words tab brings words back on a schedule (1, 3, 7, 14 and 30 days) with flashcards and a quiz. Hear it reads replies aloud with your phone’s voice and the mic lets you speak. Needs an AI key.'],
      ['Quiz', 'Six categories, 8 questions a round. With an AI key you can quiz yourself on any topic. 3 XP for each right answer.'],
      ['Myths and facts', 'Is this true or a myth? 37 short rounds. Works offline.'],
      ['Knowledge library', '16 short articles in 4 topics. Tap "I read it" for XP. With a key you also get "explain simply" and an Ask Vel box.'],
      ['Flashcards', 'Make decks and cards, or paste notes like "word - meaning" to import many at once. Study cards that are due. Missed cards come back in the same session.'],
      ['Gentleman and Life Skills academies', '8 lessons each. Read, try the task today, then a quick check. XP only when you pass the check on the first try.']
    ]],
    ['life', 'Daily life', [
      ['Fridge chef', 'Tell it what you have. It shows what you can cook now and what you almost can. 37 recipes, mostly Indian home cooking, with a vegetarian switch. Press "I cooked this" and add a photo of your dish to earn 15 XP. Your cooked dishes show in a gallery. Works offline.'],
      ['Expense notebook', 'Log spending with a form or plain words like "pizza 250 yesterday". Shows your month total, a budget bar, category bars and a currency switch. 5 XP for each entry (up to 3 a day).'],
      ['Notes vault', 'Write notes. They save by themselves and you can search. XP once per note when it has at least 20 characters.'],
      ['Countdown board', 'Name an event and a date. It shows how many days are left.'],
      ['Watchlist', 'Anime, shows, movies, songs and books. Tap the circle to move between Planned, In progress and Finished. Finishing gives XP.'],
      ['Voice memos', 'Record short audio notes. They stay only on this phone and are not backed up.'],
      ['Wardrobe', 'Add your real clothes with photos. The app reads the main colour. Each day it suggests 3 outfits that match, avoids repeats and has a Shuffle. "Wear this today" gives 3 XP. Photos are backed up in your account vault.']
    ]],
    ['self', 'Self', [
      ['Habits', 'Check off your habits each day for 10 XP each. Each habit counts its own streak. Delete with a second tap. See the last 7 days on the habit stats screen.'],
      ['Daily planner', 'Add tasks for any day, with an optional time. Move unfinished tasks to today. 6 XP per finished task.'],
      ['Focus timer', 'Choose 15, 25, 45 or your own minutes. It keeps running if you close the app. It beeps and vibrates at the end. XP only when the round finishes.'],
      ['Mood journal', 'Rate your mood 1 to 5 with an optional note. A 14 day chart shows your pattern. 5 XP once a day.'],
      ['Hero (your avatar)', 'Change skin, face, eyes, mouth and hair. Sets lets you wear a full ready-made outfit. There are 4: Quiet Knit (free gift for every account), Violet Hood (level 10), Gate Runner and Night Raider (dungeon loot or the Market). Wearing a full set covers your custom look. Take it off to return to your own hero. More bodies are coming.'],
      ['Gear', 'Your hero has 8 gear slots that glow as an aura. A slot opens when its skill reaches level 2 (Cloak level 5, Crown level 10). Dungeons upgrade the tiers: Worn, Tempered, Runed, Mythic.']
    ]],
    ['move', 'Move and explore', [
      ['Run tracker', 'Press Start and walk or run with the screen on. A real map follows you and draws your trail. It shows time, distance, pace and how strong your GPS signal is. When you finish you see your whole route and can open it again later from the history. XP is 4 per half kilometre (need at least 200 m and a believable speed). The map is smoothed, so a shaky GPS does not add fake distance.'],
      ['Areas explored', 'The map is split into 200 m squares. Squares you have walked in glow gold. The count shows on your profile.'],
      ['Dungeon gates', 'Press Find gates. You get 3 gates at real named places near you, like a park or a temple, each with a real walking route. Tap one to preview it, tap again to start. Walk to within 40 m before the timer ends. Harder gates (rank E to S) are farther and give more XP, crystals, loot and a better chance at gear. Rank B and above has a boss floor: do 15 squats or push-ups. Gates are open from 5:30 am to 9:30 pm. Failing costs nothing. Stay on public paths, watch traffic, never enter private land or water.'],
      ['The turning map', 'Like Google Maps. The map turns so the top is the way you are facing. While you walk it uses your walking direction. When you stand still it uses the phone compass. The compass in the corner always points north. Tap it to switch between "map turns with me" and "north is up". A blue beam shows where you face. An arrow at the edge points to the gate when it is off screen. If the compass seems wrong, wave the phone in a figure 8. Street names turn with the map.'],
      ['Rep counter', 'Uses the camera to count squats, push-ups, curls and jumping jacks. Needs internet the first time to load the pose model. Sets are saved to your workout log.'],
      ['Workout log', 'Log sets of 12 exercises. Shows your best set and a 7 day chart. XP for your first set each day.']
    ]],
    ['market', 'Market, crystals and gold', [
      ['Crystals', 'Earned by effort: about 1 per 10 XP (up to 60 a day), 3 per rank step from dungeons, and +2 for opening the app each day. They stay on your phone and cannot be traded. Spend them on features: Vel Commander mode (20) and starting a guild (30).'],
      ['Gold', 'Kept safely on the server, so it cannot be faked. You need an account. Earn it from boss floors, selling dungeon loot and winning duels. At most 500 gold a day from bosses and selling. Spend it on outfits (Gate Runner 300, Night Raider 600), gifts and trades.'],
      ['Loot', 'Clearing a dungeon gives a loot item. It waits in the Shop tab until you sell it for gold.'],
      ['Gifts', 'Send a friend up to 100 gold or a tradable outfit, with a short note. One gift per friend per day. Quiet Knit and Violet Hood cannot be given away. Gifts waiting for you show in the Gifts tab.'],
      ['Trades', 'Start a trade with a friend. Each side offers gold and tradable outfits. Both press Confirm and everything swaps at once. Changing an offer cancels both confirmations. Open trades expire after 24 hours.'],
      ['Duels', 'Challenge a friend. Power comes from your level and gear, with a little luck. The loser gives up 10 to 30 percent of their gold (more for a big loss), the winner gets double that. Under 20 gold you lose nothing. 5 duels a day, and one hour between duels with the same friend.'],
      ['Free outfit', 'Every account gets Quiet Knit as a gift within a day. It lands in your Sets tab. You choose when to wear it.']
    ]],
    ['social', 'Friends and account', [
      ['Account', 'Pick a username (3 to 20 letters, numbers or _) and a password of 8 or more. There is no email, so a forgotten password cannot be reset. Write it down.'],
      ['Backup', 'When you are logged in, your data is saved to your account by itself, a short while after each change and when you leave the app. "Back up now" does it right away. On a new phone, log in and your data comes back: habits, notes, runs, avatar, wardrobe photos, cooking photos and AI key. Only voice memo audio stays on the phone.'],
      ['Friends and leaderboards', 'Add friends by username, accept requests and compare stats. Leaderboards: XP this week, total XP, km this week and areas explored, for everyone or just friends. You can hide yourself with the sharing switch. Shared: username, level, XP, weekly km, areas explored. Never shared: notes, mood, money or chats.'],
      ['Chats and guilds', 'Private messages with friends. Guilds are groups with their own chat and a weekly XP ranking. You can be in up to 5. Joining is free. Starting a guild costs 30 crystals.']
    ]],
    ['help', 'When something is wrong', [
      ['Vel says error 503', 'The free AI is busy. Wait a moment and tap Try again. Add a Groq backup key for a permanent fix.'],
      ['The map is blank', 'Map pictures need internet. Your trail still draws on a plain grid. Gates then use the older straight-line style.'],
      ['"GPS is weak"', 'Go outside to open sky and wait. The app ignores bad readings on purpose so your distance stays honest.'],
      ['My outfit gift did not arrive', 'Log in, then open Market. If it says it needs the third setup file, the owner must run VELENTIS-supabase-3.sql in Supabase once. Quiet Knit then shows in Hero, Sets.'],
      ['My girl avatar is gone', 'You are wearing a full outfit set. Open Hero, Sets and tap Take off.'],
      ['Data after reinstalling', 'Log in with the same username and password. If you were never logged in, nothing was backed up. Always check that Account says "Backed up just now" before deleting the app.'],
      ['Notifications', 'Velentis does not send phone notifications yet.']
    ]]
  ];

  var Q = '', OPEN = {}; try { OPEN = JSON.parse(localStorage.getItem(SK) || '{}') || {}; } catch (e) {}
  function render() {
    var el = $('v-manual'); if (!el) return;
    var q = Q.trim().toLowerCase(), total = 0;
    var body = S.map(function (sec) {
      var items = sec[2].filter(function (it) { return !q || (it[0] + ' ' + it[1] + ' ' + sec[1]).toLowerCase().indexOf(q) !== -1; });
      if (!items.length) return ''; total += items.length;
      var open = q || OPEN[sec[0]] ? ' open' : '';
      return '<details class="card pad man-sec" data-sec="' + sec[0] + '"' + open + ' style="margin-bottom:10px"><summary style="cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;align-items:center">' + esc(sec[1]) + '<span class="note">' + items.length + '</span></summary>' +
        items.map(function (it) { return '<div style="margin-top:12px"><div class="nm" style="font-weight:700">' + esc(it[0]) + '</div><div class="sub" style="margin-top:3px;line-height:1.5">' + esc(it[1]) + '</div></div>'; }).join('') + '</details>';
    }).join('');
    el.innerHTML = bar(u.BACK_TOOLS, 'Guide to Velentis') +
      '<div class="card hero"><span class="chip">' + ic('book') + '</span><h2>How Velentis works</h2><p>Do real things, earn XP, grow your hero. Open a section below, or search for anything.</p></div>' +
      '<input class="field" id="manQ" type="search" placeholder="Search the guide (try: gold, map, backup)" aria-label="Search the guide" autocomplete="off" value="' + esc(Q) + '" style="margin-bottom:12px">' +
      (body || '<p class="note">Nothing matches. Try another word.</p>') +
      '<div class="card pad"><div class="eyebrow">XP at a glance</div><div class="sub" style="line-height:1.6;margin-top:6px">Habit 10 (60 a day) · Run 4 per 0.5 km · Dungeon 8 per rank step · Workout 10 · Recipe cooked 15 · Planned task 6 · Focus 2 per 5 min · Quiz answer 3 · Language turn 3 · Mood 5 · Note 4 · Expense 5 · Vel chat 2 · Flashcard 2</div></div>';
    var qi = $('manQ'); if (qi && q) { try { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } catch (e) {} }
  }
  document.addEventListener('input', function (e) { if (e.target.id === 'manQ') { Q = e.target.value; render(); } });
  document.addEventListener('toggle', function (e) { var d = e.target; if (d && d.classList && d.classList.contains('man-sec') && !Q) { OPEN[d.getAttribute('data-sec')] = d.open ? 1 : 0; try { localStorage.setItem(SK, JSON.stringify(OPEN)); } catch (x) {} } }, true);
  V.registerTool('manual', function () { Q = ''; render(); });
  V.registerSearch && V.registerSearch(function (q) { return /guide|manual|help|how|what does/.test(q) ? [{ icon: 'book', title: 'Guide to Velentis', sub: 'Every feature explained', to: 'manual' }] : []; });
})();
