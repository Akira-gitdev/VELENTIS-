/* VELENTIS Word course: Korean pack.
   100 verbs, 100 objects, 100 subjects, 100 helper words (particles, endings, question words, link words),
   Hangul charts, grammar lessons and practice sentences. Most used words come first.
   Hangul syllables are built with Unicode arithmetic; polite (haeyo) forms are computed in code. */
(function () {
  'use strict';
  var V = window.Velentis; if (!V || !V.course) return;

  /* ----- Hangul syllable tools ----- */
  var BASE = 0xAC00;
  function isH(c) { var n = c ? c.charCodeAt(0) : 0; return n >= 0xAC00 && n <= 0xD7A3; }
  function dec(c) { var n = c.charCodeAt(0) - BASE; return { l: Math.floor(n / 588), v: Math.floor((n % 588) / 28), t: n % 28 }; }
  function com(l, v, t) { return String.fromCharCode(BASE + (l * 21 + v) * 28 + t); }
  function hasB(s) { var c = s.charAt(s.length - 1); return isH(c) && dec(c).t > 0; }
  function bright(v) { return v === 0 || v === 8; }   /* vowels a and o take 아, the rest take 어 */

  /* ----- Revised Romanization from Hangul (with the main sound changes) ----- */
  var INI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  var VOW = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  var FIN = [[], [0], [1], [0, 9], [2], [2, 12], [2, 18], [3], [5], [5, 0], [5, 6], [5, 7], [5, 9], [5, 16], [5, 17], [5, 18], [6], [7], [7, 9], [9], [10], [99], [12], [14], [15], [16], [17], [18]];
  function neut(c) {
    if (c === 0 || c === 1 || c === 15) return 'k';
    if (c === 7 || c === 17) return 'p';
    if (c === 2) return 'n'; if (c === 5) return 'l'; if (c === 6) return 'm'; if (c === 99) return 'ng';
    return 't';
  }
  function finOf(f, bc) {
    if (!f.length) return '';
    if (f.length === 2) {
      if (f[0] === 5) { if (f[1] === 0) return bc === 0 ? 'l' : 'k'; if (f[1] === 6) return 'm'; if (f[1] === 17) return 'p'; return 'l'; }
      return neut(f[0]);
    }
    return neut(f[0]);
  }
  function rrWord(str) {
    var syl = [], i, a, b;
    for (i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (isH(ch)) { var d = dec(ch); syl.push({ c: d.l, v: d.v, f: FIN[d.t].slice(), fs: '', lq: false }); } else syl.push({ raw: ch });
    }
    for (i = 0; i < syl.length; i++) {
      a = syl[i]; b = syl[i + 1];
      if (a.raw !== undefined) continue;
      var bc = -1;
      if (b && b.raw === undefined) {
        bc = b.c;
        if (b.c === 11) {
          if (a.f.length && a.f[a.f.length - 1] === 18) a.f.pop();
          if (a.f.length && a.f[a.f.length - 1] !== 99) {
            var m = a.f.pop();
            if (m === 3 && b.v === 20) m = 12; else if (m === 16 && b.v === 20) m = 14;
            b.c = m;
          }
          bc = b.c;
        } else if (a.f.length && a.f[a.f.length - 1] === 18) {
          a.f.pop();
          if (b.c === 0) b.c = 15; else if (b.c === 3) b.c = 16; else if (b.c === 12) b.c = 14; else if (b.c === 7) b.c = 17;
          bc = b.c;
        }
      }
      var nf = finOf(a.f, bc);
      if (b && b.raw === undefined && nf) {
        if ((nf === 'k' || nf === 't' || nf === 'p') && (b.c === 2 || b.c === 6)) nf = nf === 'k' ? 'ng' : nf === 't' ? 'n' : 'm';
        else if ((nf === 'k' || nf === 't' || nf === 'p') && b.c === 5) { nf = nf === 'k' ? 'ng' : nf === 't' ? 'n' : 'm'; b.c = 2; }
        else if ((nf === 'm' || nf === 'ng') && b.c === 5) b.c = 2;
        else if (nf === 'n' && b.c === 5) { nf = 'l'; b.lq = true; }
        else if (nf === 'l' && b.c === 2) { b.c = 5; b.lq = true; }
        else if (nf === 'l' && b.c === 5) b.lq = true;
      }
      a.fs = nf;
    }
    var out = '';
    for (i = 0; i < syl.length; i++) { a = syl[i]; out += a.raw !== undefined ? a.raw : (a.lq ? 'l' : INI[a.c]) + VOW[a.v] + a.fs; }
    return out;
  }
  function rr(s) { return (s || '').split(' ').map(rrWord).join(' ').replace(/null/g, 'nul-l'); }

  /* ----- polite verb forms ----- */
  /* irr: 'd' (ㄷ→ㄹ), 'b' (ㅂ), 's' (ㅅ), 'r' (르); the rest is handled by the sound of the stem */
  function haeBase(dict, irr) {
    var s = dict.slice(0, -1), n = s.length, lc = dec(s.charAt(n - 1)), pre = s.slice(0, -1), p;
    if (s.charAt(n - 1) === '하') return pre + '해';
    if (irr === 'r') { p = dec(s.charAt(n - 2)); return s.slice(0, n - 2) + com(p.l, p.v, 8) + (bright(p.v) ? '라' : '러'); }
    if (irr === 'd') return pre + com(lc.l, lc.v, 8) + (bright(lc.v) ? '아' : '어');
    if (irr === 'b') return pre + com(lc.l, lc.v, 0) + (s === '돕' ? '와' : '워');
    if (irr === 's') return pre + com(lc.l, lc.v, 0) + (bright(lc.v) ? '아' : '어');
    if (lc.t > 0) return s + (bright(lc.v) ? '아' : '어');
    var v = lc.v;
    if (v === 8) return pre + com(lc.l, 9, 0);
    if (v === 13) return pre + com(lc.l, 14, 0);
    if (v === 20) return pre + com(lc.l, 6, 0);
    if (v === 11) return pre + com(lc.l, 10, 0);
    if (v === 18) { p = n > 1 ? dec(s.charAt(n - 2)) : null; return pre + com(lc.l, p && bright(p.v) ? 0 : 4, 0); }
    if (v === 16 || v === 19) return s + '어';
    return s;
  }
  function pastBase(h) { var c = dec(h.charAt(h.length - 1)); return h.slice(0, -1) + com(c.l, c.v, 20); }
  function lBase(dict, irr) {   /* stem + ㄹ, used in ㄹ까요 and ㄹ 수 있어요 */
    var s = dict.slice(0, -1), lc = dec(s.charAt(s.length - 1)), pre = s.slice(0, -1);
    if (irr === 'd') return pre + com(lc.l, lc.v, 8) + '을';
    if (irr === 'b') return pre + com(lc.l, lc.v, 0) + '울';
    if (irr === 's') return pre + com(lc.l, lc.v, 0) + '을';
    if (lc.t === 8) return s;
    if (lc.t > 0) return s + '을';
    return pre + com(lc.l, lc.v, 8);
  }
  function seForm(dict, irr) {  /* polite request: 가세요, 먹으세요 */
    var s = dict.slice(0, -1), lc = dec(s.charAt(s.length - 1)), pre = s.slice(0, -1);
    if (irr === 'd') return pre + com(lc.l, lc.v, 8) + '으세요';
    if (irr === 'b') return pre + com(lc.l, lc.v, 0) + '우세요';
    if (irr === 's') return pre + com(lc.l, lc.v, 0) + '으세요';
    if (lc.t === 8) return pre + com(lc.l, lc.v, 0) + '세요';
    if (lc.t > 0) return s + '으세요';
    return s + '세요';
  }
  var FORMS = ['Now', 'Not', 'Past', 'Want to', "Let's", 'Please', 'Can'];
  var FEN = ['', ' (not)', ' (past)', ' (want to)', " (shall we)", ' (please)', ' (can)'];
  function conj(w, f) {
    var s = w.w.slice(0, -1);
    if (f === 0) return haeBase(w.w, w.irr) + '요';
    if (f === 1) return s + '지 않아요';
    if (f === 2) return pastBase(haeBase(w.w, w.irr)) + '어요';
    if (f === 3) return s + '고 싶어요';
    if (f === 4) return lBase(w.w, w.irr) + '까요?';
    if (f === 5) return seForm(w.w, w.irr);
    return lBase(w.w, w.irr) + ' 수 있어요';
  }
  /* object marker by verb type: o = 을/를, g = 이/가, p = 에, e = 에서 */
  function objPart(type, O) {
    if (type === 'o') return hasB(O.w) ? ['을', 'object'] : ['를', 'object'];
    if (type === 'g') return hasB(O.w) ? ['이', 'what'] : ['가', 'what'];
    if (type === 'p') return ['에', 'to / at'];
    return ['에서', 'at'];
  }
  function topic(S) { if (S.w === '누구') return ['가', 'subject']; return [hasB(S.w) ? '은' : '는', 'topic']; }

  /* ----- word data ----- */
  function plain(l) { var a = l.split('|'); return { w: a[0], r: '', ro: rr(a[0]), en: a[1] }; }
  function list(arr) { return arr.map(plain); }

  var verbs = [
    '하다|do|o', '가다|go|p', '오다|come|p', '보다|see, watch|o', '먹다|eat|o', '말하다|speak, say|o', '알다|know|o', '모르다|not know|o|r', '주다|give|o', '받다|receive|o',
    '만나다|meet|o', '좋아하다|like|o', '원하다|want|o', '필요하다|need|g', '생각하다|think|o', '사다|buy|o', '읽다|read|o', '쓰다|write|o', '듣다|listen, hear|o|d', '마시다|drink|o',
    '사랑하다|love|o', '만들다|make|o', '사용하다|use|o', '가지다|have, hold|o', '기다리다|wait for|o', '찾다|look for|o', '보내다|send|o', '팔다|sell|o', '앉다|sit|n', '서다|stand|n',
    '걷다|walk|n|d', '달리다|run|n', '타다|ride|o', '내리다|get off|e', '일어나다|get up|n', '자다|sleep|n', '쉬다|rest|n', '일하다|work|e', '공부하다|study|o', '배우다|learn|o',
    '가르치다|teach|o', '기억하다|remember|o', '잊다|forget|o', '시작하다|start|o', '끝나다|end|n', '열다|open|o', '닫다|close|o', '놓다|put down|o', '넣다|put in|o', '꺼내다|take out|o',
    '켜다|turn on|o', '끄다|turn off|o', '빌리다|borrow|o', '돌려주다|give back|o', '부르다|call, sing|o|r', '노래하다|sing|o', '놀다|play|n', '수영하다|swim|n', '웃다|laugh|n', '울다|cry|n',
    '죽다|die|n', '살다|live|p', '태어나다|be born|n', '바꾸다|change (something)|o', '변하다|change (by itself)|n', '계속하다|continue|o', '결정하다|decide|o', '고르다|choose|o|r', '발견하다|find, discover|o', '자르다|cut|o|r',
    '씻다|wash|o', '입다|wear|o', '신다|wear (shoes)|o', '벗다|take off|o', '청소하다|clean|o', '요리하다|cook|o', '운전하다|drive|o', '연습하다|practice|o', '이기다|win, beat|o', '지다|lose|n',
    '싸우다|fight|n', '지키다|protect|o', '돕다|help|o|b', '도와주다|help out|o', '지불하다|pay|o', '누르다|press|o|r', '밀다|push|o', '당기다|pull|o', '던지다|throw|o', '떨어지다|fall|n',
    '날다|fly|n', '짓다|build|o|s', '멈추다|stop|n', '도착하다|arrive|p', '들어가다|go in|p', '나가다|go out|p', '돌아가다|go back|p', '묻다|ask|o|d', '이해하다|understand|o', '구하다|rescue|o'
  ].map(function (l) { var a = l.split('|'), w = plain(l); w.fr = a[2]; w.irr = a[3] || ''; return w; });

  var subjects = list([
    '저|I', '나|I (casual)', '너|you (casual)', '당신|you (formal, rare)', '우리|we', '저희|we (humble)', '그|he', '그녀|she', '그들|they', '이것|this',
    '그것|that', '저것|that over there', '누구|who', '사람|person', '남자|man', '여자|woman', '아이|child', '소년|boy', '소녀|girl', '아기|baby',
    '어머니|mother', '아버지|father', '엄마|mom', '아빠|dad', '형|older brother (of a man)', '오빠|older brother (of a woman)', '누나|older sister (of a man)', '언니|older sister (of a woman)', '동생|younger sibling', '남편|husband',
    '아내|wife', '가족|family', '친구|friend', '선생님|teacher', '학생|student', '의사|doctor', '간호사|nurse', '점원|shop clerk', '손님|customer', '사장님|boss',
    '회사원|office worker', '경찰|police', '운전사|driver', '요리사|cook, chef', '가수|singer', '선수|player', '한국인|Korean person', '외국인|foreigner', '어른|adult', '선배|senior',
    '후배|junior', '동료|coworker', '왕|king', '여왕|queen', '왕자|prince', '공주|princess', '용사|hero', '전사|warrior', '마법사|wizard', '기사|knight',
    '도둑|thief', '적|enemy', '아군|ally', '신|god', '개|dog', '고양이|cat', '새|bird', '말|horse', '소|cow', '돼지|pig',
    '양|sheep', '쥐|mouse', '벌레|bug', '용|dragon', '곰|bear', '늑대|wolf', '토끼|rabbit', '원숭이|monkey', '코끼리|elephant', '동물|animal',
    '모두|everyone', '누군가|someone', '자기|oneself', '비|rain', '바람|wind', '눈|snow', '해|sun', '달|moon', '별|star', '구름|cloud',
    '할아버지|grandfather', '할머니|grandmother', '남자친구|boyfriend', '주민|villager', '상인|merchant', '도깨비|goblin', '유령|ghost', '시장님|mayor', '아들|son', '딸|daughter'
  ]);

  var objects = list([
    '물|water', '음식|food', '밥|rice, meal', '빵|bread', '고기|meat', '생선|fish', '채소|vegetables', '과일|fruit', '사과|apple', '계란|egg',
    '차|tea', '커피|coffee', '우유|milk', '주스|juice', '소금|salt', '설탕|sugar', '점심|lunch', '저녁|dinner', '아침|morning, breakfast', '도시락|lunch box',
    '책|book', '편지|letter', '신문|newspaper', '사전|dictionary', '연필|pencil', '펜|pen', '종이|paper', '가방|bag', '지갑|wallet', '열쇠|key',
    '우산|umbrella', '신발|shoes', '옷|clothes', '모자|hat', '시계|watch, clock', '휴대폰|mobile phone', '전화|phone call', '컴퓨터|computer', '텔레비전|TV', '사진|photo',
    '영화|movie', '음악|music', '노래|song', '게임|game', '그림|picture', '자동차|car', '기차|train', '버스|bus', '자전거|bicycle', '표|ticket',
    '돈|money', '집|house, home', '방|room', '학교|school', '가게|shop', '역|station', '길|road, way', '마을|village, town', '나라|country', '산|mountain',
    '바다|sea', '강|river', '꽃|flower', '나무|tree', '하늘|sky', '이름|name', '말|word, speech', '한국어|Korean', '영어|English', '일|work, job',
    '숙제|homework', '시험|exam', '문제|problem', '질문|question', '대답|answer', '이야기|story', '꿈|dream', '시간|time', '밤|night', '검|sword',
    '마법|magic', '약|medicine', '지도|map', '문|door', '창문|window', '의자|chair', '책상|desk', '침대|bed', '목욕|bath', '짐|luggage',
    '힘|strength', '마음|heart, mind', '손|hand', '눈|eye', '머리|head', '접시|plate', '숟가락|spoon', '도시|city', '공원|park', '선물|gift'
  ]);

  var helpers = [
    '이다|to be (is, am, are)|저는 학생이에요.|I am a student.',
    '은/는|topic marker (은 after a consonant, 는 after a vowel)|선생님은 의사예요.|The teacher is a doctor.',
    '이/가|subject marker (이 after a consonant, 가 after a vowel)|개가 있어요.|There is a dog.',
    '을/를|object marker (을 after a consonant, 를 after a vowel)|물을 마셔요.|I drink water.',
    '에|to, at, in (a place or a time)|학교에 가요.|I go to school.',
    '에서|at (where you do it), from|집에서 먹어요.|I eat at home.',
    '의|of, ’s|친구의 집|a friend’s house',
    '도|also, too|저도 가요.|I go too.',
    '와/과|and, with (와 after a vowel, 과 after a consonant)|책과 펜|a book and a pen',
    '하고|and, with (spoken)|엄마하고 가요.|I go with Mom.',
    '로/으로|by, toward (로 after a vowel, 으로 after a consonant)|버스로 가요.|I go by bus.',
    '에게|to (a person)|친구에게 줘요.|I give it to a friend.',
    '한테|to (a person, spoken)|친구한테 말해요.|I tell a friend.',
    '부터|from (a starting point)|아침부터 일해요.|I work from the morning.',
    '까지|until, up to|밤까지 공부해요.|I study until night.',
    '만|only|물만 마셔요.|I drink only water.',
    '보다|than|개보다 고양이가 좋아요.|I like cats more than dogs.',
    '있다|there is, to have, to stay|책이 있어요.|There is a book.',
    '없다|there is not, to not have|돈이 없어요.|I have no money.',
    '이에요/예요|is (이에요 after a consonant, 예요 after a vowel)|이것은 책이에요.|This is a book.',
    '아니다|is not|저는 학생이 아니에요.|I am not a student.',
    '안|not (before a verb)|안 먹어요.|I don’t eat.',
    '못|cannot|못 가요.|I can’t go.',
    '지 않아요|do not (after the verb stem)|먹지 않아요.|I do not eat.',
    '지 마세요|please do not|가지 마세요.|Please don’t go.',
    '아요/어요|polite ending|먹어요.|I eat.',
    '았어요/었어요|past ending|먹었어요.|I ate.',
    '고 싶어요|want to|먹고 싶어요.|I want to eat.',
    '세요/으세요|polite request (also a respectful ending)|앉으세요.|Please sit down.',
    '주세요|please give me|물을 주세요.|Please give me water.',
    '수 있어요|can|갈 수 있어요.|I can go.',
    '수 없어요|cannot|먹을 수 없어요.|I cannot eat.',
    '거예요|will|내일 갈 거예요.|I will go tomorrow.',
    '야 해요|must (아야 / 어야 해요)|가야 해요.|I must go.',
    '고 있어요|is doing|먹고 있어요.|I am eating.',
    '까요|shall we? (ㄹ까요)|같이 갈까요?|Shall we go together?',
    '습니다|formal polite ending|먹습니다.|I eat. (formal)',
    '입니다|is (formal)|저는 학생입니다.|I am a student. (formal)',
    '면/으면|if|비가 오면 안 가요.|If it rains, I don’t go.',
    '지만|but (inside a sentence)|비싸지만 좋아요.|It is expensive, but good.',
    '아서/어서|because, so|피곤해서 자요.|I am tired, so I sleep.',
    '니까/으니까|because, since|비가 오니까 집에 있어요.|Since it is raining, I stay home.',
    '러/으러|in order to (with go, come)|먹으러 가요.|I go to eat.',
    '그리고|and, and then|그리고 먹었어요.|And then I ate.',
    '그런데|but, by the way|그런데 뭐 해요?|By the way, what are you doing?',
    '하지만|but|하지만 안 가요.|But I won’t go.',
    '그래서|so, therefore|그래서 집에 가요.|So I go home.',
    '그러면|then, in that case|그러면 같이 가요.|Then let’s go together.',
    '또는|or|물 또는 차|water or tea',
    '때|when, at the time|집에 갈 때|when I go home',
    '때문에|because of|비 때문에 못 가요.|I can’t go because of the rain.',
    '뭐|what|뭐 먹어요?|What do you eat?',
    '누구|who|누구예요?|Who is it?',
    '어디|where|어디 가요?|Where are you going?',
    '언제|when|언제 가요?|When do you go?',
    '왜|why|왜 가요?|Why do you go?',
    '어떻게|how|어떻게 가요?|How do you go?',
    '얼마|how much|얼마예요?|How much is it?',
    '몇|how many|몇 개 있어요?|How many are there?',
    '어느|which|어느 책이에요?|Which book is it?',
    '무슨|what kind of|무슨 음악을 좋아해요?|What music do you like?',
    '이|this (before a noun)|이 책|this book',
    '그|that (before a noun)|그 책|that book',
    '저|that over there (before a noun)|저 책|that book over there',
    '여기|here|여기 있어요.|It is here.',
    '거기|there|거기에 가요.|I go there.',
    '저기|over there|저기에 있어요.|It is over there.',
    '아주|very|아주 커요.|It is very big.',
    '너무|too, so much|너무 커요.|It is too big.',
    '정말|really|정말 좋아해요.|I really like it.',
    '항상|always|항상 먹어요.|I always eat.',
    '자주|often|자주 가요.|I often go.',
    '가끔|sometimes|가끔 가요.|I sometimes go.',
    '보통|usually|보통 집에서 먹어요.|I usually eat at home.',
    '지금|now|지금 가요.|I go now.',
    '오늘|today|오늘 가요.|I go today.',
    '내일|tomorrow|내일 가요.|I go tomorrow.',
    '어제|yesterday|어제 갔어요.|I went yesterday.',
    '매일|every day|매일 달려요.|I run every day.',
    '이미|already|이미 먹었어요.|I already ate.',
    '아직|still, not yet|아직 안 먹었어요.|I haven’t eaten yet.',
    '좋다|good, to like (a feeling word)|날씨가 좋아요.|The weather is good.',
    '같이|together|같이 가요.|Let’s go together.',
    '더|more|더 먹고 싶어요.|I want to eat more.',
    '다시|again|다시 말해 주세요.|Please say it again.',
    '조금|a little|조금 먹어요.|I eat a little.',
    '많이|a lot|많이 먹어요.|I eat a lot.',
    '잘|well|잘 해요.|I do it well.',
    '빨리|quickly|빨리 가요.|I go quickly.',
    '천천히|slowly|천천히 말해 주세요.|Please speak slowly.',
    '모두|everyone, all|모두 와요.|Everyone comes.',
    '제일|the most|제일 좋아요.|It is the best.',
    '아마|maybe|아마 비가 올 거예요.|It will probably rain.',
    '크다|big|개가 커요.|The dog is big.',
    '네|yes|네, 가요.|Yes, I’ll go.',
    '아니요|no|아니요, 안 가요.|No, I won’t go.',
    '감사합니다|thank you|감사합니다.|Thank you.',
    '죄송합니다|I am sorry|죄송합니다.|I am sorry.',
    '안녕하세요|hello|안녕하세요.|Hello.',
    '괜찮아요|it is OK|괜찮아요.|It’s OK.'
  ].map(function (l) { var a = l.split('|'), w = plain(l); w.ex = [a[2], '', a[3]]; return w; });

  /* ----- letters ----- */
  function row(a, b) { return a.map(function (c, i) { return c ? [c, b[i]] : null; }); }
  function sylRows(cs) { return cs.map(function (r) { return r.split(' ').map(function (c) { return [c, rr(c)]; }); }); }
  var letters = [
    { name: 'Vowels', rows: [row(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ'], ['a', 'ya', 'eo (uh)', 'yeo', 'o']), row(['ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'], ['yo', 'u (oo)', 'yu', 'eu (uh, lips flat)', 'i (ee)'])] },
    { name: 'Consonants', rows: [row(['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ'], ['g / k', 'n', 'd / t', 'r / l', 'm']), row(['ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ'], ['b / p', 's', 'silent / ng', 'j', 'ch']), row(['ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'], ['k (strong)', 't (strong)', 'p (strong)', 'h'])] },
    { name: 'Double consonants', rows: [row(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'], ['kk', 'tt', 'pp', 'ss', 'jj'])] },
    { name: 'Vowel blends', rows: [row(['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ'], ['ae (eh)', 'yae', 'e (eh, same)', 'ye', 'wa']), row(['ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ'], ['wae', 'oe (we)', 'wo', 'we', 'wi']), row(['ㅢ'], ['ui'])] },
    { name: 'First syllables', rows: sylRows(['가 나 다 라 마', '바 사 아 자 차', '카 타 파 하', '거 너 더 러 머', '고 노 도 로 모', '구 누 두 루 무', '그 느 드 르 므', '기 니 디 리 미']) }
  ];

  /* ----- lessons ----- */
  function B(s, r, g) { return [s, r || '', g || '']; }
  var lessons = [
    { t: 'Hangul: letters build blocks', intro: ['Korean has its own alphabet, called Hangul. It is simple and logical. The letters are packed into little square blocks, and each block is one syllable.'],
      points: ['A block has two or three parts: a consonant, a vowel, and sometimes one more consonant at the bottom.', 'A vowel sits to the right of the consonant (가 = ㄱ + ㅏ = ga) or underneath it (고 = ㄱ + ㅗ = go).', 'ㅇ at the start of a block is silent. 아 is just a. At the bottom of a block, ㅇ says ng: 강 = gang.', 'The consonant at the bottom is called batchim. It matters later, because it decides which small word you add (은 or 는, 을 or 를).', 'Read the blocks left to right. 한국어 = han-gu-geo = the Korean language.'],
      ex: [{ s: [B('ㅎ', '', 'h'), B('ㅏ', '', 'a'), B('ㄴ', '', 'n'), B('→', '', ''), B('한', '', 'han')], en: 'Three letters make one block: han.', say: '한' }, { s: [B('한', '', 'han'), B('국', '', 'guk'), B('어', '', 'eo')], en: 'Korean (the language)', say: '한국어' }] },
    { t: 'The order of a sentence', intro: ['English says: I eat rice. Subject, verb, object. Korean puts the verb at the very end: I rice eat.'],
      points: ['Order: who, then what, then the action.', 'The verb is always last. Nothing comes after it.', 'Small marker words (particles) sit right after a word and say what job it does.', 'Korean often leaves out “I” and “you” when it is clear. 밥 먹어요 can mean I eat rice.'],
      ex: [{ s: [B('저', '', 'I'), B('는', '', 'topic'), B('물', '', 'water'), B('을', '', 'object'), B('마셔요', '', 'drink')], en: 'I drink water.', say: '저는 물을 마셔요.' }] },
    { t: 'Particles: the small glue words', intro: ['A particle is stuck to the end of a word. It tells you the job of that word. Many particles have two forms. Look at the last block of the word before it.'],
      points: ['Word ends in a consonant (batchim): 은, 이, 을, 과. Word ends in a vowel: 는, 가, 를, 와.', '은/는 marks the topic: what we talk about. 이/가 marks who or what does it.', '을/를 marks the thing the action happens to.', '에 = to, at (where you go, or a time). 에서 = at (where you do something).', '의 = ’s (친구의 집 = friend’s house). 도 = also. 와/과 = and, with.'],
      ex: [{ s: [B('학교', '', 'school'), B('에', '', 'to'), B('가요', '', 'go')], en: 'I go to school.', say: '학교에 가요.' }, { s: [B('집', '', 'home'), B('에서', '', 'at'), B('책', '', 'book'), B('을', '', 'object'), B('읽어요', '', 'read')], en: 'I read a book at home.', say: '집에서 책을 읽어요.' }, { s: [B('커피', '', 'coffee'), B('를', '', 'object'), B('마셔요', '', 'drink')], en: 'I drink coffee. (커피 ends in a vowel, so 를.)', say: '커피를 마셔요.' }] },
    { t: 'Polite verbs: 요', intro: ['Every verb in the word list is in its dictionary form, which ends in 다. For speaking, drop 다 and add 아요 or 어요. This is the polite everyday form. The app works it out for you.'],
      points: ['If the last vowel of the stem is ㅏ or ㅗ, add 아요. Otherwise add 어요. 앉다 → 앉아요. 먹다 → 먹어요.', 'When the stem ends in a vowel, the sounds squeeze together: 가다 → 가요, 보다 → 봐요, 마시다 → 마셔요.', 'Every verb that ends in 하다 becomes 해요: 공부하다 → 공부해요.', 'Past: 았어요 / 었어요 → 갔어요 (went), 먹었어요 (ate), 공부했어요 (studied).', 'The verb does not change for I, you, he or we. It is the same for everyone.', 'A few verbs bend their stem: 듣다 → 들어요, 쓰다 → 써요, 모르다 → 몰라요.'],
      ex: [{ s: [B('먹다', '', 'eat'), B('→', '', ''), B('먹어요', '', 'eat')], en: 'Drop 다, add 어요.' }, { s: [B('가다', '', 'go'), B('→', '', ''), B('가요', '', 'go'), B('→', '', ''), B('갔어요', '', 'went')], en: 'Present, then past.' }, { s: [B('공부하다', '', 'study'), B('→', '', ''), B('공부해요', '', 'study')], en: '하다 becomes 해요.' }] },
    { t: 'To be and to have', intro: ['To say A is B, put 이에요 or 예요 after B. To say something exists or you have it, use 있어요. To say it does not exist, use 없어요.'],
      points: ['B ends in a consonant: 이에요. B ends in a vowel: 예요.', 'Is not: 이/가 아니에요. 저는 학생이 아니에요 = I am not a student.', '있어요 = there is, I have. 없어요 = there is not, I don’t have.', 'There is no change for I, you, he. 이에요 is the same for all.'],
      ex: [{ s: [B('저', '', 'I'), B('는', '', 'topic'), B('학생', '', 'student'), B('이에요', '', 'am')], en: 'I am a student.', say: '저는 학생이에요.' }, { s: [B('저', '', 'I'), B('는', '', 'topic'), B('의사', '', 'doctor'), B('예요', '', 'am')], en: 'I am a doctor.', say: '저는 의사예요.' }, { s: [B('책', '', 'book'), B('이', '', 'subject'), B('있어요', '', 'there is')], en: 'There is a book. / I have a book.', say: '책이 있어요.' }, { s: [B('돈', '', 'money'), B('이', '', 'subject'), B('없어요', '', 'there is not')], en: 'I have no money.', say: '돈이 없어요.' }] },
    { t: 'Saying not', intro: ['There are two easy ways. Put 안 in front of the verb, or add 지 않아요 to the verb stem. The app uses 지 않아요 because it works the same for every verb.'],
      points: ['안 + verb: 안 먹어요 = I don’t eat.', 'Stem + 지 않아요: 먹지 않아요 = I don’t eat.', 'With a 하다 verb, 안 goes before 해요: 공부 안 해요. Or: 공부하지 않아요.', '못 + verb = cannot: 못 가요 = I can’t go.', 'Please don’t: stem + 지 마세요. 가지 마세요 = Please don’t go.'],
      ex: [{ s: [B('먹지', '', 'eat'), B('않아요', '', 'do not')], en: 'I do not eat.', say: '먹지 않아요.' }, { s: [B('안', '', 'not'), B('먹어요', '', 'eat')], en: 'I don’t eat.', say: '안 먹어요.' }, { s: [B('못', '', 'cannot'), B('가요', '', 'go')], en: 'I can’t go.', say: '못 가요.' }] },
    { t: 'Asking, wanting, asking nicely', intro: ['A question uses the same words as a statement. Your voice goes up when you speak, and you write ? when you write. Question words stay where the answer would be.'],
      points: ['뭐 = what. 어디 = where. 언제 = when. 누구 = who. 왜 = why.', 'Want to: stem + 고 싶어요. 먹고 싶어요 = I want to eat.', 'Can: stem + ㄹ/을 수 있어요. 갈 수 있어요 = I can go.', 'Shall we: stem + ㄹ/을까요? 같이 갈까요? = Shall we go together?', 'Please do it: stem + 세요 / 으세요. 앉으세요 = Please sit.', 'Please give me: 주세요. 물 주세요 = Water, please.'],
      ex: [{ s: [B('뭐', '', 'what'), B('먹어요?', '', 'do you eat?')], en: 'What do you eat?', say: '뭐 먹어요?' }, { s: [B('물을', '', 'water'), B('마시고 싶어요', '', 'want to drink')], en: 'I want to drink water.', say: '물을 마시고 싶어요.' }, { s: [B('같이', '', 'together'), B('갈까요?', '', 'shall we go?')], en: 'Shall we go together?', say: '같이 갈까요?' }] },
    { t: 'Joining sentences', intro: ['Small words tie two short sentences together. Some stand alone at the start of a sentence. Some stick onto the end of a verb stem.'],
      points: ['그리고 = and (then). 그런데 = but, by the way. 하지만 = but. 그래서 = so.', 'Stem + 지만 = but: 비싸지만 좋아요 = it is expensive, but good.', 'Stem + 아서/어서 = because, so. Stem + (으)니까 = since.', 'Stem + (으)면 = if. 비가 오면 안 가요 = If it rains, I don’t go.', 'Stem + (으)러 + 가요 = go in order to do. 먹으러 가요 = I go to eat.'],
      ex: [{ s: [B('비가', '', 'rain'), B('오니까', '', 'since it comes'), B('안 가요', '', 'don’t go')], en: 'Since it rains, I don’t go.', say: '비가 오니까 안 가요.' }, { s: [B('비싸지만', '', 'expensive, but'), B('좋아요', '', 'good')], en: 'It is expensive, but good.', say: '비싸지만 좋아요.' }] }
  ];

  /* ----- practice sentences: each piece is Hangul|meaning ----- */
  function T(a) { return a.map(function (x) { var p = x.split('|'); return [p[0], '', p[1] || '']; }); }
  var sentences = [
    ['I drink water.', '저는 물을 마셔요.', ['저|I', '는|topic', '물|water', '을|object', '마셔요|drink']],
    ['I eat rice.', '저는 밥을 먹어요.', ['저|I', '는|topic', '밥|rice', '을|object', '먹어요|eat']],
    ['I go to school.', '저는 학교에 가요.', ['저|I', '는|topic', '학교|school', '에|to', '가요|go']],
    ['I read a book.', '저는 책을 읽어요.', ['저|I', '는|topic', '책|book', '을|object', '읽어요|read']],
    ['The teacher is a woman.', '선생님은 여자예요.', ['선생님|teacher', '은|topic', '여자|woman', '예요|is']],
    ['I am a student.', '저는 학생이에요.', ['저|I', '는|topic', '학생|student', '이에요|am']],
    ['Is this water?', '이것은 물이에요?', ['이것|this', '은|topic', '물|water', '이에요?|is it?']],
    ['I do not eat meat.', '저는 고기를 먹지 않아요.', ['저|I', '는|topic', '고기|meat', '를|object', '먹지 않아요|do not eat']],
    ['My friend bought a car.', '친구는 자동차를 샀어요.', ['친구|friend', '는|topic', '자동차|car', '를|object', '샀어요|bought']],
    ['I will go home.', '저는 집에 갈 거예요.', ['저|I', '는|topic', '집|home', '에|to', '갈 거예요|will go']],
    ['I want to drink tea.', '저는 차를 마시고 싶어요.', ['저|I', '는|topic', '차|tea', '를|object', '마시고 싶어요|want to drink']],
    ['Shall we go together?', '같이 갈까요?', ['같이|together', '갈까요?|shall we go?']],
    ['What do you eat?', '뭐 먹어요?', ['뭐|what', '먹어요?|do you eat?']],
    ['Where do you go?', '어디 가요?', ['어디|where', '가요?|do you go?']],
    ['The dog sleeps at home.', '개는 집에서 자요.', ['개|dog', '는|topic', '집|home', '에서|at', '자요|sleeps']],
    ['I read a book at the station.', '저는 역에서 책을 읽어요.', ['저|I', '는|topic', '역|station', '에서|at', '책|book', '을|object', '읽어요|read']],
    ['The cat is also in the room.', '고양이도 방에 있어요.', ['고양이|cat', '도|also', '방|room', '에|in', '있어요|is']],
    ['I wrote a letter.', '저는 편지를 썼어요.', ['저|I', '는|topic', '편지|letter', '를|object', '썼어요|wrote']],
    ['Mother cooks a meal.', '어머니는 음식을 만들어요.', ['어머니|mother', '는|topic', '음식|food', '을|object', '만들어요|makes']],
    ['I did not see the movie.', '저는 영화를 안 봤어요.', ['저|I', '는|topic', '영화|movie', '를|object', '안 봤어요|did not see']],
    ['The hero fights the dragon.', '용사는 용과 싸워요.', ['용사|hero', '는|topic', '용|dragon', '과|with', '싸워요|fights']],
    ['Please look at the map.', '지도를 보세요.', ['지도|map', '를|object', '보세요|please look']],
    ['I understand Korean.', '저는 한국어를 이해해요.', ['저|I', '는|topic', '한국어|Korean', '를|object', '이해해요|understand']],
    ['Because it rains, I do not go.', '비가 오니까 안 가요.', ['비|rain', '가|subject', '오니까|because it comes', '안 가요|do not go']]
  ].map(function (s) { return { en: s[0], t: T(s[2]), say: s[1] }; });

  /* ----- builders ----- */
  function make(S, O, Vb, f) {
    var vs = conj(Vb, f), nos = f === 4 || f === 5, parts = [], segs = [], tp, text = '';
    if (!nos) { tp = topic(S); if (S.w === '누구') { parts.push(['누가', '', S.en]); segs.push('누가'); text += '누가 '; } else { parts.push([S.w, '', S.en], [tp[0], '', tp[1]]); segs.push(S.w + tp[0]); text += S.w + tp[0] + ' '; } }
    if (Vb.fr !== 'n') { var pt = objPart(Vb.fr, O); parts.push([O.w, '', O.en], [pt[0], '', pt[1]]); segs.push(O.w + pt[0]); text += O.w + pt[0] + ' '; }
    parts.push([vs, '', Vb.en + FEN[f]]); segs.push(vs.replace(/\?$/, ''));
    text += vs;
    return { parts: parts, rom: rr(segs.join(' ')) + (f === 4 ? '?' : ''), text: text, needsObj: Vb.fr !== 'n' };
  }
  function demo(set, w) {
    if (set === 'verbs') {
      var ps = [['저', '', 'I'], ['는', '', 'topic']], vs = conj(w, 0);
      if (w.fr !== 'n') { var pt = w.fr === 'o' ? ['을/를', 'object'] : w.fr === 'g' ? ['이/가', 'what'] : w.fr === 'p' ? ['에', 'to / at'] : ['에서', 'at']; ps.push(['〜', '', 'something'], [pt[0], '', pt[1]]); }
      ps.push([vs, '', w.en]);
      return { parts: ps, en: 'The polite form is ' + vs + ' (' + rr(vs) + ').' };
    }
    if (set === 'objects') return { parts: [['이것', '', 'this'], ['은', '', 'topic'], [w.w, '', w.en], [hasB(w.w) ? '이에요' : '예요', '', 'is']], en: 'This is ' + w.en + '.' };
    if (set === 'subjects') { var tp = topic(w); return { parts: [[w.w, '', w.en], [tp[0], '', tp[1]], ['학생', '', 'student'], [hasB('학생') ? '이에요' : '예요', '', 'is']], en: '(' + w.en + ') is a student.' }; }
    if (w.ex && w.ex[0]) return { parts: [[w.ex[0], '', '']], en: w.ex[2] + ' (' + rr(w.ex[0]) + ')' };
    return null;
  }

  V.course.add({
    id: 'ko', name: 'Korean', tts: 'ko-KR', labels: { r: null, ro: 'Romanised' }, letters: letters, lessons: lessons, sentences: sentences, forms: FORMS, make: make, demo: demo,
    sets: { verbs: verbs, objects: objects, subjects: subjects, helpers: helpers }
  });
})();
