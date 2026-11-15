/* Built-in learning content (works offline): quiz bank, myths and facts, library, academy lessons. */
(function () {
  'use strict';
  var D = window.Velentis.data = {};

  /* [category, question, correct, wrong1, wrong2, wrong3, why] */
  D.quiz = [
    ['Science', "Which gas do plants take in from the air?", "Carbon dioxide", "Oxygen", "Nitrogen", "Helium", "Plants use carbon dioxide and sunlight to make their food."],
    ['Science', "How many bones does an adult human have?", "206", "180", "250", "300", "Babies have about 300, and many fuse as we grow."],
    ['Science', "What is the closest star to Earth?", "The Sun", "Proxima Centauri", "Sirius", "The North Star", "The Sun is a star, about 150 million km away."],
    ['Science', "At sea level, water boils at what temperature?", "100 °C", "90 °C", "120 °C", "80 °C", "Higher up, where air pressure is lower, water boils at a lower temperature."],
    ['Science', "Which planet is called the Red Planet?", "Mars", "Venus", "Jupiter", "Mercury", "Iron oxide (rust) in the soil gives Mars its red color."],
    ['Science', "What force pulls objects toward the Earth?", "Gravity", "Magnetism", "Friction", "Inertia", "Gravity pulls anything with mass toward other mass."],
    ['Science', "Which is the hardest natural substance?", "Diamond", "Gold", "Iron", "Quartz", "Diamond is made of carbon atoms in a very strong crystal pattern."],
    ['Science', "Which part of a cell holds its DNA?", "The nucleus", "The membrane", "The cytoplasm", "The wall", "The nucleus is like the cell's control room."],
    ['History', "Who was the first President of the United States?", "George Washington", "Abraham Lincoln", "Thomas Jefferson", "John Adams", "Washington took office in 1789."],
    ['History', "In which year did India become independent?", "1947", "1950", "1935", "1942", "India became independent on 15 August 1947."],
    ['History', "Who built the pyramids of Giza?", "Ancient Egyptians", "Romans", "Greeks", "Mayans", "They were built as tombs for pharaohs over 4,000 years ago."],
    ['History', "Who was the first person to walk on the Moon?", "Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "Alan Shepard", "Armstrong stepped out in July 1969 during Apollo 11."],
    ['History', "The Great Wall is in which country?", "China", "Japan", "India", "Mongolia", "It was built in sections over many centuries."],
    ['History', "World War II ended in which year?", "1945", "1939", "1918", "1950", "The war ended in 1945."],
    ['History', "Who painted the Mona Lisa?", "Leonardo da Vinci", "Michelangelo", "Raphael", "Picasso", "Da Vinci painted it in the early 1500s."],
    ['History', "Which empire built the Colosseum?", "The Roman Empire", "The Greek Empire", "The Ottoman Empire", "The Persian Empire", "It opened in Rome around the year 80."],
    ['Geography', "Which is the largest ocean?", "Pacific", "Atlantic", "Indian", "Arctic", "The Pacific covers about a third of the planet."],
    ['Geography', "What is the capital of Japan?", "Tokyo", "Kyoto", "Osaka", "Seoul", "Tokyo has been the capital since 1868."],
    ['Geography', "Which famous river flows through Egypt?", "The Nile", "The Amazon", "The Ganges", "The Danube", "The Nile is one of the longest rivers in the world."],
    ['Geography', "On which continent is the Sahara desert?", "Africa", "Asia", "Australia", "South America", "It is the largest hot desert on Earth."],
    ['Geography', "What is the capital of Australia?", "Canberra", "Sydney", "Melbourne", "Perth", "Many people guess Sydney, but Canberra is the capital."],
    ['Geography', "Which mountain is the highest above sea level?", "Mount Everest", "K2", "Kilimanjaro", "Mont Blanc", "Everest stands about 8,849 meters above sea level."],
    ['Geography', "Which of these countries is in Africa?", "Kenya", "Peru", "Vietnam", "Poland", "Kenya is in East Africa."],
    ['Geography', "Which country has the city of Cairo?", "Egypt", "Morocco", "Turkey", "Iran", "Cairo is Egypt's capital."],
    ['Tech', "What does CPU stand for?", "Central Processing Unit", "Computer Power Unit", "Core Program Utility", "Central Program Update", "The CPU is the main brain of a computer or phone."],
    ['Tech', "Which of these is a programming language?", "Python", "Chrome", "Windows", "Router", "Python is popular for beginners."],
    ['Tech', "What does WWW stand for?", "World Wide Web", "Wide Web World", "Web World Wide", "Wireless Web Window", "The web is the pages you open in a browser."],
    ['Tech', "Computers store information using which digits?", "0 and 1", "1 and 2", "0 to 9", "A and B", "That system is called binary."],
    ['Tech', "What does RAM do in a phone or computer?", "Holds data the device is using right now", "Charges the battery", "Connects to Wi-Fi", "Plays sound", "RAM is short-term memory. It clears when the power goes off."],
    ['Tech', "Which company makes the Android system?", "Google", "Apple", "Intel", "Samsung", "Many phone makers use Android, but Google makes it."],
    ['Tech', "What does HTML describe?", "The structure of a web page", "Your internet speed", "A phone's battery", "A type of image", "HTML tells the browser what is a heading, a paragraph, a button and so on."],
    ['Tech', "Which password is the strongest?", "A long, unique one", "Your name", "123456", "Your birthday", "Length and uniqueness matter most."],
    ['General', "How many days are in a leap year?", "366", "365", "364", "367", "February gets an extra day, the 29th."],
    ['General', "How many colors are in a rainbow?", "7", "5", "6", "8", "Red, orange, yellow, green, blue, indigo, violet."],
    ['General', "How many pieces does each player start with in chess?", "16", "12", "20", "32", "Eight pawns and eight other pieces."],
    ['General', "What is the largest mammal on Earth?", "Blue whale", "Elephant", "Giraffe", "Hippo", "A blue whale can be longer than 25 meters."],
    ['General', "How many minutes are in 2.5 hours?", "150", "120", "130", "160", "2.5 times 60 is 150."],
    ['General', "Which of these is a prime number?", "13", "9", "15", "21", "13 can only be divided by 1 and itself."],
    ['General', "What is the fastest land animal?", "Cheetah", "Lion", "Horse", "Greyhound", "Cheetahs can reach about 100 km/h in short bursts."],
    ['General', "Which language has the most native speakers?", "Mandarin Chinese", "English", "Spanish", "Hindi", "More people speak Mandarin as their first language than any other."]
  ];

  /* [statement, isTrue, explanation] */
  D.facts = [
    ["We only use 10% of our brains.", false, "Brain scans show we use nearly all of it, just not all parts at the same moment."],
    ["Lightning never strikes the same place twice.", false, "Tall things like towers get hit again and again."],
    ["Goldfish only remember things for 3 seconds.", false, "They can remember things for months."],
    ["Bats are blind.", false, "Bats can see. Many also use sound to find their way."],
    ["The Great Wall of China can be seen from space with the naked eye.", false, "It is long but very thin, so astronauts cannot pick it out easily."],
    ["Cracking your knuckles causes arthritis.", false, "Studies have not found a link."],
    ["Honey can last for thousands of years without spoiling.", true, "Sealed honey is so low in water that bacteria cannot grow in it."],
    ["Bananas are berries, but strawberries are not.", true, "By the botanist's definition, a banana is a berry and a strawberry is not."],
    ["Humans have more than five senses.", true, "We also sense balance, temperature, pain and where our body parts are."],
    ["Sugar makes children hyperactive.", false, "Careful studies found no effect. Excitement at parties is the real cause."],
    ["Hair and nails keep growing after death.", false, "The skin dries and pulls back, which only makes them look longer."],
    ["Shaving makes hair grow back thicker.", false, "The tip is blunt after cutting, so it feels coarse, but it is not thicker."],
    ["An octopus has three hearts.", true, "Two pump blood to the gills and one pumps it to the body."],
    ["A day on Venus is longer than its year.", true, "Venus spins so slowly that one turn takes about 243 Earth days, but its year is about 225."],
    ["Chameleons change color mainly to hide.", false, "Mostly it is for mood, heat and talking to other chameleons."],
    ["Cold weather itself gives you a cold.", false, "Viruses cause colds. They just spread more when people stay indoors together."],
    ["Swallowed chewing gum stays in your stomach for 7 years.", false, "It passes through in a few days like other food."],
    ["Mount Everest is the tallest mountain when measured from base to peak.", false, "Mauna Kea in Hawaii is taller from its base on the ocean floor."],
    ["Diamonds are made from compressed coal.", false, "Most diamonds formed deep underground, long before coal existed."],
    ["Ostriches bury their heads in the sand when scared.", false, "They lie low on the ground, which only looks like hiding from far away."],
    ["Dogs see only in black and white.", false, "They see colors, mostly blues and yellows."],
    ["Antibiotics can cure viral infections like the flu.", false, "They work on bacteria, not viruses."],
    ["Sound travels faster in water than in air.", true, "Water is denser, so sound moves about four times faster."],
    ["Bulls charge because they hate the color red.", false, "Bulls cannot see red well. They react to the waving movement."],
    ["Glass is a very slow-flowing liquid.", false, "Glass is a solid. Old windows are uneven because of how they were made."],
    ["Earth is closest to the Sun during the northern summer.", false, "The seasons come from Earth's tilt, not its distance."],
    ["Reading in dim light permanently damages your eyes.", false, "It can tire them, but the effect passes."],
    ["You swallow spiders in your sleep.", false, "Spiders avoid large, breathing, noisy creatures."],
    ["A coin dropped from a skyscraper can kill someone.", false, "It tumbles in the air and hits with only a small sting."],
    ["Camels store water in their humps.", false, "The humps store fat, which gives them energy."],
    ["Penguins live at the North Pole.", false, "Penguins live in the Southern Hemisphere. Polar bears live in the north."],
    ["Hippos are closer relatives of whales than of pigs.", true, "Whales and hippos share a common ancestor."],
    ["Lightning can be hotter than the surface of the Sun.", true, "A bolt heats the air to around 30,000 °C."],
    ["Babies are born with more bones than adults have.", true, "Babies have about 300 bones, and some join together as they grow."],
    ["The tongue has separate zones for sweet, salty, sour and bitter.", false, "Every part of the tongue can taste all of them."],
    ["Humans and chimpanzees share most of their DNA.", true, "We share roughly 98 to 99 percent of our DNA with chimpanzees."],
    ["You lose most of your body heat through your head.", false, "You lose heat from any uncovered part. The head is just a small share."]
  ];

  /* [id, topic, title, body] */
  D.lib = [
    ['sky', 'Science', 'Why the sky is blue', "Sunlight looks white, but it is made of every color. When it enters the air, the tiny gas molecules scatter the short blue waves far more than the long red ones. So blue light bounces all around the sky and reaches your eyes from every direction. At sunrise and sunset the light travels through more air, the blue is scattered away, and the reds and oranges are what is left."],
    ['vaccine', 'Health', 'How vaccines work', "A vaccine shows your body a harmless piece or weak copy of a germ. Your immune system learns to recognize it and makes antibodies, and it keeps a memory. If the real germ shows up later, your body responds fast, often before you feel sick. Some vaccines need boosters because that memory fades over time."],
    ['interest', 'Money', 'What is compound interest', "Interest is the money you earn for keeping money in a bank, or pay for borrowing it. With compound interest, the interest itself starts earning interest. If you save 1,000 at 10% a year, you have 1,100 after one year, then 1,210 after two. The longer you wait, the faster it grows. The same effect makes debt grow quickly when you do not pay it off."],
    ['internet', 'Tech', 'How the internet works', "The internet is a huge network of connected computers. When you open a page, your phone sends a request through your provider to a server, which is a computer that stores the page. The server sends it back in many tiny packets, and your phone puts them together. Cables under the oceans carry most of this, and Wi-Fi is just the last short hop to your device."],
    ['sleep', 'Health', 'Why we need sleep', "During sleep your brain sorts the day's memories, your body repairs muscles, and hormones that control hunger and mood reset. Most teens and adults do best with 7 to 9 hours. Going to bed at the same time each night and keeping screens away for the last 30 minutes helps you fall asleep faster."],
    ['planes', 'Science', 'How airplanes fly', "A wing is curved on top and flatter below. As the plane moves forward, air flows over the wing and gets pushed downward, and the wing is pushed up in return. That upward push is lift. Engines give the speed, and when lift is bigger than the plane's weight, it flies."],
    ['seasons', 'Science', 'What causes the seasons', "Earth is tilted. When your half of the planet tilts toward the Sun, sunlight hits more directly and the days are longer, so it is summer. Six months later it tilts away, the light is weaker and days are shorter, so it is winter. Distance from the Sun does not cause the seasons."],
    ['electric', 'Science', 'How electricity reaches your home', "Power plants spin giant magnets inside coils of wire to make electricity. It travels along thick power lines at very high voltage, because that wastes less energy. Near your home, a transformer lowers the voltage to a safe level, and wires carry it to your sockets."],
    ['inflation', 'Money', 'What is inflation', "Inflation means prices slowly rise over time, so the same money buys a little less each year. If it is 5% a year, something that costs 100 today costs about 105 next year. That is why money sitting under a mattress slowly loses its buying power, and why people try to earn more than inflation on their savings."],
    ['battery', 'Tech', 'How batteries work', "A battery stores energy in chemicals. When you connect a device, a chemical reaction pushes tiny charged particles called electrons through the wire, and that flow powers your phone. In rechargeable batteries, charging pushes the reaction backward so it can be used again. Heat and fully draining it often wear a battery out faster."],
    ['ai', 'Tech', 'What is AI', "Artificial intelligence is software that learns patterns from huge amounts of examples instead of following only fixed rules. A chat AI has read enormous amounts of text and learned to predict a good next word, again and again, to form answers. It can be very helpful, but it can also be confidently wrong, so check important facts."],
    ['gps', 'Tech', 'How GPS works', "Satellites orbiting Earth constantly broadcast the time and where they are. Your phone listens to several of them. Because the signals take slightly different times to arrive, the phone can work out its distance from each satellite and find the one spot you must be standing in. Your phone only listens, so it does not send anything to the satellites."],
    ['zones', 'Science', 'Why we have time zones', "The Earth turns once every 24 hours, so the Sun is overhead at different times in different places. If everyone used one clock, noon could be in the dark. So the world is split into zones, usually an hour apart, so that noon is roughly when the Sun is highest where you live."],
    ['blackhole', 'Science', 'What is a black hole', "A black hole is a place where a huge amount of matter is squeezed into a tiny space, so its gravity is so strong that not even light can escape. Many form when a very large star runs out of fuel and collapses. They are not cosmic vacuum cleaners: if our Sun became one, Earth would keep orbiting just as before."],
    ['heart', 'Health', 'How your heart works', "Your heart is a muscle that works as a pump with four chambers. The right side sends blood to the lungs to pick up oxygen, and the left side sends it around the body. It beats around 100,000 times a day. Regular exercise makes it stronger, so it needs fewer beats to do the same job."],
    ['loan', 'Money', 'How a loan works', "When you borrow money you agree to pay it back plus interest, which is the price of borrowing. Paying it in monthly installments feels small, but the total cost is bigger than what you borrowed. Before taking a loan, ask: what is the interest rate, how long will I pay, and what is the total I will pay back."]
  ];

  /* academy lessons: [id, title, body, tryToday, question, correct, wrong1, wrong2, why] */
  D.gent = [
    ['g1', 'The first impression', "People form an opinion in the first few seconds. Three things help: a calm smile, eye contact, and a firm but not crushing handshake. Say their name back to them, like 'Nice to meet you, Sam.' It shows you are paying attention.", "Greet one person today with eye contact and their name.", "What helps most in a first meeting?", "Eye contact, a smile and using their name", "Looking at your phone", "Speaking as fast as you can", "Staying silent", "Small signs of attention build trust quickly."],
    ['g2', 'Listen more than you talk', "A good conversation is a trade. Ask a question, listen to the whole answer, then ask a follow-up about something they said. Do not wait for your turn to speak. People remember how heard they felt.", "Ask someone one follow-up question today and listen without interrupting.", "What is a good follow-up question?", "One about something they just said", "One about something totally different", "Your own story right away", "No question at all", "A follow-up shows you were really listening."],
    ['g3', 'Table manners', "Wait until everyone is served, or until the host starts. Chew with your mouth closed, keep elbows off the table while eating, and keep your phone away. Pass food to the right, and say thank you to whoever cooked or served.", "At your next meal, keep your phone away until you finish.", "When should you start eating at a shared meal?", "When everyone is served or the host starts", "As soon as your plate arrives", "After you finish your phone call", "Only after the dessert comes", "Waiting shows respect for the people sharing the meal."],
    ['g4', 'Dress to fit', "You do not need expensive clothes. Clean, ironed, and the right size matters more than the brand. Clothes that are too big or too tight look untidy. Keep shoes clean, and match your outfit to the place: a wedding and a gym are different.", "Check one outfit today: is it clean, ironed and the right fit?", "What matters most in how you look?", "Clean, neat and the right fit", "The most expensive brand", "Bright logos", "Wearing the same thing daily without washing", "Fit and cleanliness say more than a price tag."],
    ['g5', 'Punctuality is respect', "Being late tells people their time matters less than yours. Aim to arrive 5 to 10 minutes early. If you will be late, tell them as soon as you know, and say sorry once without a long excuse.", "Be 5 minutes early for something today.", "If you are going to be late, what should you do?", "Tell them early and apologize briefly", "Say nothing and hope they do not notice", "Make up a long excuse", "Do not go at all", "Early warning respects other people's plans."],
    ['g6', 'Staying calm when angry', "Anger is normal, but how you act is your choice. Pause before you reply. Breathe in for 4 and out for 6 a few times. Say how you feel without blaming, like 'I felt upset when...'. If it is too heated, say you need a few minutes and come back.", "Next time you feel annoyed, breathe out slowly 3 times before you speak.", "What is a good first move when you are angry?", "Pause and breathe before replying", "Reply right away", "Shout so they listen", "Send a harsh text", "A short pause helps you choose your words."],
    ['g7', 'Daily grooming basics', "The basics: shower, brush teeth morning and night, clean nails, clean clothes, deodorant, and neat hair. These small habits take ten minutes and change how others see you and how you feel about yourself.", "Trim your nails or tidy your hair today if it needs it.", "Which habit belongs in daily grooming?", "Brushing teeth morning and night", "Skipping showers", "Wearing the same shirt all week", "Biting nails", "Small daily habits add up."],
    ['g8', 'Phone manners', "When you are with someone, give them your attention. Put your phone face down or away. In messages, reply within a reasonable time, avoid writing in all capital letters, and do not forward private messages. If you must take a call, step aside.", "Keep your phone away for your next conversation.", "You are talking with a friend and your phone buzzes. What is polite?", "Leave it until you finish or step aside for urgent things", "Start scrolling", "Answer and talk over your friend", "Hold it up to show them", "Giving your full attention is a sign of respect."]
  ];
  D.skills = [
    ['s1', 'Budget with 50/30/20', "A simple split for your money: 50% for needs like food and rent, 30% for wants like fun and shopping, and 20% for saving or paying debt. The numbers do not need to be perfect. The point is to decide where your money goes before you spend it.", "Write down your monthly money and split it 50/30/20. You can log spending in the Expense notebook.", "In the 50/30/20 rule, what does the 20% go to?", "Savings or paying off debt", "Shopping", "Eating out", "Gifts only", "Paying yourself first builds a safety net."],
    ['s2', 'Build an emergency fund', "An emergency fund is money set aside for surprises like a broken phone or a medical bill. Start small: save a first amount you will not miss, then grow it to cover about three months of basic costs. Keep it somewhere separate so you do not spend it.", "Move a small amount into a separate savings spot today.", "What is an emergency fund for?", "Unexpected costs", "Buying new clothes", "A holiday", "Gifts", "It keeps a surprise from turning into debt."],
    ['s3', 'Plan your week', "At the start of the week, pick your top 3 goals. Each morning, choose the 1 to 3 tasks that matter most and do the hardest one first. Break big tasks into small steps. A short list you finish beats a long list you ignore.", "Pick your top 3 for today in the Daily planner.", "How many top priorities should you pick for a day?", "About 1 to 3", "Twenty", "None", "As many as possible", "A short list is easier to finish."],
    ['s4', 'Sleep basics', "Aim for 7 to 9 hours. Go to bed and wake up at about the same time every day, even on weekends. Keep your room dark and cool, and avoid caffeine in the afternoon and bright screens in the last 30 minutes before bed.", "Choose a fixed bedtime for tonight.", "What helps you sleep better?", "A regular bedtime and no screens before bed", "Caffeine at night", "Changing your bedtime daily", "Scrolling in bed", "Your body likes a steady routine."],
    ['s5', 'Write a clear message', "Open with a greeting, say what you want in the first line, add the details people need (dates, links), and finish with a clear next step and a thank you. Keep it short. Read it once before sending to catch mistakes.", "Write one short, clear message to someone today.", "What should come early in a clear email?", "What you want", "A long story about your day", "An apology for existing", "Random jokes", "Busy people read the first lines most closely."],
    ['s6', 'Interview basics', "Before the interview, learn what the company does and think of 3 examples of things you did well. Arrive early, greet everyone politely, and listen to each question fully. Answer with a short story: the situation, what you did, and the result. Ask one question at the end.", "Write down 3 things you are proud of doing.", "A good way to answer a question is to:", "Share a short example with the result", "Answer in one word", "Talk for ten minutes", "Say you do not know and stop", "Examples are more believable than claims."],
    ['s7', 'First aid basics', "In an emergency, call your local emergency number first. For a small burn, cool it under running water for about 10 minutes. For bleeding, press firmly with a clean cloth. Never move someone with a possible neck injury. This is only an overview, so consider taking a proper first aid course.", "Find your local emergency number and save it in your phone.", "How do you cool a small burn?", "Under running water for about 10 minutes", "With butter", "With toothpaste", "Cover it tightly right away", "Cool running water is the safe, standard advice."],
    ['s8', 'Food safety basics', "Wash your hands before cooking. Keep raw meat away from other foods, and cook chicken until no pink remains and the juices run clear. Put leftovers in the fridge within two hours, and eat them within about three days.", "Wash your hands properly for 20 seconds before your next meal.", "Where should leftovers go?", "In the fridge within about two hours", "On the counter overnight", "In a warm place", "In the sun", "Cooling food quickly stops germs from growing."]
  ];
})();
