// 过线 · 音标数据（英式 DJ 48 音标）
//
// 这个文件是手写的，不是生成的：音标标注、发音要点、易混对比都是人工写的，
// 例词全部取自本站词表（所以页面上能查到释义），由 scripts/check-data.mjs 逐条查。
//
// 一条的形状：
//   { id, sym, type, name, tip: [要点…], ex: [{ w, ipa }], contrast: { id, note }, distract: [三个不含这个音的例词] }
// distract 是给「听辨练习」做干扰项用的：它一定不含本条的音，所以答案唯一。
window.CET4_PHON = {
  "meta": {
    "count": 48,
    "generated": "2026-11-05",
    "source": "音标体系：英式 DJ 48 音标；例词全部取本站词表里的四级词，音标按牛津 / 朗文式标注",
    "note": "48 个音标分 6 组：单元音 12、双元音 8、爆破 6、摩擦 10、破擦 6、鼻音与舌侧音与半元音 6。",
    "symbols": [
      "iː",
      "ɪ",
      "e",
      "æ",
      "ɑː",
      "ɒ",
      "ɔː",
      "ʊ",
      "uː",
      "ʌ",
      "ɜː",
      "ə",
      "eɪ",
      "aɪ",
      "ɔɪ",
      "aʊ",
      "əʊ",
      "ɪə",
      "eə",
      "ʊə",
      "p",
      "b",
      "t",
      "d",
      "k",
      "ɡ",
      "f",
      "v",
      "θ",
      "ð",
      "s",
      "z",
      "ʃ",
      "ʒ",
      "h",
      "tʃ",
      "dʒ",
      "tr",
      "dr",
      "ts",
      "dz",
      "m",
      "n",
      "ŋ",
      "l",
      "r",
      "w",
      "j"
    ]
  },
  "groups": [
    {
      "id": "v-mono",
      "name": "单元音",
      "desc": "12 个。一个音一个口型，不滑动。先把长短、松紧分清楚。",
      "ids": [
        "ii",
        "i",
        "e",
        "ae",
        "aa",
        "o",
        "oo",
        "u",
        "uu",
        "v",
        "er",
        "schwa"
      ]
    },
    {
      "id": "v-dip",
      "name": "双元音",
      "desc": "8 个。两个音滑成一个，前重后轻。",
      "ids": [
        "ei",
        "ai",
        "oi",
        "au",
        "ou",
        "ie",
        "ea",
        "ue"
      ]
    },
    {
      "id": "c-stop",
      "name": "爆破音",
      "desc": "6 个。先堵住气再放开：三对清浊。",
      "ids": [
        "p",
        "b",
        "t",
        "d",
        "k",
        "g"
      ]
    },
    {
      "id": "c-fric",
      "name": "摩擦音",
      "desc": "10 个。气流从窄缝里挤出来，可以一直拉长。",
      "ids": [
        "f",
        "vv",
        "th",
        "dh",
        "s",
        "z",
        "sh",
        "zh",
        "h",
        "r"
      ]
    },
    {
      "id": "c-aff",
      "name": "破擦音",
      "desc": "6 个。先堵再摩擦，是一个音不是两个。",
      "ids": [
        "ch",
        "j",
        "tr",
        "dr",
        "ts",
        "dz"
      ]
    },
    {
      "id": "c-other",
      "name": "鼻音 · 舌侧音 · 半元音",
      "desc": "6 个。气流改道或者带一下就滑走。",
      "ids": [
        "m",
        "n",
        "ng",
        "l",
        "w",
        "y"
      ]
    }
  ],
  "phonemes": [
    {
      "id": "ii",
      "sym": "iː",
      "type": "vowel",
      "name": "长元音",
      "tip": [
        "嘴角往两边拉开，像微笑；舌前部抬到最高，接近上颚但不碰上。",
        "声音要拉长，比 /ɪ/ 长一倍左右；结尾不要拖出「衣」的摩擦。"
      ],
      "ex": [
        {
          "w": "team",
          "ipa": "tiːm"
        },
        {
          "w": "reach",
          "ipa": "riːtʃ"
        },
        {
          "w": "police",
          "ipa": "pəˈliːs"
        }
      ],
      "contrast": {
        "id": "i",
        "note": "中文「衣」比它紧；/iː/ 更松、更长，牙关略开。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "i",
      "sym": "ɪ",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "舌位比 /iː/ 低一点、后一点，嘴形放松，不咧嘴。",
        "短促，不要拖长；后面的辅音一出来就收住。"
      ],
      "ex": [
        {
          "w": "hit",
          "ipa": "hɪt"
        },
        {
          "w": "win",
          "ipa": "wɪn"
        },
        {
          "w": "system",
          "ipa": "ˈsɪstəm"
        }
      ],
      "contrast": {
        "id": "ii",
        "note": "hit 和 heat 的区别就在长短和松紧：/ɪ/ 松、短，/iː/ 紧、长。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "e",
      "sym": "e",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "嘴半开，上下齿之间大约一个指尖；舌前部抬起，比 /ɪ/ 低。",
        "嘴角略向两边，短而干脆。"
      ],
      "ex": [
        {
          "w": "level",
          "ipa": "ˈlevl"
        },
        {
          "w": "sense",
          "ipa": "sens"
        },
        {
          "w": "effort",
          "ipa": "ˈefət"
        }
      ],
      "contrast": {
        "id": "ae",
        "note": "/æ/ 比它张大一倍；bed 和 bad 的差别就是开口大小。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "gather",
          "ipa": "ˈɡæðə"
        }
      ]
    },
    {
      "id": "ae",
      "sym": "æ",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "嘴张到能放进两个指尖，舌尖抵下齿背，舌面压低、往前送。",
        "这是中文里没有的音，容易读成 /e/；记住「嘴要更扁更开」。"
      ],
      "ex": [
        {
          "w": "fact",
          "ipa": "fækt"
        },
        {
          "w": "add",
          "ipa": "æd"
        },
        {
          "w": "value",
          "ipa": "ˈvæljuː"
        }
      ],
      "contrast": {
        "id": "e",
        "note": "先发 /e/ 再把下巴往下放一点，就是 /æ/。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "growth",
          "ipa": "ɡrəʊθ"
        }
      ]
    },
    {
      "id": "aa",
      "sym": "ɑː",
      "type": "vowel",
      "name": "长元音",
      "tip": [
        "嘴张大，舌后部压低，像医生看喉咙时让你张嘴那样。",
        "英式不卷舌；拉长，声音靠后。"
      ],
      "ex": [
        {
          "w": "part",
          "ipa": "pɑːt"
        },
        {
          "w": "art",
          "ipa": "ɑːt"
        },
        {
          "w": "staff",
          "ipa": "stɑːf"
        }
      ],
      "contrast": {
        "id": "v",
        "note": "和 /ʌ/ 比：/ɑː/ 嘴更开、声音更长更靠后。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "o",
      "sym": "ɒ",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "嘴张开，唇稍微收圆但不前突；舌后部低。",
        "英式短音，短促有力；美式常读成 /ɑː/。"
      ],
      "ex": [
        {
          "w": "offer",
          "ipa": "ˈɒfə"
        },
        {
          "w": "policy",
          "ipa": "ˈpɒləsɪ"
        },
        {
          "w": "follow",
          "ipa": "ˈfɒləʊ"
        }
      ],
      "contrast": {
        "id": "oo",
        "note": "和 /ɔː/ 是同一个位置的长短两档：/ɒ/ 短，/ɔː/ 长且唇更圆。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "oo",
      "sym": "ɔː",
      "type": "vowel",
      "name": "长元音",
      "tip": [
        "双唇收圆并前突，舌后部抬到半高。",
        "拉长；比 /ɒ/ 圆、比 /ɒ/ 高。"
      ],
      "ex": [
        {
          "w": "law",
          "ipa": "lɔː"
        },
        {
          "w": "force",
          "ipa": "fɔːs"
        },
        {
          "w": "course",
          "ipa": "kɔːs"
        }
      ],
      "contrast": {
        "id": "o",
        "note": "law 和 lot 的区别：/ɔː/ 唇圆、拖长，/ɒ/ 唇松、短。"
      },
      "distract": [
        {
          "w": "fair",
          "ipa": "feə"
        },
        {
          "w": "share",
          "ipa": "ʃeə"
        },
        {
          "w": "tour",
          "ipa": "tʊə"
        }
      ]
    },
    {
      "id": "u",
      "sym": "ʊ",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "双唇收圆但不前突，舌后部抬起，比 /uː/ 低一点。",
        "短促、松弛；不要读成中文「乌」。"
      ],
      "ex": [
        {
          "w": "wood",
          "ipa": "wʊd"
        },
        {
          "w": "goods",
          "ipa": "ɡʊdz"
        },
        {
          "w": "output",
          "ipa": "ˈaʊtpʊt"
        }
      ],
      "contrast": {
        "id": "uu",
        "note": "wood 和 food：/ʊ/ 松而短，/uː/ 紧而长。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "uu",
      "sym": "uː",
      "type": "vowel",
      "name": "长元音",
      "tip": [
        "双唇收成小圆并向前突出，舌后部抬得最高。",
        "拉长；唇形从头到尾不能松掉。"
      ],
      "ex": [
        {
          "w": "rule",
          "ipa": "ruːl"
        },
        {
          "w": "choose",
          "ipa": "tʃuːz"
        },
        {
          "w": "include",
          "ipa": "ɪnˈkluːd"
        }
      ],
      "contrast": {
        "id": "u",
        "note": "中文「乌」唇形不够圆；/uː/ 要更圆、更紧、更长。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "v",
      "sym": "ʌ",
      "type": "vowel",
      "name": "短元音",
      "tip": [
        "口微张，唇自然放松，舌中部稍抬起、偏后。",
        "短促有力，像被轻轻打了一下的「啊」。"
      ],
      "ex": [
        {
          "w": "drug",
          "ipa": "drʌɡ"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        },
        {
          "w": "result",
          "ipa": "rɪˈzʌlt"
        }
      ],
      "contrast": {
        "id": "aa",
        "note": "不是「啊」：/ʌ/ 张口小、短，位置更靠中间。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "er",
      "sym": "ɜː",
      "type": "vowel",
      "name": "长元音",
      "tip": [
        "舌中部抬起，双唇自然放松、不圆不扁。",
        "英式不卷舌；拉长，像犹豫时的「呃——」。"
      ],
      "ex": [
        {
          "w": "term",
          "ipa": "tɜːm"
        },
        {
          "w": "church",
          "ipa": "tʃɜːtʃ"
        },
        {
          "w": "research",
          "ipa": "rɪˈsɜːtʃ"
        }
      ],
      "contrast": {
        "id": "schwa",
        "note": "/ɜː/ 是重读、拉长的 /ə/；/ə/ 只出现在轻读音节。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "schwa",
      "sym": "ə",
      "type": "vowel",
      "name": "弱元音",
      "tip": [
        "口腔完全放松，舌平放，最短最轻的一个音。",
        "只出现在非重读音节；不要给它加重音。"
      ],
      "ex": [
        {
          "w": "system",
          "ipa": "ˈsɪstəm"
        },
        {
          "w": "happen",
          "ipa": "ˈhæpən"
        },
        {
          "w": "later",
          "ipa": "ˈleɪtə"
        }
      ],
      "contrast": {
        "id": "er",
        "note": "同一个字母 a 在 about 里读 /ə/，在 art 里读 /ɑː/，区别在重音。"
      },
      "distract": [
        {
          "w": "decision",
          "ipa": "dɪˈsɪʒn"
        },
        {
          "w": "demand",
          "ipa": "dɪˈmɑːnd"
        },
        {
          "w": "besides",
          "ipa": "bɪˈsaɪdz"
        }
      ]
    },
    {
      "id": "ei",
      "sym": "eɪ",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /e/ 滑到 /ɪ/，前长后短、前重后轻。",
        "两个音要连成一个滑动，不要断成两个。"
      ],
      "ex": [
        {
          "w": "state",
          "ipa": "steɪt"
        },
        {
          "w": "nation",
          "ipa": "ˈneɪʃn"
        },
        {
          "w": "rate",
          "ipa": "reɪt"
        }
      ],
      "contrast": {
        "id": "e",
        "note": "不是把 /e/ 拉长：结尾必须收向 /ɪ/。"
      },
      "distract": [
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "fact",
          "ipa": "fækt"
        },
        {
          "w": "follow",
          "ipa": "ˈfɒləʊ"
        }
      ]
    },
    {
      "id": "ai",
      "sym": "aɪ",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /a/ 滑到 /ɪ/，口型由大变小。",
        "前重后轻，结尾收到 /ɪ/ 就停。"
      ],
      "ex": [
        {
          "w": "might",
          "ipa": "maɪt"
        },
        {
          "w": "line",
          "ipa": "laɪn"
        },
        {
          "w": "type",
          "ipa": "taɪp"
        }
      ],
      "contrast": {
        "id": "ei",
        "note": "和 /eɪ/ 比：起点张得更开（/a/ 对 /e/）。"
      },
      "distract": [
        {
          "w": "choose",
          "ipa": "tʃuːz"
        },
        {
          "w": "church",
          "ipa": "tʃɜːtʃ"
        },
        {
          "w": "course",
          "ipa": "kɔːs"
        }
      ]
    },
    {
      "id": "oi",
      "sym": "ɔɪ",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /ɔ/ 滑到 /ɪ/，唇由圆变扁。",
        "别读成「奥义」两个音，中间要连。"
      ],
      "ex": [
        {
          "w": "point",
          "ipa": "pɔɪnt"
        },
        {
          "w": "voice",
          "ipa": "vɔɪs"
        },
        {
          "w": "choice",
          "ipa": "tʃɔɪs"
        }
      ],
      "contrast": {
        "id": "oo",
        "note": "/ɔː/ 是单元音；/ɔɪ/ 一定要滑到 /ɪ/。"
      },
      "distract": [
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "fact",
          "ipa": "fækt"
        },
        {
          "w": "follow",
          "ipa": "ˈfɒləʊ"
        }
      ]
    },
    {
      "id": "au",
      "sym": "aʊ",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /a/ 滑到 /ʊ/，唇由不圆到圆。",
        "前重后轻，结尾收到 /ʊ/ 就停。"
      ],
      "ex": [
        {
          "w": "power",
          "ipa": "ˈpaʊə"
        },
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "crowd",
          "ipa": "kraʊd"
        }
      ],
      "contrast": {
        "id": "ai",
        "note": "和 /aɪ/ 起点相同，区别在收向 /ʊ/ 还是 /ɪ/。"
      },
      "distract": [
        {
          "w": "choose",
          "ipa": "tʃuːz"
        },
        {
          "w": "church",
          "ipa": "tʃɜːtʃ"
        },
        {
          "w": "course",
          "ipa": "kɔːs"
        }
      ]
    },
    {
      "id": "ou",
      "sym": "əʊ",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /ə/ 滑到 /ʊ/，唇慢慢收圆。",
        "起点很松，别读成「欧」；英式起点靠近 /ə/。"
      ],
      "ex": [
        {
          "w": "role",
          "ipa": "rəʊl"
        },
        {
          "w": "whole",
          "ipa": "həʊl"
        },
        {
          "w": "phone",
          "ipa": "fəʊn"
        }
      ],
      "contrast": {
        "id": "au",
        "note": "起点不同：/əʊ/ 从松弛的 /ə/ 出发，/aʊ/ 从张开的 /a/ 出发。"
      },
      "distract": [
        {
          "w": "choose",
          "ipa": "tʃuːz"
        },
        {
          "w": "church",
          "ipa": "tʃɜːtʃ"
        },
        {
          "w": "course",
          "ipa": "kɔːs"
        }
      ]
    },
    {
      "id": "ie",
      "sym": "ɪə",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /ɪ/ 滑到 /ə/，前清后弱。",
        "第二个音几乎听不清，别读成「伊啊」。"
      ],
      "ex": [
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "real",
          "ipa": "rɪəl"
        },
        {
          "w": "theory",
          "ipa": "ˈθɪərɪ"
        }
      ],
      "contrast": {
        "id": "ea",
        "note": "和 /eə/ 比起点：/ɪə/ 起点高而闭，/eə/ 起点低而开。"
      },
      "distract": [
        {
          "w": "choose",
          "ipa": "tʃuːz"
        },
        {
          "w": "church",
          "ipa": "tʃɜːtʃ"
        },
        {
          "w": "course",
          "ipa": "kɔːs"
        }
      ]
    },
    {
      "id": "ea",
      "sym": "eə",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /e/ 滑到 /ə/，口型由半开变松。",
        "英式里 /r/ 不发音，结尾只是轻轻收向 /ə/。"
      ],
      "ex": [
        {
          "w": "share",
          "ipa": "ʃeə"
        },
        {
          "w": "fair",
          "ipa": "feə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ],
      "contrast": {
        "id": "ie",
        "note": "两者结尾都是 /ə/，区别全在起点。"
      },
      "distract": [
        {
          "w": "add",
          "ipa": "æd"
        },
        {
          "w": "art",
          "ipa": "ɑːt"
        },
        {
          "w": "law",
          "ipa": "lɔː"
        }
      ]
    },
    {
      "id": "ue",
      "sym": "ʊə",
      "type": "dip",
      "name": "双元音",
      "tip": [
        "从 /ʊ/ 滑到 /ə/，唇由圆变松。",
        "这个音在英式里正被 /ɔː/ 取代，听到 tour 读成 /tɔː/ 也算对。"
      ],
      "ex": [
        {
          "w": "tour",
          "ipa": "tʊə"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "rural",
          "ipa": "ˈrʊərəl"
        }
      ],
      "contrast": {
        "id": "oo",
        "note": "现代英音里它常和 /ɔː/ 合并，别死记。"
      },
      "distract": [
        {
          "w": "add",
          "ipa": "æd"
        },
        {
          "w": "art",
          "ipa": "ɑːt"
        },
        {
          "w": "law",
          "ipa": "lɔː"
        }
      ]
    },
    {
      "id": "p",
      "sym": "p",
      "type": "stop",
      "name": "清辅音",
      "tip": [
        "双唇紧闭再突然放开，送气要强（手放嘴前能感觉到风）。",
        "声带不振动；词尾的 /p/ 常常只闭唇、不送气。"
      ],
      "ex": [
        {
          "w": "part",
          "ipa": "pɑːt"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        }
      ],
      "contrast": {
        "id": "b",
        "note": "和 /b/ 唯一的差别是声带振不振、送不送气。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        },
        {
          "w": "choice",
          "ipa": "tʃɔɪs"
        }
      ]
    },
    {
      "id": "b",
      "sym": "b",
      "type": "stop",
      "name": "浊辅音",
      "tip": [
        "口型和 /p/ 一样，但不送气、声带振动。",
        "摸喉咙应该能感觉到麻。"
      ],
      "ex": [
        {
          "w": "business",
          "ipa": "ˈbɪznəs"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        },
        {
          "w": "probably",
          "ipa": "ˈprɒbəblɪ"
        }
      ],
      "contrast": {
        "id": "p",
        "note": "中文 b 其实是清音；英语 /b/ 要真的振动声带。"
      },
      "distract": [
        {
          "w": "decision",
          "ipa": "dɪˈsɪʒn"
        },
        {
          "w": "human",
          "ipa": "ˈhjuːmən"
        },
        {
          "w": "include",
          "ipa": "ɪnˈkluːd"
        }
      ]
    },
    {
      "id": "t",
      "sym": "t",
      "type": "stop",
      "name": "清辅音",
      "tip": [
        "舌尖抵上齿龈，憋住气再放开，送气强。",
        "声带不振动；英式词尾 /t/ 常带一点喉塞。"
      ],
      "ex": [
        {
          "w": "state",
          "ipa": "steɪt"
        },
        {
          "w": "part",
          "ipa": "pɑːt"
        },
        {
          "w": "system",
          "ipa": "ˈsɪstəm"
        }
      ],
      "contrast": {
        "id": "d",
        "note": "和 /d/ 比：口型相同，一个送气清音，一个不送气浊音。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "follow",
          "ipa": "ˈfɒləʊ"
        }
      ]
    },
    {
      "id": "d",
      "sym": "d",
      "type": "stop",
      "name": "浊辅音",
      "tip": [
        "舌尖抵上齿龈，放开时不送气，声带振动。",
        "在词尾要发出来，别吞掉。"
      ],
      "ex": [
        {
          "w": "demand",
          "ipa": "dɪˈmɑːnd"
        },
        {
          "w": "decade",
          "ipa": "ˈdekeɪd"
        },
        {
          "w": "direct",
          "ipa": "dəˈrekt"
        }
      ],
      "contrast": {
        "id": "t",
        "note": "water 在美音里会变成 /d/，这是另一种规则，先按英式练。"
      },
      "distract": [
        {
          "w": "human",
          "ipa": "ˈhjuːmən"
        },
        {
          "w": "policy",
          "ipa": "ˈpɒləsɪ"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        }
      ]
    },
    {
      "id": "k",
      "sym": "k",
      "type": "stop",
      "name": "清辅音",
      "tip": [
        "舌后部抵住软腭，憋气后放开，送气强。",
        "声带不振动；在 /s/ 后面不送气（school）。"
      ],
      "ex": [
        {
          "w": "fact",
          "ipa": "fækt"
        },
        {
          "w": "include",
          "ipa": "ɪnˈkluːd"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        }
      ],
      "contrast": {
        "id": "g",
        "note": "和 /ɡ/ 比：位置一样，区别在声带。"
      },
      "distract": [
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "follow",
          "ipa": "ˈfɒləʊ"
        }
      ]
    },
    {
      "id": "g",
      "sym": "ɡ",
      "type": "stop",
      "name": "浊辅音",
      "tip": [
        "舌后部抵软腭，放开时不送气，声带振动。",
        "注意手写体是 ɡ（不是印刷体 g）。"
      ],
      "ex": [
        {
          "w": "government",
          "ipa": "ˈɡʌvənmənt"
        },
        {
          "w": "drug",
          "ipa": "drʌɡ"
        },
        {
          "w": "goal",
          "ipa": "ɡəʊl"
        }
      ],
      "contrast": {
        "id": "k",
        "note": "cat 和 get：先听声带，再看送气。"
      },
      "distract": [
        {
          "w": "project",
          "ipa": "ˈprɒdʒekt"
        },
        {
          "w": "statesman",
          "ipa": "ˈsteɪtsmən"
        },
        {
          "w": "team",
          "ipa": "tiːm"
        }
      ]
    },
    {
      "id": "f",
      "sym": "f",
      "type": "fric",
      "name": "清辅音",
      "tip": [
        "上齿轻触下唇，气流从缝隙挤出，没有爆音。",
        "声带不振动；可以一直拉长。"
      ],
      "ex": [
        {
          "w": "fact",
          "ipa": "fækt"
        },
        {
          "w": "force",
          "ipa": "fɔːs"
        },
        {
          "w": "effect",
          "ipa": "ɪˈfekt"
        }
      ],
      "contrast": {
        "id": "v",
        "note": "口型完全相同，只差声带。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        },
        {
          "w": "image",
          "ipa": "ˈɪmɪdʒ"
        }
      ]
    },
    {
      "id": "vv",
      "sym": "v",
      "type": "fric",
      "name": "浊辅音",
      "tip": [
        "上齿轻触下唇，声带振动，气流摩擦而出。",
        "中文没有这个音，容易读成 /w/；记住上齿要碰下唇。"
      ],
      "ex": [
        {
          "w": "voice",
          "ipa": "vɔɪs"
        },
        {
          "w": "value",
          "ipa": "ˈvæljuː"
        },
        {
          "w": "level",
          "ipa": "ˈlevl"
        }
      ],
      "contrast": {
        "id": "f",
        "note": "very 不要读成 wery：上齿必须碰下唇。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "th",
      "sym": "θ",
      "type": "fric",
      "name": "清辅音",
      "tip": [
        "舌尖轻放在上下齿之间，气流从舌齿缝隙挤出。",
        "声带不振动；中文没有，别读成 /s/。"
      ],
      "ex": [
        {
          "w": "death",
          "ipa": "deθ"
        },
        {
          "w": "growth",
          "ipa": "ɡrəʊθ"
        },
        {
          "w": "method",
          "ipa": "ˈmeθəd"
        }
      ],
      "contrast": {
        "id": "s",
        "note": "think 和 sink：舌头要伸到齿间，不是藏在齿后。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "dh",
      "sym": "ð",
      "type": "fric",
      "name": "浊辅音",
      "tip": [
        "口型和 /θ/ 一样，但声带振动。",
        "多出现在 this / that / the 这类词里。"
      ],
      "ex": [
        {
          "w": "within",
          "ipa": "wɪˈðɪn"
        },
        {
          "w": "rather",
          "ipa": "ˈrɑːðə"
        },
        {
          "w": "gather",
          "ipa": "ˈɡæðə"
        }
      ],
      "contrast": {
        "id": "z",
        "note": "和 /z/ 比：/ð/ 舌尖在齿间，/z/ 舌尖在齿后。"
      },
      "distract": [
        {
          "w": "besides",
          "ipa": "bɪˈsaɪdz"
        },
        {
          "w": "decade",
          "ipa": "ˈdekeɪd"
        },
        {
          "w": "define",
          "ipa": "dɪˈfaɪn"
        }
      ]
    },
    {
      "id": "s",
      "sym": "s",
      "type": "fric",
      "name": "清辅音",
      "tip": [
        "舌尖靠近上齿龈，气流从中间细缝挤出，像漏气。",
        "声带不振动；汉语的 s 位置更靠前，要往后收一点。"
      ],
      "ex": [
        {
          "w": "system",
          "ipa": "ˈsɪstəm"
        },
        {
          "w": "state",
          "ipa": "steɪt"
        },
        {
          "w": "sense",
          "ipa": "sens"
        }
      ],
      "contrast": {
        "id": "z",
        "note": "和 /z/ 只差声带；词尾复数 -s 什么时候读 /s/ 什么时候读 /z/，看前一个音清浊。"
      },
      "distract": [
        {
          "w": "demand",
          "ipa": "dɪˈmɑːnd"
        },
        {
          "w": "direct",
          "ipa": "dəˈrekt"
        },
        {
          "w": "include",
          "ipa": "ɪnˈkluːd"
        }
      ]
    },
    {
      "id": "z",
      "sym": "z",
      "type": "fric",
      "name": "浊辅音",
      "tip": [
        "口型和 /s/ 一样，声带振动。",
        "中文没有词首的 /z/，别读成汉语拼音 z（那是 /ts/）。"
      ],
      "ex": [
        {
          "w": "business",
          "ipa": "ˈbɪznəs"
        },
        {
          "w": "result",
          "ipa": "rɪˈzʌlt"
        },
        {
          "w": "choose",
          "ipa": "tʃuːz"
        }
      ],
      "contrast": {
        "id": "s",
        "note": "zoo 的起始音要振动，不要发成「租」。"
      },
      "distract": [
        {
          "w": "demand",
          "ipa": "dɪˈmɑːnd"
        },
        {
          "w": "direct",
          "ipa": "dəˈrekt"
        },
        {
          "w": "include",
          "ipa": "ɪnˈkluːd"
        }
      ]
    },
    {
      "id": "sh",
      "sym": "ʃ",
      "type": "fric",
      "name": "清辅音",
      "tip": [
        "舌前部靠近硬腭，唇略圆前突，气流摩擦。",
        "像让人安静的「嘘」，但唇要更圆更突出。"
      ],
      "ex": [
        {
          "w": "nation",
          "ipa": "ˈneɪʃn"
        },
        {
          "w": "social",
          "ipa": "ˈsəʊʃl"
        },
        {
          "w": "special",
          "ipa": "ˈspeʃl"
        }
      ],
      "contrast": {
        "id": "ch",
        "note": "/ʃ/ 是持续的摩擦；/tʃ/ 前面有一个短暂的堵塞。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "fact",
          "ipa": "fækt"
        }
      ]
    },
    {
      "id": "zh",
      "sym": "ʒ",
      "type": "fric",
      "name": "浊辅音",
      "tip": [
        "口型和 /ʃ/ 一样，声带振动。",
        "几乎只出现在词中（measure, vision），词首极少。"
      ],
      "ex": [
        {
          "w": "measure",
          "ipa": "ˈmeʒə"
        },
        {
          "w": "vision",
          "ipa": "ˈvɪʒn"
        },
        {
          "w": "decision",
          "ipa": "dɪˈsɪʒn"
        }
      ],
      "contrast": {
        "id": "sh",
        "note": "和 /ʃ/ 只差声带；中文「日」太重，别直接替换。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        }
      ]
    },
    {
      "id": "h",
      "sym": "h",
      "type": "fric",
      "name": "清辅音",
      "tip": [
        "气流从喉部轻轻摩擦出来，口型跟着后面的元音走。",
        "声带不振动；不要读成中文「喝」那么重。"
      ],
      "ex": [
        {
          "w": "happen",
          "ipa": "ˈhæpən"
        },
        {
          "w": "human",
          "ipa": "ˈhjuːmən"
        },
        {
          "w": "hit",
          "ipa": "hɪt"
        }
      ],
      "contrast": {
        "id": "w",
        "note": "who 里没有 /h/（读 /huː/ 也对，但 who 的 h 常被省略）。"
      },
      "distract": [
        {
          "w": "besides",
          "ipa": "bɪˈsaɪdz"
        },
        {
          "w": "decade",
          "ipa": "ˈdekeɪd"
        },
        {
          "w": "define",
          "ipa": "dɪˈfaɪn"
        }
      ]
    },
    {
      "id": "r",
      "sym": "r",
      "type": "fric",
      "name": "浊辅音",
      "tip": [
        "舌尖卷起或后缩，但不碰上腭；双唇略圆前突。",
        "英式只在元音前发音，词尾的 r 不读（car /kɑː/）。"
      ],
      "ex": [
        {
          "w": "reach",
          "ipa": "riːtʃ"
        },
        {
          "w": "result",
          "ipa": "rɪˈzʌlt"
        },
        {
          "w": "research",
          "ipa": "rɪˈsɜːtʃ"
        }
      ],
      "contrast": {
        "id": "l",
        "note": "和 /l/ 比：/r/ 舌尖不碰上腭，/l/ 舌尖要顶上齿龈。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "ch",
      "sym": "tʃ",
      "type": "aff",
      "name": "清辅音",
      "tip": [
        "舌前部先抵住硬腭（像 /t/），再慢慢放开摩擦（像 /ʃ/）。",
        "是一个音，不是 t + ʃ 两下。"
      ],
      "ex": [
        {
          "w": "reach",
          "ipa": "riːtʃ"
        },
        {
          "w": "choice",
          "ipa": "tʃɔɪs"
        },
        {
          "w": "nature",
          "ipa": "ˈneɪtʃə"
        }
      ],
      "contrast": {
        "id": "sh",
        "note": "watch 和 wash：前者开头有堵塞，后者没有。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "j",
      "sym": "dʒ",
      "type": "aff",
      "name": "浊辅音",
      "tip": [
        "口型和 /tʃ/ 一样，声带振动，不送气。",
        "像中文「知」，但要更短、更浊。"
      ],
      "ex": [
        {
          "w": "project",
          "ipa": "ˈprɒdʒekt"
        },
        {
          "w": "major",
          "ipa": "ˈmeɪdʒə"
        },
        {
          "w": "image",
          "ipa": "ˈɪmɪdʒ"
        }
      ],
      "contrast": {
        "id": "ch",
        "note": "和 /tʃ/ 只差声带；age 的结尾要振动。"
      },
      "distract": [
        {
          "w": "congress",
          "ipa": "ˈkɒŋɡres"
        },
        {
          "w": "business",
          "ipa": "ˈbɪznəs"
        },
        {
          "w": "decision",
          "ipa": "dɪˈsɪʒn"
        }
      ]
    },
    {
      "id": "tr",
      "sym": "tr",
      "type": "aff",
      "name": "清辅音",
      "tip": [
        "舌前部抵住齿龈后部，先堵再放，紧接着卷舌的 /r/。",
        "这是 t + r 的连读固化，中文「戳」接近，但更短。"
      ],
      "ex": [
        {
          "w": "trade",
          "ipa": "treɪd"
        },
        {
          "w": "truth",
          "ipa": "truːθ"
        },
        {
          "w": "treat",
          "ipa": "triːt"
        }
      ],
      "contrast": {
        "id": "dr",
        "note": "和 /dr/ 只差声带。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "dr",
      "sym": "dr",
      "type": "aff",
      "name": "浊辅音",
      "tip": [
        "口型和 /tr/ 一样，声带振动。",
        "像中文「桌」的开头，但更短更浊。"
      ],
      "ex": [
        {
          "w": "drug",
          "ipa": "drʌɡ"
        },
        {
          "w": "drop",
          "ipa": "drɒp"
        },
        {
          "w": "dream",
          "ipa": "driːm"
        }
      ],
      "contrast": {
        "id": "tr",
        "note": "tree 和 dream：听声带，别看拼写。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "ts",
      "sym": "ts",
      "type": "aff",
      "name": "清辅音",
      "tip": [
        "舌尖抵住上齿龈，放开时送气，像中文「次」的结尾。",
        "多出现在名词复数和动词第三人称单数后面。"
      ],
      "ex": [
        {
          "w": "pants",
          "ipa": "pænts"
        },
        {
          "w": "outset",
          "ipa": "ˈaʊtset"
        },
        {
          "w": "statesman",
          "ipa": "ˈsteɪtsmən"
        }
      ],
      "contrast": {
        "id": "dz",
        "note": "和 /dz/ 只差声带：cats 对 words。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "ensure",
          "ipa": "ɪnˈʃʊə"
        }
      ]
    },
    {
      "id": "dz",
      "sym": "dz",
      "type": "aff",
      "name": "浊辅音",
      "tip": [
        "口型和 /ts/ 一样，声带振动，像中文「资」。",
        "规则同上：前面的音是浊音时才读 /dz/。"
      ],
      "ex": [
        {
          "w": "towards",
          "ipa": "təˈwɔːdz"
        },
        {
          "w": "besides",
          "ipa": "bɪˈsaɪdz"
        },
        {
          "w": "upwards",
          "ipa": "ˈʌpwədz"
        }
      ],
      "contrast": {
        "id": "ts",
        "note": "复数 -s 读 /s/ /z/ /ts/ /dz/，取决于前一个音。"
      },
      "distract": [
        {
          "w": "decade",
          "ipa": "ˈdekeɪd"
        },
        {
          "w": "define",
          "ipa": "dɪˈfaɪn"
        },
        {
          "w": "effect",
          "ipa": "ɪˈfekt"
        }
      ]
    },
    {
      "id": "m",
      "sym": "m",
      "type": "nasal",
      "name": "鼻音",
      "tip": [
        "双唇紧闭，气流从鼻腔出来，声带振动。",
        "可以一直哼，直到需要张嘴。"
      ],
      "ex": [
        {
          "w": "might",
          "ipa": "maɪt"
        },
        {
          "w": "team",
          "ipa": "tiːm"
        },
        {
          "w": "system",
          "ipa": "ˈsɪstəm"
        }
      ],
      "contrast": {
        "id": "n",
        "note": "和 /n/ 比：一个闭唇，一个舌尖顶上齿龈。"
      },
      "distract": [
        {
          "w": "allow",
          "ipa": "əˈlaʊ"
        },
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        }
      ]
    },
    {
      "id": "n",
      "sym": "n",
      "type": "nasal",
      "name": "鼻音",
      "tip": [
        "舌尖抵上齿龈，气流从鼻腔出来，声带振动。",
        "中文的 n 位置更靠前，英语的舌尖要更往后。"
      ],
      "ex": [
        {
          "w": "nation",
          "ipa": "ˈneɪʃn"
        },
        {
          "w": "line",
          "ipa": "laɪn"
        },
        {
          "w": "define",
          "ipa": "dɪˈfaɪn"
        }
      ],
      "contrast": {
        "id": "ng",
        "note": "sin 和 sing：舌尖顶齿龈是 /n/，舌后部抬是 /ŋ/。"
      },
      "distract": [
        {
          "w": "crowd",
          "ipa": "kraʊd"
        },
        {
          "w": "effort",
          "ipa": "ˈefət"
        },
        {
          "w": "fact",
          "ipa": "fækt"
        }
      ]
    },
    {
      "id": "ng",
      "sym": "ŋ",
      "type": "nasal",
      "name": "鼻音",
      "tip": [
        "舌后部抵住软腭，气流从鼻腔出来，声带振动。",
        "只出现在词尾或 /k/ /ɡ/ 前面，不会出现在词首。"
      ],
      "ex": [
        {
          "w": "congress",
          "ipa": "ˈkɒŋɡres"
        },
        {
          "w": "strength",
          "ipa": "streŋθ"
        },
        {
          "w": "training",
          "ipa": "ˈtreɪnɪŋ"
        }
      ],
      "contrast": {
        "id": "n",
        "note": "别加一个 /ɡ/：sing 是 /sɪŋ/，不是 /sɪŋɡ/。"
      },
      "distract": [
        {
          "w": "project",
          "ipa": "ˈprɒdʒekt"
        },
        {
          "w": "statesman",
          "ipa": "ˈsteɪtsmən"
        },
        {
          "w": "business",
          "ipa": "ˈbɪznəs"
        }
      ]
    },
    {
      "id": "l",
      "sym": "l",
      "type": "lat",
      "name": "舌侧音",
      "tip": [
        "舌尖抵上齿龈，气流从舌头两侧出来，声带振动。",
        "词尾的 /l/ 要更「暗」：舌后部抬起（milk 的 l）。"
      ],
      "ex": [
        {
          "w": "line",
          "ipa": "laɪn"
        },
        {
          "w": "level",
          "ipa": "ˈlevl"
        },
        {
          "w": "public",
          "ipa": "ˈpʌblɪk"
        }
      ],
      "contrast": {
        "id": "r",
        "note": "和 /r/ 比：/l/ 舌尖必须顶上齿龈。"
      },
      "distract": [
        {
          "w": "appear",
          "ipa": "əˈpɪə"
        },
        {
          "w": "aware",
          "ipa": "əˈweə"
        },
        {
          "w": "choice",
          "ipa": "tʃɔɪs"
        }
      ]
    },
    {
      "id": "w",
      "sym": "w",
      "type": "semiv",
      "name": "半元音",
      "tip": [
        "双唇收圆前突，很快滑向后面的元音。",
        "不能单独成音，一定跟着元音走。"
      ],
      "ex": [
        {
          "w": "war",
          "ipa": "wɔː"
        },
        {
          "w": "win",
          "ipa": "wɪn"
        },
        {
          "w": "wonder",
          "ipa": "ˈwʌndə"
        }
      ],
      "contrast": {
        "id": "vv",
        "note": "和 /v/ 比：/w/ 用双唇，/v/ 用上齿咬下唇。"
      },
      "distract": [
        {
          "w": "add",
          "ipa": "æd"
        },
        {
          "w": "art",
          "ipa": "ɑːt"
        },
        {
          "w": "fair",
          "ipa": "feə"
        }
      ]
    },
    {
      "id": "y",
      "sym": "j",
      "type": "semiv",
      "name": "半元音",
      "tip": [
        "舌前部抬向硬腭，很快滑向后面的元音。",
        "和中文「一」的起头很像，但没有摩擦。"
      ],
      "ex": [
        {
          "w": "human",
          "ipa": "ˈhjuːmən"
        },
        {
          "w": "view",
          "ipa": "vjuː"
        },
        {
          "w": "value",
          "ipa": "ˈvæljuː"
        }
      ],
      "contrast": {
        "id": "ii",
        "note": "和 /iː/ 比：/j/ 只滑一下，不持续。"
      },
      "distract": [
        {
          "w": "business",
          "ipa": "ˈbɪznəs"
        },
        {
          "w": "decision",
          "ipa": "dɪˈsɪʒn"
        },
        {
          "w": "demand",
          "ipa": "dɪˈmɑːnd"
        }
      ]
    }
  ]
};
