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
// 字段说明：
//   id / topic(主题) / title(中文标题) / level(1 最易 3 最难)
//   gist(一句中文说明，读完再对，别提前剧透)
//   words(标注的生词，必须出现在正文里，且必须在四级词表里)
//   paras(正文段落，2–3 段)

window.CET4_READINGS = {
  meta: {
    count: 6,
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
      gist: '城市灯光会让夜间迁徙的鸟迷失方向；关掉高楼灯光之后撞楼数量减少一半以上，而代价很小。',
      words: ['instinct', 'artificial', 'confuse', 'safety', 'circle'],
      paras: [
        'Every autumn, millions of birds fly south at night. For a long time, people believed that they found their way by instinct alone. Now researchers know that the artificial light of cities plays a part too.',
        'Bright buildings confuse the birds. Instead of keeping to the dark sky, many turn toward the light and circle around it for hours. Some hit the glass. A study in one American city found that switching off the lights of tall buildings during migration season cut the number of crashes by more than half.',
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
  ],
};
