/* VELENTIS Word course: Japanese pack.
   100 verbs, 100 objects, 100 subjects, 100 helper words (particles, endings, question words and link words),
   hiragana and katakana charts, grammar lessons and practice sentences. Most used words come first. */
(function () {
  'use strict';
  var V = window.Velentis; if (!V || !V.course) return;

  /* ----- kana to letters (romaji) ----- */
  var TAB = 'あ a い i う u え e お o か ka き ki く ku け ke こ ko さ sa し shi す su せ se そ so た ta ち chi つ tsu て te と to な na に ni ぬ nu ね ne の no は ha ひ hi ふ fu へ he ほ ho ま ma み mi む mu め me も mo や ya ゆ yu よ yo ら ra り ri る ru れ re ろ ro わ wa を o ん n が ga ぎ gi ぐ gu げ ge ご go ざ za じ ji ず zu ぜ ze ぞ zo だ da ぢ ji づ zu で de ど do ば ba び bi ぶ bu べ be ぼ bo ぱ pa ぴ pi ぷ pu ぺ pe ぽ po'.split(' ');
  var MAP = {}; for (var q = 0; q < TAB.length; q += 2) MAP[TAB[q]] = TAB[q + 1];
  function toHira(s) { return s.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
  function rom(s) {
    s = toHira(s || ''); var out = '', dbl = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i], n = s[i + 1], r;
      if (c === 'っ') { dbl = true; continue; }
      if (c === 'ー') { var m = out.match(/[aiueo]$/); out += m ? m[0] : ''; continue; }
      r = MAP[c]; if (r == null) { out += c; continue; }
      if (n === 'ゃ' || n === 'ゅ' || n === 'ょ') {
        var v = n === 'ゃ' ? 'a' : n === 'ゅ' ? 'u' : 'o', st = r.slice(0, -1);
        r = /(sh|ch|j)$/.test(st) ? st + v : st + 'y' + v; i++;
      }
      if (dbl) { r = (r.indexOf('ch') === 0 ? 't' : r[0]) + r; dbl = false; }
      out += r;
    }
    return out;
  }
  /* ----- verb forms ----- */
  var UI = { 'う': 'い', 'く': 'き', 'ぐ': 'ぎ', 'す': 'し', 'つ': 'ち', 'ぬ': 'に', 'ぶ': 'び', 'む': 'み', 'る': 'り' };
  function stem(s, cls) {
    if (cls === 'i') { if (/する$/.test(s)) return s.slice(0, -2) + 'し'; if (/くる$/.test(s)) return s.slice(0, -2) + 'き'; if (/来る$/.test(s)) return s.slice(0, -1); }
    if (cls === 'r') return s.slice(0, -1);
    return s.slice(0, -1) + (UI[s.slice(-1)] || s.slice(-1));
  }
  function te(s, cls) {
    if (cls === 'i') { if (/する$/.test(s)) return s.slice(0, -2) + 'して'; if (/くる$/.test(s)) return s.slice(0, -2) + 'きて'; if (/来る$/.test(s)) return s.slice(0, -1) + 'て'; }
    if (cls === 'r') return s.slice(0, -1) + 'て';
    var l = s.slice(-1), b = s.slice(0, -1);
    if (/(いく|行く)$/.test(s)) return b + 'って';
    if ('うつる'.indexOf(l) >= 0) return b + 'って';
    if ('むぶぬ'.indexOf(l) >= 0) return b + 'んで';
    if (l === 'く') return b + 'いて'; if (l === 'ぐ') return b + 'いで'; if (l === 'す') return b + 'して';
    return s;
  }
  var FORMS = ['Now', 'Not', 'Past', 'Past not', 'Want to', "Let's", 'Please'];
  var FEN = ['', ' (not)', ' (past)', ' (did not)', ' (want to)', " (let's)", ' (please)'];
  function conj(s, cls, f) {
    if (f === 6) return te(s, cls) + 'ください';
    var st = stem(s, cls);
    return st + ['ます', 'ません', 'ました', 'ませんでした', 'たいです', 'ましょう'][f];
  }
  var PART = { o: ['を', 'o', 'object'], p: ['に', 'ni', 'to / at'], g: ['が', 'ga', 'what'] };

  function split(line) { return line.split('|'); }
  function plain(a) { var w = a[0], r = a[1]; return { w: w, r: r === w ? '' : r, ro: rom(r), en: a[2] }; }
  var verbs = ('する|する|do|i|o\nある|ある|exist (things)|u|n\nいる|いる|exist (people, animals)|r|n\nなる|なる|become|u|n\n行く|いく|go|u|p\n来る|くる|come|i|p\n見る|みる|see, watch|r|o\n言う|いう|say|u|o\n食べる|たべる|eat|r|o\n飲む|のむ|drink|u|o\n知る|しる|know|u|o\n思う|おもう|think|u|o\n分かる|わかる|understand|u|g\n持つ|もつ|hold, have|u|o\n使う|つかう|use|u|o\n作る|つくる|make|u|o\n買う|かう|buy|u|o\n売る|うる|sell|u|o\n読む|よむ|read|u|o\n書く|かく|write|u|o\n聞く|きく|listen, ask|u|o\n話す|はなす|speak|u|o\n待つ|まつ|wait|u|o\n会う|あう|meet|u|p\n帰る|かえる|go home|u|p\n入る|はいる|enter|u|p\n出る|でる|leave, go out|r|o\n立つ|たつ|stand|u|n\n座る|すわる|sit|u|n\n歩く|あるく|walk|u|n\n走る|はしる|run|u|n\n乗る|のる|ride|u|p\n降りる|おりる|get off|r|o\n起きる|おきる|wake up|r|n\n寝る|ねる|sleep|r|n\n休む|やすむ|rest|u|n\n働く|はたらく|work|u|n\n勉強する|べんきょうする|study|i|o\n学ぶ|まなぶ|learn|u|o\n教える|おしえる|teach, tell|r|o\n覚える|おぼえる|remember|r|o\n忘れる|わすれる|forget|r|o\n考える|かんがえる|think about|r|o\n始める|はじめる|start|r|o\n終わる|おわる|end|u|n\n開ける|あける|open|r|o\n閉める|しめる|close|r|o\n置く|おく|put, place|u|o\n取る|とる|take|u|o\n渡す|わたす|hand over|u|o\n送る|おくる|send|u|o\n貸す|かす|lend|u|o\n借りる|かりる|borrow|r|o\n返す|かえす|give back|u|o\n呼ぶ|よぶ|call|u|o\n歌う|うたう|sing|u|o\n遊ぶ|あそぶ|play|u|n\n泳ぐ|およぐ|swim|u|n\n笑う|わらう|laugh|u|n\n泣く|なく|cry|u|n\n怒る|おこる|get angry|u|n\n愛する|あいする|love|i|o\n死ぬ|しぬ|die|u|n\n生きる|いきる|be alive|r|n\n住む|すむ|live (in a place)|u|p\n生まれる|うまれる|be born|r|n\n変わる|かわる|change (by itself)|u|n\n変える|かえる|change (something)|r|o\n続ける|つづける|continue|r|o\n決める|きめる|decide|r|o\n選ぶ|えらぶ|choose|u|o\n探す|さがす|look for|u|o\n見つける|みつける|find|r|o\n出す|だす|take out, hand in|u|o\n入れる|いれる|put in|r|o\n切る|きる|cut|u|o\n洗う|あらう|wash|u|o\n着る|きる|wear (on the body)|r|o\n履く|はく|wear (on the feet)|u|o\n脱ぐ|ぬぐ|take off (clothes)|u|o\n掃除する|そうじする|clean|i|o\n料理する|りょうりする|cook|i|o\n運転する|うんてんする|drive|i|o\n練習する|れんしゅうする|practice|i|o\n勝つ|かつ|win|u|n\n負ける|まける|lose|r|n\n戦う|たたかう|fight|u|n\n守る|まもる|protect|u|o\n助ける|たすける|help, rescue|r|o\n手伝う|てつだう|help out|u|o\n払う|はらう|pay|u|o\n習う|ならう|take lessons in|u|o\n触る|さわる|touch|u|p\n押す|おす|push|u|o\n引く|ひく|pull|u|o\n投げる|なげる|throw|r|o\n落ちる|おちる|fall|r|n\n飛ぶ|とぶ|fly|u|n\n動く|うごく|move|u|n\n止まる|とまる|stop (by itself)|u|n').split('\n').map(function (l) { var a = split(l), w = plain(a); w.cls = a[3]; w.fr = a[4]; return w; });

  var subjects = ('私|わたし|I\nあなた|あなた|you\n彼|かれ|he\n彼女|かのじょ|she\n私たち|わたしたち|we\n彼ら|かれら|they\n僕|ぼく|I (boy’s word)\n俺|おれ|I (rough, male)\nこれ|これ|this\nそれ|それ|that\nあれ|あれ|that over there\n誰|だれ|who\n人|ひと|person\n男|おとこ|man\n女|おんな|woman\n子ども|こども|child\n男の子|おとこのこ|boy\n女の子|おんなのこ|girl\n赤ちゃん|あかちゃん|baby\n母|はは|my mother\n父|ちち|my father\nお母さん|おかあさん|mother (yours)\nお父さん|おとうさん|father (yours)\n兄|あに|my older brother\n姉|あね|my older sister\n弟|おとうと|my younger brother\n妹|いもうと|my younger sister\n夫|おっと|husband\n妻|つま|wife\n家族|かぞく|family\n友達|ともだち|friend\n先生|せんせい|teacher\n学生|がくせい|student\n生徒|せいと|pupil\n医者|いしゃ|doctor\n看護師|かんごし|nurse\n店員|てんいん|shop clerk\n客|きゃく|customer\n社長|しゃちょう|company president\n会社員|かいしゃいん|office worker\n警察|けいさつ|police\n運転手|うんてんしゅ|driver\n料理人|りょうりにん|cook, chef\n歌手|かしゅ|singer\n選手|せんしゅ|player, athlete\n日本人|にほんじん|Japanese person\n外国人|がいこくじん|foreigner\n大人|おとな|adult\n先輩|せんぱい|senior\n後輩|こうはい|junior\n上司|じょうし|boss\n同僚|どうりょう|coworker\n王|おう|king\n王様|おうさま|king (respectful)\n女王|じょおう|queen\n王子|おうじ|prince\n姫|ひめ|princess\n勇者|ゆうしゃ|hero\n戦士|せんし|warrior\n魔法使い|まほうつかい|wizard\n騎士|きし|knight\n泥棒|どろぼう|thief\n敵|てき|enemy\n味方|みかた|ally\n神|かみ|god\n犬|いぬ|dog\n猫|ねこ|cat\n鳥|とり|bird\n馬|うま|horse\n牛|うし|cow\n豚|ぶた|pig\n羊|ひつじ|sheep\n鼠|ねずみ|mouse\n虫|むし|bug\n竜|りゅう|dragon\n熊|くま|bear\n狼|おおかみ|wolf\nうさぎ|うさぎ|rabbit\n猿|さる|monkey\n象|ぞう|elephant\n動物|どうぶつ|animal\nみんな|みんな|everyone\n誰か|だれか|someone\n自分|じぶん|oneself\n雨|あめ|rain\n風|かぜ|wind\n雪|ゆき|snow\n太陽|たいよう|sun\n月|つき|moon\n星|ほし|star\n雲|くも|cloud\nお爺さん|おじいさん|old man, grandfather\nお婆さん|おばあさん|old woman, grandmother\n彼氏|かれし|boyfriend\n兄弟|きょうだい|siblings\n村人|むらびと|villager\n商人|しょうにん|merchant\n鬼|おに|ogre\n幽霊|ゆうれい|ghost\n市長|しちょう|mayor').split('\n').map(function (l) { return plain(split(l)); });

  var objects = ('水|みず|water\n食べ物|たべもの|food\n飲み物|のみもの|drink\nご飯|ごはん|rice, meal\nパン|パン|bread\n肉|にく|meat\n魚|さかな|fish\n野菜|やさい|vegetables\n果物|くだもの|fruit\nりんご|りんご|apple\n卵|たまご|egg\nお茶|おちゃ|tea\nコーヒー|コーヒー|coffee\n牛乳|ぎゅうにゅう|milk\n料理|りょうり|dish, cooking\n朝ご飯|あさごはん|breakfast\n弁当|べんとう|boxed lunch\n本|ほん|book\n手紙|てがみ|letter\n新聞|しんぶん|newspaper\n辞書|じしょ|dictionary\n鉛筆|えんぴつ|pencil\nペン|ペン|pen\n紙|かみ|paper\nかばん|かばん|bag\n財布|さいふ|wallet\n鍵|かぎ|key\n傘|かさ|umbrella\n靴|くつ|shoes\n服|ふく|clothes\n帽子|ぼうし|hat\n時計|とけい|watch, clock\n携帯|けいたい|mobile phone\n電話|でんわ|phone call\nパソコン|パソコン|computer\nテレビ|テレビ|TV\n写真|しゃしん|photo\n映画|えいが|movie\n音楽|おんがく|music\n歌|うた|song\nゲーム|ゲーム|game\n絵|え|picture\n車|くるま|car\n電車|でんしゃ|train\nバス|バス|bus\n自転車|じてんしゃ|bicycle\n切符|きっぷ|ticket\nお金|おかね|money\n家|いえ|house, home\n部屋|へや|room\n学校|がっこう|school\n店|みせ|shop\n駅|えき|station\n道|みち|road, way\n町|まち|town\n国|くに|country\n山|やま|mountain\n海|うみ|sea\n川|かわ|river\n花|はな|flower\n木|き|tree\n空|そら|sky\n名前|なまえ|name\n言葉|ことば|word, language\n日本語|にほんご|Japanese\n英語|えいご|English\n仕事|しごと|work, job\n宿題|しゅくだい|homework\n試験|しけん|exam\n問題|もんだい|problem\n質問|しつもん|question\n答え|こたえ|answer\n話|はなし|story, talk\n夢|ゆめ|dream\n時間|じかん|time\n今日|きょう|today\n朝|あさ|morning\n夜|よる|night\n剣|けん|sword\n魔法|まほう|magic\n薬|くすり|medicine\n地図|ちず|map\nドア|ドア|door\n窓|まど|window\n椅子|いす|chair\n机|つくえ|desk\nベッド|ベッド|bed\n風呂|ふろ|bath\n荷物|にもつ|luggage\n力|ちから|strength\n心|こころ|heart, mind\n手|て|hand\n目|め|eye\n頭|あたま|head\n昼ご飯|ひるごはん|lunch\n晩ご飯|ばんごはん|dinner\n塩|しお|salt\n砂糖|さとう|sugar\n箸|はし|chopsticks\n皿|さら|plate').split('\n').map(function (l) { return plain(split(l)); });

  var helpers = ('は|は|topic marker (said “wa”)|私は学生です|わたしはがくせいです|I am a student\nが|が|subject marker|犬がいます|いぬがいます|There is a dog\nを|を|object marker (said “o”)|水を飲みます|みずをのみます|I drink water\nに|に|to, at, in|学校に行きます|がっこうにいきます|I go to school\nで|で|at (where you do it), by|家で食べます|いえでたべます|I eat at home\nの|の|of, ’s|私の本|わたしのほん|my book\nと|と|and, with|友達と行きます|ともだちといきます|I go with a friend\nも|も|also, too|私も行きます|わたしもいきます|I will go too\nへ|へ|toward (said “e”)|駅へ行きます|えきへいきます|I go toward the station\nから|から|from, because|朝から働きます|あさからはたらきます|I work from morning\nまで|まで|until, up to|夜まで勉強します|よるまでべんきょうします|I study until night\nや|や|and (a few things)|本や紙|ほんやかみ|books, paper and so on\nか|か|question marker|水ですか|みずですか|Is it water?\nね|ね|right? (agreeing)|いいですね|いいですね|Nice, isn’t it?\nよ|よ|you know! (telling)|行きますよ|いきますよ|I’m going, you know\nより|より|than|犬より猫|いぬよりねこ|cat more than dog\nだけ|だけ|only|水だけ|みずだけ|only water\nでも|でも|even, but|でも行きます|でもいきます|But I will go\nです|です|is, am, are|私は学生です|わたしはがくせいです|I am a student\nだ|だ|is (casual)|学生だ|がくせいだ|(He) is a student\nではありません|ではありません|is not|学生ではありません|がくせいではありません|I am not a student\nでした|でした|was|学生でした|がくせいでした|I was a student\nます|ます|polite verb ending|食べます|たべます|eat\nません|ません|do not (polite)|食べません|たべません|do not eat\nました|ました|did (polite)|食べました|たべました|ate\nませんでした|ませんでした|did not (polite)|食べませんでした|たべませんでした|did not eat\nましょう|ましょう|let’s|行きましょう|いきましょう|Let’s go\nませんか|ませんか|won’t you? (inviting)|行きませんか|いきませんか|Won’t you go?\nたい|たい|want to|食べたい|たべたい|I want to eat\nない|ない|not (casual verb)|食べない|たべない|don’t eat\nた|た|did (casual)|食べた|たべた|ate\nて|て|-te form (joins actions)|食べて寝る|たべてねる|eat and sleep\nている|ている|is doing|食べている|たべている|is eating\nてください|てください|please do|見てください|みてください|Please look\nてもいい|てもいい|may do|入ってもいい|はいってもいい|You may enter\nなければならない|なければならない|must do|行かなければならない|いかなければならない|I have to go\nないでください|ないでください|please don’t|見ないでください|みないでください|Please don’t look\nことができる|ことができる|can do|泳ぐことができる|およぐことができる|can swim\nつもり|つもり|intend to|行くつもりです|いくつもりです|I intend to go\nでしょう|でしょう|probably|雨でしょう|あめでしょう|It will probably rain\nかもしれない|かもしれない|might|行くかもしれない|いくかもしれない|might go\nと思う|とおもう|I think that|行くと思います|いくとおもいます|I think I’ll go\nので|ので|because|雨なので行きません|あめなのでいきません|It rains, so I won’t go\nけど|けど|but|行くけど|いくけど|I go, but\nそして|そして|and then|そして食べました|そしてたべました|And then I ate\nだから|だから|so, therefore|だから行きます|だからいきます|So I will go\nそれから|それから|after that|それから寝ます|それからねます|After that I sleep\nもし|もし|if (starting word)|もし雨なら|もしあめなら|If it rains\nたら|たら|if, when|行ったら|いったら|if I go\nとき|とき|when, at the time|行くとき|いくとき|when I go\nながら|ながら|while doing|歩きながら話す|あるきながらはなす|talk while walking\nために|ために|in order to|食べるために働く|たべるためにはたらく|work in order to eat\nそうだ|そうだ|looks like|おいしそうだ|おいしそうだ|Looks tasty\nみたい|みたい|like, seems|夢みたい|ゆめみたい|like a dream\n何|なに|what|何を食べますか|なにをたべますか|What will you eat?\nどこ|どこ|where|どこに行きますか|どこにいきますか|Where do you go?\nいつ|いつ|when|いつ行きますか|いついきますか|When do you go?\nどう|どう|how|どうですか|どうですか|How is it?\nどうして|どうして|why|どうして行きますか|どうしていきますか|Why do you go?\nいくら|いくら|how much|いくらですか|いくらですか|How much is it?\nいくつ|いくつ|how many|いくつありますか|いくつありますか|How many are there?\nどれ|どれ|which one|どれですか|どれですか|Which one is it?\nどの|どの|which (before a noun)|どの本ですか|どのほんですか|Which book?\nこの|この|this (before a noun)|この本|このほん|this book\nその|その|that (before a noun)|その本|そのほん|that book\nあの|あの|that over there (before a noun)|あの本|あのほん|that book over there\nここ|ここ|here|ここにあります|ここにあります|It is here\nそこ|そこ|there|そこにいます|そこにいます|(He) is there\nあそこ|あそこ|over there|あそこに行きます|あそこにいきます|I go over there\nとても|とても|very|とても大きい|とてもおおきい|very big\nもう|もう|already|もう食べました|もうたべました|I already ate\nまだ|まだ|not yet, still|まだ食べません|まだたべません|I haven’t eaten yet\nすぐ|すぐ|right away|すぐ行きます|すぐいきます|I’ll go right away\nいつも|いつも|always|いつも食べます|いつもたべます|I always eat\nよく|よく|often, well|よく行きます|よくいきます|I often go\nちょっと|ちょっと|a little|ちょっと待って|ちょっとまって|Wait a little\n全然|ぜんぜん|not at all (with “not”)|全然分かりません|ぜんぜんわかりません|I don’t understand at all\nたくさん|たくさん|a lot|たくさん食べます|たくさんたべます|I eat a lot\n少し|すこし|a little bit|少し話します|すこしはなします|I speak a little\nもっと|もっと|more|もっと食べたい|もっとたべたい|I want to eat more\n一番|いちばん|the most|一番好き|いちばんすき|like it the most\n本当に|ほんとうに|really|本当に好き|ほんとうにすき|really like it\n一緒に|いっしょに|together|一緒に行きます|いっしょにいきます|go together\nはい|はい|yes|はい、行きます|はい、いきます|Yes, I’ll go\nいいえ|いいえ|no|いいえ、行きません|いいえ、いきません|No, I won’t go\nありがとう|ありがとう|thank you|ありがとう|ありがとう|Thank you\nすみません|すみません|excuse me, sorry|すみません|すみません|Excuse me\nお願いします|おねがいします|please (asking)|お願いします|おねがいします|Please\nください|ください|please give me|水をください|みずをください|Please give me water\n好き|すき|like (a liking word)|犬が好きです|いぬがすきです|I like dogs\n大きい|おおきい|big|大きい犬|おおきいいぬ|a big dog\n小さい|ちいさい|small|小さい猫|ちいさいねこ|a small cat\nいい|いい|good|いい天気|いいてんき|nice weather\n高い|たかい|expensive, tall|高い山|たかいやま|a tall mountain\nさん|さん|Mr, Ms (after a name)|田中さん|たなかさん|Mr. Tanaka\n今|いま|now|今行きます|いまいきます|I go now\n明日|あした|tomorrow|明日行きます|あしたいきます|I go tomorrow\n昨日|きのう|yesterday|昨日食べました|きのうたべました|I ate yesterday\n毎日|まいにち|every day|毎日走ります|まいにちはしります|I run every day\n時々|ときどき|sometimes|時々行きます|ときどきいきます|I sometimes go').split('\n').map(function (l) { var a = split(l), w = plain(a); w.ex = [a[3], a[4], a[5]]; if (w.w === 'は') w.ro = 'wa'; if (w.w === 'を') w.ro = 'o'; if (w.w === 'へ') w.ro = 'e'; return w; });

  /* ----- letters ----- */
  var ROWS = [['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'], ['た', 'ち', 'つ', 'て', 'と'], ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ま', 'み', 'む', 'め', 'も'], ['や', null, 'ゆ', null, 'よ'], ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', null, 'を', null, 'ん']];
  var ROWS2 = [['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'], ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']];
  function kata(c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); }
  function mkRows(rows, k) { return rows.map(function (r) { return r.map(function (c) { return c ? [k ? kata(c) : c, MAP[c]] : null; }); }); }
  var letters = [
    { name: 'Hiragana', rows: mkRows(ROWS, 0) }, { name: 'Hiragana with marks', rows: mkRows(ROWS2, 0) },
    { name: 'Katakana', rows: mkRows(ROWS, 1) }, { name: 'Katakana with marks', rows: mkRows(ROWS2, 1) }
  ];

  /* ----- lessons ----- */
  function B(s, r, g) { return [s, r || '', g || '']; }
  var lessons = [
    { t: 'The order of a sentence', intro: ['English says: I eat rice. Subject, verb, object. Japanese puts the verb at the very end: I rice eat.'],
      points: ['Order: who, then what, then the action.', 'The verb is always last. Nothing comes after it, except a question sound like か.', 'Small marker words (particles) come after each word to say what job it does.'],
      ex: [{ s: [B('私', 'わたし', 'I'), B('は', 'wa', 'topic'), B('水', 'みず', 'water'), B('を', 'o', 'object'), B('飲みます', 'のみます', 'drink')], en: 'I drink water.', say: '私は水を飲みます' }] },
    { t: 'Particles: the small glue words', intro: ['Each particle sits right after a word and tells you its job. They matter more than anything else in Japanese.'],
      points: ['は (wa) marks the topic: what we are talking about.', 'を (o) marks the thing the action happens to.', 'に (ni) marks where you go to, or the time something happens.', 'で (de) marks the place where you do the action.', 'の (no) joins two nouns: 私の本 is my book.', 'と (to) means and, or with. も (mo) means also.'],
      ex: [{ s: [B('学校', 'がっこう', 'school'), B('に', 'ni', 'to'), B('行きます', 'いきます', 'go')], en: 'I go to school.', say: '学校に行きます' }, { s: [B('家', 'いえ', 'house'), B('で', 'de', 'at'), B('本', 'ほん', 'book'), B('を', 'o', 'object'), B('読みます', 'よみます', 'read')], en: 'I read a book at home.', say: '家で本を読みます' }] },
    { t: 'Polite verbs: ます', intro: ['Every verb in the word list is in its dictionary form. To be polite, change the ending to ます. The ます form is the safe one to speak.'],
      points: ['ます = do it. ません = don’t do it.', 'ました = did it. ませんでした = didn’t do it.', 'There is no “I, you, he” change. The verb stays the same for everyone.'],
      ex: [{ s: [B('食べます', 'たべます', 'eat')], en: 'eat, will eat' }, { s: [B('食べません', 'たべません', 'don’t eat')], en: 'don’t eat' }, { s: [B('食べました', 'たべました', 'ate')], en: 'ate' }, { s: [B('食べませんでした', 'たべませんでした', 'didn’t eat')], en: 'didn’t eat' }] },
    { t: 'Two kinds of verb', intro: ['To get the ます form you drop the ending, and it depends on the verb type. The app knows each verb’s type behind the scenes, and Make your own shows the result.'],
      points: ['Type A (ends in る with an え or い sound before it, like 食べる, 見る, 寝る): drop る, add ます.', 'Type B (everything else, like 飲む, 行く, 話す): change the last sound to the い sound, then add ます. 飲む becomes 飲みます. 行く becomes 行きます.', 'Two odd ones: する becomes します. 来る (くる) becomes 来ます (きます).'],
      ex: [{ s: [B('食べる', 'たべる', 'eat'), B('→', '', ''), B('食べます', 'たべます', '')], en: 'Drop る, add ます.' }, { s: [B('飲む', 'のむ', 'drink'), B('→', '', ''), B('飲みます', 'のみます', '')], en: 'む becomes み, add ます.' }] },
    { t: 'A is B: です', intro: ['です works like is, am and are. Put it at the end. It has no meaning by itself, it just closes the sentence politely.'],
      points: ['A は B です = A is B.', 'Not: A は B ではありません (or じゃありません).', 'Was: でした. Question: add か.'],
      ex: [{ s: [B('私', 'わたし', 'I'), B('は', 'wa', 'topic'), B('学生', 'がくせい', 'student'), B('です', 'desu', 'am')], en: 'I am a student.', say: '私は学生です' }, { s: [B('これ', '', 'this'), B('は', 'wa', 'topic'), B('水', 'みず', 'water'), B('ですか', 'desu ka', 'is it?')], en: 'Is this water?', say: 'これは水ですか' }] },
    { t: 'Questions', intro: ['Add か to the end of any sentence and it becomes a question. No change in word order, no lifting words around.'],
      points: ['Question words (何, どこ, いつ, 誰) stay in the spot where the answer would be.', '何 = what. どこ = where. いつ = when. 誰 = who.'],
      ex: [{ s: [B('何', 'なに', 'what'), B('を', 'o', 'object'), B('食べますか', 'たべますか', 'do you eat?')], en: 'What do you eat?', say: '何を食べますか' }, { s: [B('どこ', '', 'where'), B('に', 'ni', 'to'), B('行きますか', 'いきますか', 'do you go?')], en: 'Where do you go?', say: 'どこに行きますか' }] },
    { t: 'Want to, please, let’s', intro: ['Three tiny changes to the stem (the verb with ます removed) give you the most useful phrases.'],
      points: ['Stem + たいです = I want to do it.', 'Stem + ましょう = Let’s do it.', 'て-form + ください = Please do it. (て-form: 食べる becomes 食べて, 見る becomes 見て.)'],
      ex: [{ s: [B('水', 'みず', 'water'), B('を', 'o', 'object'), B('飲みたいです', 'のみたいです', 'want to drink')], en: 'I want to drink water.', say: '水を飲みたいです' }, { s: [B('一緒に', 'いっしょに', 'together'), B('行きましょう', 'いきましょう', 'let’s go')], en: 'Let’s go together.', say: '一緒に行きましょう' }] },
    { t: 'Joining sentences', intro: ['Small link words let you tie two short sentences into one.'],
      points: ['から = because. けど = but. そして = and then. だから = so.', 'から comes after the reason: 雨ですから、行きません (It’s rain, so I won’t go).'],
      ex: [{ s: [B('雨', 'あめ', 'rain'), B('です', 'desu', 'is'), B('から', 'kara', 'because'), B('行きません', 'いきません', 'won’t go')], en: 'Because it’s raining, I won’t go.', say: '雨ですから行きません' }] }
  ];

  /* ----- practice sentences, in order, each piece is script|reading|meaning ----- */
  function T(a) { return a.map(function (x) { var p = x.split('|'); return [p[0], p[1] || '', p[2] || '']; }); }
  var sentences = [
    ['I drink water.', ['私|わたし|I', 'は||', '水|みず|water', 'を||', '飲みます|のみます|drink']],
    ['I eat rice.', ['私|わたし|I', 'は||', 'ご飯|ごはん|rice', 'を||', '食べます|たべます|eat']],
    ['I go to school.', ['私|わたし|I', 'は||', '学校|がっこう|school', 'に||', '行きます|いきます|go']],
    ['I read a book.', ['私|わたし|I', 'は||', '本|ほん|book', 'を||', '読みます|よみます|read']],
    ['The teacher is a woman.', ['先生|せんせい|teacher', 'は||', '女|おんな|woman', 'です|desu|is']],
    ['I am a student.', ['私|わたし|I', 'は||', '学生|がくせい|student', 'です|desu|am']],
    ['Is this water?', ['これ||this', 'は||', '水|みず|water', 'ですか|desu ka|is it?']],
    ['I do not eat meat.', ['私|わたし|I', 'は||', '肉|にく|meat', 'を||', '食べません|たべません|don’t eat']],
    ['My friend bought a car.', ['友達|ともだち|friend', 'は||', '車|くるま|car', 'を||', '買いました|かいました|bought']],
    ['I will go home.', ['私|わたし|I', 'は||', '家|いえ|home', 'に||', '帰ります|かえります|go back']],
    ['I want to drink tea.', ['私|わたし|I', 'は||', 'お茶|おちゃ|tea', 'を||', '飲みたいです|のみたいです|want to drink']],
    ['Let’s go together.', ['一緒に|いっしょに|together', '行きましょう|いきましょう|let’s go']],
    ['What do you eat?', ['何|なに|what', 'を||', '食べますか|たべますか|do you eat?']],
    ['Where do you go?', ['どこ||where', 'に||', '行きますか|いきますか|do you go?']],
    ['The dog sleeps at home.', ['犬|いぬ|dog', 'は||', '家|いえ|home', 'で||', '寝ます|ねます|sleeps']],
    ['I read a book at the station.', ['私|わたし|I', 'は||', '駅|えき|station', 'で||', '本|ほん|book', 'を||', '読みます|よみます|read']],
    ['The cat is also in the room.', ['猫|ねこ|cat', 'も||', '部屋|へや|room', 'に||', 'います|います|is']],
    ['I wrote a letter.', ['私|わたし|I', 'は||', '手紙|てがみ|letter', 'を||', '書きました|かきました|wrote']],
    ['The mother cooks a meal.', ['母|はは|mother', 'は||', '料理|りょうり|meal', 'を||', '作ります|つくります|makes']],
    ['I did not see the movie.', ['私|わたし|I', 'は||', '映画|えいが|movie', 'を||', '見ませんでした|みませんでした|didn’t see']],
    ['The hero fights the dragon.', ['勇者|ゆうしゃ|hero', 'は||', '竜|りゅう|dragon', 'と||', '戦います|たたかいます|fights']],
    ['Please look at the map.', ['地図|ちず|map', 'を||', '見てください|みてください|please look']],
    ['I understand Japanese.', ['私|わたし|I', 'は||', '日本語|にほんご|Japanese', 'が||', '分かります|わかります|understand']],
    ['Because it rains, I do not go.', ['雨|あめ|rain', 'です|desu|is', 'から|kara|because', '行きません|いきません|won’t go']]
  ].map(function (s) { return { en: s[0], t: T(s[1]), say: s[1].map(function (x) { return x.split('|')[0]; }).join('') + '。' }; });

  /* ----- builders ----- */
  function make(S, O, Vb, f) {
    var vs = conj(Vb.w, Vb.cls, f), vr = conj(Vb.r || Vb.w, Vb.cls, f), fr = Vb.fr, nos = f >= 5;
    var sr = S.r || S.w, parts = nos ? [] : [[S.w, S.r, S.en], ['は', 'wa', 'topic']], romz = nos ? '' : rom(sr) + ' wa';
    if (fr !== 'n') { var pt = PART[fr] || PART.o; parts.push([O.w, O.r, O.en], [pt[0], pt[1], pt[2]]); romz += ' ' + rom(O.r || O.w) + ' ' + pt[1]; }
    romz = romz.trim();
    parts.push([vs, vr === vs ? '' : vr, Vb.en + FEN[f]]); romz += ' ' + (f === 6 ? rom(te(Vb.r || Vb.w, Vb.cls)) + ' kudasai' : rom(vr));
    var text = (nos ? '' : S.w + 'は') + (fr !== 'n' ? O.w + (PART[fr] || PART.o)[0] : '') + vs;
    return { parts: parts, rom: romz, text: text, needsObj: fr !== 'n' };
  }
  function demo(set, w) {
    if (set === 'verbs') {
      var ps = [['私', 'わたし', 'I'], ['は', 'wa', 'topic']], vs = conj(w.w, w.cls, 0), vr = conj(w.r || w.w, w.cls, 0);
      if (w.fr !== 'n') { var pt = PART[w.fr] || PART.o; ps.push(['〜', '', 'something'], [pt[0], pt[1], pt[2]]); }
      ps.push([vs, vr === vs ? '' : vr, w.en]);
      return { parts: ps, en: 'The polite form is ' + vs + (vr !== vs ? ' (' + vr + ')' : '') + '.' };
    }
    if (set === 'objects') return { parts: [['これ', '', 'this'], ['は', 'wa', 'topic'], [w.w, w.r, w.en], ['です', 'desu', 'is']], en: 'This is ' + w.en + '.' };
    if (set === 'subjects') return { parts: [[w.w, w.r, w.en], ['は', 'wa', 'topic'], ['学生', 'がくせい', 'student'], ['です', 'desu', 'is']], en: '(' + w.en + ') is a student.' };
    if (w.ex && w.ex[0] && w.ex[0] !== w.w) return { parts: [[w.ex[0], w.ex[1], '']], en: w.ex[2] };
    return null;
  }

  V.course.add({
    id: 'ja', name: 'Japanese', tts: 'ja-JP', letters: letters, lessons: lessons, sentences: sentences, forms: FORMS, make: make, demo: demo,
    sets: { verbs: verbs, objects: objects, subjects: subjects, helpers: helpers }
  });
})();
