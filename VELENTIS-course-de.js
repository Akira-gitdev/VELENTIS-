/* VELENTIS Word course: German pack.
   100 verbs, 100 objects (nouns with article), 100 subjects, 100 helper words, special letters and sounds,
   8 grammar lessons and 24 practice sentences. Most used words come first. */
(function () {
  'use strict';
  var V = window.Velentis; if (!V || !V.course) return;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function B(s, g) { return [s, '', g || '']; }

  /* ----- verbs: inf|English|Partizip II|aux (h=haben, s=sein)|object (a=accusative, N=nominative, n=none)|du-form|er-form ----- */
  var TAB = {
    sein: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    haben: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    werden: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    wissen: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    mögen: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    tun: ['tue', 'tust', 'tut', 'tun', 'tut', 'tun'],
    können: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
    müssen: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    möchten: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten']
  };
  var verbs = [
    'sein|be|gewesen|s|N', 'haben|have|gehabt|h|a', 'werden|become|geworden|s|N', 'gehen|go|gegangen|s|n', 'machen|make, do|gemacht|h|a',
    'sagen|say|gesagt|h|a', 'kommen|come|gekommen|s|n', 'geben|give|gegeben|h|a|gibst|gibt', 'sehen|see|gesehen|h|a|siehst|sieht', 'wissen|know (a fact)|gewusst|h|a',
    'finden|find|gefunden|h|a', 'nehmen|take|genommen|h|a|nimmst|nimmt', 'denken|think|gedacht|h|n', 'essen|eat|gegessen|h|a|isst|isst', 'trinken|drink|getrunken|h|a',
    'lesen|read|gelesen|h|a|liest|liest', 'schreiben|write|geschrieben|h|a', 'sprechen|speak|gesprochen|h|a|sprichst|spricht', 'hören|hear, listen|gehört|h|a', 'kaufen|buy|gekauft|h|a',
    'brauchen|need|gebraucht|h|a', 'kennen|know (a person)|gekannt|h|a', 'verstehen|understand|verstanden|h|a', 'lieben|love|geliebt|h|a', 'mögen|like|gemocht|h|a',
    'suchen|look for|gesucht|h|a', 'bringen|bring|gebracht|h|a', 'fahren|drive, travel|gefahren|s|n|fährst|fährt', 'laufen|run, walk|gelaufen|s|n|läufst|läuft', 'schlafen|sleep|geschlafen|h|n|schläfst|schläft',
    'arbeiten|work|gearbeitet|h|n', 'wohnen|live (reside)|gewohnt|h|n', 'bleiben|stay|geblieben|s|n', 'stehen|stand|gestanden|h|n', 'sitzen|sit|gesessen|h|n',
    'liegen|lie (be lying)|gelegen|h|n', 'warten|wait|gewartet|h|n', 'lernen|learn|gelernt|h|a', 'spielen|play|gespielt|h|a', 'fragen|ask|gefragt|h|a',
    'rufen|call|gerufen|h|a', 'öffnen|open|geöffnet|h|a', 'schließen|close|geschlossen|h|a', 'tragen|carry, wear|getragen|h|a|trägst|trägt', 'halten|hold|gehalten|h|a|hältst|hält',
    'zeigen|show|gezeigt|h|a', 'schicken|send|geschickt|h|a', 'verkaufen|sell|verkauft|h|a', 'bezahlen|pay|bezahlt|h|a', 'bekommen|get, receive|bekommen|h|a',
    'treffen|meet|getroffen|h|a|triffst|trifft', 'besuchen|visit|besucht|h|a', 'vergessen|forget|vergessen|h|a|vergisst|vergisst', 'glauben|believe|geglaubt|h|a', 'kochen|cook|gekocht|h|a',
    'singen|sing|gesungen|h|a', 'tanzen|dance|getanzt|h|n', 'lachen|laugh|gelacht|h|n', 'weinen|cry|geweint|h|n', 'leben|be alive, live|gelebt|h|n',
    'sterben|die|gestorben|s|n|stirbst|stirbt', 'tun|do|getan|h|a', 'waschen|wash|gewaschen|h|a|wäschst|wäscht', 'schneiden|cut|geschnitten|h|a', 'bauen|build|gebaut|h|a',
    'malen|paint|gemalt|h|a', 'putzen|clean|geputzt|h|a', 'fallen|fall|gefallen|s|n|fällst|fällt', 'fliegen|fly|geflogen|s|n', 'schwimmen|swim|geschwommen|s|n',
    'springen|jump|gesprungen|s|n', 'steigen|climb, rise|gestiegen|s|n', 'kämpfen|fight|gekämpft|h|n', 'schützen|protect|geschützt|h|a', 'retten|rescue|gerettet|h|a',
    'töten|kill|getötet|h|a', 'gewinnen|win|gewonnen|h|a', 'verlieren|lose|verloren|h|a', 'werfen|throw|geworfen|h|a|wirfst|wirft', 'fangen|catch|gefangen|h|a|fängst|fängt',
    'ziehen|pull|gezogen|h|a', 'drücken|push, press|gedrückt|h|a', 'legen|lay down|gelegt|h|a', 'stellen|put upright|gestellt|h|a', 'wählen|choose|gewählt|h|a',
    'beginnen|begin|begonnen|h|a', 'fühlen|feel|gefühlt|h|a', 'küssen|kiss|geküsst|h|a', 'benutzen|use|benutzt|h|a', 'erzählen|tell (a story)|erzählt|h|a',
    'üben|practise|geübt|h|a', 'studieren|study|studiert|h|a', 'reisen|travel|gereist|s|n', 'träumen|dream|geträumt|h|n', 'verteidigen|defend|verteidigt|h|a',
    'zerstören|destroy|zerstört|h|a', 'wachsen|grow|gewachsen|s|n|wächst|wächst', 'rennen|run fast|gerannt|s|n', 'nennen|name, call|genannt|h|a', 'entdecken|discover|entdeckt|h|a'
  ].map(function (l) {
    var a = l.split('|'), o = { w: a[0], r: '', ro: '', en: a[1], pp: a[2], aux: a[3], c: a[4] };
    if (a[5]) { o.du = a[5]; o.er = a[6]; }
    if (a[0] === 'sein') o.lets = 'seien';
    return o;
  });

  /* ----- nouns for objects: article noun|English[|p for plural][|accusative noun] ----- */
  function noun(l) {
    var a = l.split('|'), t = a[0].split(' ');
    var o = { w: a[0], r: '', ro: '', en: a[1], art: t[0], base: t.slice(1).join(' ') };
    if (a[2] === 'p') o.pl = true;
    if (a[2] && a[2] !== 'p') o.an = a[2];
    return o;
  }
  var objects = [
    'das Wasser|water', 'das Brot|bread', 'das Essen|food', 'der Kaffee|coffee', 'der Tee|tea', 'die Milch|milk', 'das Fleisch|meat', 'der Fisch|fish', 'das Ei|egg', 'der Apfel|apple',
    'das Obst|fruit', 'das Gemüse|vegetables', 'die Suppe|soup', 'der Käse|cheese', 'der Kuchen|cake', 'das Bier|beer', 'der Wein|wine', 'der Saft|juice', 'der Zucker|sugar', 'das Salz|salt',
    'das Buch|book', 'der Brief|letter', 'die Zeitung|newspaper', 'der Stift|pen', 'das Papier|paper', 'die Tasche|bag', 'der Schlüssel|key', 'der Regenschirm|umbrella', 'die Schuhe|shoes|p', 'das Kleid|dress',
    'der Hut|hat', 'die Uhr|clock, watch', 'das Handy|mobile phone', 'der Computer|computer', 'der Fernseher|TV', 'das Foto|photo', 'der Film|film', 'die Musik|music', 'das Lied|song', 'das Spiel|game',
    'das Bild|picture', 'das Auto|car', 'der Zug|train', 'der Bus|bus', 'das Fahrrad|bicycle', 'die Fahrkarte|ticket', 'das Geld|money', 'das Haus|house', 'das Zimmer|room', 'die Schule|school',
    'der Laden|shop', 'der Bahnhof|station', 'die Straße|street', 'die Stadt|town, city', 'das Land|country', 'der Berg|mountain', 'das Meer|sea', 'der Fluss|river', 'die Blume|flower', 'der Baum|tree',
    'der Himmel|sky', 'der Name|name|den Namen', 'das Wort|word', 'die Sprache|language', 'die Arbeit|work', 'die Hausaufgabe|homework', 'die Prüfung|exam', 'das Problem|problem', 'die Frage|question', 'die Antwort|answer',
    'die Geschichte|story', 'der Traum|dream', 'die Zeit|time', 'der Tag|day', 'der Morgen|morning', 'die Nacht|night', 'das Schwert|sword', 'die Magie|magic', 'die Medizin|medicine', 'die Karte|map, card',
    'die Tür|door', 'das Fenster|window', 'der Stuhl|chair', 'der Tisch|table', 'das Bett|bed', 'das Bad|bath', 'das Gepäck|luggage', 'die Kraft|strength', 'das Herz|heart', 'die Hand|hand',
    'das Auge|eye', 'der Kopf|head', 'das Licht|light', 'das Feuer|fire', 'das Gold|gold', 'der Schatz|treasure', 'die Burg|castle', 'die Tasse|cup', 'der Teller|plate', 'der Löffel|spoon'
  ].map(noun);

  /* ----- subjects: word|English|person (0 ich, 1 du, 2 er/sie/es, 3 wir, 4 ihr, 5 sie/Sie)|shown word ----- */
  var subjects = [
    'ich|I|0', 'du|you (friend)|1', 'er|he|2', 'sie (she)|she|2|sie', 'es|it|2', 'wir|we|3', 'ihr|you all|4', 'sie (they)|they|5|sie', 'Sie (you, polite)|you (polite)|5|Sie', 'wer|who|2',
    'das|this, that|2', 'man|one, people|2', 'jemand|someone|2', 'niemand|nobody|2', 'alle|everyone|5',
    'der Mann|man|2', 'die Frau|woman|2', 'das Kind|child|2', 'der Junge|boy|2', 'das Mädchen|girl|2', 'das Baby|baby|2', 'die Mutter|mother|2', 'der Vater|father|2', 'der Bruder|brother|2', 'die Schwester|sister|2',
    'der Sohn|son|2', 'die Tochter|daughter|2', 'die Oma|grandma|2', 'der Opa|grandpa|2', 'die Eltern|parents|5', 'die Familie|family|2', 'der Freund|friend (male)|2', 'die Freundin|friend (female)|2', 'der Lehrer|teacher (male)|2', 'die Lehrerin|teacher (female)|2',
    'der Schüler|pupil|2', 'der Student|student|2', 'der Arzt|doctor (male)|2', 'die Ärztin|doctor (female)|2', 'der Koch|cook, chef|2', 'der Fahrer|driver|2', 'der Polizist|police officer|2', 'der Verkäufer|seller|2', 'der Sänger|singer|2', 'der Chef|boss|2',
    'der Nachbar|neighbour|2', 'der Gast|guest|2', 'der Mensch|human, person|2', 'die Leute|people|5', 'die Kinder|children|5', 'die Freunde|friends|5',
    'der König|king|2', 'die Königin|queen|2', 'der Prinz|prince|2', 'die Prinzessin|princess|2', 'der Held|hero|2', 'der Krieger|warrior|2', 'der Zauberer|wizard|2', 'die Hexe|witch|2', 'der Ritter|knight|2', 'der Dieb|thief|2',
    'der Feind|enemy|2', 'der Gott|god|2', 'der Geist|ghost, spirit|2', 'der Riese|giant|2', 'der Drache|dragon|2', 'der Elf|elf|2', 'der Zwerg|dwarf|2', 'der Händler|merchant|2', 'der Bauer|farmer|2', 'der Bäcker|baker|2',
    'das Monster|monster|2', 'der Engel|angel|2', 'der Pirat|pirate|2', 'der Soldat|soldier|2',
    'der Hund|dog|2', 'die Katze|cat|2', 'der Vogel|bird|2', 'das Pferd|horse|2', 'die Kuh|cow|2', 'das Schwein|pig|2', 'das Schaf|sheep|2', 'die Maus|mouse|2', 'der Bär|bear|2', 'der Wolf|wolf|2',
    'der Hase|rabbit|2', 'der Affe|monkey|2', 'der Elefant|elephant|2', 'das Tier|animal|2', 'der Löwe|lion|2', 'die Schlange|snake|2', 'der Fuchs|fox|2',
    'der Regen|rain|2', 'die Sonne|sun|2', 'der Wind|wind|2', 'der Schnee|snow|2', 'der Mond|moon|2', 'der Stern|star|2', 'die Wolke|cloud|2', 'das Wetter|weather|2'
  ].map(function (l) {
    var a = l.split('|'), o = { w: a[0], r: '', ro: '', en: a[1], p: +a[2] };
    if (a[3]) o.d = a[3];
    return o;
  });

  /* ----- helper words: word|English|example|example English ----- */
  var helpers = [
    'können|can, be able to|Ich kann schwimmen.|I can swim.', 'müssen|must, have to|Ich muss gehen.|I must go.', 'wollen|want to (strong)|Ich will essen.|I want to eat.',
    'möchten|would like to|Ich möchte Wasser.|I would like water.', 'dürfen|may, be allowed to|Darf ich gehen?|May I go?', 'sollen|should|Du sollst schlafen.|You should sleep.',
    'und|and|Brot und Wasser|bread and water', 'oder|or|Tee oder Kaffee?|Tea or coffee?', 'aber|but|Ich will, aber ich kann nicht.|I want to, but I can’t.',
    'denn|because (verb stays 2nd)|Ich bleibe, denn ich bin müde.|I stay, because I am tired.', 'weil|because (verb goes last)|Ich bleibe, weil ich müde bin.|I stay because I am tired.',
    'dass|that|Ich weiß, dass du kommst.|I know that you are coming.', 'wenn|if, when|Wenn es regnet, bleibe ich hier.|If it rains, I stay here.',
    'ja|yes|Ja, ich komme.|Yes, I am coming.', 'nein|no|Nein, danke.|No, thank you.', 'nicht|not|Ich komme nicht.|I am not coming.', 'kein|no, not a|Ich habe kein Auto.|I have no car.',
    'bitte|please, you’re welcome|Wasser, bitte.|Water, please.', 'danke|thank you|Danke, gut.|Thanks, fine.', 'Entschuldigung|sorry, excuse me|Entschuldigung, wo ist der Bahnhof?|Excuse me, where is the station?',
    'Hallo|hello|Hallo, wie geht’s?|Hello, how are you?', 'Tschüss|bye|Tschüss, bis morgen!|Bye, see you tomorrow!', 'Guten Morgen|good morning|Guten Morgen!|Good morning!',
    'Guten Tag|good day, hello|Guten Tag!|Good day!',
    'der|the (masculine)|Der Hund schläft.|The dog sleeps.', 'die|the (feminine, plural)|Die Katze schläft.|The cat sleeps.', 'das|the (neuter), that|Das Haus ist groß.|The house is big.',
    'ein|a (masculine, neuter)|Ich habe ein Buch.|I have a book.', 'eine|a (feminine)|Ich habe eine Katze.|I have a cat.', 'einen|a (masculine, object)|Ich sehe einen Hund.|I see a dog.',
    'den|the (masculine, object)|Ich sehe den Hund.|I see the dog.', 'mein|my|Das ist mein Buch.|That is my book.', 'dein|your|Wo ist dein Handy?|Where is your phone?',
    'sein (his)|his, its|Das ist sein Hund.|That is his dog.', 'ihr (her)|her|Das ist ihr Haus.|That is her house.', 'unser|our|Das ist unser Auto.|That is our car.',
    'in|in, into|Ich bin in der Stadt.|I am in the town.', 'an|at, on (a wall, edge)|Ich denke an dich.|I think of you.', 'auf|on, onto|Das Buch ist auf dem Tisch.|The book is on the table.',
    'mit|with|Ich gehe mit dir.|I go with you.', 'von|from, of|Das Buch ist von mir.|The book is from me.', 'zu|to|Ich gehe zu dir.|I go to you.', 'nach|to (a city), after|Ich fahre nach Berlin.|I travel to Berlin.',
    'aus|out of, from|Ich komme aus Deutschland.|I come from Germany.', 'bei|at (someone’s place), near|Ich bin bei dir.|I am at your place.', 'für|for|Das ist für dich.|That is for you.',
    'ohne|without|Ich trinke Kaffee ohne Zucker.|I drink coffee without sugar.', 'über|over, about|Wir sprechen über Musik.|We talk about music.', 'unter|under|Die Katze ist unter dem Tisch.|The cat is under the table.',
    'vor|in front of, before|Das Auto ist vor dem Haus.|The car is in front of the house.', 'hinter|behind|Der Hund ist hinter dem Haus.|The dog is behind the house.', 'neben|next to|Ich sitze neben dir.|I sit next to you.',
    'zwischen|between|Ich sitze zwischen dir und ihm.|I sit between you and him.', 'durch|through|Wir gehen durch die Stadt.|We go through the town.', 'um|around, at (a time)|Wir essen um acht Uhr.|We eat at eight o’clock.',
    'gegen|against|Der Held kämpft gegen den Drachen.|The hero fights against the dragon.',
    'was|what|Was ist das?|What is that?', 'wo|where|Wo ist das Haus?|Where is the house?', 'wohin|where to|Wohin gehst du?|Where are you going?',
    'woher|where from|Woher kommst du?|Where do you come from?', 'wann|when|Wann kommst du?|When are you coming?', 'warum|why|Warum lernst du?|Why do you learn?', 'wie|how|Wie heißt du?|What is your name?',
    'wie viel|how much|Wie viel kostet das?|How much does that cost?', 'wie viele|how many|Wie viele Kinder hast du?|How many children do you have?',
    'mich|me (object)|Du siehst mich.|You see me.', 'dich|you (object)|Ich sehe dich.|I see you.', 'ihn|him (object)|Ich sehe ihn.|I see him.', 'mir|to me|Gib mir das Buch.|Give me the book.', 'dir|to you|Ich gebe dir das Buch.|I give you the book.',
    'sehr|very|Das ist sehr gut.|That is very good.', 'immer|always|Ich bin immer hier.|I am always here.', 'nie|never|Ich esse nie Fleisch.|I never eat meat.', 'oft|often|Ich lese oft.|I often read.',
    'manchmal|sometimes|Manchmal schlafe ich hier.|Sometimes I sleep here.', 'heute|today|Heute bleibe ich hier.|Today I stay here.', 'morgen|tomorrow|Morgen komme ich.|Tomorrow I come.',
    'gestern|yesterday|Gestern habe ich ein Buch gelesen.|Yesterday I read a book.', 'jetzt|now|Ich esse jetzt.|I am eating now.', 'hier|here|Ich bin hier.|I am here.', 'dort|there|Das Haus ist dort.|The house is there.',
    'da|there, here|Da ist der Bahnhof.|There is the station.', 'auch|also, too|Ich komme auch.|I am coming too.', 'nur|only|Ich habe nur Wasser.|I only have water.', 'schon|already|Ich habe schon gegessen.|I have already eaten.',
    'noch|still, yet|Ich habe noch Zeit.|I still have time.', 'viel|much, a lot|Ich esse viel.|I eat a lot.', 'wenig|little, few|Ich habe wenig Geld.|I have little money.', 'mehr|more|Ich möchte mehr Wasser.|I would like more water.',
    'gut|good, well|Das ist gut.|That is good.', 'schlecht|bad|Das Wetter ist schlecht.|The weather is bad.', 'groß|big, tall|Das Haus ist groß.|The house is big.', 'klein|small|Der Hund ist klein.|The dog is small.',
    'neu|new|Das Auto ist neu.|The car is new.', 'alt|old|Der Mann ist alt.|The man is old.', 'schön|beautiful, nice|Die Blume ist schön.|The flower is beautiful.', 'müde|tired|Ich bin müde.|I am tired.',
    'zusammen|together|Wir gehen zusammen.|We go together.', 'vielleicht|maybe|Vielleicht komme ich.|Maybe I will come.', 'dann|then|Erst essen wir, dann gehen wir.|First we eat, then we go.'
  ].map(function (l) {
    var a = l.split('|'), o = { w: a[0], r: '', ro: '', en: a[1] };
    if (a[2]) o.ex = [a[2], '', a[3] || ''];
    return o;
  });

  /* ----- letters ----- */
  function row(a) { return a.map(function (x) { return x ? [x[0], x[1]] : null; }); }
  var letters = [
    { name: 'Special letters', rows: [
      row([['ä', 'eh (like e in bed)'], ['ö', 'er (round lips)'], ['ü', 'ew (round lips)'], ['ß', 'ss']]),
      row([['Ä', 'eh'], ['Ö', 'er'], ['Ü', 'ew']])
    ] },
    { name: 'Sounds', rows: [
      row([['sch', 'sh'], ['ch', 'soft kh'], ['ei', 'eye'], ['ie', 'ee'], ['eu', 'oy']]),
      row([['au', 'ow'], ['st-', 'sht (at start)'], ['sp-', 'shp (at start)'], ['v', 'f'], ['w', 'v']]),
      row([['z', 'ts'], ['j', 'y'], ['qu', 'kv'], ['pf', 'pf'], ['tsch', 'ch']])
    ] }
  ];

  /* ----- lessons ----- */
  var lessons = [
    { t: 'Word order: the verb is second', intro: ['A simple German sentence is like English: who, then the action, then what. But the verb must always be in the second place.'],
      points: ['Normal order: subject, verb, object. Ich esse Brot. (I eat bread.)', 'Start with another piece, like heute (today), and the verb stays second. The subject goes behind it: Heute esse ich Brot.', 'The verb is the second piece, not always the second word. Der Hund (two words) is one piece: Der Hund schläft.', 'German writes every noun with a capital letter: Brot, Hund, Haus.'],
      ex: [{ s: [B('Ich', 'I'), B('esse', 'eat'), B('Brot', 'bread')], en: 'I eat bread.', say: 'Ich esse Brot.' }, { s: [B('Heute', 'today'), B('esse', 'eat'), B('ich', 'I'), B('Brot', 'bread')], en: 'Today I eat bread.', say: 'Heute esse ich Brot.' }] },
    { t: 'Nouns: der, die, das', intro: ['Every German noun has a gender: masculine, feminine or neuter. You can’t guess it, so learn each noun together with its little word.'],
      points: ['der = masculine: der Hund (the dog).', 'die = feminine: die Katze (the cat).', 'das = neuter: das Haus (the house).', 'For many things (plural) it is always die: die Hunde (the dogs).', 'a/an: ein (der and das nouns), eine (die nouns).', 'The thing that gets the action is the object. Only masculine changes there: der becomes den, ein becomes einen. Ich sehe den Hund. Die and das do not change.'],
      ex: [{ s: [B('Der Hund', 'the dog'), B('schläft', 'sleeps')], en: 'The dog sleeps.', say: 'Der Hund schläft.' }, { s: [B('Ich', 'I'), B('sehe', 'see'), B('den', 'the (object)'), B('Hund', 'dog')], en: 'I see the dog.', say: 'Ich sehe den Hund.' }, { s: [B('Ich', 'I'), B('sehe', 'see'), B('die', 'the'), B('Katze', 'cat')], en: 'I see the cat.', say: 'Ich sehe die Katze.' }] },
    { t: 'Verbs change with the person', intro: ['In German the verb ending changes for who does it. The word list shows the infinitive (gehen, essen). Take off -en and add an ending.'],
      points: ['Regular: ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen.', 'Sie with a capital S means you (polite). It looks like sie (they): Sie gehen.', 'sein (be): ich bin, du bist, er ist, wir sind, ihr seid, sie sind.', 'haben (have): ich habe, du hast, er hat, wir haben, ihr habt, sie haben.', 'Some verbs change their vowel for du and er: essen (du isst, er isst), sehen (du siehst), fahren (du fährst), sprechen (du sprichst), lesen (du liest).', 'Make your own shows the right form for every verb.'],
      ex: [{ s: [B('ich', 'I'), B('bin', 'am'), B('du', 'you'), B('bist', 'are'), B('er', 'he'), B('ist', 'is')], en: 'sein: I am, you are, he is' }, { s: [B('wir', 'we'), B('sind', 'are'), B('ihr', 'you all'), B('seid', 'are'), B('sie', 'they'), B('sind', 'are')], en: 'sein: we are, you all are, they are' }, { s: [B('Du', 'you'), B('isst', 'eat'), B('Brot', 'bread')], en: 'You eat bread. (essen changes)', say: 'Du isst Brot.' }] },
    { t: 'No and not: nicht, kein', intro: ['German has two ways to say no. Use nicht with a verb. Use kein in front of a noun.'],
      points: ['nicht = not: Ich gehe nicht. (I don’t go.)', 'kein = no, not a: Ich habe kein Auto. (I have no car.)', 'kein changes like ein: keinen for a masculine object, keine for die nouns and plurals.', 'Ich habe keinen Hund. Ich habe keine Katze. Ich habe kein Haus.'],
      ex: [{ s: [B('Ich', 'I'), B('gehe', 'go'), B('nicht', 'not')], en: 'I am not going.', say: 'Ich gehe nicht.' }, { s: [B('Wir', 'we'), B('haben', 'have'), B('kein', 'no'), B('Geld', 'money')], en: 'We have no money.', say: 'Wir haben kein Geld.' }] },
    { t: 'Questions', intro: ['There are two kinds of question. The verb stays in a fixed place, so it is easy.'],
      points: ['Yes/no question: the verb goes first. Isst du Brot? (Do you eat bread?)', 'Question word first (was, wer, wo, wann, warum, wie), then the verb in second place.', 'Was isst du? Wo wohnst du? Wer ist das?', 'Answer with ja (yes) or nein (no).'],
      ex: [{ s: [B('Isst', 'eat'), B('du', 'you'), B('Brot', 'bread')], en: 'Do you eat bread?', say: 'Isst du Brot?' }, { s: [B('Was', 'what'), B('isst', 'eat'), B('du', 'you')], en: 'What do you eat?', say: 'Was isst du?' }, { s: [B('Wo', 'where'), B('wohnst', 'live'), B('du', 'you')], en: 'Where do you live?', say: 'Wo wohnst du?' }] },
    { t: 'Can, must, want, would like', intro: ['Helper verbs like können (can) take the second place. The second verb goes to the very end, in the infinitive (the dictionary form).'],
      points: ['können (can): ich kann, du kannst, er kann, wir können.', 'müssen (must): ich muss, du musst, er muss, wir müssen.', 'wollen (want): ich will, du willst, er will, wir wollen.', 'möchten (would like, polite): ich möchte, du möchtest, er möchte, wir möchten.', 'Ich möchte Wasser trinken. = I would like to drink water.', 'Let’s: put the verb first, then wir. Gehen wir! (Let’s go!)'],
      ex: [{ s: [B('Ich', 'I'), B('möchte', 'would like'), B('Wasser', 'water'), B('trinken', 'drink')], en: 'I would like to drink water.', say: 'Ich möchte Wasser trinken.' }, { s: [B('Er', 'he'), B('kann', 'can'), B('nicht', 'not'), B('schlafen', 'sleep')], en: 'He cannot sleep.', say: 'Er kann nicht schlafen.' }, { s: [B('Gehen', 'go'), B('wir', 'we')], en: 'Let’s go!', say: 'Gehen wir!' }] },
    { t: 'The past: Perfekt', intro: ['To talk about the past in speech, use haben or sein in second place, and a past participle at the very end.'],
      points: ['Most verbs use haben: Ich habe Brot gegessen. (I ate bread.)', 'Verbs of going or changing use sein: Ich bin gegangen. Er ist gekommen. Wir sind gefahren.', 'Regular participles: ge + stem + t: machen becomes gemacht.', 'Many common verbs are different, so learn each one: essen becomes gegessen, sehen becomes gesehen.', 'Make your own shows the right helper and participle for every verb.'],
      ex: [{ s: [B('Ich', 'I'), B('habe', 'have'), B('das Buch', 'the book'), B('gelesen', 'read (past)')], en: 'I read the book.', say: 'Ich habe das Buch gelesen.' }, { s: [B('Er', 'he'), B('ist', 'is'), B('nach Hause', 'home'), B('gegangen', 'gone')], en: 'He went home.', say: 'Er ist nach Hause gegangen.' }] },
    { t: 'Joining sentences', intro: ['Small link words join two sentences. Some leave the word order alone. Some push the verb to the end.'],
      points: ['und = and, oder = or, aber = but, denn = because. After these the order stays normal: Ich bleibe, denn ich bin müde.', 'weil = because, dass = that, wenn = if, when. After these the verb goes to the very end: Ich bleibe, weil ich müde bin.', 'Put a comma before the link word.'],
      ex: [{ s: [B('Wir', 'we'), B('essen', 'eat'), B('Brot', 'bread'), B('und', 'and'), B('trinken', 'drink'), B('Wasser', 'water')], en: 'We eat bread and drink water.', say: 'Wir essen Brot und trinken Wasser.' }, { s: [B('Ich', 'I'), B('bleibe', 'stay'), B('hier,', 'here'), B('weil', 'because'), B('ich', 'I'), B('müde', 'tired'), B('bin', 'am')], en: 'I stay here because I am tired.', say: 'Ich bleibe hier, weil ich müde bin.' }] }
  ];

  /* ----- practice sentences: piece|meaning ----- */
  var sentences = [
    ['I read.', ['Ich|I', 'lese|read']],
    ['You sleep.', ['Du|you', 'schläfst|sleep']],
    ['We go.', ['Wir|we', 'gehen|go']],
    ['I drink water.', ['Ich|I', 'trinke|drink', 'Wasser|water']],
    ['He eats bread.', ['Er|he', 'isst|eats', 'Brot|bread']],
    ['The dog sleeps.', ['Der Hund|the dog', 'schläft|sleeps']],
    ['I have a book.', ['Ich|I', 'habe|have', 'ein Buch|a book']],
    ['You are my friend.', ['Du|you', 'bist|are', 'mein Freund|my friend']],
    ['The child reads a newspaper.', ['Das Kind|the child', 'liest|reads', 'eine Zeitung|a newspaper']],
    ['We have no money.', ['Wir|we', 'haben|have', 'kein Geld|no money']],
    ['The woman buys the apple.', ['Die Frau|the woman', 'kauft|buys', 'den Apfel|the apple']],
    ['Where is the station?', ['Wo|where', 'ist|is', 'der Bahnhof|the station']],
    ['What do you eat?', ['Was|what', 'isst|eat', 'du|you']],
    ['Do you speak German?', ['Sprichst|speak', 'du|you', 'Deutsch|German']],
    ['Today we play a game.', ['Heute|today', 'spielen|play', 'wir|we', 'ein Spiel|a game']],
    ['Tomorrow I travel by train.', ['Morgen|tomorrow', 'fahre|travel', 'ich|I', 'mit dem Zug|by train']],
    ['I would like to drink a coffee.', ['Ich|I', 'möchte|would like', 'einen Kaffee|a coffee', 'trinken|drink']],
    ['He cannot sleep.', ['Er|he', 'kann|can', 'nicht|not', 'schlafen|sleep']],
    ['I have read the book.', ['Ich|I', 'habe|have', 'das Buch|the book', 'gelesen|read (past)']],
    ['He went home.', ['Er|he', 'ist|is', 'nach Hause|home', 'gegangen|gone']],
    ['The hero has seen the dragon.', ['Der Held|the hero', 'hat|has', 'den Drachen|the dragon', 'gesehen|seen']],
    ['We eat bread and drink water.', ['Wir|we', 'essen|eat', 'Brot|bread', 'und|and', 'trinken|drink', 'Wasser|water']],
    ['I stay at home because it rains.', ['Ich|I', 'bleibe|stay', 'zu Hause,|at home', 'weil|because', 'es|it', 'regnet|rains']],
    ['Why do you learn German?', ['Warum|why', 'lernst|learn', 'du|you', 'Deutsch|German']]
  ].map(function (s) {
    var pcs = s[1].map(function (x) { var p = x.split('|'); return [p[0], '', p[1] || '']; });
    return { en: s[0], t: pcs, say: pcs.map(function (p) { return p[0]; }).join(' ') + (/\?$/.test(s[0]) ? '?' : '.') };
  });

  /* ----- grammar helpers ----- */
  function stemOf(inf) { return inf.slice(0, -2); }
  function needsE(st) { return /(chn|[bdfgkpt]n|[bdfgkpt]m|t|d)$/.test(st); }
  function pres(Vb, p) {
    var t = TAB[Vb.w]; if (t) return t[p];
    var st = stemOf(Vb.w), e = needsE(st);
    if (p === 0) return st + 'e';
    if (p === 1) return Vb.du || (/[sßxz]$/.test(st) ? st + 't' : st + (e ? 'est' : 'st'));
    if (p === 2) return Vb.er || st + (e ? 'et' : 't');
    if (p === 4) return st + (e ? 'et' : 't');
    return Vb.w;
  }
  function auxForm(Vb, p) { return TAB[Vb.aux === 's' ? 'sein' : 'haben'][p]; }
  var FEN = ['', ' (not)', ' (past)', ' (would like to)', ' (can)', ' (must)', " (let's)"];
  var FORMS = ['Now', 'Not', 'Past', 'Want to', 'Can', 'Must', "Let's"];

  /* object blocks: article + noun, with the right case or with kein */
  function objBlocks(O, c, neg) {
    var base = O.base, art = O.art, g = O.pl ? 'p' : art === 'der' ? 'm' : art === 'die' ? 'f' : 'n', acc = c === 'a';
    if (acc && O.an) base = O.an.split(' ').slice(1).join(' ');
    var w, gl;
    if (neg) { w = g === 'm' ? (acc ? 'keinen' : 'kein') : (g === 'n' ? 'kein' : 'keine'); gl = 'no, not a'; }
    else if (g === 'm' && acc) { w = 'den'; gl = 'the (masc., object)'; }
    else { w = art; gl = g === 'm' ? 'the (masc.)' : g === 'f' ? 'the (fem.)' : g === 'n' ? 'the (neut.)' : 'the (plural)'; }
    return [B(w, gl), B(base, O.en)];
  }

  function make(S, O, Vb, f) {
    var p = S.p, c = Vb.c, hasO = c !== 'n', parts = [], sw = S.d || S.w, subj = B(sw, S.en), ob;
    var inf = Vb.w;
    if (S.w === 'niemand' && f === 1) subj = B('jemand', 'someone'); /* avoid a double negative */
    if (f === 0) {
      parts.push(subj, B(pres(Vb, p), Vb.en));
      if (hasO) parts = parts.concat(objBlocks(O, c, false));
    } else if (f === 1) {
      parts.push(subj, B(pres(Vb, p), Vb.en + FEN[1]));
      if (hasO) parts = parts.concat(objBlocks(O, c, true)); else parts.push(B('nicht', 'not'));
    } else if (f === 2) {
      parts.push(subj, B(auxForm(Vb, p), Vb.aux === 's' ? 'am/is/are (helper)' : 'have/has (helper)'));
      if (hasO) parts = parts.concat(objBlocks(O, c, false));
      parts.push(B(Vb.pp, Vb.en + FEN[2]));
    } else if (f >= 3 && f <= 5) {
      var mod = ['möchten', 'können', 'müssen'][f - 3];
      parts.push(subj, B(TAB[mod][p], ['would like', 'can', 'must'][f - 3]));
      if (hasO) parts = parts.concat(objBlocks(O, c, false));
      parts.push(B(inf, Vb.en));
    } else {
      parts.push(B(Vb.lets || inf, Vb.en + FEN[6]), B('wir', 'we'));
      if (hasO) parts = parts.concat(objBlocks(O, c, false));
    }
    parts[0] = [cap(parts[0][0]), parts[0][1], parts[0][2]];
    var text = parts.map(function (x) { return x[0]; }).join(' ') + (f === 6 ? '!' : '.');
    return { parts: parts, rom: '', text: text, needsObj: hasO };
  }

  function demo(set, w) {
    if (set === 'verbs') {
      var ps = [B('Ich', 'I'), B(pres(w, 0), w.en)];
      if (w.c !== 'n') ps.push(B('etwas', 'something'));
      return { parts: ps, en: 'Past: ich ' + auxForm(w, 0) + (w.c !== 'n' ? ' … ' : ' ') + w.pp + '.' };
    }
    if (set === 'objects') {
      return { parts: [B('Das', 'this'), B(w.pl ? 'sind' : 'ist', w.pl ? 'are' : 'is'), B(w.art, w.pl ? 'the (plural)' : w.art === 'der' ? 'the (masc.)' : w.art === 'die' ? 'the (fem.)' : 'the (neut.)'), B(w.base, w.en)], en: 'This is ' + w.en + '.' };
    }
    if (set === 'subjects') {
      return { parts: [B(cap(w.d || w.w), w.en), B(TAB.sein[w.p], 'is / am / are'), B('müde', 'tired')], en: 'Try it with “tired”.' };
    }
    if (w.ex && w.ex[0] && w.ex[0] !== w.w) return { parts: [[w.ex[0], '', '']], en: w.ex[2] };
    return null;
  }

  V.course.add({
    id: 'de', name: 'German', tts: 'de-DE', noRead: true, letters: letters, lessons: lessons, sentences: sentences, forms: FORMS, make: make, demo: demo,
    sets: { verbs: verbs, objects: objects, subjects: subjects, helpers: helpers }
  });
})();
