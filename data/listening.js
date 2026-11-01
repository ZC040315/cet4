// 过线 · 精听材料（本站自产，**不是真题**）
//
// 为什么要自己写：CET 真题音频有版权，站不能托管；而精听需要的只是「有原文对照的英语语音」。
// 所以这里的每一段都是本站自己写的英文，用浏览器自带的语音合成朗读，
// 原文天然成立，也没有版权问题。
//
// 三件必须说清楚的事（规划书第三节、第五节）：
//   1. **不是真题**，也不假装是真题。真题请用官方出版物或学校发的资料。
//   2. 英文是**自产的练习材料**，写的时候刻意用了四级常见词和自然的连读、弱读、数字、时间。
//      读起来不自然的地方，直接改这个文件就行。
//   3. 机器音 ≠ 考场音响。它练的是「听清并理解」，练不出「适应考场环境」。
//      后者只能靠正版真题音频，那也是为什么今日页里有一行「真题音频打卡」。
//
// **写这些材料的一条硬规矩：不编出处。**
// 凡是「某大学的研究发现」「一项调查显示」这种话，一律不写 —— 因为我核实不了，
// 写出来就等于在练习材料里放假信息。短文里出现的说法都是一般性的、常识层面的结论；
// 具体的数字（价格、时间、楼层、学费）都是故事内部的信息，不是对世界的统计。
// 要精确数据请查权威来源（规划书第五节：站里出现的每一句英文，你都能知道它是从哪来的）。
//
// 类型对应四级听力的三个部分：
//   news         短篇新闻（A 部分，7 题 49.7 分）
//   conversation 长对话（B 部分，8 题 56.8 分）
//   passage      听力篇章（C 部分，10 题 142 分）← 分值最高，所以这里放得最多（5 篇）
//
// 字段说明：
//   id / type / level(1 最难以下 3 最难) / title(中文标题) / gist(一句中文大意，盲听后对答案用)
//   focus(这一段在练什么) / tips(跟读提示，2–4 条) / sentences(原文，一句一条)

window.CET4_LISTENING = {
  meta: {
    count: 13,
    generated: '2026-10-11',
    source: '本站自产（2026-10-11 写），不是真题',
    note: '每段都用浏览器语音合成朗读。先盲听抓大意，再逐句听写，然后对照原文分类，最后跟读；第二天重听一遍。13 篇分三种类型，听一周不重样。',
  },

  clips: [
    // ---------- 短篇新闻 ----------
    {
      id: 'news-01',
      type: 'news',
      level: 1,
      title: '图书馆考试周延长到午夜',
      gist: '学校图书馆在考试周把开放时间延长到午夜，并增加座位、插座，楼下咖啡店也开得更晚。',
      focus: '时间与场所：until midnight / stay open later 这类反复出现的表达',
      tips: [
        'until midnight 里的 t 和 m 会连起来读，听起来像一个词',
        'have asked for 里的 have 弱读，几乎是 /həv/',
        'usually 是 /ˈjuːʒuəli/，中间那个音不要读重',
      ],
      sentences: [
        'The university library will stay open until midnight during the exam weeks.',
        'The change starts next Monday and will last for three weeks.',
        'Students have asked for longer hours since the beginning of the term.',
        'The library says it will add more seats and power outlets on the second floor.',
        'A small cafe on the ground floor will also stay open later.',
        'Staff say the reading rooms are usually full after eight in the evening.',
        'Students can book a seat online, but walk-ins are still welcome.',
      ],
    },
    {
      id: 'news-02',
      type: 'news',
      level: 2,
      title: '学生公交票价降到一元',
      gist: '某城市明年一月起把学生公交票价从两元降到一元，并计划添置十辆电动公交，一年后再评估。',
      focus: '数字对比：one yuan / two yuan / ten new buses',
      tips: [
        'instead of 里的 of 几乎听不见，靠 instead 定位',
        'officials 是 /əˈfɪʃlz/，中间的 i 很轻',
        'will be reviewed 是被动，小心别听成 will review',
      ],
      sentences: [
        'The city will lower bus fares for students starting in January.',
        'A single ride will cost one yuan instead of two.',
        'The discount applies to full-time students with a valid card.',
        'City officials say the goal is to get more young people out of cars.',
        'The bus company will add ten new electric buses next year.',
        'Passengers can pay with a phone or a travel card.',
        'The new fare will be reviewed after one year.',
      ],
    },
    {
      id: 'news-03',
      type: 'news',
      level: 3,
      title: '食堂试新菜单',
      gist: '北校区食堂这个月试新菜单：三菜两汤、少油少盐、价格不变；反响好就明年春天固定下来。',
      focus: '价格与截止时间，以及比较级（less oil and less salt）',
      tips: [
        'testing a new menu 里的 a 很轻，容易整句糊过去',
        'between 在语流里常读成 /bɪˈtwiːn/，别听成 begin',
        'permanent 是 /ˈpɜːmənənt/，重音在第一个音节',
      ],
      sentences: [
        'The dining hall on the north campus is testing a new menu this month.',
        'Students can now choose between three main dishes and two soups.',
        'The price of a full meal is still twelve yuan.',
        'The kitchen says it uses less oil and less salt than before.',
        'A survey last term found that students wanted more vegetables.',
        'The new menu will run until the end of November.',
        'If students like it, it will become permanent in the spring.',
      ],
    },

    // ---------- 长对话 ----------
    {
      id: 'conv-01',
      type: 'conversation',
      level: 1,
      title: '借笔记，顺带发现作业提前了',
      gist: '两个学生聊借笔记，中间发现实验报告的截止时间被老师提前到了周五。',
      focus: '「改口」的口气：Oh, and… / I thought… / She changed it…',
      tips: [
        'yesterday\'s lecture 里两个 s 音连着，容易糊',
        'a bit messy 里的 bit 很轻，重音在 messy',
        'I\'d have missed 是虚拟语气，读得很快，靠上下文猜',
      ],
      sentences: [
        'Hi, are you using your notes from yesterday\'s lecture?',
        'I can\'t find mine. I think I left them in the classroom.',
        'Sure, but they are a bit messy.',
        'That is fine. I just need the part about the experiment.',
        'Let me send you a photo instead. It is faster.',
        'Great. Can you send it before six? I have a lab at seven.',
        'No problem. Oh, and the professor said the report is due on Friday.',
        'Friday? I thought we had until next Monday.',
        'She changed it this morning. She wrote it on the board.',
        'Thanks for telling me. I would have missed the deadline.',
      ],
    },
    {
      id: 'conv-02',
      type: 'conversation',
      level: 2,
      title: '兼职面试：周末能不能来',
      gist: '学生来面试兼职，谈到每周能做多少小时、周末班怎么排，公司说先试用四周。',
      focus: '数字（fifteen / twenty / four-week）和面试里的委婉表达',
      tips: [
        'Come in 两个词连读，听起来像 coming',
        'How many hours 里的 many 读得快，重音在 hours',
        'four-week trial 中间有连字符，读音是一个词',
      ],
      sentences: [
        'Thanks for coming in. Did you find the office easily?',
        'Yes, the directions were clear.',
        'Good. So, tell me why you want this job.',
        'I want to work with people, and the hours fit my classes.',
        'How many hours can you work each week?',
        'About fifteen, maybe twenty during the holidays.',
        'We mostly need someone on weekends. Is that possible?',
        'Saturdays are fine. Sundays I have a study group.',
        'That works. We start people on a four-week trial.',
        'That sounds fair. When would I start?',
      ],
    },
    {
      id: 'conv-03',
      type: 'conversation',
      level: 3,
      title: '选课：摄影还是演讲',
      gist: '两个学生商量选修课选摄影还是演讲，最后决定周一上午九点准时抢课。',
      focus: '转折词 however / though，以及快读的 I am torn between',
      tips: [
        'I am torn between 里的 torn 很短，别听成一个新单词',
        'fills up fast 三个词都快，靠 fast 定位',
        'registration 是 /ˌredʒɪˈstreɪʃn/，很长但不重读',
      ],
      sentences: [
        'Have you decided which elective to take next term?',
        'I am torn between photography and public speaking.',
        'Public speaking would help with your presentations.',
        'True, but photography is only once a week.',
        'How many credits is each one?',
        'Both are two credits. The photography class fills up fast, though.',
        'Then you should register early. Registration opens at nine on Monday.',
        'I will set an alarm. Last time the site crashed.',
        'Everyone was on it at the same minute. That is why.',
        'Wish me luck.',
      ],
    },

    // ---------- 听力篇章（C 部分，分值最高）----------
    {
      id: 'pass-01',
      type: 'passage',
      level: 1,
      title: '睡眠不是学习的敌人',
      gist: '深睡时大脑会把当天学的东西转成长期记忆；通宵之后书页变得陌生，所以考前那一夜不该熬。',
      focus: '因果句的抓取，以及「转折 + 补充」两句话的关系',
      tips: [
        'sorts through 连读，听起来像 sortsthrough',
        'part of it 里的 of it 几乎吞掉，靠 part 定位',
        'permanent 是 /ˈpɜːmənənt/，重音在第一音节',
      ],
      sentences: [
        'Most students know that sleep matters, but few treat it as part of studying.',
        'During deep sleep, the brain sorts through what you learned that day.',
        'It moves important information into long-term memory.',
        'If you cut sleep to study more, you may remember less.',
        'Anyone who has stayed up all night knows this feeling.',
        'The next morning, the pages you read are suddenly strange.',
        'The opposite is also true. After a full night of sleep, difficult material feels lighter.',
        'So the hours you spend asleep are not hours taken from your study time.',
        'They are part of it.',
        'You still have to read the pages, and you still have to review them.',
        'But sleep is when the review becomes permanent.',
        'So the night before an exam is not the best time to stay up.',
      ],
    },
    {
      id: 'pass-02',
      type: 'passage',
      level: 2,
      title: '城市为什么要多种树',
      gist: '城市种树能降温、挡雨、省空调电，但小树头两三年需要浇水养护，好处要很多年后才显现。',
      focus: '「不只因为好看」这种转折定位，以及 several degrees 这类程度表达',
      tips: [
        'not only because 三个词连得很紧，靠 because 抓',
        'several degrees 里的 degrees 重音在后半',
        'keeping it alive 里的 it 几乎吞掉',
      ],
      sentences: [
        'Cities are planting more trees, and not only because they look nice.',
        'A mature tree can cool the air around it by several degrees.',
        'That matters more every year, as summers get hotter.',
        'Trees also slow down rain, which helps when a storm hits.',
        'Walk down a street with old trees on a hot afternoon, and you feel the difference at once.',
        'Those streets also use less electricity for air conditioning.',
        'But planting a tree is easier than keeping it alive.',
        'Young trees need water for the first two or three years.',
        'Some cities now ask residents to water the trees near their homes.',
        'Others choose species that can survive with very little rain.',
        'Either way, the benefit comes years later, not next month.',
        'That is why planners say the work must not stop when a city changes leaders.',
      ],
    },
    {
      id: 'pass-03',
      type: 'passage',
      level: 3,
      title: '屏幕读得快，纸书记得住',
      gist: '屏幕阅读容易跳来跳去、变成跳读；实验里读纸质文章的人记住的细节更多。重要的东西要慢读两遍。',
      focus: '因果链长句：第 9 句和第 13 句信息最密，是整段的难点',
      tips: [
        'invites you to 里的 you to 连读成 /jə tə/',
        'recalled 是 /rɪˈkɔːld/，别听成 called',
        'as if you were 里的 were 很轻，靠 as if 定位',
      ],
      sentences: [
        'Reading on a screen and reading on paper are not the same experience.',
        'A screen invites you to jump around: a message, a link, a video.',
        'Paper offers fewer ways to escape.',
        'That difference changes how much you remember.',
        'Read the same article on paper and on a screen, and notice which one stays with you.',
        'For most people, the paper version leaves more behind.',
        'The screen is not the problem by itself.',
        'The problem is the habit that grows around it: reading quickly and skimming.',
        'When you skim, you recognize words without building a picture.',
        'A picture is what you remember later.',
        'This does not mean you should avoid screens.',
        'It means that for something you need to keep, slow down.',
        'Read it once quickly, then read it again as if you were explaining it to someone.',
      ],
    },
    {
      id: 'pass-04',
      type: 'passage',
      level: 2,
      title: '走路为什么帮你想清楚',
      gist: '走路同时改变血流和注意力，还因为「有明确的结束时间」让脑子敢放松；所以卡住的时候别硬扛，起身走一圈，带上本子。',
      focus: '因果关系，以及「两件事」的并列结构（The first is… The second is…）',
      tips: [
        'two things at once 三个词连得紧，靠 things 定位',
        'staring at 连读，听起来像 staringat',
        'wander 是 /ˈwɒndə(r)/，别听成 wonder',
      ],
      sentences: [
        'Many writers say that their best ideas come while they are walking.',
        'It is not magic. Walking changes two things at once.',
        'The first is blood flow. A walk of twenty minutes sends more oxygen to the brain.',
        'The second is attention. Outside, your eyes move from one thing to another.',
        'That movement keeps you from staring at the same problem.',
        'When you come back to your desk, the problem looks a little different.',
        'There is another reason a walk helps: it has a clear end.',
        'You know you will sit down again in half an hour, so your mind is free to wander.',
        'Sitting at a desk with no plan makes the same half hour feel heavy.',
        'So the next time you are stuck, do not force it.',
        'Stand up, put on your shoes, and walk around the block.',
        'Take a notebook with you. The idea may arrive before you get home.',
      ],
    },
    {
      id: 'pass-05',
      type: 'passage',
      level: 3,
      title: '回收这件事比标签复杂',
      gist: '玻璃能反复熔化，纸只能回收几次，塑料种类太多混在一起就没用了；所以最省能源的一步不是扔进回收桶，而是买之前先问自己两句。',
      focus: '对比结构（三种材料命运不同）和「不是……而是……」的句式',
      tips: [
        'melted down 连读，听起来像 melteddown',
        'fibres 是 /ˈfaɪbəz/，重音在前',
        'landfill 重音在第一个音节',
      ],
      sentences: [
        'Most of us put paper, glass and plastic in the same bin and feel better.',
        'The truth is that these materials do not have the same future.',
        'Glass is the easiest. It can be melted down again and again without losing quality.',
        'Paper can be recycled a few times, but each time the fibres get shorter.',
        'After a few rounds, paper turns into something weaker, like a box or a tissue.',
        'Plastic is the difficult one.',
        'There are many kinds of plastic, and they cannot be melted together.',
        'If one kind is mixed into another, the whole batch becomes useless.',
        'So a bottle may come back as a bottle, or it may end up buried in a landfill.',
        'This does not mean recycling is pointless.',
        'It means the first step is not the bin. It is the question you ask in the shop.',
        'Before you buy, ask twice: do I need this, and will I use it more than once?',
        'Those two questions save more energy than any bin ever will.',
      ],
    },
    {
      id: 'news-04',
      type: 'news',
      level: 1,
      title: '老楼装电梯，钱怎么分',
      gist: '南片区六栋八十年代的老楼今年装电梯：城市出一半钱，一楼不出、顶楼出最多；第一栋三月动工，大约四个月。',
      focus: '数字与楼层：six / nineteen eighties / half / March / four months',
      tips: [
        'nineteen eighties 里的 eighties 读成 /ˈeɪtiz/',
        'shared by 连读，听起来像 shareby',
        'the rest is 里的 is 很轻，靠 rest 定位',
      ],
      sentences: [
        'Six old buildings in the south district will get lifts this year.',
        'Most of them were built in the nineteen eighties and have six floors.',
        'For years, residents over seventy had to climb the stairs every day.',
        'The city pays half of the cost, and the rest is shared by the families.',
        'Families on the first floor pay nothing, and those on the top floor pay the most.',
        'Work on the first building starts in March and takes about four months.',
        'Residents say they will believe it when the doors open.',
      ],
    },
    {
      id: 'conv-04',
      type: 'conversation',
      level: 2,
      title: '跟房东约修水管',
      gist: '租客报告厨房水管漏水，跟房东约时间：房东说周四下午派人，租客那天有课，最后谈成先报价再动手，还要顺便看一下一直滴水的龙头。',
      focus: '请求与条件的口气：Could it be earlier? / If not, can you…? / before he starts',
      tips: [
        'started leaking 连读，听起来像 startedleaking',
        'puddle 是 /ˈpʌdl/',
        'dripping 里两个 p 只发一个音',
      ],
      sentences: [
        'Hello, is this about the water again?',
        'Yes. The pipe under the kitchen sink started leaking last night.',
        'Did you turn off the water under the sink?',
        'I did, but there is still a small puddle every morning.',
        'All right. I can send someone on Thursday afternoon.',
        'Could it be earlier? I have a class on Thursday.',
        'I will ask. If not, can you leave the key with the neighbour?',
        'That is fine. Please tell me the price before he starts.',
        'Of course. The last repair cost eighty yuan, and this one should be similar.',
        'Good. And could you ask him to check the tap too? It never stops dripping.',
      ],
    },
  ],
};
