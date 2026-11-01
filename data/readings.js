// 过线 · 短读材料（本站自产，**不是真题**）
//
// 规划书第四节第 4 条：自产的短篇英文（100–150 词）+ 标注生词 + 一句中文说明，
// 并明确标注「本站自产的练习材料，不是真题」。
//
// 三条约定：
//   1. **不是真题**，也不是从别处抄的；是本站 2026-10-11 自己写的，读着不自然就改这个文件。
//   2. **生词只标词，不写释义**。释义一律从词表查（ECDICT 的原文），
//      所以这里标的每个词都必须在四级词表里 —— scripts/check-data.mjs 会把关。
//   3. 每篇 100–150 词，同样由 scripts/check-data.mjs 数出来把关。
//
// **同样不编出处**：不写「某大学的研究发现」。短文里的说法都是一般性的常识结论；
// 出现的数字是故事内部的信息（价格、时间、里程），不是对世界的统计。
// 要精确数据请查权威来源 —— 练习材料不该假装自己是论文。
//
// 字段说明：
//   id / topic(主题) / title(中文标题) / level(1 最易 3 最难)
//   gist(一句中文说明，读完再对，别提前剧透)
//   words(标注的生词，必须出现在正文里，且必须在四级词表里)
//   paras(正文段落，2–3 段)

window.CET4_READINGS = {
  meta: {
    count: 9,
    generated: '2026-10-11',
    source: '本站自产（2026-10-11 写），不是真题',
    note: '每篇 100–150 词，标出的生词能在词表里查到释义。读完先对一句中文说明，再决定要不要把生词丢进错词本。',
  },

  readings: [
    {
      id: 'read-01',
      topic: '科学与环境',
      title: '灯光与候鸟',
      level: 2,
      gist: '城市灯光会让夜间迁徙的鸟迷失方向；关掉高楼灯光之后撞楼的鸟明显变少，而代价很小。',
      words: ['instinct', 'artificial', 'confuse', 'safety', 'circle'],
      paras: [
        'Every autumn, millions of birds fly south at night. For a long time, people believed that they found their way by instinct alone. Now researchers know that the artificial light of cities plays a part too.',
        'Bright buildings confuse the birds. Instead of keeping to the dark sky, many turn toward the light and circle around it for hours. Some hit the glass. Where cities turn off the lights of tall buildings during migration season, far fewer birds are killed.',
        'The cost of the change is small. A few owners worry about safety, but most offices simply turn off their lights after eleven at night. The birds, it seems, only need one dark window to find their way again.',
      ],
    },
    {
      id: 'read-02',
      topic: '工作与沟通',
      title: '面试时该问什么',
      level: 2,
      gist: '面试里你问的问题和你要回答的问题一样重要：它显示你有没有想过对方，以及你够不够直接。',
      words: ['prepare', 'interview', 'candidate', 'respect', 'tone'],
      paras: [
        'Most people prepare for an interview by thinking about the questions they will be asked. That is useful, but it is only half of the job. The questions you ask may matter just as much.',
        'A good question shows that you have thought about the company, not just about yourself. Asking how a team measures success, for example, tells the interviewer that you care about results. Asking what happened to the person who had the job before you may send a very different message.',
        'Tone matters too. One candidate asked directly, "What is the worst part of working here?" and got an honest answer, because the interviewer showed respect for the question. Another asked the same thing with a smile, and heard nothing at all.',
      ],
    },
    {
      id: 'read-03',
      topic: '城市生活',
      title: '共享单车改变了什么',
      level: 1,
      gist: '共享单车让短途出行变便宜、还能顺便运动，也改善了路边空气质量；但乱停乱放说明光有车不够，还得有规则。',
      words: ['system', 'benefit', 'quality', 'pavement', 'spread'],
      paras: [
        'Ten years ago, few Chinese cities had a bike-sharing system. Today millions of rides are taken every day, and the idea has spread to hundreds of cities around the world.',
        'The benefit is easy to see. A short trip that once needed a taxi now takes ten minutes and costs almost nothing. Riders also get exercise without planning to. Studies in several cities suggest that air quality near busy roads improves when more people leave their cars at home.',
        'The problems are just as clear. Bikes are left on the pavement, in front of doors, even in rivers. Some companies went out of business, and their bikes stayed on the streets for years. A shared system, it turns out, needs rules as much as it needs bicycles.',
      ],
    },
    {
      id: 'read-04',
      topic: '健康',
      title: '下午四点的那杯咖啡',
      level: 2,
      gist: '咖啡因在体内大约五六个小时减一半，下午四点的一杯到半夜还剩四分之一；睡前八小时停掉，深睡才不会变短。',
      words: ['drug', 'chemical', 'effect', 'remove', 'research'],
      paras: [
        'Caffeine is the most widely used drug in the world, and most of us take it without thinking. It works by blocking a chemical that makes you feel sleepy, and the effect lasts longer than people expect.',
        'The body can remove about half of the caffeine in your blood every five to six hours. A cup of coffee at four in the afternoon, then, still leaves a quarter of its caffeine in your body at midnight.',
        'Research on sleep suggests a simple rule: stop drinking coffee eight hours before bed. Some people say they can drink coffee after dinner and still sleep well. They may fall asleep on time, but their deep sleep is often shorter, and they feel it the next morning.',
      ],
    },
    {
      id: 'read-05',
      topic: '消费与生活',
      title: '买二手不再是将就',
      level: 2,
      gist: '二手交易平台让买卖双方都划算，也少生产一件东西；但照片会藏瑕疵，所以先看再付钱。',
      words: ['compromise', 'platform', 'attraction', 'damage', 'goods'],
      paras: [
        'Buying used things used to feel like a compromise. Now it is often a choice. An online platform has made it easy to sell a phone, a bicycle or a coat to someone in the next street.',
        'For buyers, the attraction is obvious: the same product for half the price. For sellers, it is a way to clear space and get something back. For the environment, every used item that finds a second owner is one less item produced.',
        'The risk has not disappeared. Photos can hide damage, and sizes are not always what they seem. Experienced buyers ask for a short video, meet in a public place, and never pay before they have seen the goods.',
      ],
    },
    {
      id: 'read-06',
      topic: '校园',
      title: '小组作业里那个不动手的人',
      level: 3,
      gist: '小组作业里总有人白拿分数；办法很土但有效：第一次见面就把谁做什么、什么时候做完写下来，让贡献看得见。',
      words: ['project', 'complain', 'reward', 'individual', 'deliver'],
      paras: [
        'Almost every student has a story about a group project in which one person did nothing. The others complain, but the grade is shared, so nothing changes.',
        'Researchers call this the free-rider problem. It appears whenever a reward is given to a group rather than to a single individual. The larger the group, the easier it is for one person to stay quiet and let others carry the work.',
        'There is a simple fix, though it feels uncomfortable at first: at the first meeting, write down who will do what, with dates. A written plan makes the work visible. When everyone can see who has failed to deliver, most people do their part - not because they are afraid, but because they were asked in a way they cannot ignore.',
      ],
    },
    {
      id: 'read-07',
      topic: '生活常识',
      title: '很多花是浇死的',
      level: 1,
      gist: '叶子发黄掉光看起来像缺水，其实常常是浇水太多把根泡坏了；浇之前先用手指试一下土，别急着加水。',
      words: ['soil', 'pour', 'pot', 'finger', 'extra'],
      paras: [
        'A plant that dies in a bright room is more often drowned than thirsty. Water fills the small spaces in the soil where air should be, and the roots slowly stop working.',
        'The sign is easy to miss. The leaves turn yellow and fall, which looks exactly like the result of too little water. So the owner adds more, and the plant goes faster.',
        'The fix is not a better plant. It is less water and a longer wait. Put a finger in the soil before you pour. If it still feels wet, walk away. Most house plants need less than people believe, and they grow better in a pot that lets extra water out.',
      ],
    },
    {
      id: 'read-08',
      topic: '心理与日常',
      title: '排队时时间会变慢',
      level: 2,
      gist: '等十分钟比走十分钟难受，一半是因为没事做，另一半是因为不知道要等多久；给自己一个形状（数人数、读四页），等待就不再是空的。',
      words: ['queue', 'exactly', 'count', 'trick', 'shape'],
      paras: [
        'Standing in a queue for ten minutes feels longer than walking for ten minutes. Part of the reason is that a queue gives you nothing to do but wait.',
        'The other part is that you do not know when it will end. A queue that moves in small steps feels shorter than one that stands still, even when both take the same time. This is why airports tell you how long the line is, and why a lift with mirrors annoys fewer people.',
        'You can use the same trick on yourself. When you have to wait, give the time a shape: count the people in front of you, or decide to read exactly four pages. The wait does not get shorter, but it stops being empty.',
      ],
    },
    {
      id: 'read-09',
      topic: '学习方法',
      title: '大任务要切小才动得起来',
      level: 2,
      gist: '拖不是因为难，是因为大：大任务没有明显的第一个动作。把第一步小到无聊（打开文件写标题、复习十个词），因为在坐下那一刻之前，开始才是最贵的。',
      words: ['obvious', 'cure', 'refuse', 'climb', 'review'],
      paras: [
        'Most people do not put off a task because it is hard. They put it off because it is large. A large task has no obvious first step, so the mind slides away to something easier.',
        'The cure is to make the first step small enough to be boring. Not write the report, but open the file and write the title. Not study for the exam, but review ten words. A step that takes two minutes is hard to refuse.',
        'This works for a simple reason: starting is the expensive part. Once you are sitting down with the file open, the next step is much easier to take. The trick is not to plan the whole climb. It is to put one foot on the first step before you decide anything else.',
      ],
    },
  ],
};
