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
      "Nectar of Instruction is a small book of eleven short verses by Srila Rupa Gosvami. Srila Prabhupada translated each verse and explained it.",
      "Each verse gives practical advice: how to handle our urges, which habits help or harm us, how to treat different people, and how to keep God in mind through the day.",
      "In Kartik we will read the first eight verses, which are the most suitable for beginners.",
      "Every day has one topic. Read it on your own, or come to the centre and read it with us.",
      "Tuesdays and Fridays, " + MAIN_TIME + ", are our main discussion days at the centre. You are welcome any other day too.",
      "It is fine to skim. You do not need to understand everything the first time."
    ],
    qs: ["What do you hope to get from this month of reading?", "What is one habit you would like to improve by the end of Kartik?"],
    tryThis: "Tomorrow's topic is why saying sorry is not enough. Read it tomorrow morning, even just the first few lines." },

  /* ---------------- Text 1: days 2 to 4 (day 5 became movie day, Fri 30 Oct) ---------------- */
  { kind: "topic", title: "Why saying sorry is not enough",
    hook: "Have you ever promised to stop a bad habit and done it again the same day?",
    read: R(1, [["placed a number of intelligent questions", "easy process is being recommended"]]),
    points: [
      "Text 1 says that a sober person who can tolerate six urges (speech, mind, anger, tongue, stomach and the sexual urge) is qualified to make disciples all over the world. We will cover them over the next days.",
      "A thief knows he can be caught and punished. Yet after jail he steals again. Punishment alone does not change the heart.",
      "An elephant bathes in the river, then throws dirt over itself on the bank. Saying sorry without changing is like that bath.",
      "The same applies to chanting. We cannot chant and then keep doing wrong, thinking the chanting will cancel it out.",
      "Real atonement is awakening our dormant God consciousness. The way is a regulated, healthy life: avoid illicit sex, meat-eating, intoxication and gambling, and serve God under the guidance of a genuine teacher."
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

  { kind: "special", title: "Movie day: Lord Narasimha and little Prahlada",
    hook: "How do you stay true to what you believe when everyone around you, even your own family, is against it?",
    points: [
      "Today we watch Mahavatar Narsimha together. Films add scenes and drama, so remember the real source of this story is the Srimad-Bhagavatam, Seventh Canto. Here is the story in short.",
      "The story: a king named Hiranyakashipu was very powerful and very proud. His brother had been killed, and he was angry at God. He did hard penance and asked for a gift that would make him unbeatable: he could not be killed by man or animal, indoors or outdoors, by day or night, on land or in the sky, or by any weapon. Feeling safe, he began to rule cruelly and told everyone to worship him instead of God.",
      "His own little son Prahlada, only five years old, loved God with his whole heart. He had learned about God even before he was born. He told his friends at school: be happy now, chant, love God. Do not wait until you are old.",
      "Hiranyakashipu tried everything to change his son: threats, then punishments, then trying to have him killed (by elephants, snakes, poison and fire). Prahlada stayed calm and kept remembering God, and nothing harmed him.",
      "One day Hiranyakashipu asked, 'Where is this God of yours?' Prahlada answered, 'He is everywhere.' 'Even in this pillar?' Hiranyakashipu laughed and smashed the pillar. Out came Lord Narasimha, half lion and half man, who is neither a man nor an animal. It was twilight, which is neither day nor night. He placed the king on his lap at the doorway, which is neither inside nor outside, and ended him with his claws, which are not a weapon. Every condition of the gift was kept and still the king could not escape.",
      "Even then Narasimha's anger was so great that nobody dared come near, not even the goddess Lakshmi. Then little Prahlada walked up fearlessly and offered a prayer. The Lord became gentle like a mother cow licking her newborn calf, and told Prahlada to ask for anything.",
      "Prahlada did not ask for anything for himself. He said that asking God for things is like doing business. He only prayed that his father be forgiven, and that he could keep serving God.",
      "Main points: (1) God is everywhere, and He keeps His promise to protect His devotees. (2) Power, wealth and cleverness cannot beat God. (3) Faith does not depend on age, education or what others say. (4) Real love for God asks for nothing in return. (5) God is fierce to those who torment the innocent, and tender to those who love Him.",
      "Link to Text 1 (where we have been the last few days): Hiranyakashipu never had enough. His desires and anger ruled him. Prahlada was calm, because his mind was fixed on God. That is exactly what Text 1 says: the one who masters the urges is the master, and the one ruled by them is their servant."
    ],
    qs: ["What did Prahlada do to stay strong when his father was against him?", "Why do you think Hiranyakashipu's clever plan failed?", "Where in your life do you need a little of Prahlada's courage?", "What would you ask God for, and what does Prahlada's answer teach you?"],
    tryThis: "Tell one person the story of Prahlada in your own words. Then choose one small way to stay steady this week, like starting your chanting at the same time every day." },

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
      "Staying close to people who blaspheme the Vaishnavas (the God-loving people) is not helpful.",
      "Greed: wanting mystic powers, merging into the formless, or material prosperity gets in the way."
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
      "Devotion is practical activity, not sentimental speculation or imagined ecstasy. It is a kind of cultivation, and cultivation means activity.",
      "Sitting quietly can stop nonsense activities for a while, but devotion also fills life with meaningful service.",
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
      "Srila Rupa Gosvami gave half of his earnings to the service of God, a quarter to his relatives and kept a quarter for emergencies. The text says that, whatever one's income, half should be spent on the service of God and of those who serve Him.",
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
      "A person who has been formally initiated and is engaged in worshipping the Deity: offer humble obeisances.",
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
    read: R(5, [["while giving instructions to sanatana gosvami", "careful to accept an uttama-adhikari"]]),
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
      "The text says only someone who is truly devoted can see another such person properly. A beginner cannot easily tell."
    ],
    qs: ["Have you been judged by your appearance? How did it feel?", "How can we make sure no one at the centre feels judged?"],
    tryThis: "Today, speak to someone you normally would not." },

  { kind: "topic", title: "Overlook the defects",
    hook: "Would you refuse a gift because the wrapper was crumpled?",
    read: R(6, [["no one should criticize the bodily defects of a pure devotee", "not to be considered an ordinary human being"]]),
    points: [
      "No one should criticise the bodily faults of a person who is truly engaged in service. We overlook them.",
      "Look at what matters: that person's service to God.",
      "Even if such a person sometimes seems to act badly, the text says to consider them a saintly person, because their real identity is service to God.",
      "The Ganges in the rainy season has foam, bubbles and mud, but it is still pure. People still bathe in it."
    ],
    qs: ["Why is it easy to see faults and hard to see service?", "How can we speak kindly about someone who is not there?"],
    tryThis: "Say one good thing about someone who is not present." },

  { kind: "topic", title: "Status is not by birth (Text 6 in one picture)",
    hook: "Does your family background decide who you are?",
    read: R(6, [["even though a pure devotee may not be born in a brahmana", "as soon as anyone becomes envious"], one("if we consider the bodily defects of a vaisnava")]),
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
      "The movement exists to make a setting where people can chant."
    ],
    qs: ["What do you notice in yourself when you chant regularly?", "How can we help newcomers start?"],
    tryThis: "Invite a friend to chant with you for five minutes." },

  { kind: "topic", title: "Stages of chanting (Text 7 in one picture)",
    hook: "Does chanting get easier with time?",
    read: R(7, [["there are three stages in chanting the holy name", "will immediately vanish"]]),
    points: [
      "Three stages of chanting: with offences, with fewer offences, and pure. A beginner makes many mistakes. By avoiding the ten offences we reach the next stage.",
      "One must begin with faith, and faith increases by chanting.",
      "As we keep going, unwanted habits fall away, we become attached to devotional activities, and we begin to experience joy in them.",
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
      "Train the tongue to speak about God and to taste only prasada.",
      "The text also advises living in Vrindavan, or any part of it, and taking shelter of an advanced person there."
    ],
    qs: ["What small reminders could you set during the day?", "What fills your mind when you are alone?"],
    tryThis: "Set a phone reminder at midday to pause and chant for two minutes." },

  { kind: "topic", title: "Living in the holy land",
    hook: "Where do you feel closest to God?",
    read: R(8, [["krsnam smaran janam casya", "spiritually perfect soul"]]),
    points: [
      "Rupa Gosvami's verse: always live in the land of Vraja (Vrindavan) and keep remembering God and His dear associates.",
      "Follow in the footsteps of those associates, under their guidance, and an intense desire to serve God can grow.",
      "Serve with a feeling similar to theirs. This applies both while we are still practising and when we have reached perfection."
    ],
    qs: ["Who is a good example of this for you?", "What could make your home feel like a holy place?"],
    tryThis: "Place a picture of God where you will see it each morning." },

  { kind: "topic", title: "The essence (Text 8 in one picture)",
    hook: "If you could keep just one point from this book, what would it be?",
    read: R(8, [["srila bhaktisiddhanta sarasvati thakura has commented as follows", "this is the essence of all instruction"]]),
    points: [
      "In short, the commentary says: give up selfish motives, train the mind by chanting and remembering, and pass our time remembering God under the direction of an expert guide.",
      "It also describes stages of growth: hearing, then becoming attached to hearing, then remembering, and finally understanding our eternal relationship with God.",
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
    "Verse 1: We bow to God as Damodara, whose form is eternal, full of knowledge and joy. As a child in Gokula He breaks a pot of yogurt, runs from the grinding mortar in fear of His mother Yasoda, and she runs after Him and catches Him.",
    "Verse 2: Seeing the stick in His mother's hand, He cries and rubs His eyes again and again. His eyes are full of fear and His necklace shakes with His quick breathing. His belly is bound not with ropes only, but with His mother's pure love.",
    "Verse 3: By such childhood games He drowns the people of Gokula in joy. He shows those who see Him only as the all-powerful God that He is conquered only by pure love that is close and free from awe.",
    "Verse 4: We do not ask for liberation, or for Vaikuntha, or for any other blessing. We ask only that God's child form in Vrindavana stays always in our heart.",
    "Verse 5: We ask that His lovely face, framed by soft dark hair and kissed again and again by Yasoda, stay in our heart. Thousands of other blessings are of no use.",
    "Verse 6: We bow to Him and pray for mercy, as we are poor, ignorant and drowning in an ocean of sorrow. We ask Him to rescue us and become visible to our eyes.",
    "Verse 7: As He freed the two sons of Kuvera, Manigriva and Nalakuvara, and gave them love for Him, we ask Him to give us His own loving devotion. We have no desire for liberation.",
    "Verse 8: We bow to the bright rope that binds His belly, to His belly which is the abode of the whole universe, to His beloved Srimati Radharani, and to God who shows endless pastimes."
  ],
  why: [
    "The prayer is found in the Padma Purana. It was spoken by Satyavrata Muni to Narada Muni and Saunaka Rishi.",
    "The Hari-bhakti-vilasa says that in the month of Kartika one should worship Lord Damodara and recite this prayer daily. That is why we sing it every day of this plan.",
    "Verse 2 tells us that God's belly is bound not just by rope, but by His mother's pure love. He is won by love, not by power or wealth.",
    "The prayer asks for love for God, not for comfort or for freedom from this world. That is why it fits the lessons of Nectar of Instruction."
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
  { from: "Damodarastakam", q: "In verse 2 of the Damodarastakam, what binds God's belly?", a: "His mother's pure love", w: ["Golden chains", "A promise to the sages", "His own fear"] }
];

/* Real-life examples (every day) and what research says (some days).
   Examples are everyday pictures, not stories about real people. */
var EXTRA = [
  /* 1 */ { ex: ["A new appliance comes with a short manual. Read it and the machine works for years; ignore it and it breaks early. This book is the short manual for the machine we use every day: ourselves."] },
  /* 2 */ { ex: [
    "Imagine someone steps on your foot and says sorry, then steps on it again, and again, with a sorry each time. You would only believe him when he takes his foot away.",
    "Someone who eats on time, washes his hands and sleeps well does not keep falling sick, so he does not need to keep apologising to his body. A regulated life is what changes things. The text compares real atonement to a regulated, healthy way of living."] },
  /* 3 */ { ex: [
    "Speech: A person who just goes silent to stop gossiping drifts back within a week. The one who starts telling the group one good thing he learned each day finds gossip has no room left.",
    "Mind: Try not to think of a song and it plays louder. Put on a different song and the first one fades. The mind settles when it has something better to hold.",
    "Anger: A teacher stays calm when a student is rude to him. He acts firmly when the student bullies a younger child or mocks something holy."],
    sci: [
      "Mind: In a famous 1987 study by Daniel Wegner, people told not to think of a white bear thought of it about once a minute anyway, and more once the instruction ended. Researchers suggest that giving the mind something absorbing to focus on works better than pushing a thought away (American Psychological Association summary).",
      "Anger: In a 2002 study of 600 students by Brad Bushman, those who hit a punching bag while thinking about the person who upset them became angrier and more aggressive. Doing nothing at all calmed people more than venting did. Letting anger out is not the same as using it well."] },
  /* 4 */ { ex: [
    "Three goats are tied in a line to one rope. Hold the front one firmly and the other two cannot run. The tongue is the front one, so when it is controlled, the rest are easier to control.",
    "A family that eats at fixed times, with the food offered first, does not wander to the stall all day. The tongue is trained at the table.",
    "A person who fasts one day a week finds hunger rules the other six days less. Fasting days teach the stomach to wait."],
    sci: [
      "Hunger spills over into other desires. In a 2019 study of 50 university students, going about 10 hours without food made them choose rewards now over bigger rewards later, for money as well as for food (Skrynka and Vincent). It was a small study, and the choices were hypothetical.",
      "Control in one area can help in others. In a 2006 study by Oaten and Cheng, after two months of a regular exercise programme, people reported less smoking, alcohol and caffeine, healthier eating, and better study habits and spending control.",
      "A fair note: a 2017 review of 33 studies (Friese and colleagues) found that training self-control helps a little (an average effect of about 0.3, and smaller after correcting for bias), but it could not confirm that the benefit spreads to everything. So research supports the idea in part. The text's claim goes further, and we hold it as teaching, not as a proven law."] },
  /* 5 */ { ex: [
    "A matatu with six noisy passengers all shouting directions. The master of the senses is the driver, who hears them all and still decides the route.",
    "The same water that floods a field can be channelled to irrigate it. We do not crush the six urges, we point them at the right use: speech for good talk, anger for the right cause, the tongue for offered food.",
    "Being able to say enough to a second plate is a small version of being master of the senses."] },
  /* 6 */ { ex: [
    "Think of a harvest. The farms grew enough, but a few buyers store the maize and release it slowly, so the shortage shows up in the market. The text says the world has enough for everyone, and scarcity is often made by taking more than we need.",
    "A family with a small plot and a cow feeds itself, and sells the extra milk. That is plain living and high thinking: needs met, mind free for higher things.",
    "A bird takes a few grains and flies off. We can learn to take what we need and leave the rest for others."],
    sci: ["In 2011 the UN food agency (FAO) estimated that roughly one third of the food produced in the world for people each year, about 1.3 billion tonnes, is lost or wasted. So shortages are not only about too little being grown. This is our reading of the figure. FAO's report does not say who holds the food."] },
  /* 7 */ { ex: [
    "Talking about a movie with friends is fine. A little relaxation is normal, and only excess is the problem. The trouble starts when it fills every evening. The cure is not to ban it, but to make room for better talk too: one evening a week sharing something we learned.",
    "Farmers join a cooperative to learn from other farmers, and traders join the chamber of commerce. In the same way we sit with people who are serious about spiritual life, because progress is normal there."] },
  /* 8 */ { ex: [
    "Rules for progress: A runner follows his training plan because it makes him faster, not to impress anyone, and he does not skip it when nobody is watching.",
    "Preparing for what is next: Before travelling abroad you learn the language. You prepare for where you are going, not only where you are now. The man who built a fortune for his sons did not prepare for his own next step.",
    "Company: A student serious about exams sits with people who study, not with those who laugh at studying.",
    "Greed: Someone who is content with enough spends his savings on school fees and has peace. The one chasing more has none."] },
  /* 9 */ { ex: [
    "You find KSh 1,000 outside a shop. The third person asks the shopkeeper whose it is and returns it. He is both honest and wise.",
    "A tenant looks after a rented house as the landlord's property: uses it, keeps it clean, does not sell the doors.",
    "At a wedding feast every guest gets a plate. You eat what you need, trusting the hosts prepared enough for all."] },
  /* 10 */ { ex: [
    "Someone who wants to learn the guitar does not only admire guitars. He picks one up and practises daily.",
    "Quiet sitting can clear the weeds, but then you must plant. Meditation stops the nonsense, and devotion adds meaningful activity.",
    "A friendship is kept alive by calling, visiting, listening, helping and sharing. There are nine processes in devotion, so start with one."] },
  /* 11 */ { ex: [
    "A learner approaches a good mechanic humbly, asks questions and helps in the garage. That is how real knowledge is received.",
    "An artist practises before sunrise because he loves it. Spiritual life needs the same eagerness.",
    "A phone made for calls and games can also carry the daily reading to the whole group."] },
  /* 12 */ { ex: [
    "A farmer plants beans and does not dig them up every morning to check. Patience and confidence go together.",
    "A swimmer lets the water hold him because he trusts it. We do our part and trust God to do His.",
    "Brushing teeth works because it is daily, not once a month. The same goes for our regular practices.",
    "An athlete trains with athletes. We give up the company that pulls us away and live with those who share our goal."],
    sci: ["In a 2010 study by Phillippa Lally and colleagues at University College London, 96 university students each picked a new daily habit, and 82 finished. On average it took 66 days to feel automatic, and it ranged from 18 to 254 days for different people. Missing a single day made little difference, but missing many days did."] },
  /* 13 */ { ex: [
    "A student who left school and returns later resumes where he stopped, not from the first class. Devotion is never lost.",
    "Even a little swimming practice can save you in deep water. A little progress here protects us from great fear.",
    "Water the roots of a tree and the leaves look after themselves. Good qualities grow by themselves in someone devoted to God."] },
  /* 14 */ { ex: [
    "Nobody becomes close to someone he never eats with. Sharing food is the quickest way to friendship.",
    "A neighbour sends a plate of food, and the plate comes back with something in it. Giving and accepting keeps friendship moving.",
    "Telling a trusted elder your struggle and asking what he did is how confidence between people grows."],
    sci: ["A 2017 Oxford study led by Robin Dunbar found that the more often people eat with others, the more likely they are to feel happy and satisfied with their lives, and they tend to have wider networks of support. This shows a link, not proof that meals cause it."] },
  /* 15 */ { ex: [
    "Business partners settle their plans over lunch. Friends share meals, plans and advice.",
    "A new member of a choir starts singing, and a new member of a football club starts playing. The company we keep shapes us.",
    "A mother's voice wakes a sleeping child. The love was already there, and the voice brings it out. Hearing and chanting do the same for the heart."],
    sci: ["A 2007 study by Christakis and Fowler followed 12,067 people from 1971 to 2003. A person's chance of becoming obese rose by 57% if a close friend became obese. The effect was not seen among neighbours. It shows a link between friends, not proof of cause."] },
  /* 16 */ { ex: [
    "A harambee works because everyone gives what they can. Small gifts become a school.",
    "A family decides at the start of the month: half to the main goal, a quarter to relatives, a quarter for emergencies. This is the pattern Rupa Gosvami followed.",
    "A good teacher loves his work, befriends other teachers, is patient with weak pupils and keeps away from those who envy him. That is the middle level the text describes."],
    sci: ["A 2008 study by Elizabeth Dunn, Lara Aknin and Michael Norton found that people who spent a larger share of their money on others were happier. In an experiment, people who were assigned to spend on others felt happier than those assigned to spend on themselves, and even about 5 US dollars made a difference."] },
  /* 17 */ { ex: [
    "A new apprentice greets everyone in the workshop. He shows more respect to the one who has finished his training, and learns most from the master who is free of jealousy. Respect fits the level.",
    "Greeting a stranger with a nod and a kind thought is respect in the mind.",
    "Standing when a teacher enters is a humble bow.",
    "Choosing a mentor: pick the one who builds people up, not the one who tears others down."] },
  /* 18 */ { ex: [
    "A first-year student only attends lectures. By third year he helps newcomers, joins study groups and is gentle with those who struggle. That is growth.",
    "An experienced gardener also helps his neighbours and keeps pests away, not only his own plant.",
    "Staying clear of people who only criticise protects our peace as we grow."] },
  /* 19 */ { ex: [
    "A neighbour says a kind word about our teacher. We thank him and do not question his habits.",
    "Brushing teeth slowly every day keeps them clean. Chanting without offences, daily, slowly clears the heart.",
    "A champion who stops training loses his form. The text says some great preachers fell after they stopped chanting."] },
  /* 20 */ { ex: [
    "A patient finishes the whole course of medicine, not only the pills he likes. Faith means following the whole instruction.",
    "A learner driver does not copy a racing driver's moves. We know our own level and do not imitate those more advanced.",
    "We choose a driving instructor with years of safe driving, and in the same way we choose a spiritual guide who is truly advanced.",
    "A passenger boards a bus trusting the driver and the route. Faith is firm trust in what we are told."] },
  /* 21 */ { ex: [
    "A crumpled, torn note still buys the same as a new one. Its value is not in the paper.",
    "Only a musician can recognise a real musician. A beginner cannot tell, so we hold back from judging.",
    "Rainy-season river water looks muddy on top, yet people still bathe in it. The Ganges is not polluted by foam."] },
  /* 22 */ { ex: [
    "A teacher with a stammer who teaches well. We listen to what he teaches, not how it sounds.",
    "A mango with a bruised skin can be the sweetest in the bag.",
    "A gift in a crumpled wrapper is still a gift. We look at the service, not the surface."] },
  /* 23 */ { ex: [
    "A doctor's title is earned by study. It cannot be inherited from a parent.",
    "A newly promoted manager remembers he is still a colleague. Titles that lead to pride lead to a fall.",
    "In a choir, when one voice shines the others are glad, because the song is better.",
    "A senior student coaches the juniors, and the juniors listen. The more advanced helps the less advanced."] },
  /* 24 */ { ex: [
    "When you have a fever, even your favourite food tastes bitter. The food did not change, we did.",
    "Many people find coffee bitter at first and love it later. Taste can be developed.",
    "You keep taking the medicine before you feel better. With care and attention the taste returns."] },
  /* 25 */ { ex: [
    "When you are dehydrated, the rehydration drink is the last thing you want and exactly what helps. The remedy is what we resist.",
    "Wipe the dust off a mirror and you see clearly. Chanting cleans the heart in the same way.",
    "If the wiring is faulty, changing the bulb does not help. The real disease is in the heart, not in outside things."] },
  /* 26 */ { ex: [
    "Learning to drive: first you stall and make many mistakes, then fewer, then it is smooth. Chanting goes through the same three stages.",
    "Mopping a muddy floor: first mud everywhere, then less, then clean. Offences lessen as we keep going.",
    "Switch on a lamp and the darkness leaves at once. Remembering God does the same for illusion.",
    "A new shop earns trust by being used again and again. Faith grows by chanting."] },
  /* 27 */ { ex: [
    "A trained guard dog protects the home. An untrained one chases the neighbours' chickens. The mind, trained, becomes a friend.",
    "The last thing you read before sleep follows you into dreams. Imagine the last thought of life. That is why we practise remembering God now.",
    "A person who speaks kindly all day finds kind thoughts come first. Train the tongue and the mind follows."],
    sci: ["In a 2010 study by Matthew Killingsworth and Daniel Gilbert, a phone app contacted 2,250 volunteers at random times. People's minds were on something other than what they were doing 46.9 percent of the time, and they were less happy when their minds wandered."] },
  /* 28 */ { ex: [
    "An apprentice learns carpentry by serving a master carpenter in his workshop and copying how he works.",
    "A trainee chef copies the head chef's feeling for food as well as his steps. We follow the feeling of those who love God.",
    "A student who moves next to the library studies more without trying. Where good habits are normal, they are easier to keep."] },
  /* 29 */ { ex: [
    "A mother packing a child for boarding school gives only the essentials and one line of advice. Text 8 is that one line.",
    "A learner driver practises with an instructor beside him. That is how we train the mind under expert guidance.",
    "Learning to swim goes in stages: watching, wading, swimming, diving. Spiritual growth goes through hearing, becoming attached, remembering and understanding."] },
  /* 30 */ { ex: [
    "At the end of a course, what you carry home is not the notes but the habit you now practise.",
    "A seed planted this month needs watering. Keep one habit going."] }
];
EXTRA.forEach(function (x, i) { if (DAYS[i]) { DAYS[i].examples = x.ex; if (x.sci) DAYS[i].science = x.sci; } });
