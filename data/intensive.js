// 过线 · 精读材料（本站自产，**不是真题**）
//
// 规划书第四节第 4 条的延伸：短读练「读得下去」，精读练「读得进去」。
// 一篇约 300 词，四段到五段，每段配一句中文译文（默认折起来，读完再看），
// 挑三句长难句拆结构，最后三道理解题。
//
// 三条硬规则，和短读一致：
//   1. 释义不写进数据，只标「哪些词是生词」，释义一律从词表查；
//      scripts/check-data.mjs 会强制「标出来的词必须在四级词表里」。
//   2. 句子全部自己写，不抄任何出版物，所以不写出处 —— 也不编「某研究显示」。
//   3. 英文里不用破折号：朗读和分句时它太容易被当成断句。

window.CET4_INTENSIVE = {
  meta: {
    count: 5,
    generated: '2026-11-01',
    source: '本站自产（不是真题，也不是任何出版物的原文）',
    note:
      '每篇 280–400 词，带段落译文、三句长难句拆解、三道理解题。' +
      '句子按四级阅读的常见写法自己写，考点也是常见的那些，但句子本身没有出处。',
  },

  articles: [
    {
      id: 'int-01',
      topic: '睡眠与记忆',
      title: 'Sleep Is Part of the Work',
      level: 2,
      gist:
        '睡觉不是学习的休息时间，而是学习的一部分：睡着以后大脑会把白天遇到的东西再过一遍。' +
        '所以「学完就睡」比「学完接着刷手机」更值，睡前那一小时适合复习，不适合开新词。',
      paras: [
        {
          en:
            'Most students treat sleep as the time left over after everything else. The essay is finished, ' +
            'the wrong answers are checked, and then, if any night is left, they sleep. This order feels ' +
            'efficient, but it puts the most useful hour of the day at the end of the queue.',
          zh:
            '大多数学生把睡觉当成「别的事都做完之后剩下的时间」。作文写完了，错题看过了，' +
            '如果这一夜还剩一点，才去睡。这个顺序感觉上很有效率，但它把一天里最有用的那一小时排到了队尾。',
        },
        {
          en:
            'What happens during sleep is not a pause. While you are asleep, the brain goes over what you ' +
            'met during the day. Connections that were weak in the afternoon are stronger by morning. Words ' +
            'that you could hardly recall at midnight come back without effort after seven hours of rest. ' +
            'That is why an hour of sleep can do more for a list of new words than another hour of staring at it.',
          zh:
            '睡着的时候发生的事不是暂停。你睡着时，大脑会把白天遇到的东西再过一遍。下午还弱的连接，' +
            '到早上就强了；半夜几乎想不起来的词，睡七个小时之后会不费力地回来。所以同样是一小时，' +
            '用来睡觉能帮到一张新词表，用来盯着它看反而不如。',
        },
        {
          en:
            'The order to follow is simple: learn, sleep, then test yourself. If you go over twenty words and ' +
            'then go straight to bed, the words have a chance to settle. If you go over the same words and ' +
            'keep scrolling until two in the morning, you are paying for tonight with tomorrow.',
          zh:
            '该遵循的顺序很简单：学、睡、再自测。如果你过一遍二十个词就直接去睡，这些词有机会沉下来；' +
            '如果你过一遍同样的词，然后刷手机刷到凌晨两点，你是在用明天偿还今晚。',
        },
        {
          en:
            'This does not mean you should sleep less in order to study more. Cutting sleep to add study ' +
            'hours is like cutting the flour to bake a bigger cake. The plan looks longer, but the result is ' +
            'smaller. For most people, seven to eight hours is not a luxury. It is part of the method.',
          zh:
            '这不是说为了多学就该少睡。砍睡眠来加学习时间，就像削掉面粉想烤一个更大的蛋糕：' +
            '计划看起来更长，结果却更小。对大多数人来说，七到八小时不是奢侈，而是方法的一部分。',
        },
        {
          en:
            'One last point about timing. The hour before sleep is a good place for review, not for new ' +
            'material. Going over something you have already met is cheap, and it fits what the brain does at ' +
            'night. Meeting twenty fresh words at midnight is expensive, and half of them may be gone by breakfast.',
          zh:
            '最后一点关于时机。睡前那一小时适合复习，不适合开新东西。把已经见过的东西再过一遍很便宜，' +
            '而且正好配合大脑夜里做的事；半夜去碰二十个全新的词很贵，到吃早饭时可能已经没了一半。',
        },
      ],
      words: ['efficient', 'queue', 'pause', 'recall', 'settle', 'luxury', 'method'],
      sentences: [
        {
          en: 'Words that you could hardly recall at midnight come back without effort after seven hours of rest.',
          zh: '半夜几乎想不起来的词，睡七个小时之后会不费力地回来。',
          note:
            '主干是 Words come back。that 从句修饰 Words；without effort 说「回来的方式」，' +
            'after seven hours of rest 说「回来的时间」。读长句先抓主干，再把这两个状语放回去。',
        },
        {
          en: 'Cutting sleep to add study hours is like cutting the flour to bake a bigger cake.',
          zh: '砍睡眠来加学习时间，就像削掉面粉想烤一个更大的蛋糕。',
          note:
            '主语是动名词短语 Cutting sleep，to add study hours 表目的。is like 后面又是一个动名词，' +
            '所以句子是「做 A 像做 B」的比较，不是在讲做饭。',
        },
        {
          en:
            'If you go over the same words and keep scrolling until two in the morning, you are paying for ' +
            'tonight with tomorrow.',
          zh: '如果你过一遍同样的词，然后刷手机刷到凌晨两点，你是在用明天偿还今晚。',
          note:
            'if 从句里两个动作并列（go over 和 keep scrolling）；主句用进行时，表示这个代价还在持续。' +
            'pay for A with B 是固定搭配：「用 B 支付 A」。',
        },
      ],
      questions: [
        {
          q: 'What happens to new words during sleep, according to the passage?',
          options: [
            'They are forgotten faster than before.',
            'They become easier to recall.',
            'They are replaced by older words.',
            'They are stored only at midnight.',
          ],
          answer: 1,
          explain: '第二段：半夜想不起来的词，睡七个小时之后会「不费力地回来」，也就是更容易想起来。',
        },
        {
          q: 'The writer compares cutting sleep to cutting flour in order to show that',
          options: [
            'baking takes more time than studying',
            'students should eat before studying',
            'a longer plan may bring a smaller result',
            'sleep matters less than food',
          ],
          answer: 2,
          explain: '原文说「计划看起来更长，结果却更小」：削减睡眠去换学习时间，总量看着多了，实际效果反而差。',
        },
        {
          q: 'What does the writer suggest doing in the hour before sleep?',
          options: [
            'Reviewing something you have already met',
            'Learning twenty fresh words',
            'Checking wrong answers on a phone',
            'Writing the day\'s essay',
          ],
          answer: 0,
          explain: '最后一段：睡前那一小时适合复习，不适合开新东西。',
        },
      ],
    },

    {
      id: 'int-02',
      topic: '学习环境',
      title: 'Where You Study Changes What You Notice',
      level: 2,
      gist:
        '坐同样的三小时，收获可能完全不同，差别往往不在努力，而在「地方」。注意力会不断被拉走又拉回来，' +
        '每次回来都要付一点小代价；所以选地方要比选书认真，而且地方要跟任务配。',
      paras: [
        {
          en:
            'Two students can sit for the same three hours and walk away with very different amounts. The ' +
            'difference is often not effort but place. A desk facing a window, a table in a busy cafe, and a ' +
            'library seat with nothing to look at are three different jobs, even when the book is the same.',
          zh:
            '两个学生可以坐同样三个小时，带走的东西却差很多。差别往往不在努力，而在「地方」。' +
            '一张朝窗的书桌、一张闹哄哄的咖啡馆桌子、一个什么都看不见的图书馆座位，是三种不同的活，' +
            '哪怕书的同一本。',
        },
        {
          en:
            'Attention is not a tap that stays open. It opens, closes, opens again. Every time something pulls ' +
            'it away, you pay a small price to come back: you re-read the line, you find your place, you ' +
            'remember what you were about to write. None of these costs is large. Added up over three hours, ' +
            'they decide whether the session worked.',
          zh:
            '注意力不是一个一直开着的龙头。它开、关、再开。每次有东西把它拉走，你要付一点小代价才能回来：' +
            '重读那一行、找回读到哪儿、想起刚才要写什么。每一笔代价都不大。放到三个小时里加起来，' +
            '它们决定了这次学习到底有没有用。',
        },
        {
          en:
            'This is why a plain wall is useful. It is not that the cafe is bad; it is that a new sound, a new ' +
            'face, a new plate arriving gives your attention another small thing to handle. Deep work needs a ' +
            'place where nothing is asking for the next ten minutes.',
          zh:
            '这就是为什么一面空墙有用。不是说咖啡馆不好，而是新声音、新面孔、端上来的一只新盘子，' +
            '都会给注意力再添一件要处理的小事。需要专注的活，需要一个「接下来十分钟没有东西叫你」的地方。',
        },
        {
          en:
            'The rule that follows is not "study only in silence". It is "choose the place that matches the ' +
            'task". Reading a hard passage needs a quiet corner. Reviewing words you already know can survive ' +
            'a noisy kitchen. Sorting your notes is easy anywhere.',
          zh:
            '由此得出的规则不是「只能在绝对安静里学习」，而是「选跟任务相配的地方」。读一段难文章需要安静的角落；' +
            '复习已经认识的词，闹哄哄的厨房也能扛住；整理笔记在哪儿都行。',
        },
        {
          en:
            'There is one more cost that students rarely count: the price of starting. If your books are in a ' +
            'bag, and the bag is in another room, you need a decision before you can read a line. Keep the desk ' +
            'ready the night before, and the first minute of study costs almost nothing.',
          zh:
            '还有一笔学生很少算的成本：开始的那一下。如果书在包里，包在另一个房间，你得先做一个决定才能读一行。' +
            '头天晚上把桌子收拾好，学习的第一分钟就几乎不花力气。',
        },
        {
          en:
            'It is worth testing this for a week. Study in three places and write down, at the end of each ' +
            'session, how much you actually finished. Most people are surprised by how large the difference is, ' +
            'and by which place wins. That result is worth more than any advice about where to study, because ' +
            'it is about your attention, not someone else\'s.',
          zh:
            '值得花一周做个试验：在三个不同的地方学习，每次结束时写下你到底做完了多少。' +
            '多数人会对差距之大感到意外，也会对「哪个地方赢」感到意外。这个结果比任何「该在哪儿学」的建议都值钱，' +
            '因为它量的是你的注意力，不是别人的。',
        },
      ],
      words: ['effort', 'attention', 'handle', 'survive', 'decision', 'silence', 'count'],
      sentences: [
        {
          en:
            'Every time something pulls it away, you pay a small price to come back: you re-read the line, you ' +
            'find your place, you remember what you were about to write.',
          zh: '每次有东西把它拉走，你要付一点小代价才能回来：重读那一行、找回读到哪儿、想起刚才要写什么。',
          note:
            '冒号后面三个并列句在解释 price 到底是什么；what 引导 remember 的宾语从句。' +
            '读的时候先抓住 you pay a small price，再看冒号的展开。',
        },
        {
          en:
            'It is not that the cafe is bad; it is that a new sound, a new face, a new plate arriving gives ' +
            'your attention another small thing to handle.',
          zh: '不是说咖啡馆不好，而是新声音、新面孔、端上来的一只新盘子，都会给注意力再添一件要处理的小事。',
          note:
            'It is not that... ; it is that... 是「不是因为 A，而是因为 B」的句型，两个 that 都引导表语从句。' +
            '后面 gives 的主语是三个并列的名词短语（a new sound / a new face / a new plate arriving）。',
        },
        {
          en: 'Keep the desk ready the night before, and the first minute of study costs almost nothing.',
          zh: '头天晚上把桌子收拾好，学习的第一分钟就几乎不花力气。',
          note:
            '祈使句 + and + 陈述句 =「做了前一件事，就有后一个结果」，相当于 If you keep the desk ready... 。' +
            'the night before 是时间状语。',
        },
      ],
      questions: [
        {
          q: 'What does the writer mean by saying that attention is not a tap?',
          options: [
            'Attention cannot be measured.',
            'Attention opens and closes again and again.',
            'Attention is stronger in the morning.',
            'Attention depends on the book you read.',
          ],
          answer: 1,
          explain: '第二段紧接着说「它开、关、再开」，意思是注意力会反复被打断，不是一开到底。',
        },
        {
          q: 'Why is a plain wall useful?',
          options: [
            'It keeps the room cool.',
            'It makes reading slower.',
            'It gives attention fewer things to handle.',
            'It replaces the need for a library.',
          ],
          answer: 2,
          explain: '第三段：空墙不会给注意力再添「要处理的小事」。',
        },
        {
          q: 'Which of the following best matches the writer\'s advice?',
          options: [
            'Study only in complete silence.',
            'Review words you already know in a noisy kitchen.',
            'Avoid kitchens at all times.',
            'Keep your books in another room.',
          ],
          answer: 1,
          explain: '第四段：地方要跟任务配，复习已经认识的词在闹哄哄的厨房也能进行。',
        },
      ],
    },

    {
      id: 'int-03',
      topic: '工作与时间',
      title: 'The Four-Day Week Is Not Only About Hours',
      level: 3,
      gist:
        '四天工作制能成立，往往不是因为人变快了，而是因为砍掉了本来就不必做的事。' +
        '多出来的一天不是「更努力的奖励」，而是一次检查：这家公司分得清哪些习惯产生价值、哪些只产生忙碌感。',
      paras: [
        {
          en:
            'When a company tries a four-day week, the first question is always about hours: can the same work ' +
            'be done in less time? The answer usually turns out to be yes, but not because people work faster. ' +
            'It is because they stop doing work that never needed doing.',
          zh:
            '一家公司试四天工作制时，第一个问题总是关于小时数：同样的活能不能用更少的时间做完？' +
            '答案通常是能，但不是因为人变快了，而是因为他们不再做那些本来就不必做的事。',
        },
        {
          en:
            'Meetings that existed to report on other meetings disappear. Reports that nobody read stop being ' +
            'written. A team that has one fewer day does not simply squeeze five days into four; it is forced ' +
            'to decide what the week is for.',
          zh:
            '为了汇报别的会而开的会消失了。没人看的报告不再写了。少了一天的团队不是把五天硬塞进四天，' +
            '而是被迫回答：这一周到底是用来做什么的。',
        },
        {
          en:
            'This is the part that is easy to miss. The extra day off is not a reward for working harder. It is ' +
            'a test of whether the company knows which of its habits produce value and which only produce the ' +
            'feeling of being busy.',
          zh:
            '这一层最容易漏掉。多出来的那一天不是「更努力」的奖励，而是一次检验：' +
            '这家公司是否分得清哪些习惯产生价值、哪些只产生「很忙」的感觉。',
        },
        {
          en:
            'The same logic applies to a student\'s week. If you add a rest day and your results do not change, ' +
            'that tells you something about how you were spending the other six. If your results fall, you have ' +
            'found the part of your routine that was actually carrying the weight.',
          zh:
            '同样的道理也适用于一个学生的周计划。如果你加进一天休息，成绩没变，这说明你原来那六天是怎么花的；' +
            '如果成绩掉了，你就找到了自己日程里真正在承重的那部分。',
        },
        {
          en:
            'None of this means a shorter week is always better. Some work is measured in hours: a nurse cannot ' +
            'see two patients in the time of one. The lesson is narrower and more useful: before you cut time, ' +
            'find out what the time was for.',
          zh:
            '这些都不意味着「更短的一周总是更好」。有些活就是按小时算的：护士没法在一个病人的时间里看两个。' +
            '这个结论更窄、也更有用：在砍时间之前，先弄清那些时间本来是用来干什么的。',
        },
        {
          en:
            'There is a limit, and it is worth naming. A shorter week works when the work can be measured by ' +
            'what comes out of it, not by how long someone sits at a desk. It fails when the job is mostly ' +
            'waiting, answering, or simply being present. That is why the idea spreads quickly in some offices ' +
            'and not at all in a hospital.',
          zh:
            '它也有边界，值得说明白。用「产出什么」而不是「在桌前坐多久」来衡量工作时，更短的一周才成立；' +
            '如果这份活主要是等、是应答、是「人在那儿」，它就撑不住。所以这个想法在有些办公室传得很快，' +
            '在医院里则完全行不通。',
        },
      ],
      words: ['squeeze', 'reward', 'routine', 'value', 'produce', 'disappear', 'logic'],
      sentences: [
        {
          en:
            'A team that has one fewer day does not simply squeeze five days into four; it is forced to decide ' +
            'what the week is for.',
          zh: '少了一天的团队不是把五天硬塞进四天，而是被迫回答：这一周到底是用来做什么的。',
          note:
            '分号连接两个主句。前半句 that has one fewer day 修饰 team；后半句 be forced to do 表示「不得不」，' +
            'what 引导 decide 的宾语从句。',
        },
        {
          en:
            'It is a test of whether the company knows which of its habits produce value and which only produce ' +
            'the feeling of being busy.',
          zh: '这是一次检验：这家公司是否分得清哪些习惯产生价值、哪些只产生「很忙」的感觉。',
          note:
            'whether 引导介词 of 的宾语从句；里面又有两个并列的 which 从句作 knows 的宾语。' +
            '句子长是因为从句套从句，主干只有 It is a test。',
        },
        {
          en:
            'If you add a rest day and your results do not change, that tells you something about how you were ' +
            'spending the other six.',
          zh: '如果你加进一天休息，成绩没变，这说明你原来那六天是怎么花的。',
          note:
            'if 从句里并列了 add 和 do not change 两个动作；主句的 that 指代前面整件事；' +
            'how 引导 about 的宾语从句，the other six 指另外六天。',
        },
      ],
      questions: [
        {
          q: 'Why can the same work be done in four days?',
          options: [
            'People work much faster.',
            'Some work never needed doing.',
            'Machines do part of the work.',
            'The company hires more staff.',
          ],
          answer: 1,
          explain: '第一段：不是因为人变快，而是因为不再做本来就不必做的事。',
        },
        {
          q: 'What does the extra day off test?',
          options: [
            'Whether staff enjoy their jobs',
            'Whether the office is big enough',
            'Whether the company knows which habits produce value',
            'Whether meetings can be longer',
          ],
          answer: 2,
          explain: '第三段：多出来的一天检验公司是否分得清「产生价值的习惯」和「只产生忙碌感的习惯」。',
        },
        {
          q: 'What does the writer admit in the last paragraph?',
          options: [
            'A shorter week is always better.',
            'Some work is measured in hours.',
            'Students should work seven days a week.',
            'Nurses have easier jobs than office workers.',
          ],
          answer: 1,
          explain: '最后一段承认有些活是按小时算的，护士就是例子，所以「更短总是更好」不成立。',
        },
      ],
    },

    {
      id: 'int-04',
      topic: '消费与回收',
      title: 'Recycling Is Not a Licence to Buy More',
      level: 2,
      gist:
        '把瓶子丢进正确的桶，只是问题的中间，不是结尾。回收最好放在最后一步：先用少一点、再用一次，最后才回收。' +
        '更麻烦的是，知道自己「做了好事」会让人买得更多，因为愧疚变小了。',
      paras: [
        {
          en:
            'Putting a bottle in the right bin feels like the end of a problem. In fact it is the middle of ' +
            'one. The bottle still has to be collected, sorted, cleaned and turned into something else, and ' +
            'each of those steps costs energy and money.',
          zh:
            '把瓶子丢进正确的桶，感觉像是一个问题的结束。其实那只是中间：瓶子还要被收走、分拣、清洗、' +
            '变成别的东西，每一步都要花能源和钱。',
        },
        {
          en:
            'This is why recycling works best as a last step, not a first one. The order that matters is: use ' +
            'less, use it again, then recycle. A bag that you carry for two years saves more than a hundred ' +
            'bags that you recycle.',
          zh:
            '这就是为什么回收最好当最后一步，而不是第一步。要紧的顺序是：用少一点、再用一次、最后才回收。' +
            '一个背了两年的袋子，比一百个被你回收的袋子更省。',
        },
        {
          en:
            'The feeling of doing something good can also make us do more of the thing itself. Shoppers who are ' +
            'told that a package is recyclable sometimes buy more than those who are not, because the guilt is ' +
            'smaller. The package has not changed. Only the story about it has.',
          zh:
            '「做了件好事」的感觉，还会让人把这件事本身做得更多。被告知包装可回收的顾客，有时比没被告知的买得更多，' +
            '因为愧疚变小了。包装并没有变，变的只是关于它的说法。',
        },
        {
          en:
            'That does not make recycling pointless. Metal and glass can be used again and again, and a city ' +
            'that sorts its waste needs less land for it. But the question to ask before buying is not "can ' +
            'this be recycled?" It is "do I need this at all?"',
          zh:
            '这不是说回收没意义。金属和玻璃可以反复用，会分类垃圾的城市需要填埋的土地也更少。' +
            '但买东西之前该问的不是「这个能回收吗」，而是「我到底需不需要它」。',
        },
        {
          en:
            'A simple habit helps: keep a list of what you actually finished last month, not what you bought. ' +
            'Most people find that the things they use every day are few, and the things they recycle most are ' +
            'the ones they could have done without.',
          zh:
            '有个简单的习惯有用：记一张「上个月真的用完的东西」的单子，而不是「买了什么」的单子。' +
            '多数人会发现自己每天用的东西很少，而回收得最多的那些，恰恰是本来可以不买的。',
        },
        {
          en:
            'The same test works for almost anything you bring home: clothes, tools, small machines. Before the ' +
            'new one goes into the cupboard, ask when you last used the one you already have. If you cannot ' +
            'remember, the new thing is not adding a thing to your life; it is adding a place to keep it.',
          zh:
            '同样的检验几乎适用于任何带回家的东西：衣服、工具、小电器。在把新的塞进柜子之前，先问你上次用原来那个是什么时候。' +
            '如果想不起来，新的这件并没有给生活添上一样东西，只是添了一个存放它的地方。',
        },
      ],
      words: ['energy', 'habit', 'package', 'metal', 'waste', 'list'],
      sentences: [
        {
          en: 'A bag that you carry for two years saves more than a hundred bags that you recycle.',
          zh: '一个背了两年的袋子，比一百个被你回收的袋子更省。',
          note:
            '两个 that 从句都是定语，分别修饰 bag 和 bags。more than 是比较结构，' +
            '读作 saves more than a hundred bags do（比一百个袋子省得多）。',
        },
        {
          en:
            'Shoppers who are told that a package is recyclable sometimes buy more than those who are not, ' +
            'because the guilt is smaller.',
          zh: '被告知包装可回收的顾客，有时比没被告知的买得更多，因为愧疚变小了。',
          note:
            '主干是 Shoppers buy more than those。who are told that... 是定语从句，其中 that 又引导 told 的宾语从句；' +
            'those who are not 是省略说法（those who are not told）。',
        },
        {
          en:
            'Most people find that the things they use every day are few, and the things they recycle most are ' +
            'the ones they could have done without.',
          zh: '多数人会发现自己每天用的东西很少，而回收得最多的那些，恰恰是本来可以不买的。',
          note:
            'find 后面跟两个并列的 that 从句（第二个 that 省略）；the ones 后面又是省略关系词的定语从句；' +
            'could have done without 表示「本来可以不用」。',
        },
      ],
      questions: [
        {
          q: 'What is the writer\'s view of recycling?',
          options: [
            'It solves the problem completely.',
            'It is the middle step, not the end.',
            'It wastes more energy than it saves.',
            'It should be stopped.',
          ],
          answer: 1,
          explain: '第一段说丢进桶只是「中间」，不是问题的结束；第二段说要紧的是先用少一点、再用一次、最后回收。',
        },
        {
          q: 'Why might shoppers told that a package is recyclable buy more?',
          options: [
            'Recyclable products are cheaper.',
            'The package looks better.',
            'The guilt they feel is smaller.',
            'Shops encourage them to.',
          ],
          answer: 2,
          explain: '第三段：因为「愧疚变小了」，所以买得更多。',
        },
        {
          q: 'What question does the writer say to ask before buying?',
          options: [
            'Can this be recycled?',
            'Is this made of glass?',
            'Will this last a month?',
            'Do I need this at all?',
          ],
          answer: 3,
          explain: '第四段：买之前该问的不是「能回收吗」，而是「我到底需不需要它」。',
        },
      ],
    },

    {
      id: 'int-05',
      topic: '学习工具',
      title: 'What a Translation App Cannot Do for You',
      level: 3,
      gist:
        '翻译软件能给你「这段什么意思」，给不了「这个句子怎么搭起来的」。而后者才是让你不用软件也能读的东西。' +
        '用它的时机是：自己先读一遍、先猜一遍，再拿它来对答案。',
      paras: [
        {
          en:
            'A translation app can turn a page of English into Chinese in two seconds. It cannot tell you which ' +
            'sentence the exam will ask about, and it cannot make the grammar of that sentence feel familiar. ' +
            'Those two things are what reading practice is for.',
          zh:
            '翻译软件能在两秒内把一页英文变成中文。它没法告诉你考试会问哪一句，也没法让那句话的语法变眼熟。' +
            '而这两件事，正是「阅读练习」要练的。',
        },
        {
          en:
            'The reason is that understanding a text and understanding how a text is built are different ' +
            'skills. The app gives you the first. The second is what lets you read the next text without the ' +
            'app, because you begin to notice the patterns: how a noun is followed by a clause, how a negative ' +
            'is placed, how an argument is turned.',
          zh:
            '原因是：「看懂一段文字」和「看懂一段文字是怎么搭起来的」是两种不同的能力。软件给你前一种。' +
            '后一种才让你下一篇不用软件也能读，因为你开始注意到那些模式：名词后面怎么跟从句、否定放在哪里、' +
            '一个论点怎么转折。',
        },
        {
          en:
            'There is also a habit problem. When the answer is always one tap away, the mind stops doing the ' +
            'small work of guessing from context. Guessing is not a bad habit in reading; it is the skill the ' +
            'exam is testing. A word you guess and then check stays longer than a word you never guessed.',
          zh:
            '还有一个习惯问题。当答案永远只隔一次点击，脑子就不再干那点「从上下文猜」的小活。' +
            '在阅读里，猜不是坏习惯，它正是考试在考的能力。你猜过再去查的词，比从没猜过的词记得久。',
        },
        {
          en:
            'So use the app, but use it at the right moment: after you have read the paragraph once and made ' +
            'your own guess. Then compare. The gap between your guess and the app\'s answer is the most useful ' +
            'page of your notebook.',
          zh:
            '所以用软件，但要在对的时机用：先把这段读一遍、自己先猜一遍，再去看它。然后对照。' +
            '你的猜测和软件答案之间的差距，就是你笔记本里最有用的那一页。',
        },
        {
          en:
            'In the last month before the exam, try one passage a week with no app at all. It will feel ' +
            'slower. That is the point: the slow reading is the one that stays with you on the day.',
          zh:
            '考前最后一个月，每周试一篇完全不用软件的。它会显得慢。这正是重点：慢的那一遍，才会在考场上留下来。',
        },
        {
          en:
            'One more thing the app cannot do is keep you company while you are confused. Confusion is the ' +
            'feeling of a sentence that has not opened yet. Stay with it for thirty seconds before you reach ' +
            'for the phone. Most of the time the sentence opens by itself, and the next one opens faster.',
          zh:
            '软件还有一件事做不到：在你困惑的时候陪着你。困惑就是一句话还没打开时的那个感觉。' +
            '在伸手拿手机之前，先跟它待三十秒。多数时候句子会自己打开，而下一句会打开得更快。',
        },
      ],
      words: ['familiar', 'compare', 'notice', 'paragraph', 'negative', 'argument', 'skill'],
      sentences: [
        {
          en:
            'The second is what lets you read the next text without the app, because you begin to notice the ' +
            'patterns: how a noun is followed by a clause, how a negative is placed, how an argument is turned.',
          zh:
            '后一种才让你下一篇不用软件也能读，因为你开始注意到那些模式：名词后面怎么跟从句、否定放在哪里、' +
            '一个论点怎么转折。',
          note:
            'what 引导表语从句（The second is what...）；because 引导原因状语；' +
            '冒号后三个 how 从句并列，说明 patterns 具体指什么。',
        },
        {
          en: 'Guessing is not a bad habit in reading; it is the skill the exam is testing.',
          zh: '在阅读里，猜不是坏习惯，它正是考试在考的能力。',
          note: '分号连接两个主句；the skill 后面省略了关系词 that，the exam is testing 是修饰它的定语从句。',
        },
        {
          en: 'A word you guess and then check stays longer than a word you never guessed.',
          zh: '你猜过再去查的词，比从没猜过的词记得久。',
          note:
            '两个定语从句都省略了 that（A word [that] you guess...）；stays 是主句谓语；' +
            'longer than 比较的是两个词能留多久。',
        },
      ],
      questions: [
        {
          q: 'What can a translation app not do, according to the passage?',
          options: [
            'Turn English into Chinese quickly.',
            'Make the grammar of a sentence feel familiar.',
            'Show the meaning of a word.',
            'Work without the internet.',
          ],
          answer: 1,
          explain: '第一段明确说：它没法让那句的语法变眼熟。',
        },
        {
          q: 'Why does the writer call guessing a skill?',
          options: [
            'It saves time in the exam.',
            'It replaces vocabulary learning.',
            'It is what lets you read without the app and what the exam tests.',
            'It makes texts shorter.',
          ],
          answer: 2,
          explain: '第三段：猜正是考试在考的能力，也是让你摆脱软件的东西。',
        },
        {
          q: 'What does the writer suggest for the last month before the exam?',
          options: [
            'Use the app for every sentence.',
            'Stop reading altogether.',
            'Translate only the questions.',
            'Read one passage a week with no app.',
          ],
          answer: 3,
          explain: '最后一段：每周一篇完全不用软件，慢一点正是重点。',
        },
      ],
    },
  ],
};
