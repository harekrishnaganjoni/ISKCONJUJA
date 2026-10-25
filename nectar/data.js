/* Plan data. Edit the wording here if you like. Dates run from Mon 26 Oct to Tue 24 Nov 2026. */
var START = [2026, 9, 26]; // year, month (0 = Jan), day

var INTRO = {
  title: "Welcome and the Preface",
  reading: ["preface"],
  hooks: ["If you could give a friend just eleven pieces of advice for a good life, what would they be?"],
  sections: [
    { head: "About this book", items: [
      "Nectar of Instruction is a small book of eleven short verses. It was written about 500 years ago by Srila Rupa Gosvami, a close follower of Lord Caitanya.",
      "Srila Prabhupada, who founded ISKCON, translated the verses into English and explained each one.",
      "The book gives practical advice for daily life: how to control our habits, who to spend time with, and how to make steady progress in spiritual life."
    ]},
    { head: "How we will read it this month", items: [
      "Mondays and Thursdays: read the next text at home or at the centre.",
      "Tuesdays and Fridays, 7:00 to 7:30 PM, at the centre: the main discussion class.",
      "Other days: come to the centre any day to talk, or catch up on your own with the recap.",
      "It is fine to skim. You do not need to understand everything the first time."
    ]}
  ],
  questions: [
    "What do you hope to get from this month of reading?",
    "What is one habit you would like to improve by the end of Kartik?"
  ],
  tryThis: "Tomorrow's class is Text 1. Read it tonight or tomorrow morning, even just the translation."
};

var CLASSES = {
  c1: { idx: 1, title: "The six urges", texts: [1],
    hooks: ["Ever said something you regretted, or eaten more than you planned? Who was really in charge?"],
    sections: [
      { head: "Key points", items: [
        "The verse lists six urges that push us around: the urge to speak, the demands of the mind, anger, the tongue, the stomach, and the sexual urge. Someone who can stay steady through all six can guide others anywhere.",
        "Controlling speech does not mean staying silent. It means using our words to talk about God and good things.",
        "A busy mind settles when it is kept on God. Trying to empty the mind completely does not last.",
        "Anger cannot simply be switched off. It can be used for the right cause, such as standing up when God or holy people are insulted, and not over small insults to ourselves.",
        "The tongue is the key. Eating only food offered to God, at regular times, makes it much easier to control the stomach and the other urges.",
        "Being a master of your senses is what makes a person a real leader. Otherwise we are servants of our senses."
      ]}
    ],
    questions: [
      "Which of the six urges is hardest for you? (You do not need to answer out loud.)",
      "What is one good thing we could talk about this week instead of gossip?",
      "How could eating at regular times help with the other urges?"
    ],
    tryThis: "For one day, eat only at your regular meal times and notice what your tongue asks for in between." },

  c2: { idx: 4, title: "Six habits that drain us", texts: [2],
    hooks: ["Too much food, too much work, too much gossip. Which one steals most of your time?"],
    sections: [
      { head: "Key points", items: [
        "Six things spoil spiritual progress: eating or collecting more than we need, working too hard for things that are hard to get, idle talk, following rules for their own sake (or ignoring them), spending time with people who have no interest in spiritual life, and greed.",
        "The guiding idea is plain living and high thinking. Take what you need and use the rest to serve God.",
        "Birds take a few grains and leave. A person will take the whole bag. Taking far more than we need causes anxiety and conflict.",
        "Idle talk, such as endless news, gossip and arguments about politics, wastes time that could go to something valuable.",
        "Rules in spiritual life are there to help us make progress, so they should be followed for that reason, not for show.",
        "Good company matters. Spending time with people who share our goal makes the path easier."
      ]}
    ],
    questions: [
      "Of food, work and talk, which one takes up most of your time?",
      "What does 'enough' look like for you?",
      "Whose company helps you become better, and how can we spend more time with them?"
    ],
    tryThis: "Pick one time-waster this week and spend those 15 minutes on something you will be glad of tomorrow." },

  c3: { idx: 8, title: "Six habits that build us up", texts: [3],
    hooks: ["How do you keep going with something good when it gets boring?"],
    sections: [
      { head: "Key points", items: [
        "Six things help spiritual life succeed: enthusiasm, confidence, patience, doing the regular practices (hearing, chanting and remembering God), leaving bad company, and following the example of great teachers.",
        "Spiritual life is practical action, not just sitting quietly or having nice feelings.",
        "The nine processes of service include hearing about God, chanting, remembering, worshipping, praying and offering ourselves.",
        "Enthusiasm means putting energy into serving God, as eagerly as a student or a businessperson works for success.",
        "Even modern tools can be used in God's service. Prabhupada used a dictaphone to dictate his books."
      ]}
    ],
    questions: [
      "What has helped you stay consistent with something in the past?",
      "Which of the six is strongest in you, and which needs support?",
      "What tool on your phone could you use for something spiritual?"
    ],
    tryThis: "Choose one daily practice (chanting, reading or prayer) and do it at the same time every day this week." },

  c4: { idx: 11, title: "Six ways to build friendship", texts: [4],
    hooks: ["What is the quickest way to become real friends? Hint: it involves sharing food."],
    sections: [
      { head: "Key points", items: [
        "The verse names six things that grow love between people who share a spiritual goal: giving gifts, accepting gifts, sharing private thoughts, asking for advice in confidence, accepting food offered by others, and offering food to others.",
        "Notice that half of them are about food. Sharing food from the feast is a simple way to become close.",
        "These are not formalities. They are signs of real, caring friendship."
      ]}
    ],
    questions: [
      "Which of the six do we already do well as a group?",
      "Which one could we start in Juja?",
      "Who could you share food with this week?"
    ],
    tryThis: "Share a meal or snack with someone from the group and have a real conversation." },

  c5: { idx: 15, title: "How to treat different people", texts: [5],
    hooks: ["How should we greet a new visitor, an elder and a friend? Should it be the same?"],
    sections: [
      { head: "Key points", items: [
        "Different people deserve different kinds of respect. The verse describes three levels.",
        "A person who chants God's name: respect them in your mind.",
        "A person who has taken formal initiation and worships God: bow to them with humility.",
        "An advanced person whose heart is free of finding fault in others: associate with them and serve them faithfully.",
        "The mark of someone advanced is that they do not criticise others. Looking for faults is a sign of the opposite."
      ]}
    ],
    questions: [
      "How do you greet someone you respect?",
      "Why is not criticising others such a sign of a good heart?",
      "Who could you serve more this week?"
    ],
    tryThis: "Say one sincere kind word to someone you respect." },

  c6: { idx: 18, title: "Looking beyond appearances, and the sweetness of chanting", texts: [6, 7],
    hooks: [
      "Have you ever judged someone by how they look or dress? Were you right?",
      "When you are sick, even your favourite food tastes bitter. Could that be happening with chanting?"
    ],
    sections: [
      { head: "Text 6: key points", items: [
        "A person who is truly spiritual should not be judged by their body: family background, skin colour, a disability or an illness.",
        "Think of the Ganges in the rainy season. The water has foam, bubbles and mud, but it is still pure, and wise people bathe in it without hesitation."
      ]},
      { head: "Text 7: key points", items: [
        "God's name and stories are as sweet as sugar candy.",
        "Someone with jaundice finds sweets bitter. In the same way, ignorance makes chanting seem dull at first.",
        "The cure is to keep going. Chanting every day slowly clears the sickness, and the taste comes naturally."
      ]}
    ],
    questions: [
      "Who have you misjudged at first and later seen differently?",
      "Why would it be silly to refuse the Ganges because of a little foam?",
      "What helps your chanting taste sweeter: time, place or company?"
    ],
    tryThis: "Chant one round slowly and listen carefully to every word." },

  c7: { idx: 22, title: "The essence of all advice", texts: [8],
    hooks: ["How do you remember God at work, or on the matatu?"],
    sections: [
      { head: "Key points", items: [
        "This text gives the summary of all the advice: use your full twenty-four hours to chant and remember God's name, form, qualities and activities.",
        "Our tongue and mind are gradually engaged in this way.",
        "In the mind we live in Vrindavan, the holy land where God's activities took place.",
        "We follow the example of people who love God deeply and are devoted to serving Him."
      ]}
    ],
    questions: [
      "What are three small reminders you could set during the day?",
      "What part of your routine could be filled with remembering God?",
      "Who is a good example for you of someone who does this?"
    ],
    tryThis: "Set a phone reminder at midday to pause and chant for two minutes." },

  c8: { idx: 25, title: "Special places and the highest love", texts: [9, 10, 11],
    hooks: ["What is the most special place you have ever been, and why did it feel different?"],
    sections: [
      { head: "Key points", items: [
        "These last texts describe a ladder of holy places, each higher than the one before: Mathura, then Vrindavan, then Govardhana Hill, and highest of all the holy lake called Radha-kunda.",
        "Places become special because of what happened there, especially God's loving activities.",
        "Radha-kunda is described as being as dear to God as Srimati Radharani Herself, who is His dearest.",
        "The final text says that even a single bath in Radha-kunda awakens pure love for God, which is the goal of the whole book."
      ]}
    ],
    questions: [
      "What makes a place feel special to you?",
      "Which of these three texts spoke to you most?",
      "What does 'pure love for God' mean to you?"
    ],
    tryThis: "Think about one holy place you would like to visit someday, and write down why." }
};

var REVIEW = {
  title: "Review",
  hooks: ["Which of these eight classes surprised you most?"],
  points: [
    "Text 1: six urges that push us around, and how to use each one well.",
    "Text 2: six habits that drain us.",
    "Text 3: six habits that build us up.",
    "Text 4: six ways to build real friendship.",
    "Text 5: how to treat different kinds of people.",
    "Texts 6 and 7: look beyond appearances, and keep chanting until it tastes sweet.",
    "Text 8: remember God all day.",
    "Texts 9 to 11: special places and the highest love."
  ],
  questions: ["Which one point do you most want to remember?", "Which text do you want to talk about tomorrow?"],
  tryThis: "Think about the one point you will share at tomorrow's closing."
};

var CONCLUSION = {
  title: "Closing",
  hooks: ["Which one point from these four weeks will you keep?"],
  sections: [
    { head: "How the closing goes", items: [
      "Everyone shares one point they will keep and one habit they will try to continue.",
      "Thank each other for the month.",
      "Decide together what to read next."
    ]}
  ],
  questions: [
    "What is the one idea from Nectar of Instruction that you will carry forward?",
    "What changed in your daily routine this month?",
    "What should we read together next?"
  ],
  tryThis: "Keep going: pick one of the habits from the book and practise it for the next month."
};

var DAMODARA = {
  title: "Damodarastakam: the prayer we sing in Kartik",
  meanings: [
    "I bow to Damodara, God, whose form is eternal and full of knowledge and joy. He shines in the village of Gokula with His earrings swinging. He broke a pot of butter, ran from the grinding mortar in fear of His mother Yashoda, and she chased and caught Him.",
    "He cries and rubs His eyes again and again with both hands. His eyes are full of fear, and His throat, marked with three lines like a conch shell, shakes with sobs. His belly is tied with a rope, bound by His mother's love.",
    "Through childhood games like these, He fills the cowherd village with joy. He shows those who see Him only as the all-powerful God that He is won by pure love alone.",
    "I do not ask for liberation or for any other blessing. I ask only that Your child form stay always in my heart.",
    "I pray that Your lovely face, framed by curling dark hair and kissed again and again by Mother Yashoda, with lips red like bimba fruit, may stay in my heart. I want nothing else.",
    "I bow to You, Damodara, endless and all-pervading. Please be pleased with me. I am drowning in an ocean of suffering. Shower Your glance of nectar on me and lift me up.",
    "You freed the two sons of Kuvera, who had been bound as trees, and gave them love for You. In the same way, please give me pure love. That is all I want.",
    "I bow to the rope that binds Your belly, which shines brightly and holds the whole universe. I bow to Radhika, who is dear to You. And I bow to You, God of endless pastimes."
  ],
  why: [
    "Damodara means the one with a rope around His belly. It is a name of God from the story of God as a baby and His mother Yashoda.",
    "In the story, Yashoda tried to tie the naughty child to a mortar. Every rope was two fingers too short, until He allowed Himself to be tied out of love for her. It shows that God is bound by love, not by power or wealth.",
    "The prayer is traditionally taken from the Padma Purana, in the section on the glories of the month of Kartik.",
    "In Kartik it is sung every evening while offering a small ghee lamp to God as Damodara. All you need is a small lamp and a picture.",
    "The prayer asks for love, not for comfort or for freedom from this world. That is why it fits the lessons of Nectar of Instruction."
  ]
};

/* Final quiz. The quiz opens on this day number (0 = Mon 26 Oct, 28 = Mon 23 Nov). */
var QUIZ_OPEN_DAY = 28;
var QUIZ = [
  { from: "Text 1", q: "Text 1 lists six urges. Which of these is NOT one of them?", a: "Sleep", w: ["Anger", "Speech", "The tongue"] },
  { from: "Text 1", q: "What does Text 1 say is the key to controlling the tongue, the stomach and the other urges?", a: "Eating only food offered to God, at regular times", w: ["Skipping meals completely", "Eating anything, but in small amounts", "Eating only at restaurants with vegetarian menus"] },
  { from: "Text 2", q: "What is the guiding idea of Text 2?", a: "Plain living and high thinking", w: ["Collecting as much as possible for the future", "Staying silent all day", "Working harder for better things"] },
  { from: "Text 3", q: "Which of these is one of the six helpful principles in Text 3?", a: "Enthusiasm", w: ["Wealth", "Fame", "Staying silent"] },
  { from: "Text 4", q: "Which of these is one of the six exchanges of love in Text 4?", a: "Giving and accepting gifts", w: ["Correcting each other in public", "Competing for the best seat", "Keeping everything to yourself"] },
  { from: "Text 5", q: "For an advanced person who never criticises others, Text 5 says to:", a: "Keep their company and serve them", w: ["Respect them only in the mind", "Avoid them", "Bow to them only on festival days"] },
  { from: "Text 6", q: "In Text 6, what is the Ganges in the rainy season compared to?", a: "A pure spiritual person whose body may look imperfect", w: ["A busy market", "A beautiful temple", "A wealthy ruler"] },
  { from: "Text 7", q: "In Text 7, what sickness makes sweet things taste bitter?", a: "Jaundice", w: ["Malaria", "A common cold", "Typhoid"] },
  { from: "Text 8", q: "What does Text 8 say is the essence of all advice?", a: "Use all twenty-four hours to chant and remember God", w: ["Chant only on Sundays", "Collect as many books as possible", "Give up all work"] },
  { from: "Text 9", q: "Which place does Text 9 describe as the highest of all?", a: "Radha-kunda", w: ["Mathura", "Vrindavan", "Govardhana Hill"] },
  { from: "Text 11", q: "According to Text 11, what does even one bath in Radha-kunda awaken?", a: "Pure love for God", w: ["Great wealth", "A long life", "Fame"] },
  { from: "Damodarastakam", q: "What does the name Damodara mean?", a: "The one with a rope around His belly", w: ["The one who carries a flute", "The lifter of the hill", "The one who sits on a lotus"] }
];
