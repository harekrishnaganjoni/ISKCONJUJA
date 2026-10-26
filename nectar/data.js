/* Plan data. 30 days, Mon 26 Oct to Tue 24 Nov 2026. Every day has its own topic.
   "read" says which text file to use and which part of it to show that day.
   Each part is [where it starts, where it ends], written in lower case with no accents. */
var START = [2026, 9, 26]; // year, month (0 = Jan), day
var MAIN_TIME = "7:00 to 7:30 PM";

function R(n, parts) { return { f: "text-" + n, n: n, parts: parts }; }
function one(a) { return [a, a]; }

var DAYS = [
  /* ---------------- Day 1 ---------------- */
  { kind: "intro", title: "Welcome: a book of simple advice",
    hook: "If you could give a friend just a few pieces of advice for a good life, what would they be?",
    points: [
      "Nectar of Instruction is a small book of eleven short verses, written about 500 years ago by Srila Rupa Gosvami. Srila Prabhupada translated it and explained each verse.",
      "Each verse gives practical advice: how to handle our urges, which habits help or harm us, how to treat different people, and how to keep God in mind through the day.",
      "In Kartik we will read the first eight verses. They are the most useful for daily life.",
      "Every day has one topic. Read it on your own, or come to the centre and read it with us.",
      "Tuesdays and Fridays, " + MAIN_TIME + ", are our main discussion days at the centre. You are welcome any other day too.",
      "It is fine to skim. You do not need to understand everything the first time."
    ],
    qs: ["What do you hope to get from this month of reading?", "What is one habit you would like to improve by the end of Kartik?"],
    tryThis: "Tomorrow's topic is why saying sorry is not enough. Read it tomorrow morning, even just the first few lines." },

  /* ---------------- Text 1: days 2 to 5 ---------------- */
  { kind: "topic", title: "Why saying sorry is not enough",
    hook: "Have you ever promised to stop a bad habit and done it again the same day?",
    read: R(1, [["placed a number of intelligent questions", "easy process is being recommended"]]),
    points: [
      "Text 1 says that a sober person who can tolerate six urges (speech, mind, anger, tongue, stomach and the sexual urge) can guide others anywhere. We will cover them over four days.",
      "A thief knows he can be caught and punished. Yet after jail he steals again. Punishment alone does not change the heart.",
      "An elephant bathes in the river, then throws dirt over itself on the bank. Saying sorry without changing is like that bath.",
      "The same applies to chanting. We cannot chant and then keep doing wrong, thinking the chanting will cancel it out.",
      "Real atonement is waking up our love for God. The way is a regulated, healthy life: avoid illicit sex, meat-eating, intoxication and gambling, and serve God."
    ],
    qs: ["Why does punishment alone not stop a habit?", "What has actually helped you change a habit for good?"],
    tryThis: "Pick one habit you want to stop. Write down what you will do instead." },

  { kind: "topic", title: "Speech, mind and anger",
    hook: "Ever said something you regretted? Who was really in charge?",
    read: R(1, [["first one must control his speaking power", "anger is controlled, however, when utilized"]]),
    points: [
      "Speech: we all love to talk, even about nonsense. A frog croaks and so invites the snake. The cure is not silence. It is using our words to talk about God and good things.",
      "Mind: a restless mind settles when it is fixed on God, the way darkness disappears in sunlight. Trying to empty the mind does not last.",
      "Anger: we cannot switch it off, but we can use it rightly. Be tolerant when we are insulted, but be firm when God or holy people are insulted. Hanuman and Arjuna are the examples."
    ],
    qs: ["What do you talk about most? Could some of it be about something better?", "What do you do when your mind will not settle?", "When is anger right, and when does it do harm?"],
    tryThis: "Today, replace one chat with something uplifting. Share something you read here." },

  { kind: "topic", title: "The tongue, the stomach and the sexual urge",
    hook: "Why is it so hard to stop eating when the food tastes good?",
    read: R(1, [["similarly, the demands of the body can be divided", "chewing the chewed"]]),
    points: [
      "The tongue, the stomach and the sexual urge sit in a line in the body, and the demands begin with the tongue. Control the tongue and the other two follow.",
      "A simple way to control the tongue is to eat only prasada: food offered to God, at regular times.",
      "Eating only for taste, even prasada, still lets the tongue rule. Do not eat too much. Fasting days help us restrain the stomach.",
      "The sexual urge is kept within marriage, for raising children. Dwelling on it in thought and talk also keeps us tied to the senses.",
      "A person who masters these six urges is a master of the senses. Otherwise we are servants of our senses."
    ],
    qs: ["What helps you stop at 'enough'?", "What would eating only prasada look like for you?", "Which of the three is hardest for you? (No need to answer aloud.)"],
    tryThis: "Eat one meal today at a fixed time and stop before you feel stuffed." },

  { kind: "topic", title: "Text 1 in one picture",
    hook: "If you could control only one urge, which would make life easiest?",
    read: R(1, [["in a similar manner, the urges of the genitals", "frustration of material desires produces anger"]]),
    points: [
      "The six urges are speech, mind, anger, tongue, stomach and the sexual urge.",
      "We are not asked to crush them. We use each one for God: speak about Him, fix the mind on Him, use anger for the right cause, eat only prasada.",
      "Thinking we are only the body creates three kinds of demands: to speak, of the mind, and of the body. Practising resistance is called austerity.",
      "Useless talk includes a great deal of what is written and said around the world. Talking about God is the cure.",
      "The mind is shaken by attachment to plans, and by anger when those plans fail."
    ],
    qs: ["Which urge will you work on this week?", "How can this group help each other with it?"],
    tryThis: "Choose one urge and one small action. Tell someone you trust, and report back on Tuesday." },

  /* ---------------- Text 2: days 6 to 9 ---------------- */
  { kind: "topic", title: "Taking more than we need",
    hook: "Birds take a few grains and fly away. People take the whole bag. Why?",
    read: R(2, [["the main problem confronting the conditioned souls", "that is their unfortunate position"]]),
    points: [
      "Text 2 lists six things that spoil devotion. The first two are eating or collecting more than we need, and working too hard for things that are hard to get.",
      "Animals take only what they need. People take far more, and the whole world suffers for it.",
      "The purport says a simple life with a little land and a cow can meet our needs. Our intelligence is meant to help us know God, not to make more things we do not need.",
      "The guiding idea is plain living and high thinking."
    ],
    qs: ["What do you own or chase that goes beyond what you need?", "What would 'enough' look like for you?"],
    tryThis: "Give away or share one thing you do not need." },

  { kind: "topic", title: "Idle talk and the company we keep",
    hook: "How much of your day goes on talking about nothing?",
    read: R(2, [["another impediment is prajalpa", "awaken their dormant"]]),
    points: [
      "The third hindrance is idle talk. The text mentions piles of newspapers, magazines and novels, crosswords, cards and endless debates. These waste valuable time.",
      "If we must talk, we should talk about spiritual life.",
      "The fifth hindrance is spending time with people who have no interest in spiritual life. Business people join clubs and associations to help their business. In the same way we should keep company that helps us grow.",
      "That is the reason for ISKCON: to give people the chance to be with those who have not forgotten God."
    ],
    qs: ["How much time do you spend on chats and social media?", "Whose company helps you grow? How can we spend more time with them?"],
    tryThis: "Take 15 minutes you would spend chatting about nothing and spend it with a friend on something uplifting." },

  { kind: "topic", title: "Rules and greed",
    hook: "Do rules help us, or hold us back?",
    read: R(2, [["karmis labor to accumulate", "impediments on the path"]]),
    points: [
      "Story: a man worked all his life to build a fortune for his sons and grandsons. In his next life he was born in a cobbler's family near the house he built, and his own sons beat him with shoes. We work hard for our children without knowing our own future.",
      "Rules: follow spiritual rules for spiritual progress, not for material gain. Ignoring them is also a mistake. The four basic rules are to avoid illicit sex, meat-eating, gambling and intoxication.",
      "Spending time with people who criticise God and God-loving people is not helpful.",
      "Greed: wanting powers, status or material gain gets in the way."
    ],
    qs: ["Are there rules in your life you follow without knowing why?", "What do you work hardest for? Will it matter in the end?"],
    tryThis: "Write down one rule you keep, and why you keep it." },

  { kind: "topic", title: "Everything belongs to God (Text 2 in one picture)",
    hook: "You find a hundred shillings on the road. What do you do?",
    read: R(2, [["if a hundred-dollar bill", "knowing well to whom they belong"]]),
    points: [
      "Three people find money on the street. One pockets it (dishonest). One leaves it (honest, but does not know its use). The third finds the owner and returns it (honest and wise).",
      "Everything belongs to God. We take what we need and do not take what belongs to others.",
      "Taking more than we need is a kind of theft. The world has enough for everyone to live well.",
      "The six hindrances: taking too much, over-working, idle talk, rule extremes, bad company, and greed."
    ],
    qs: ["Why is returning the money 'wise' and not just 'honest'?", "Which of the six hindrances will you watch this week?"],
    tryThis: "Before you buy something this week, ask: do I need this?" },

  /* ---------------- Text 3: days 10 to 13 ---------------- */
  { kind: "topic", title: "Devotion is action",
    hook: "Is spiritual life about sitting quietly, or about doing something?",
    read: R(3, [["devotional service is not a matter of sentimental speculation", "surrendering oneself fully to the lord"]]),
    points: [
      "Text 3 lists six things that help devotion succeed: enthusiasm, confidence, patience, doing the regular practices, leaving bad company, and following the example of great teachers.",
      "Devotion is practical activity, not daydreaming or feeling. It is like farming: it needs regular work.",
      "Sitting quietly can stop distractions for a while, but devotion also fills life with meaningful service.",
      "The nine processes are hearing, chanting, remembering, serving, worshipping, offering respect, serving as a servant, friendship, and giving ourselves fully."
    ],
    qs: ["Which of the nine do you already do?", "Which one could you add this week?"],
    tryThis: "Do one new practice from the list today." },

  { kind: "topic", title: "Enthusiasm",
    hook: "What gives you energy when you are tired but still want to succeed?",
    read: R(3, [["sravanam, or hearing, is the first step", "practical action in the foreground of spiritual life"]]),
    points: [
      "Hearing comes first. We listen to a person who knows, with humility, with questions and with service.",
      "By good fortune we meet someone who is truly spiritual and listen patiently. The path opens.",
      "A student, a businessperson or an artist needs enthusiasm to succeed. So does spiritual life.",
      "Enthusiasm means putting our energy into serving God, with intelligence. Even a dictaphone, made by someone with no spiritual interest, was used to write books about God. Everything can be put to use in His service."
    ],
    qs: ["Where do you feel enthusiasm in your life right now?", "What modern tool could you use for something spiritual?"],
    tryThis: "Use one tool you already use (phone, WhatsApp, a spreadsheet) for something spiritual today." },

  { kind: "topic", title: "Patience and regular practice",
    hook: "Which is harder: starting something good, or continuing it?",
    read: R(3, [["these activities must be executed with patience", "filled every moment of time"]]),
    points: [
      "Patience: the movement began with one person and no response. Because the work continued, people gradually understood.",
      "A new bride cannot expect a child the day after the wedding. She trusts it will come in time. We need the same patience and confidence in spiritual life.",
      "Confidence means trusting that God will protect us as we do our best.",
      "Regular practices must be kept. The four basic rules (no illicit sex, meat-eating, gambling or intoxication) and daily chanting on beads are examples.",
      "To succeed, we give up the company of people who pull us away, and we live with those who share our goal."
    ],
    qs: ["What helps you keep a routine?", "Which good habit has taken you the longest to build?"],
    tryThis: "Pick a time each day for your chanting or reading, and keep to it all week." },

  { kind: "topic", title: "Confidence and keeping going",
    hook: "What do you do after a setback?",
    read: R(3, [one("if one strictly follows the advice given in this verse"), one("devotional service is so pure and perfect"), one("since all the devotees of the lord are under the protection")]),
    points: [
      "The six principles together make progress certain: enthusiasm, confidence, patience, regular practice, good company and following great teachers.",
      "Devotion is so pure that once started, nothing is lost. Even a little progress protects us from great fear. If someone falls, they begin again where they left off.",
      "Other paths (philosophy, building wealth, strange powers) do not give lasting benefit.",
      "Good qualities grow by themselves in someone who is devoted to God."
    ],
    qs: ["What would you tell a friend who gave up and feels bad about it?", "How can we encourage each other when someone slips?"],
    tryThis: "Send an encouraging message to someone in the group today." },

  /* ---------------- Text 4: days 14 to 16 ---------------- */
  { kind: "topic", title: "Six ways to show love",
    hook: "What is the quickest way to become real friends? Hint: it involves sharing food.",
    read: R(4, [["in this verse srila rupa gosvami explains how to perform devotional activities", "this is called bhunkte bhojayate caiva"]]),
    points: [
      "Text 4 names six things that grow love between people who share a spiritual goal.",
      "Giving gifts, accepting gifts in return, sharing what is in our heart, and asking confidentially about spiritual life.",
      "Eating food offered by others (prasada), and feeding others with prasada.",
      "Two of the six are about food. Sharing food is one of the simplest ways to become close.",
      "An experienced person explains, and the one with less experience learns."
    ],
    qs: ["Which of the six comes easiest for you?", "Which could our group start in Juja?"],
    tryThis: "Invite someone to share a meal with you this week." },

  { kind: "topic", title: "Friendship in everyday life",
    hook: "How do business people close a deal? Usually over a meal.",
    read: R(4, [["even in ordinary social activities", "naturally awakens"]]),
    points: [
      "Even in ordinary life, close friends do the same six things. A businessperson invites a partner to a meal, shares his plans, asks advice and exchanges presents.",
      "The company we keep shapes us. A man is known by his company.",
      "Love for God is already in every heart. Hearing and chanting wake it up. It is not forced from outside.",
      "That is why everyone should be given a chance to hear."
    ],
    qs: ["How has your company shaped you, for better or worse?", "How can we make newcomers feel welcome at the centre?"],
    tryThis: "Invite one friend to a programme at the centre." },

  { kind: "topic", title: "Giving and sharing (Text 4 in one picture)",
    hook: "Do you give anything away regularly, and how do you decide how much?",
    read: R(4, [["the conclusion is that we should always keep company", "fulfill the demands of dadati"]]),
    points: [
      "Keep the company of people who share the goal, follow the rules, follow great teachers and carry out instructions.",
      "A person at the middle level loves God, makes friends with those who love Him, is kind to the ignorant, and avoids those who are envious.",
      "Srila Rupa Gosvami gave half of his earnings to the service of God, a quarter to his family and kept a quarter for emergencies. This is a high standard to aim for. We begin with what we can.",
      "The six exchanges of love are how a community stays close."
    ],
    qs: ["What could you give each month for service?", "How could we help each other with giving?"],
    tryThis: "Decide on one thing to give this week and give it." },

  /* ---------------- Text 5: days 17 to 20 ---------------- */
  { kind: "topic", title: "Three kinds of people and how to treat them",
    hook: "How should we greet a new visitor, an elder and a friend? Should it be the same?",
    read: R(5, [["in order to intelligently apply the sixfold loving reciprocations", "most desirable"]]),
    points: [
      "Text 5 says we should respect people according to their level.",
      "A person who chants God's name: respect them in your mind.",
      "A person who has been formally initiated and is engaged in service: offer a humble bow.",
      "An advanced person whose heart is free of finding fault in others: keep their company and serve them.",
      "The mark of an advanced person is that they do not criticise others."
    ],
    qs: ["Why does the verse stress that the advanced person does not criticise?", "How do you greet someone you respect?"],
    tryThis: "Greet each person at the centre with a smile and their name." },

  { kind: "topic", title: "Where we start",
    hook: "Is it enough to be polite to the deity but ignore the people around us?",
    read: R(5, [["one should not remain a kanistha-adhikari", "envious by nature"]]),
    points: [
      "A beginner often focuses only on worship in the temple, but does not know how to behave towards others. The text says we should not stay there.",
      "The next level: love God, make friends with people who love God, be kind to those who do not know, and keep away from those who are envious by nature.",
      "We all start at the beginning. The aim is to grow."
    ],
    qs: ["What does it look like to be kind to someone who does not know?", "How can we grow past 'just going through the motions'?"],
    tryThis: "Help someone at the centre this week without being asked." },

  { kind: "topic", title: "Respect anyone who chants",
    hook: "Who do you secretly look down on?",
    read: R(5, [["the chanting of the holy names of krsna is so sublime", "failed to chant the holy name of the lord"]]),
    points: [
      "If you hear someone say God's name even once, that person deserves respect. Anyone who likes to chant should be respected, at least in the mind.",
      "The text gives the example of a famous musician who respects God and chants His names. He should be respected.",
      "Chanting carefully, without offences, slowly leads to understanding.",
      "Some who were once great teachers fell, because they stopped chanting."
    ],
    qs: ["Who around you have you not been giving respect to?", "How does regular chanting protect us?"],
    tryThis: "Chant at least one round with full attention today." },

  { kind: "topic", title: "Faith (Text 5 in one picture)",
    hook: "What does it mean to have faith?",
    read: R(5, [["while giving instructions to sanatana gosvami", "basis for advancing in spiritual life"]]),
    points: [
      "Faith is firm, confident trust in the instructions we have received. It is where everything begins.",
      "Faith means accepting the instructions as a whole, not picking and choosing. Arjuna accepted everything he heard.",
      "Our level depends on our faith.",
      "We should know our own position and not imitate people who are more advanced.",
      "Choose a good guide, someone truly advanced."
    ],
    qs: ["What do you have firm faith in?", "Why is it unwise to pick only the parts we like?"],
    tryThis: "Write down one instruction you will follow fully this week." },

  /* ---------------- Text 6: days 21 to 23 ---------------- */
  { kind: "topic", title: "Do not judge by appearances",
    hook: "Have you ever judged someone by how they look or dress? Were you right?",
    read: R(6, [["suddha-bhakti, the activity of the soul proper", "in different ways"]]),
    points: [
      "Text 6 says that a person engaged in pure service to God is above the body, even if the body looks ordinary or imperfect.",
      "Someone who serves God without selfish motives is already free from the pull of material nature.",
      "So we should not look at such a person through the body: family, looks, health or background.",
      "Beginners cannot easily tell who is advanced, so we must be careful in how we judge."
    ],
    qs: ["Have you been judged by your appearance? How did it feel?", "How can we make sure no one at the centre feels judged?"],
    tryThis: "Today, speak to someone you normally would not." },

  { kind: "topic", title: "Overlook the defects",
    hook: "Would you refuse a gift because the wrapper was crumpled?",
    read: R(6, [["no one should criticize the bodily defects of a pure devotee", "not to be considered an ordinary human being"]]),
    points: [
      "No one should criticise the bodily faults of a person who is truly engaged in service. We overlook them.",
      "Look at what matters: that person's service to God.",
      "Someone sincerely devoted to God should be considered good, even if they sometimes slip. Their real identity is service.",
      "The Ganges in the rainy season has foam, bubbles and mud, but it is still pure. People still bathe in it."
    ],
    qs: ["Why is it easy to see faults and hard to see service?", "How can we speak kindly about someone who is not there?"],
    tryThis: "Say one good thing about someone who is not present." },

  { kind: "topic", title: "Status is not by birth (Text 6 in one picture)",
    hook: "Does your family background decide who you are?",
    read: R(6, [one("even though a pure devotee may not be born in a brahmana"), one("if we consider the bodily defects of a vaisnava")]),
    points: [
      "A title like gosvami (master of the senses) is not inherited. It is earned by controlling the senses, whatever our birth.",
      "People with a good title must not become proud. Pride brings a quick fall.",
      "There is no room for jealousy in spiritual life.",
      "Looking for faults in a pure person is a very serious mistake. We take instruction from a more advanced person, and a more advanced person helps those with less."
    ],
    qs: ["Where do you see people judged by birth or position?", "How do we stay free from jealousy?"],
    tryThis: "Congratulate someone on something they have done well." },

  /* ---------------- Text 7: days 24 to 26 ---------------- */
  { kind: "topic", title: "Why chanting can taste bitter",
    hook: "When you are sick, even your favourite food tastes bitter. Could that be happening with chanting?",
    read: R(7, [["the holy name of lord krsna, his quality, pastimes", "he does not accept such instructions"]]),
    points: [
      "Text 7 says that God's name and pastimes are sweet like sugar candy.",
      "Ignorance is like jaundice. Someone with jaundice finds sweet things bitter.",
      "Ignorance makes us forget God, and so we cannot enjoy His name.",
      "People in that condition often refuse advice, but with great care and attention the taste returns."
    ],
    qs: ["What makes chanting feel dull for you?", "What helps you chant with attention?"],
    tryThis: "Chant one round in a quiet place and listen to every word." },

  { kind: "topic", title: "The cure is the sweet itself",
    hook: "What is the medicine for jaundice?",
    read: R(7, [["such people never surrender to krsna, and they oppose", "freed from the blazing fire of material existence"]]),
    points: [
      "For jaundice, sugar candy is the medicine. In the same way, chanting God's name is the remedy for our confusion.",
      "The real disease is in the heart. If the heart is cleansed, material troubles cannot harm us.",
      "Chanting is easy and beneficial. It frees us from the burning fire of material life.",
      "The movement exists to make a setting where people can chant. We begin with faith, and faith grows by chanting."
    ],
    qs: ["What do you notice in yourself when you chant regularly?", "How can we help newcomers start?"],
    tryThis: "Invite a friend to chant with you for five minutes." },

  { kind: "topic", title: "Stages of chanting (Text 7 in one picture)",
    hook: "Does chanting get easier with time?",
    read: R(7, [["there are three stages in chanting the holy name", "will immediately vanish"]]),
    points: [
      "Three stages of chanting: with offences, with fewer offences, and pure. A beginner makes many mistakes. By avoiding the ten offences we reach the next stage.",
      "As we keep going, unwanted habits fall away, attachment grows, and finally we taste real joy in it.",
      "Light and shadow: where the sun is, there is no darkness. Where God is remembered, illusion cannot stay."
    ],
    qs: ["What mistakes do beginners make in chanting?", "What would help you chant every day?"],
    tryThis: "Choose a daily time and number of rounds, and keep it for a week." },

  /* ---------------- Text 8: days 27 to 29 ---------------- */
  { kind: "topic", title: "Train the mind",
    hook: "How do you remember God at work, or on the matatu?",
    read: R(8, [["since the mind may be one's enemy or one's friend", "this is further elucidated by srila rupa gosvami"]]),
    points: [
      "Text 8 gives the essence of all advice: use all twenty-four hours chanting and remembering God's name, form, qualities and pastimes.",
      "The mind can be our friend or our enemy, so we must train it to remember God.",
      "Whatever we remember at the time of death decides what comes next. So we practise remembering God now.",
      "Train the tongue to speak about God and to taste only prasada."
    ],
    qs: ["What small reminders could you set during the day?", "What fills your mind when you are alone?"],
    tryThis: "Set a phone reminder at midday to pause and chant for two minutes." },

  { kind: "topic", title: "Living in the holy land",
    hook: "Where do you feel closest to God?",
    read: R(8, [["krsnam smaran janam casya", "spiritually perfect soul"]]),
    points: [
      "The text advises living in Vrindavan, the holy land, or any part of it, and taking shelter of an advanced person there.",
      "Always remember God and His dear associates, and follow in the footsteps of those who love God deeply.",
      "Serve with feelings like theirs, under their guidance.",
      "This applies at the beginning and at the end of the journey."
    ],
    qs: ["Who is a good example of this for you?", "What could make your home feel like a holy place?"],
    tryThis: "Place a picture of God where you will see it each morning." },

  { kind: "topic", title: "The essence (Text 8 in one picture)",
    hook: "If you could keep just one point from this book, what would it be?",
    read: R(8, [one("srila bhaktisiddhanta sarasvati thakura has commented as follows")]),
    points: [
      "In short: give up selfish motives, train the mind by chanting and remembering, and live under the guidance of someone expert.",
      "The eight texts in a line each: Text 1, control six urges. Text 2, six things that drain us. Text 3, six things that help. Text 4, six ways to show love. Text 5, how to treat different people. Text 6, do not judge by appearances. Text 7, chanting is sweet. Text 8, remember God all day.",
      "The quiz opens today."
    ],
    qs: ["Which text spoke to you most?", "What is the one point you will carry forward?"],
    tryThis: "Take the quiz, and think about the one point you will share tomorrow." },

  /* ---------------- Day 30 ---------------- */
  { kind: "closing", title: "Closing",
    hook: "Which one point from these four weeks will you keep?",
    points: [
      "Everyone shares one point they will keep and one habit they will try to continue.",
      "Thank each other for the month.",
      "Decide together what to read next."
    ],
    qs: ["What is the one idea from Nectar of Instruction that you will carry forward?", "What changed in your daily routine this month?", "What should we read together next?"],
    tryThis: "Keep going: pick one habit from the book and practise it for the next month." }
];

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

/* Final quiz. It opens on this day number (0 = Mon 26 Oct, 28 = Mon 23 Nov). */
var QUIZ_OPEN_DAY = 28;
var QUIZ = [
  { from: "Text 1", q: "Text 1 lists six urges. Which of these is NOT one of them?", a: "Sleep", w: ["Anger", "Speech", "The tongue"] },
  { from: "Text 1", q: "What does Text 1 say is the key to controlling the tongue, the stomach and the other urges?", a: "Eating only food offered to God, at regular times", w: ["Skipping meals completely", "Eating anything, but in small amounts", "Eating only at restaurants with vegetarian menus"] },
  { from: "Text 1", q: "What does the story of the elephant that bathes and then throws dirt on itself teach?", a: "Saying sorry without changing does not clean us", w: ["Elephants should stay away from rivers", "Cleanliness is not important", "We should bathe only once a day"] },
  { from: "Text 2", q: "What is the guiding idea of Text 2?", a: "Plain living and high thinking", w: ["Collecting as much as possible for the future", "Staying silent all day", "Working harder for better things"] },
  { from: "Text 3", q: "Which of these is one of the six helpful principles in Text 3?", a: "Enthusiasm", w: ["Wealth", "Fame", "Staying silent"] },
  { from: "Text 4", q: "Which of these is one of the six exchanges of love in Text 4?", a: "Giving and accepting gifts", w: ["Correcting each other in public", "Competing for the best seat", "Keeping everything to yourself"] },
  { from: "Text 5", q: "For an advanced person who never criticises others, Text 5 says to:", a: "Keep their company and serve them", w: ["Respect them only in the mind", "Avoid them", "Bow to them only on festival days"] },
  { from: "Text 6", q: "In Text 6, what is the Ganges in the rainy season compared to?", a: "A pure spiritual person whose body may look imperfect", w: ["A busy market", "A beautiful temple", "A wealthy ruler"] },
  { from: "Text 7", q: "In Text 7, what sickness makes sweet things taste bitter?", a: "Jaundice", w: ["Malaria", "A common cold", "Typhoid"] },
  { from: "Text 8", q: "What does Text 8 say is the essence of all advice?", a: "Use all twenty-four hours to chant and remember God", w: ["Chant only on Sundays", "Collect as many books as possible", "Give up all work"] },
  { from: "Text 8", q: "In Text 8, the mind is described as:", a: "Either our friend or our enemy", w: ["Always our enemy", "Always our friend", "Not important"] },
  { from: "Damodarastakam", q: "What does the name Damodara mean?", a: "The one with a rope around His belly", w: ["The one who carries a flute", "The lifter of the hill", "The one who sits on a lotus"] }
];
