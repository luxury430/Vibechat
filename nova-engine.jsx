import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
//   NOVA ENGINE v3.0 — NLP Brain + GK Knowledge Base
//   GK Source: SSC SmartBook 4000 Q Bank (Testbook × S.Chand)
//   Topics: Ancient History · Medieval · Modern · Geography ·
//            Polity · Economics · Physics · Chemistry · Biology
//   Algorithms: TF-IDF · TextRank · Levenshtein · Porter Stemmer
//               Keyword Overlap · Context Memory · GK Search
// ═══════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
//  GK KNOWLEDGE BASE — Extracted from SSC SmartBook PDF
//  Format: { k: "keywords", a: "answer", f: "fact", t: "topic" }
// ════════════════════════════════════════════════════════
const GK_KB = [
  // ── ANCIENT HISTORY ──
  { k:"which veda sama veda knowledge incorrectly matched", a:"Sama-Veda = Knowledge of Science is INCORRECT", f:"Sama-Veda is Knowledge of melodies and chants (not science). Atharva-Veda = magic formulas, Rig Veda = hymns of praise, Yajur-Veda = sacrificial formulas.", t:"Ancient History" },
  { k:"mohenjo daro lies bank which river", a:"Indus river", f:"Mohenjo-Daro lies on the bank of the Indus river in Larkana district, Sindh, Pakistan. Discovered by R.D. Banerji in 1922. UNESCO World Heritage Site since 1980.", t:"Ancient History" },
  { k:"mohenjo daro meaning word", a:"Mound of the dead", f:"Mohenjo-Daro means 'Mound of the Dead Men' in Sindhi. It is the largest city of Indus Valley Civilization.", t:"Ancient History" },
  { k:"ancient poet wrote abhijnanashakuntalam", a:"Kalidasa", f:"Kalidasa is the greatest classical Sanskrit poet and dramatist of ancient India. Works include Abhijnana-Sakuntala, Raghuvamsa, Meghaduta, Malavikagnimitra, Kumarasambhava.", t:"Ancient History" },
  { k:"ancient sanskrit text medicine surgery", a:"Sushruta Samhita", f:"Sushruta Samhita is an ancient Sanskrit text on medicine and surgery. It is one of the two basic Hindu texts on medical domain. Sushruta was the first Indian surgeon.", t:"Ancient History" },
  { k:"vipas rigvedic name river", a:"Beas", f:"Vipas is the Rigvedic name of Beas river. Chenab=Askini, Ravi=Purushni, Jhelum=Vitasta, Beas=Vipas, Sutlej=Sutudri.", t:"Ancient History" },
  { k:"birth place birthplace lord gautam buddha", a:"Lumbini", f:"Siddhartha Gautama was born in 623 BC (also said 563 BC) in the gardens of Lumbini, Nepal. Emperor Ashoka erected a commemorative pillar there.", t:"Ancient History" },
  { k:"who wrote book indica", a:"Megasthenes", f:"Indica was written by Megasthenes, the Greek ambassador of Seleucus I Nicator sent to the court of Chandragupta Maurya. The book provides details about Mauryan administration.", t:"Ancient History" },
  { k:"vedic religion also known", a:"Brahmanism", f:"Vedic religion was also known as Brahmanism, a form of Hinduism revolving around ritual ideologies presented by the Vedas.", t:"Ancient History" },
  { k:"harappa unearthed 1921 montgomery district banks river ravi", a:"Harappa", f:"Harappa was excavated by Rai Bahadur Daya Ram Sahni in 1921 in Montgomery district on banks of river Ravi.", t:"Ancient History" },
  { k:"chandragupta i succeeded son", a:"Samudragupta", f:"Chandragupta I was succeeded by Samudragupta (335-380 AD), the greatest king of the Gupta dynasty, also called Napoleon of India by V.A. Smith.", t:"Ancient History" },
  { k:"mricchakatika written by", a:"Sudraka", f:"The Mricchakatika (The little clay cart) is written by Sudraka (248 AD). It presents a remarkable social drama.", t:"Ancient History" },
  { k:"gayatri mantra created composed by whom", a:"Vishvamitra", f:"Gayatri Mantra was created by Vishvamitra. It is a prayer for spiritual stimulation addressed to the Sun, taken from the third Mandala of Rig Veda.", t:"Ancient History" },
  { k:"that gautam buddha born lumbini confirmed whose inscription", a:"Ashoka", f:"Ashoka's pillar inscription in 249 BC confirms that Lord Buddha was born in 623 BC in the sacred area of Lumbini in Nepal.", t:"Ancient History" },
  { k:"who wrote kitab ul hind", a:"Al-Biruni", f:"Al-Biruni (Abu Rayhan al-Biruni) wrote Kitab-ul-Hind. He is called Founder of Indology, Father of Comparative Religion. He came to India with Mahmud of Ghazni in 1017.", t:"Ancient History" },
  { k:"vedic name ravi river", a:"Parushini (Purushni)", f:"The Vedic name of Ravi river is Parushni/Purushni. Rigveda mentions 7 rivers as Sapta-Sindhu.", t:"Ancient History" },
  { k:"sole example proto historical phase indian subcontinent", a:"Indus Valley Civilization", f:"Indus Valley Civilization is the sole example of Proto-Historical Phase in India. Scripts exist but are not yet deciphered.", t:"Ancient History" },
  { k:"author book ashtadhyayi", a:"Panini", f:"Ashtadhyayi (Eight Chapters) is a Sanskrit grammar treatise by Panini (6th-5th century BCE). It set linguistic standards for Classical Sanskrit in 4000 sutras.", t:"Ancient History" },
  { k:"nachiketa mentioned", a:"Kathopanishad", f:"Nachiketa is mentioned in the Kathopanishad, which is a conversation between Yama (lord of death) and Nachiketa (young boy) about the meaning of death.", t:"Ancient History" },
  { k:"vedic civilisation india flourished river", a:"Saraswati river", f:"Vedic Civilization flourished along the river Saraswati. Rigveda Book 6 has 'Nadistuti Sukta' praising Saraswati as the 'perfect mother, unsurpassed river'.", t:"Ancient History" },
  { k:"vedic period society divided classes varnas", a:"Four (4) classes called Varnas", f:"Vedic society was divided into 4 Varnas: Brahmins (priests), Kshatriyas (warriors), Vaishyas (merchants/farmers), Shudras (laborers). Mentioned in Purusa Sukta of Rigveda.", t:"Ancient History" },
  { k:"first ruler magadha mahajanapadas sixth century bc", a:"Bimbisara", f:"Bimbisara (558-491 BC) of Haryanaka dynasty was the first ruler of Magadha (543-492 BC). He founded Magadha by uniting tribes and territories.", t:"Ancient History" },
  { k:"important gods early vedic period", a:"Agni, Indra, Soma", f:"Agni (fire/second most important), Indra (rain god/king of gods), Soma (plant deity/king of plants) were the most important gods of the early Vedic period.", t:"Ancient History" },
  { k:"two assemblies early vedic period", a:"Samiti and Sabha", f:"Two assemblies in Early Vedic period: Sabha (dancing, gambling, judicial, administrative) and Samiti (folk assembly for tribal business). Women attended Sabha as Sabhavati.", t:"Ancient History" },
  { k:"yajur in yajur veda mean", a:"Sacrifice/Worship", f:"Yajur means 'worship' or 'sacrifice' in Sanskrit. Yajur Veda = 'Knowledge of the Sacrifice'. It contains mantras for Yajna or sacrificial rituals.", t:"Ancient History" },
  { k:"oldest veda", a:"Rigveda", f:"Rigveda is the oldest of all four Vedas and one of the oldest extant texts in any Indo-European language. It contains 1028 hymns and 10,600 verses in 10 mandalas.", t:"Ancient History" },
  { k:"total hymns rig veda", a:"1028 hymns", f:"There are total 1028 hymns in Rig Veda, organized into 10 books called Mandals with 10,600 verses.", t:"Ancient History" },
  { k:"vedanta refers to text", a:"Upanishads", f:"The Upanishads (along with Brahmasutra and Bhagavad Gita) are referred to as 'Vedanta'. They are the last source of Shrutis in Hinduism.", t:"Ancient History" },
  { k:"fourth buddhist council held kingship", a:"Kanishka", f:"Fourth Buddhist Council was held at Kundalavana (72 AD) under Kanishka, presided by Vasumitra and Ashwaghosha. It resulted in compilation of Great Commentary on Abhidharma.", t:"Ancient History" },
  { k:"harshacharita biography harshavardhana written", a:"Banabhatta", f:"Harshacharita, biography of Emperor Harshavardhana, was written by Banabhatta (court poet) in 7th century CE.", t:"Ancient History" },
  { k:"massive temple sun god situated", a:"Odisha (Konark)", f:"The Konark Sun Temple is a 13th-century Hindu temple dedicated to the Sun God in Odisha. It is shaped like a giant chariot.", t:"Ancient History" },
  { k:"ashta mahasthana eight places buddha not one those", a:"Raigad is NOT one of the Ashta Mahasthana", f:"Ashta Mahasthana: Lumbini, Bodh Gaya, Sarnath, Kushinagar, Shravasti, Sankissa, Rajgriha, Vaishali. Raigad is NOT included.", t:"Ancient History" },
  { k:"indica written by", a:"Megasthenes", f:"Indica is a book on Mauryan India by Megasthenes, the Greek ambassador of Seleucus I Nikator. He visited India during Chandragupta Maurya's reign.", t:"Ancient History" },
  { k:"sacred books jataks whose", a:"Buddhists", f:"Jataks are sacred books of Buddhists, containing over 500 tales about Gautama Buddha's previous births.", t:"Ancient History" },
  { k:"deopahar archaeological site located", a:"Assam", f:"The Deopahar is an Archaeological Site located in Assam, a protected park under the Archaeology Directorate, Assam government.", t:"Ancient History" },
  { k:"buddha preach first sermon where", a:"Sarnath", f:"Buddha preached his first sermon at Sarnath (near Varanasi, UP). This event is called Dharmachakrapravartana (turning of the wheel of law).", t:"Ancient History" },
  { k:"harappa excavated by", a:"Rai Bahadur Daya Ram Sahni", f:"Harappa was excavated by Rai Bahadur Daya Ram Sahni in 1921 on the banks of river Ravi.", t:"Ancient History" },
  { k:"lothal city ancient indus valley civilization located", a:"Gujarat", f:"Lothal is located in the Bhal region of Gujarat. Excavated by ASI (1955-1960). It had the world's oldest known dock/port.", t:"Ancient History" },
  { k:"founder maurya dynasty", a:"Chandragupta Maurya", f:"Chandragupta Maurya founded the Maurya Empire in 322 BCE, overthrowing the Nanda Dynasty with help of Chanakya.", t:"Ancient History" },
  { k:"capital magadha mahajanapada", a:"Patliputra", f:"Patliputra (modern Patna) was the capital of Magadha Mahajanapada. Before that, Rajgriha was the capital.", t:"Ancient History" },
  { k:"seven rathas temple located pallava", a:"Mahabalipuram", f:"Seven Rathas Temple (Pancha Rathas) are located at Mahabalipuram, 65 km from Chennai, built by Pallava kings in 7th-8th centuries.", t:"Ancient History" },
  { k:"indus valley houses built using", a:"Bricks (baked bricks)", f:"Houses in Indus Valley Civilization were made of baked bricks. The IVC is known for urban planning, drainage system, grid layout.", t:"Ancient History" },
  { k:"famous mahabodhi temple located", a:"Bodh Gaya", f:"Mahabodhi Temple is in Bodh Gaya, Bihar. Buddha attained enlightenment under a Bodhi tree here. UNESCO World Heritage Site since 2002.", t:"Ancient History" },
  { k:"ashoka dynasty belong", a:"Maurya dynasty", f:"Ashoka the Great belonged to the Maurya Dynasty founded by Chandragupta Maurya. Ashoka ruled 268-232 BCE and helped spread Buddhism.", t:"Ancient History" },
  { k:"last king nanda dynasty", a:"Dhana Nanda", f:"Dhana Nanda was the last ruler of the Nanda dynasty. He was defeated by Chandragupta Maurya who established the Mauryan Empire.", t:"Ancient History" },
  { k:"veda contains gayatri mantra", a:"Rig Veda", f:"Gayatri Mantra is found in the Rig Veda (verse 3.62.10). It is dedicated to the ancient sun deity Savitri.", t:"Ancient History" },
  { k:"foundation buddhism noble truths fold path", a:"Four noble truths and Eight-fold path", f:"Buddhism is based on Four Noble Truths (Dukkha, Samudaya, Nirodha, Magga) and Eight-fold Path (Ashtangika Marga).", t:"Ancient History" },
  { k:"biggest epic world", a:"Mahabharata", f:"Mahabharata is the biggest epic in the world, one of two major epics of ancient India (other is Ramayana). Written by Ved Vyas.", t:"Ancient History" },
  { k:"greek ambassador megasthenes come which indian king", a:"Chandragupta Maurya", f:"Famous Greek ambassador Megasthenes came to Chandragupta Maurya's court. He was ambassador of Seleucus I Nicator.", t:"Ancient History" },
  { k:"ashoka governor ujjain before emperor", a:"Ujjain", f:"Ashoka's father Bindusara appointed him as Governor of Ujjain (important administrative centre in Avanti province) before he became emperor.", t:"Ancient History" },
  { k:"indus valley civilisation worshipped", a:"Pashupati", f:"Chief male deity of IVC was Pashupati (proto-Shiva), shown in seals sitting in yogic posture with three faces, two horns, surrounded by animals.", t:"Ancient History" },
  { k:"sites associated birth gautama buddha", a:"Lumbini", f:"Lumbini is associated with the birth of Gautama Buddha (563 BC). UNESCO World Heritage Site since 1997.", t:"Ancient History" },
  { k:"founder gupta dynasty", a:"Sri Gupta", f:"Sri Gupta was the founder of the Gupta dynasty. Chandragupta I (founder of Gupta era, 320 AD) is widely known but Sri Gupta was the original founder.", t:"Ancient History" },
  { k:"satyameva jayate originated upanishad", a:"Mundaka Upanishad", f:"'Satyameva Jayate' (Truth alone triumphs) originated from Mundaka Upanishad. It is inscribed below the Indian National Emblem, adopted on Jan 26, 1950.", t:"Ancient History" },
  { k:"kalibangan indus valley site located which state", a:"Rajasthan (Hanumangarh district)", f:"Kalibangan is in Hanumangarh district of Rajasthan, on banks of river Ghaggar (Saraswati). Discovered by Amalanand Ghosh.", t:"Ancient History" },
  { k:"rakhigarhi archaeological sites lies haryana", a:"Haryana", f:"Rakhigarhi is in Hisar District, Haryana. It is a pre-Indus Valley Civilization settlement going back to 6500 BCE.", t:"Ancient History" },
  { k:"chaityas viharas constructed monks religion", a:"Buddhism", f:"Chaityas were places of worship in Buddhism. Viharas were dwelling places for Buddhist monks.", t:"Ancient History" },
  { k:"ramcharitmanas written", a:"Tulsidas", f:"Ramcharitmanas was written by Tulsidas in Awadhi language. It narrates the story of Lord Rama.", t:"Ancient History" },
  { k:"tolkappiyam sangam age literature", a:"Tamil literature", f:"Tolkappiyam written by Tolkappiyar in Tamil is the greatest work of Tamil literature. It is a work on Tamil Grammar and gives political/social context.", t:"Ancient History" },
  { k:"writer book harshacharitra", a:"Banabhatta", f:"Banabhatta wrote Harshacharitra (biography of King Harsha Vardhan). He was the court poet of King Harsha and also wrote Kadambari (world's earliest novel).", t:"Ancient History" },
  { k:"first country buddhism propagated outside india", a:"Sri Lanka", f:"Sri Lanka was the first country outside India where Buddhism was propagated. Ashoka's son Mahindra led the mission.", t:"Ancient History" },
  { k:"founded shunga dynasty", a:"Pushyamitra Shunga", f:"Pushyamitra Shunga founded the Shunga dynasty after assassinating the last Mauryan ruler Brihadratha in 185 BC. Capital was Pataliputra, later Vidisha.", t:"Ancient History" },
  { k:"sanskrit ramayana written", a:"Valmiki", f:"Valmiki is the author of Sanskrit Ramayana. It consists of 24,000 shlokas and seven cantos (kandas). Valmiki is celebrated as Adi Kavi.", t:"Ancient History" },
  { k:"last king maurya dynasty", a:"Brihadratha", f:"Brihadratha was the last king of the Maurya dynasty, assassinated in 185 BC by his commander-in-chief Pushyamitra Sunga.", t:"Ancient History" },
  { k:"citadel lower town associated which city", a:"Harappa", f:"Citadel and Lower town are associated with Harappa city. The citadel was on a raised platform, lower town was larger.", t:"Ancient History" },
  { k:"tri ratna triratna indicate buddhism", a:"Buddha, Dhamma, Sangha", f:"Tri-ratna (Three Jewels) in Buddhism: Buddha, Dhamma (teachings), Sangha (community of followers). Triratna in Sanskrit means 'Three Jewels'.", t:"Ancient History" },
  { k:"capital mauryan empire", a:"Pataliputra", f:"Pataliputra (modern Patna) was the capital of the Mauryan Empire. There were 5 major political centres: Pataliputra, Taxila, Ujjayini, Tosali, Suvarnagiri.", t:"Ancient History" },
  { k:"gupta ruler napoleon india", a:"Samudragupta", f:"Samudragupta is called the Napoleon of India by V.A. Smith. The Allahabad Pillar Inscription (Prayaga Prasasti) by court poet Harisena details his conquests.", t:"Ancient History" },
  { k:"chinese traveller huien tsang visited india king rule", a:"Harshvardhana", f:"Chinese traveler Huien Tsang visited India (630-645 AD) during Harshvardhana's reign. He wrote Si-yu-ki ('Records of the Western World').", t:"Ancient History" },
  { k:"light of asia", a:"Buddha", f:"Gautam Buddha is also known as 'The Light of Asia'. He is also called 'The Enlightened One'. Born in Kapilvastu, Nepal around 563 BC.", t:"Ancient History" },
  { k:"not important site indus valley civilisation", a:"Dibrugarh is NOT an Indus Valley site", f:"Dibrugarh is not an Indus Valley site. Important sites: Lothal, Mohenjodaro, Harappa, Kalibangan, Dholavira, Rakhigarhi.", t:"Ancient History" },
  { k:"maurya dynasty founded defeating dhana nanda", a:"Chandragupta Maurya", f:"Chandragupta Maurya, with help of Chanakya, defeated Dhana Nanda (322 BCE) and founded the Mauryan Dynasty at Patliputra.", t:"Ancient History" },
  { k:"book shi yu ki after visiting harshavardhana court", a:"Hiuen-Tsang", f:"Hiuen-Tsang wrote Shi-Yu-Ki (Si-yu-ki = 'Record of the Western Countries') after visiting Harshavardhana's court. He stayed 5 years at Nalanda University.", t:"Ancient History" },
  { k:"port town lothal civilisation", a:"Harappan Civilization", f:"Lothal port town belongs to Harappan Civilization. It has the world's oldest known dock, located in Gujarat, discovered 1954.", t:"Ancient History" },
  { k:"first tirthankar", a:"Rishabhadev (Rishabhanatha/Adinatha)", f:"Rishabhadev (Rishabhanatha) was the first Tirthankar and considered the founder of Jainism. Mahavira was the 24th and last Tirthankar.", t:"Ancient History" },
  { k:"kanishka dynasty belong", a:"Kushan dynasty", f:"Kanishka belonged to the Kushan dynasty. The Kushan dynasty was founded by Kujula Kadphises. Kanishka was the greatest Kushan king and patron of Buddhism.", t:"Ancient History" },
  { k:"king harshvardhan bhadra vihar kannauj", a:"Kannauj", f:"King Harshvardhan established a large center of knowledge called 'Bhadra-Vihar' at Kannauj, which was also his capital.", t:"Ancient History" },
  { k:"devanampriya priyadarshi known as", a:"Ashoka Maurya", f:"Ashoka Maurya assumed the title 'Devanampiya Priyadarshi'. Devanampriya = 'beloved to the gods', Priyadarshi = 'one who regards everyone amiably'.", t:"Ancient History" },
  { k:"buddhist text majjhima nikaya language", a:"Pali", f:"Buddhist text Majjhima Nikaya is in Pali language. It is the 'Collection of Middle-length Discourses', part of Sutta Pitaka of Theravada Buddhism.", t:"Ancient History" },
  { k:"hiuen tsang visited court ruler", a:"Harshavardhana", f:"Hiuen Tsang visited the court of Harshavardhana. He stayed in India for 15 years and described it as 'prince of pilgrims'.", t:"Ancient History" },
  { k:"golden age hinduism period", a:"Gupta period", f:"The Gupta period (275-550 AD) is referred to as the Golden Age of Hinduism. Sri Gupta was the founder, Skandagupta was the last ruler.", t:"Ancient History" },
  { k:"port city indus valley civilization", a:"Lothal", f:"Lothal was a port city of the Indus Valley Civilization, located in Gujarat on Bhogava river. It had the world's oldest known dock.", t:"Ancient History" },
  { k:"chanakya ideas written down book", a:"Arthashastra", f:"Chanakya's (Kautilya's) ideas were written in the Arthashastra, a Sanskrit text on economy and polity. Manuscript discovered by R. Shama Sastri in 1905.", t:"Ancient History" },
  { k:"brihatsmhita brihat samhita author written", a:"Varahamihira", f:"Varahamihira wrote Brihat Samhita, an important encyclopedia in Sanskrit covering astronomy, architecture, crops, perfume, matrimony, gems, and rituals.", t:"Ancient History" },
  { k:"manjusri ajanta painting religion", a:"Buddhism", f:"Manjusri in Ajanta Painting is related to Buddhism. He is a male Bodhisattva associated with the Wisdom of Buddha, depicted with a sword.", t:"Ancient History" },
  { k:"city excavated 1922 larkana district banks indus", a:"Mohanjodaro", f:"Mohanjodaro was excavated in 1922 in Larkana district on banks of Indus by R.D. Banerjee.", t:"Ancient History" },
  { k:"second buddhist council held reign", a:"Kalasoka", f:"Second Buddhist Council was held at Vaishali in 383 BC during the reign of Kalasoka. It resulted in schism into Sthavira-Vadins and Mahasanghikas.", t:"Ancient History" },
  { k:"wrote holy book bhagavad gita", a:"Ved Vyas", f:"Bhagavad Gita was composed by Vyasa (Ved Vyas). Known as 'The Song of God', it is 700 verses from Mahabharata (Bhishma Parva). Lord Krishna's teachings to Arjuna.", t:"Ancient History" },
  { k:"name book rules buddhist sanghas laid down", a:"Vinaya Pitaka", f:"Rules of Buddhist Sanghas are in Vinaya Pitaka (Book of Discipline). Tripitaka = three baskets: Sutta Pitaka, Vinaya Pitaka, Abhidhamma Pitaka.", t:"Ancient History" },
  { k:"also called indian machiavelli", a:"Kautilya (Chanakya)", f:"Kautilya is called 'Indian Machiavelli'. He was prime minister under Chandragupta Maurya and wrote Arthashastra.", t:"Ancient History" },
  { k:"24th jain tirthankara", a:"Mahavira", f:"Mahavira was the 24th Jain Tirthankara. 1st = Rishabhadev, 23rd = Parshvanatha, 24th = Mahavira. Vardhamana Mahavira born 540 BC in Kundagrama near Vaishali.", t:"Ancient History" },
  { k:"samkhaya school philosophy founded", a:"Kapila", f:"Samkhya School of Philosophy was founded by Sage Kapila. Other schools: Yoga=Patanjali, Nyaya=Gautama, Vaisheshika=Kanada.", t:"Ancient History" },
  { k:"sandrocottus referred writings greeks", a:"Chandragupta Maurya", f:"Chandragupta Maurya is referred to as 'Sandrocottus' in Greek writings. He ruled c.322-298 BC and founded Mauryan Dynasty at Patliputra.", t:"Ancient History" },
  { k:"books not written harshavardhana", a:"Kadambari", f:"Kadambari was NOT written by Harshavardhana, it was composed by Banabhatta. Harshavardhana wrote Ratnavali, Nagananda, Priyadarsika.", t:"Ancient History" },
  { k:"literary figure gupta age", a:"Kalidasa", f:"Kalidasa is the most notable literary figure of the Gupta Age. Other Gupta era figures: Bhairavi, Harisena. The Panchatantra was also composed in this period.", t:"Ancient History" },
  { k:"jataka tales associated sects", a:"Buddhism", f:"Jataka tales are associated with Buddhism, containing stories of Gautama Buddha's previous births.", t:"Ancient History" },
  { k:"malvika agnimitram written by", a:"Kalidasa", f:"Malvika-agnimitram was written by Kalidasa. Other works: Abhijnanasakuntalam, Raghuvamsa, Meghaduta, Vikramorvasiyam, Kumarasambhavam.", t:"Ancient History" },
  { k:"harappan people did not trade country", a:"Mongolia", f:"Harappans did NOT trade with Mongolia. They traded with Afghanistan (silver), Persia (turquoise), Oman (copper).", t:"Ancient History" },
  { k:"site first discovered harappan", a:"Harappa", f:"Harappa was the first Harappan site to be discovered (1921, by Daya Ram Sahni). Mohenjodaro was discovered in 1922.", t:"Ancient History" },
  { k:"kingdom first used elephants wars", a:"Magadha", f:"Magadha was the first kingdom to use elephants in wars. The Magadha kingdom covers modern districts of Patna, Jehanabad, Nalanda, Gaya etc.", t:"Ancient History" },
  { k:"capital matsya mahajanapada", a:"Viratnagar", f:"Capital of Matsya Mahajanapada was Viratnagar (present-day Bairat, Jaipur district, Rajasthan).", t:"Ancient History" },
  { k:"veda contains treatment diseases", a:"Atharva Veda", f:"Atharva Veda contains treatment for diseases. It is an encyclopedia for medicine containing spells, prayers, charms for healing.", t:"Ancient History" },
  { k:"not correct about lord vishnu ten incarnations", a:"Garuda is NOT one of the ten incarnations", f:"10 incarnations of Vishnu (Dashavatar): Matsya, Kurma, Varaha, Narsimha, Vamana, Parshurama, Rama, Krishna, Buddha, Kalki. Garuda is Vishnu's mount, not an avatar.", t:"Ancient History" },
  { k:"departure siddhartha search truth known as", a:"Mahabhinishkraman", f:"Mahabhinishkraman refers to the departure of Siddhartha from home at age 29. Dharmachakrapravartana = first sermon at Sarnath, Nirvana = enlightenment, Parinirvana = death at Kushinagar.", t:"Ancient History" },
  { k:"23rd tirthankara jainism", a:"Parsvanatha", f:"Parsvanatha was the 23rd Tirthankara of Jainism. Mahavira was the 24th. Rishabhanatha was the 1st.", t:"Ancient History" },
  { k:"gautamiputra satakarni achievements recorded inscription", a:"Nasik Inscription", f:"Gautamiputra Satakarni's achievements are in Nasik Inscription, laid by his mother Gautami Balaski. He defeated Saka King Nahapana.", t:"Ancient History" },
  { k:"chinese buddhist travellers visited both kings harsha pulakeshin", a:"Chinese Buddhist monk Hiuen Tsang", f:"Hiuen Tsang visited both kings Harsha and Pulakeshin II.", t:"Ancient History" },
  { k:"aihole inscription associated ruler", a:"Pulakesin II", f:"Aihole Inscription is associated with Pulakesin II of Chalukya dynasty, written by court poet Ravikirti. It describes his conquests including defeat of Harshavardhana.", t:"Ancient History" },
  { k:"founder kanvas dynasty", a:"Vasudeva", f:"Vasudeva was the founder of Kanvas dynasty. He was minister of last Sunga ruler Devabhuti and established Kanvas with capital at Patliputra.", t:"Ancient History" },
  { k:"total number upanishads known historians", a:"108 Upanishads", f:"108 Upanishads are known to historians, of which 11 are the main Mukhya Upanishads. Last recorded in 1656 by Dara Shikoh.", t:"Ancient History" },
  { k:"vajrayana school belongs religion", a:"Buddhism", f:"Vajrayana School belongs to Buddhism. It means 'The Vehicle of the Thunderbolt', developed in India in 7th-8th centuries CE. Also known as Tantric Buddhism.", t:"Ancient History" },
  { k:"dhamekh stupa sarnath constructed mauryan king", a:"Ashoka", f:"Dhamekh Stupa at Sarnath was built by Ashoka. It marks where Buddha gave his first sermon. It is 43.6 meters high with 28 meters diameter.", t:"Ancient History" },
  { k:"capital guptas", a:"Pataliputra", f:"Capital of the Gupta dynasty was Pataliputra. Samudragupta issued eight types of gold coins. The court of Chandragupta II had the Navratnas including Kalidasa.", t:"Ancient History" },
  { k:"came india time chandragupta maurya", a:"Megasthenes", f:"Megasthenes came to India during Chandragupta Maurya's reign as ambassador of Seleucus I Nicator and wrote Indica.", t:"Ancient History" },
  { k:"bramhasphutasiddhanta book written", a:"Brahmagupta", f:"Bramhasphutasiddhanta was written by Brahmagupta (c.628). It contains mathematical astronomy and ideas about positive numbers, negative numbers and zero.", t:"Ancient History" },
  { k:"nalanda mahavihara founded rulers", a:"Kumargupta I", f:"Nalanda Mahavihara was founded in 5th century CE by Kumaragupta I of the Gupta Dynasty.", t:"Ancient History" },
  { k:"rivers not mentioned rig veda", a:"Narmada river is NOT mentioned in Rig Veda", f:"Narmada is not mentioned in Rig Veda. Rivers in Rig Veda: Indus, Jhelum, Chenab, Ravi, Beas, Sutlej, Gomati, Kurram, Ghaggar, Swat.", t:"Ancient History" },
  { k:"second buddisht council held where when", a:"Vaishali in 383 BC", f:"Second Buddhist Council was held at Vaishali in 383 BC under Kalasoka, presided by Sabakami.", t:"Ancient History" },
  { k:"oldest brahmana vedic literature", a:"Shatapatha Brahmana", f:"Shatapatha Brahmana is the oldest and largest Brahmana in Vedic Literature, attached to Yajur Veda. Aitareya and Sankhyan attached to Rig Veda. Gopatha to Atharva Veda.", t:"Ancient History" },
  { k:"sushruta work medicine gupta period", a:"Sushruta", f:"Sushruta is known for his work on medicine during the Gupta period. He was the first Indian surgeon. Sushruta Samhita is a Sanskrit text on surgery.", t:"Ancient History" },
  { k:"allahabad pillar inscription reign king", a:"Samudragupta", f:"Allahabad Pillar Inscription (Prayag Prasasti) gives details of Samudragupta's reign, composed by court poet Harisena.", t:"Ancient History" },
  { k:"gupta ruler repulsed huna invasion", a:"Skandagupta", f:"Skandagupta repulsed the Huna invasion. Source: Bhitari Pillar Inscription. He revalued currency switching from dinar to Suvarna.", t:"Ancient History" },
  { k:"oldest discovered indus valley civilization site", a:"Bhirrana", f:"Bhirrana is the oldest discovered IVC site, according to C-14 radio-dating by ASI. Located in Fatehabad district, dated 6200 BC.", t:"Ancient History" },
  { k:"rigvedic name chenab river", a:"Askini (Askani)", f:"The Rigvedic name of Chenab river is Askini (also written Askani). Ravi=Purushni, Jhelum=Vitasta, Beas=Vipasha.", t:"Ancient History" },
  { k:"kathasaritsagara written by", a:"Somadeva", f:"The Kathasaritsagara (Ocean of the Streams of Stories) is an 11th-century Sanskrit collection by Somadeva, containing Indian legends, fairy tales and folk tales.", t:"Ancient History" },
  { k:"oldest upanishad", a:"Brihadaranyaka", f:"Brihadaranyaka is the oldest Upanishad. It contains the Yagnavalkya-Maitreyi dialogue and the idea of rebirth. Chandogya teaches cosmic self doctrine.", t:"Ancient History" },
  { k:"pataliputra capital magadha reign created fort", a:"Udayin", f:"Udayin made Pataliputra the capital of Magadha. He was son of Ajatashatru and built a fort at confluence of Ganges and Son at Patna.", t:"Ancient History" },
  { k:"not associated excavations harappa mohanjodaro", a:"V.A. Smith", f:"V.A. Smith was NOT associated with Harappa/Mohenjo-Daro excavations. R.D. Banerji discovered Mohenjodaro (1922), K.N. Dikshit excavated northeast sector, M.S. Vats excavated Harappa.", t:"Ancient History" },
  { k:"gupta ruler repulsed huna", a:"Skandagupta", f:"Skandagupta repulsed the Huna invasion and restored Gupta power.", t:"Ancient History" },
  { k:"sculpture chariot harappa times found location", a:"Daimabad (Maharashtra)", f:"A sculpture of a chariot of Harappa times was found at Daimabad, Maharashtra. Archaeological site discovered 1958, excavations 1976-79.", t:"Ancient History" },
  { k:"ashoka appointed religious officials known", a:"Dhamma-mahamatta", f:"Ashoka appointed Dhamma-mahamatta, officers to implement and publicize Dhamma (Buddhist teachings) across his empire.", t:"Ancient History" },
  { k:"symbol jain tirthankara parshvanatha", a:"Snake", f:"Snake is the symbol of Jain Tirthankara Parshvanatha. Jainism's five vows: Ahimsa, Satya, Achaurya, Brahmacharya, Aparigraha.", t:"Ancient History" },
  { k:"all men are my children inscription ashoka", a:"Separate Kalinga Rock Edict I", f:"'All men are my children' declaration by Ashoka is in Separate Kalinga Rock Edict I. It expresses his doctrine of paternal administration.", t:"Ancient History" },
  { k:"punch marked coins found bihar made", a:"Silver", f:"Punch-marked coins found abundantly in Bihar were made of silver.", t:"Ancient History" },
  { k:"samadhi maran related philosophy", a:"Jain philosophy", f:"Samadhi Maran (also called Sallekhana) is embracing voluntary death by fasting in Jainism. It is practiced when end of life is near due to old age or incurable disease.", t:"Ancient History" },
  { k:"chandogya brahmana related veda", a:"Sam Veda (Sama Veda)", f:"The Chandogya Brahmana is related to Sam Veda. It is the second Brahmana of Sama Veda.", t:"Ancient History" },
  { k:"kalchakra ceremony associated religion", a:"Buddhism", f:"'Kalchakra' ceremony is associated with Buddhism, based on a foundational tantric treatise in Sanskrit.", t:"Ancient History" },
  { k:"first gupta ruler adopted title maharajadhiraja", a:"Chandragupta I", f:"Chandragupta I was the first Gupta ruler to adopt the title of Maharajadhiraja.", t:"Ancient History" },
  { k:"leader jain gana known", a:"Ganadhar", f:"The leader of a Jain gana was known as Ganadhar (chief disciple of a Tirthankara).", t:"Ancient History" },
  { k:"only unesco world heritage site bihar state", a:"Mahabodhi Vihar", f:"Mahabodhi Vihar in Gaya district is the only UNESCO World Heritage Site in Bihar. It marks Buddha's attainment of enlightenment.", t:"Ancient History" },
  { k:"first witnessed domestication animals stone age", a:"Mesolithic Age", f:"Mesolithic Age (9000-4000 BC) first witnessed domestication of animals. Evidence from Adamgarh (MP) and Baghore (Rajasthan).", t:"Ancient History" },
  { k:"bhagavad gita extracted parva mahabharat", a:"Bhishma Parva", f:"Bhagavad Gita is extracted from Bhishma Parva of Mahabharata. Total 18 Parvas in Mahabharata. 700 verses, written by Ved Vyasa.", t:"Ancient History" },
  { k:"vedic deity indra end evils known", a:"Great Warriors", f:"The Vedic deity Indra for ending evils was known as Great Warriors. Indra is the lord of heavens, god of thunder and rain, with Vajra weapon and Airavata elephant.", t:"Ancient History" },
  { k:"nirvana buddhism describes best concept", a:"Extinction of the flame of desire", f:"Nirvana = shedding of all desires and ending of sufferings, leading to freedom from rebirth. Buddha attained Nirvana at Bodhgaya.", t:"Ancient History" },
  { k:"pandyas occupied madurai tinnevelly south travancore decline mauryan", a:"Pandyas", f:"Pandyas occupied districts of Madurai and Tinnevelly with portions of South Travancore after decline of Mauryan Empire. Capital at Madurai on Vaigai river.", t:"Ancient History" },
  { k:"not correct satavahana dynasty", a:"They patronized Kannada language (NOT CORRECT)", f:"The Satavahanas patronized Prakrit language, NOT Kannada. Founder: Simuka. They patronized Buddhism and Brahmanism and built chaityas and viharas.", t:"Ancient History" },
  { k:"chola emblem kingdom", a:"Tiger", f:"Chola = Tiger, Chera = Bow and arrow, Pandyas = Fish.", t:"Ancient History" },
  { k:"built mehrauli iron pillar", a:"Chandragupta II", f:"Mehrauli Iron Pillar near Qutub Minar was built during Chandragupta II's reign. It is 7.2 meters high and known as Kirti Stambha.", t:"Ancient History" },
  { k:"jain kirti stambh chittorgarh devoted tirthankara", a:"Adinath (Rishabhanatha)", f:"Jain Kirti Stambh (Chittorgarh, Rajasthan) is devoted to Adinath (first Jain Tirthankara). Height 22m, 7 floors, built in 12th century.", t:"Ancient History" },
  { k:"main source information indo greek rulers", a:"Coins", f:"Coins are the main source of information about Indo-Greek rulers.", t:"Ancient History" },
  { k:"kandariya mahadev temple khajuraho built", a:"Dhangadev", f:"Kandariya Mahadev Temple at Khajuraho was built by Dhangadev (999 AD). It is a Shiva temple renowned for its nagara-style and erotic sculptures.", t:"Ancient History" },
  { k:"jainism three ratnas triratnas way nirvana", a:"Right Faith, Right Knowledge, Right Conduct", f:"Three Ratnas (Triratnas) of Jainism: Samyak Darshana (Right Faith), Samyak Gyana (Right Knowledge), Samyak Charitra (Right Conduct). The path to liberation.", t:"Ancient History" },
  { k:"gupta period gold coins called", a:"Dinaras", f:"During the Gupta Period, gold coins were called Dinaras. Silver coins were called Rupaka. Official currency of Mauryans was Pan (silver, ¾ tola).", t:"Ancient History" },
  { k:"hinayana sect buddhism correct", a:"There is no worship of Bodhisattvas in Hinayana sect", f:"Hinayana = 'lesser vehicle', follows original Buddha teachings, no idol/image worship, no Bodhisattvas, individual salvation through meditation. Used Pali language.", t:"Ancient History" },
  { k:"rulers mentioned sandrocottus", a:"Chandragupta Maurya", f:"Chandragupta Maurya was mentioned as 'Sandrocottus' in writings of the Greeks (Justin's Epitome), identified by William Jones.", t:"Ancient History" },
  { k:"silappadikaram tamil epic written", a:"Ilango Adigal", f:"Silappadikaram is a Tamil epic written by Ilango Adigal, a prince. It is about Kannagi who avenges her husband's unjust death at the Pandyan court.", t:"Ancient History" },
  { k:"kamandaka nitisara contribution", a:"Political morality", f:"Kamandaka's Nitisara is a contribution to political morality, based on Kautilya's Arthashastra, written during the Gupta Period.", t:"Ancient History" },
  { k:"vardhana kingdom king conquer rajasthan", a:"Harshvardhana", f:"Harshvardhana of the Vardhana Kingdom conquered maximum part of Rajasthan.", t:"Ancient History" },
  { k:"nishka ancient india", a:"Gold coin of Maurya", f:"Nishka was the gold coin of Mauryas.", t:"Ancient History" },
  { k:"vinaya pitaka book related", a:"Rules of the Buddhist Sangha", f:"Vinaya Pitaka is related to rules of Buddhist Sangha. Also called Book of Discipline. Contains monastic rules for monks and nuns.", t:"Ancient History" },
  { k:"sandivigraha high official gupta inscriptions", a:"Foreign affairs minister", f:"Sandivigraha, mentioned in Gupta inscriptions, was most probably the minister for foreign affairs.", t:"Ancient History" },
  { k:"capital kalinga eastern province ashoka invasion", a:"Toshali", f:"Capital of Kalinga (Eastern Province) during Ashoka's invasion was Toshali.", t:"Ancient History" },
  { k:"mehrauli iron pillar qutub minar belongs period", a:"Chandragupta Vikramaditya (Chandragupta II)", f:"Mehrauli Iron Pillar belongs to Chandragupta Vikramaditya (Chandragupta II). Also known as Kirti Stambha.", t:"Ancient History" },
  { k:"sulkadhyaksha mauryan municipal administration", a:"Collector of tolls", f:"Sulkadhyaksha = Collector of tolls in Mauryan administration. Panyaadhyaksha = Superintendent of Commerce, Samasthadhyaksha = Market.", t:"Ancient History" },
  { k:"lokapala guardians universe gods", a:"Yama, Indra, Varuna and Kubera", f:"Guardians of four directions (Lokapala): Kubera (North), Yama (South), Indra (East), Varuna (West).", t:"Ancient History" },
  { k:"dhanvantari navaratnas nine gems ruler india", a:"Chandragupta II (Vikramaditya)", f:"Dhanvantari was one of the Navaratnas (Nine Gems) of Chandragupta II of Ujjayini.", t:"Ancient History" },
  { k:"first jain assembly organized", a:"Patliputra", f:"First Jain assembly was held at Patliputra in 300 BC, during Chandragupta Maurya's reign, under Sthoolabhadr. Jainism divided into Digambar and Shwetambar.", t:"Ancient History" },
  { k:"chinese pilgrim came india 5th century", a:"Fa Hien", f:"Fa Hien (405-411 AD) came to India in the 5th century during reign of Chandragupta II (Vikramaditya). He wrote 'Record of Buddhist Kingdoms'.", t:"Ancient History" },
  { k:"third jain tirthankara", a:"Sambhavnath", f:"Sambhavnath was the 3rd Jain Tirthankara. Order: 1st=Rishabhanatha, 2nd=Ajitnath, 3rd=Sambhavnath, 23rd=Parshwanath, 24th=Mahavira.", t:"Ancient History" },
  { k:"castes absent mauryan period megasthenes", a:"Philosophers (or Slave was absent)", f:"According to Megasthenes, slavery was absent in Indian society during Mauryan period. He divided Indian society into 7 castes: philosopher, farmer, shepherd, trader, warrior, overseer, councillor.", t:"Ancient History" },
  { k:"fundamental difference mahayana buddhism hinayana buddhism", a:"Idol worship of Gods and Goddesses", f:"Mahayana believes in idol worship of Buddha and Bodhisattvas. Hinayana does not believe in idol worship and focuses on individual salvation.", t:"Ancient History" },
  { k:"chinese buddhist pilgrims xuan zang came court", a:"Harshavardhan", f:"Chinese Buddhist pilgrim Xuan Zang came to the court of Harshavardhan (7th century). Primary aim was to gain knowledge of Buddhism.", t:"Ancient History" },
  { k:"kalidasa kumarasambhavam story birth mythological", a:"Kartikeya", f:"Kalidasa's Kumarasambhavam describes the birth of Kumara (Kartikeya), son of Lord Shiva and Parvati. Kalidasa is known as 'Indian Shakespeare'.", t:"Ancient History" },
  { k:"ultimate goal education jainism", a:"Liberation (Moksha)", f:"Ultimate goal of education in Jainism is Liberation (Moksha) - attainment of salvation from the chain of birth and death.", t:"Ancient History" },
  { k:"capital kanva dynasty", a:"Pataliputra", f:"Capital of Kanva Dynasty was Pataliputra. Founder: Vasudeva Kanva. Last king: Susharman. Succeeded by the Satavahanas.", t:"Ancient History" },
  { k:"buddhist councils first second third fourth", a:"1st=Rajagriha/Ajatashatru, 2nd=Vaishali/Kalasoka, 3rd=Pataliputra/Asoka, 4th=Kundalavana/Kanishka", f:"Buddhist Councils: 1st (483 BC) Rajagriha-Ajatshatru; 2nd (383 BC) Vaishali-Kalasoka; 3rd (250 BC) Pataliputra-Asoka; 4th (72 AD) Kashmir-Kanishka.", t:"Ancient History" },
  { k:"samaharta mauryan administration", a:"Chief Collector general of revenue", f:"Samaharta was the Chief Collector general of revenue in the Mauryan kingdom.", t:"Ancient History" },

  // ── GENERAL FACTS (from solutions/explanations) ──
  { k:"four noble truths buddhism", a:"Dukkha, Samudaya, Nirodha, Magga", f:"Four Noble Truths of Buddhism: 1. Dukkha (suffering), 2. Samudaya (cause of suffering), 3. Nirodha (cessation of suffering), 4. Magga (path to cessation).", t:"Buddhism" },
  { k:"eight fold path buddhism ashtangika marga", a:"Right View, Right Thoughts, Right Speech, Right Conduct, Right Livelihood, Right Effort, Right Mindfulness, Right Meditation", f:"Eight-fold Path (Ashtangika Marga) of Buddhism consists of 8 right practices leading to Nirvana.", t:"Buddhism" },
  { k:"four vedas", a:"Rigveda, Samaveda, Yajurveda, Atharvaveda", f:"Four Vedas: Rigveda (oldest, hymns), Samaveda (musical hymns), Yajurveda (sacrificial formulas), Atharvaveda (magic formulas, medicine).", t:"Ancient History" },
  { k:"mahajanapadas capitals sixteen", a:"Magadha=Rajgir/Patliputra, Kosala=Sravasti, Vatsa=Kausambi, Avanti=Ujjain, Gandhara=Takshila, Matsya=Viratnagar", f:"16 Mahajanapadas with capitals. Magadha eventually became the most powerful.", t:"Ancient History" },
  { k:"indus valley sites features", a:"Lothal=dockyard/rice, Kalibangan=fire altars/ploughed field, Mohenjodaro=Great Bath/Dancing girl, Dholavira=3 parts/water management", f:"Key Indus Valley sites: Lothal (Gujarat)=dock+double burial; Kalibangan (Rajasthan)=fire altars; Mohenjodaro=Great Bath; Dholavira=3 parts; Surkotada=horse bones.", t:"Ancient History" },
  { k:"gupta rulers list kings", a:"Sri Gupta (founder) → Chandragupta I → Samudragupta → Chandragupta II → Kumaragupta → Skandagupta (last)", f:"Gupta dynasty: Sri Gupta (founder), Chandragupta I (Maharajadhiraja), Samudragupta (Napoleon of India), Chandragupta II (Vikramaditya), Kumaragupta (founded Nalanda), Skandagupta.", t:"Ancient History" },
  { k:"chinese travellers visitors ancient india list", a:"Megasthenes=Chandragupta Maurya, Fa-Hien=Chandragupta II, Hiuen Tsang=Harshvardhana", f:"Foreign travellers: Megasthenes (Greek, Chandragupta Maurya), Fa-Hien (405-411 AD, Chandragupta II), Hiuen Tsang (630-645 AD, Harshvardhana).", t:"Ancient History" },
  { k:"maurya dynasty rulers", a:"Chandragupta Maurya → Bindusara → Ashoka → Dasharatha → Brihadratha (last)", f:"Mauryan rulers: Chandragupta (founder, 322 BCE), Bindusara (son), Ashoka (greatest, 268-232 BCE), last was Brihadratha (assassinated 185 BC).", t:"Ancient History" },
];

// ════════════════════════════════════════════════════════
//   NOVA ENGINE v3.0 — NLP + GK Brain
// ════════════════════════════════════════════════════════
const NovaEngine = (() => {

  // ── Session context
  const ctx = {
    greeted: false,
    greetCount: 0,
    userMood: null,
    lastIntent: null,
  };

  // ── Stop words
  const STOP = new Set(["a","an","the","and","or","but","in","on","at","to","for","of",
    "with","by","from","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall","can","it",
    "its","this","that","these","those","i","you","he","she","we","they","me","him",
    "her","us","them","my","your","his","our","their","what","which","who","whom","when",
    "where","why","how","all","both","each","few","more","most","other","some","such",
    "no","not","only","same","so","than","too","very","just","as","if","also","into",
    "up","out","about","after","before","over","under","again","then","once","here",
    "there","any","every","much","now","still","even","back","well","way","get","got",
    "let","put","say","said","see","make","made","know","think","come","came","go","take",
    "among","following"]);

  // ── Porter Stemmer (core rules)
  const stem = (w) => {
    if (w.length <= 3) return w;
    if (w.endsWith("tion")) return w.slice(0,-3);
    if (w.endsWith("ness")) return w.slice(0,-4);
    if (w.endsWith("ing") && w.length > 6)  return w.slice(0,-3);
    if (w.endsWith("ed") && w.length > 5)   return w.slice(0,-2);
    if (w.endsWith("er") && w.length > 5)   return w.slice(0,-2);
    if (w.endsWith("ly") && w.length > 5)   return w.slice(0,-2);
    if (w.endsWith("al") && w.length > 5)   return w.slice(0,-2);
    if (w.endsWith("ment")) return w.slice(0,-4);
    if (w.endsWith("s") && !w.endsWith("ss") && w.length > 4) return w.slice(0,-1);
    return w;
  };

  // ── Levenshtein distance
  const levenshtein = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m+1 }, (_, i) =>
      Array.from({ length: n+1 }, (_, j) => (i===0 ? j : j===0 ? i : 0))
    );
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++) {
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    }
    return dp[m][n];
  };

  const fuzzyMatch = (word, keywords, threshold=2) =>
    keywords.some(k => Math.abs(word.length-k.length)<=threshold && levenshtein(word,k)<=threshold);

  // ── Tokenizer
  const tokenize = (text) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w))
      .map(stem);

  // ── Intl.Segmenter sentence splitter with fallback
  const splitSentences = (text) => {
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const seg = new Intl.Segmenter("en", { granularity: "sentence" });
        return Array.from(seg.segment(text))
          .map(s => s.segment.replace(/\s+/g," ").trim())
          .filter(s => s.split(/\s+/).length >= 5 && s.length >= 25);
      }
    } catch(_) {}
    const raw = text.replace(/([A-Z][a-z]+\.)(\s)/g,"$1<ABBR>")
      .match(/[^.!?…]+(?:[.!?…]+(?:\s|$)|$)/g) || [];
    return raw.map(s=>s.replace(/<ABBR>/g," ").replace(/\s+/g," ").trim())
      .filter(s=>s.split(/\s+/).length>=5 && s.length>=25);
  };

  // ── TF-IDF
  const buildTFIDF = (sentences) => {
    const N = sentences.length;
    const sentWords = sentences.map(s => tokenize(s));
    const df = {};
    sentWords.forEach(words => new Set(words).forEach(w=>{df[w]=(df[w]||0)+1;}));
    return sentWords.map(words => {
      const freq = {};
      words.forEach(w=>(freq[w]=(freq[w]||0)+1));
      const maxFreq = Math.max(...Object.values(freq),1);
      const vec = {};
      Object.entries(freq).forEach(([w,f])=>{
        vec[w] = (f/maxFreq) * Math.log((N+1)/(1+(df[w]||0)));
      });
      return vec;
    });
  };

  // ── Cosine similarity
  const cosineSim = (a, b) => {
    const keys = new Set([...Object.keys(a),...Object.keys(b)]);
    let dot=0,magA=0,magB=0;
    keys.forEach(k=>{const va=a[k]||0,vb=b[k]||0; dot+=va*vb; magA+=va*va; magB+=vb*vb;});
    const d = Math.sqrt(magA)*Math.sqrt(magB);
    return d===0?0:dot/d;
  };

  // ── TextRank
  const textRank = (vecs, iterations=12, d=0.85) => {
    const N = vecs.length;
    if (!N) return [];
    const sim = vecs.map((vi,i)=>vecs.map((vj,j)=>i===j?0:cosineSim(vi,vj)));
    const norm = sim.map(row=>{
      const sum=row.reduce((a,v)=>a+v,0);
      return sum===0?row.map(()=>1/N):row.map(v=>v/sum);
    });
    let scores = Array(N).fill(1/N);
    for(let iter=0;iter<iterations;iter++){
      scores=scores.map((_,i)=>(1-d)/N+d*scores.reduce((acc,s,j)=>acc+s*(norm[j][i]||0),0));
    }
    return scores;
  };

  // ── Summarizer
  const summarize = (text, targetLines=4) => {
    const sentences = splitSentences(text);
    if (!sentences.length) return { summary:"Text is too short to summarize meaningfully.", reduced:0 };
    if (sentences.length<=3) return { summary:sentences.join(" "), reduced:0 };
    const tfidfVecs = buildTFIDF(sentences);
    const trScores = textRank(tfidfVecs);
    const scored = sentences.map((sent,idx)=>{
      const pos=idx/Math.max(sentences.length-1,1);
      const posScore=pos<=0.15?0.22:pos>=0.85?0.14:pos<=0.30?0.09:0.02;
      const wc=sent.split(/\s+/).length;
      const lenScore=wc>=12&&wc<=35?0.08:wc>=7?0.03:0;
      const keyScore=/\d{4}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)+|\d+%|\$\d+/.test(sent)?0.06:0;
      return {sent,idx,score:(trScores[idx]||0)+posScore+lenScore+keyScore};
    });
    const n=Math.min(targetLines,Math.max(2,Math.ceil(sentences.length*0.3)));
    const top=scored.sort((a,b)=>b.score-a.score).slice(0,n).sort((a,b)=>a.idx-b.idx);
    const originalWC=text.trim().split(/\s+/).length;
    const summaryWC=top.map(t=>t.sent).join(" ").split(/\s+/).length;
    const reduced=Math.round(Math.max(0,100-(summaryWC/originalWC)*100));
    return {summary:top.map(t=>t.sent).join(" "),reduced,originalWC,summaryWC};
  };

  // ════════════════════════════════════
  //  GK SEARCH ENGINE
  // ════════════════════════════════════
  const searchGK = (query) => {
    const qWords = new Set(tokenize(query));
    if (qWords.size === 0) return null;

    let bestScore = 0;
    let bestEntry = null;

    for (const entry of GK_KB) {
      const kWords = new Set(tokenize(entry.k));
      const fWords = new Set(tokenize(entry.f));
      const aWords = new Set(tokenize(entry.a));

      // Keyword overlap with question keywords (high weight)
      let overlap = 0;
      qWords.forEach(w => {
        if (kWords.has(w)) overlap += 2;        // exact match in keywords
        else if (fWords.has(w)) overlap += 0.8; // match in fact
        else if (aWords.has(w)) overlap += 1;   // match in answer
        // fuzzy match bonus
        else {
          kWords.forEach(k => { if (levenshtein(w,k)<=1 && w.length>3) overlap += 1.2; });
        }
      });

      const score = overlap / Math.max(qWords.size, kWords.size);

      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    // Only return if confident enough
    return bestScore >= 0.35 ? { entry: bestEntry, score: bestScore } : null;
  };

  // ── Is this a GK question?
  const isGKQuestion = (input) => {
    const t = input.toLowerCase();
    const gkTriggers = [
      /^(who|what|where|when|which|whose|whom|how many|name the|give the|tell me about|what is|what are|what was|what were)/i,
      /\b(founded|discovered|written|composed|located|known as|called|built|established|capital of|author|ruler|dynasty|king|emperor|wrote|reign|period|age|civilization|century|bc|ad|ancient|medieval|modern|india|history|geography|polity|economy|biology|chemistry|physics|science)\b/i
    ];
    return gkTriggers.some(p => p.test(t));
  };

  // ── Format GK answer
  const formatGKAnswer = (entry, score) => {
    const confidence = score >= 0.7 ? "📚" : score >= 0.5 ? "🔍" : "🤔";
    return `${confidence} **${entry.a}**\n\n${entry.f}\n\n_Topic: ${entry.t} · GK Source: SSC SmartBook_`;
  };

  // ── Intent patterns
  const PATTERNS = {
    greet:      [/^(hi+|hey+|hello+|howdy|hiya|yo+|sup|greetings|salutations|good\s?(morning|afternoon|evening|day|night)|what'?s\s?up|wassup|heya|hola)[!.,\s]*/i],
    farewell:   [/^(bye|goodbye|see\s?(ya|you)|later|cya|ttyl|farewell|take\s?care|good\s?night|g2g|gtg)[!.,\s]*/i],
    thanks:     [/^(thanks|thank\s?(you|u)|thx|ty|cheers|appreciate|grateful|gracias)[!.,\s]*/i],
    howAreYou:  [/how\s?(are\s?you|r\s?u|is\s?it\s?going|do\s?you\s?do|have\s?you\s?been)|how'?s\s?(it|life|everything)/i],
    userGood:   [/^(i'?m?\s*)?(doing\s+)?(good|great|fine|well|amazing|awesome|fantastic|wonderful|excellent|blessed|happy|not\s+bad|pretty\s+good)[!.,\s]*/i],
    userBad:    [/^(i'?m?\s*)?(not\s+so\s+good|not\s+great|bad|sad|tired|exhausted|okay|so-so|meh|stressed|struggling|rough)[!.,\s]*/i],
    whoAreYou:  [/who\s?are\s?you|what\s?are\s?you|your\s?name|introduce\s?yourself/i],
    canYouDo:   [/what\s?can\s?you|your\s?(features?|capabilities|abilities|skills)|how\s?(can|do)\s?you\s?help/i],
    agree:      [/^(yes|yeah|yep|yup|sure|ok|okay|alright|absolutely|definitely|correct|right|exactly|indeed)[!.,\s]*/i],
    disagree:   [/^(no|nope|nah|not\s?really|disagree)[!.,\s]*/i],
    tellJoke:   [/tell\s?(me\s+)?(a\s+)?joke|make\s+me\s+laugh|say\s+something\s+funny|humor\s+me/i],
    compliment: [/you'?re?\s+(great|awesome|cool|amazing|smart|helpful|the\s+best|fantastic)|love\s+you|i\s+like\s+you/i],
    bored:      [/i'?m?\s+(bored|idle)|nothing\s+to\s+do|entertain\s+me/i],
    gkTest:     [/quiz\s?me|test\s?me|ask\s?me\s?(a\s+)?(question|gk|quiz)|practice\s+(gk|questions)/i],
    sumRequest: [/\b(summarize|summarise|summary|tldr|tl;dr|brief|shorten|condense|key\s?points|main\s?points|extract)\b/i],
    question:   [/^(what|who|how|why|when|where|which|is|are|was|were|can|could|would|should|do|does|did|have|has|name|tell|give)\b/i],
  };

  const R = {
    greetFirst: [
      "Hey there! 👋 So great to have you here! How are you doing today?",
      "Hello! 😊 Welcome! I'm Nova — how are you doing?",
      "Hi! 🌟 Glad you stopped by! How's everything going?",
      "Hey! So happy you're here 😄 How are you doing today?",
    ],
    greetReturn: [
      "Hey again! 😊 Great to see you back! What can I help with?",
      "Oh hey! 👋 You're back! How's it going?",
      "Welcome back! Hope you've been doing well 😄 What are we working on?",
    ],
    farewell: [
      "Bye! Take care! 👋 Come back anytime!",
      "See you! It was so nice chatting 😊 Don't be a stranger!",
      "Goodbye! Hope I was helpful ✨ Come back whenever you need!",
      "Take care! 👋 It was a pleasure. Nova out!",
    ],
    thanks: [
      "Aww, you're so welcome! 😊 Happy to help anytime!",
      "My pleasure! 😄 That's what I'm here for ✨",
      "No problem at all! 🙌 You just made my day!",
      "Glad I could help! 😊 Come back whenever you need!",
    ],
    userGood: [
      "That's so great to hear! 😄 Now — what can I help you with? Ask me a GK question or paste text to summarize!",
      "Wonderful! 🌟 Positive energy! What can I do for you today?",
      "Love that! 😊 Ready to help — GK questions, summaries, or anything else?",
    ],
    userBad: [
      "Aw, I'm really sorry 💙 Hope things look up! I'm here — want me to quiz you on GK or summarize something?",
      "Oh no 😢 Sending you good vibes! Here if you need anything!",
      "Sorry to hear that 💙 Hang in there! What can I do to help?",
    ],
    howAreYou: [
      "Running at full power! 🚀 GK database loaded, NLP ready. How about you?",
      "Doing fantastically! ⚡ GK engine humming. How are you?",
      "Never better! 😄 All algorithms firing. How are YOU doing?",
    ],
    agree: ["Perfect! 😊 What can I do for you?", "Great! Ready whenever you need me ✨", "Awesome! Let's get to work ⚡"],
    disagree: ["No worries! 😊 Tell me what you'd like instead!", "Fair enough! What would you prefer?"],
    jokes: [
      "Why don't scientists trust atoms? Because they make up everything! 😂",
      "Why did the NLP engine go to therapy? Too many unresolved tokens. 😄",
      "Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂",
      "I asked my summarizer for a joke. It gave me the punchline and cut the rest. Just efficiency. 😄",
    ],
    compliment: [
      "Aww, you're making me blush! 😊💜 You're pretty great too!",
      "That means a lot! 🤗 You just made my day! You're awesome!",
    ],
    bored: [
      "Bored? Let me fix that! 🎯 Ask me a GK question — I have knowledge from the SSC SmartBook! Or paste any text to summarize!",
      "Challenge accepted! 😄 Ask me 'quiz me' for a GK question, or paste any article!",
    ],
    gkTest: [], // handled dynamically
    unknown: [
      "Hmm, not sure what you mean! 🤔 Try asking a GK question, or paste text to summarize!",
      "I didn't quite catch that 😅 I can answer GK questions or summarize text — what do you need?",
    ],
  };

  // ── Random GK quiz question
  const getRandomGKQuestion = () => {
    const entry = GK_KB[Math.floor(Math.random() * GK_KB.length)];
    // Pull question from keywords as a rough question
    const q = entry.k.replace(/\b(which|who|what|where|when|whose|name)\b/gi,"").trim();
    return { entry, q };
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ── Main respond function
  const respond = (input) => {
    const intent = detect(input);
    const wc = input.trim().split(/\s+/).length;
    ctx.lastIntent = intent;

    switch (intent) {
      case "greet": {
        const resp = ctx.greeted ? pick(R.greetReturn) : pick(R.greetFirst);
        ctx.greeted = true; ctx.greetCount++;
        return { kind:"text", text:resp };
      }
      case "userGood":  ctx.userMood="good"; return { kind:"text", text:pick(R.userGood) };
      case "userBad":   ctx.userMood="bad";  return { kind:"text", text:pick(R.userBad) };
      case "farewell":  return { kind:"text", text:pick(R.farewell) };
      case "thanks":    return { kind:"text", text:pick(R.thanks) };
      case "howAreYou": return { kind:"text", text:pick(R.howAreYou) };
      case "agree":     return { kind:"text", text:pick(R.agree) };
      case "disagree":  return { kind:"text", text:pick(R.disagree) };
      case "tellJoke":  return { kind:"text", text:pick(R.jokes) };
      case "compliment":return { kind:"text", text:pick(R.compliment) };
      case "bored":     return { kind:"text", text:pick(R.bored) };

      case "gkTest": {
        const { entry, q } = getRandomGKQuestion();
        return { kind:"gkQuiz", question: entry.k, answer: entry.a, fact: entry.f, topic: entry.t };
      }

      case "whoAreYou":
        return { kind:"text", text:"I'm Nova ⚡ — an offline AI engine with a built-in GK knowledge base!\n\n🔬 **Powered by:**\n• TF-IDF + TextRank NLP\n• Levenshtein fuzzy matching\n• Porter Stemmer\n• **SSC SmartBook GK Database** 📚\n\n📖 **I can answer questions from:**\n• Ancient History · Medieval History\n• Modern History · Indian Geography\n• Polity · Economics · Physics\n• Chemistry · Biology · Static GK\n\nZero API. Zero server. All local! 🛡️" };

      case "canYouDo":
        return { kind:"text", text:"Here's what I can do! 😊\n\n📄 **Summarize** any text → crisp key lines\n🧠 **Answer GK questions** from SSC SmartBook database\n🎯 **Quiz you** — say 'quiz me' for a random GK question!\n💬 **Chat** — small talk, jokes, questions\n🔍 **TextRank** extraction — smartest sentences first\n\nPaste any text, ask any GK question, or say 'quiz me'! ✨" };

      case "sumRequest": {
        const cleaned = input.replace(/^.*?(summarize|summarise|brief|shorten|condense|summary\s?of|tldr[:\s]*)\s*/i,"").trim();
        if (cleaned.split(/\s+/).length < 20) {
          return { kind:"text", text:"Sure! 📄 Paste the text you'd like me to summarize!" };
        }
        return { kind:"summary", ...summarize(cleaned) };
      }

      case "question": {
        // Try GK first
        if (isGKQuestion(input)) {
          const gkResult = searchGK(input);
          if (gkResult) {
            return { kind:"gkAnswer", answer:gkResult.entry.a, fact:gkResult.entry.f, topic:gkResult.entry.t, score:gkResult.score };
          }
        }
        return { kind:"text", text:"Good question! 🤔 I'm best at GK questions from History, Geography, Polity and Science. Try asking something like 'Who wrote Indica?' or paste long text to summarize! 📝" };
      }

      case "autoSummarize":
      case "longEnough": {
        const result = summarize(input);
        return { kind:"summary", ...result, originalWC:wc };
      }

      default: {
        // Always try GK search for unknown intents with question-like input
        if (wc >= 3 && wc <= 40 && isGKQuestion(input)) {
          const gkResult = searchGK(input);
          if (gkResult) {
            return { kind:"gkAnswer", answer:gkResult.entry.a, fact:gkResult.entry.f, topic:gkResult.entry.t, score:gkResult.score };
          }
        }
        if (wc >= 50) return { kind:"summary", ...summarize(input), originalWC:wc };
        return { kind:"text", text:pick(R.unknown) };
      }
    }
  };

  const detect = (input) => {
    const t = input.trim();
    for (const [intent, pats] of Object.entries(PATTERNS)) {
      if (pats.some(p => p.test(t))) return intent;
    }
    const words = t.toLowerCase().split(/\s+/);
    const sumKeywords = ["summarize","summarise","summary","condense","shorten","tldr"];
    if (words.some(w => w.length>=4 && fuzzyMatch(w, sumKeywords, 2))) return "sumRequest";
    const wc = t.split(/\s+/).length;
    if (wc >= 50) return "autoSummarize";
    if (wc >= 20) return "longEnough";
    return "unknown";
  };

  return { respond, summarize };
})();

// ════════════════════════════════════════════════════════
//   NOVA UI
// ════════════════════════════════════════════════════════

const CHIPS = [
  "Hey Nova! 👋",
  "Quiz me on GK 🎯",
  "Who wrote Indica?",
  "What can you do?",
];

export default function NovaApp() {
  const [msgs, setMsgs] = useState([{
    id:0, role:"nova", kind:"text",
    text:"Hey! 👋 I'm **Nova v3.0** — your offline AI engine.\n\nI can now **answer GK questions** from the SSC SmartBook (Ancient History, Polity, Geography & more), **summarize** any text, and chat!\n\nTry asking me a history question — or say **'quiz me'** for a random GK challenge! 📚",
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoad]    = useState(false);
  const [chipsV, setChipsV]   = useState(true);
  const [quizState, setQuiz]  = useState(null); // {answer, revealed}
  const endRef = useRef(null);
  const taRef  = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const send = useCallback((text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput(""); setChipsV(false); setQuiz(null);
    if (taRef.current) taRef.current.style.height = "auto";
    setMsgs(prev => [...prev, { id:Date.now(), role:"user", kind:"text", text:t }]);
    setLoad(true);
    setTimeout(() => {
      const resp = NovaEngine.respond(t);
      setMsgs(prev => [...prev, { id:Date.now()+1, role:"nova", ...resp }]);
      setLoad(false);
    }, 450 + Math.random() * 400);
  }, [input, loading]);

  const onKey = (e) => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const resize = (e) => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,130)+"px"; };

  return (
    <div style={S.root}>
      <div style={S.glow1}/><div style={S.glow2}/>
      <header style={S.header}>
        <div style={S.headerOrb}>⚡</div>
        <div>
          <div style={S.headerTitle}>Nova Engine</div>
          <div style={S.headerSub}>🟢 GK Brain Active · SSC SmartBook Database · No API</div>
        </div>
        <div style={S.offlineBadge}>v3.0 GK+NLP</div>
      </header>

      <div style={S.feed}>
        {msgs.map((m,i) => <Bubble key={m.id} msg={m} isNew={i===msgs.length-1} onSend={send} />)}
        {loading && <TypingBubble />}
        {chipsV && msgs.length===1 && (
          <div style={S.chips}>
            {CHIPS.map(c=>(
              <button key={c} style={S.chip}
                onMouseEnter={e=>Object.assign(e.target.style,{background:"rgba(139,92,246,.18)",color:"#c4b5fd",borderColor:"rgba(139,92,246,.5)"})}
                onMouseLeave={e=>Object.assign(e.target.style,{background:S.chip.background,color:S.chip.color,borderColor:S.chip.border})}
                onClick={()=>send(c)}>{c}</button>
            ))}
          </div>
        )}
        <div ref={endRef}/>
      </div>

      <div style={S.inputWrap}>
        <div style={S.inputBox}>
          <textarea ref={taRef} value={input}
            onChange={e=>{setInput(e.target.value);resize(e);}}
            onKeyDown={onKey}
            placeholder="Ask a GK question, say 'quiz me', or paste text to summarize…"
            rows={1} style={S.textarea}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading}
            style={{...S.sendBtn,...(input.trim()&&!loading?S.sendActive:{})}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div style={S.footer}>NOVA ENGINE v3.0 · SSC GK Database · TF-IDF+TextRank · Zero API</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes glow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        textarea::-webkit-scrollbar{width:2px} textarea::-webkit-scrollbar-thumb{background:rgba(139,92,246,.3);border-radius:99px}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(139,92,246,.2);border-radius:99px}
      `}</style>
    </div>
  );
}

function Bubble({ msg, isNew, onSend }) {
  const isNova = msg.role==="nova";
  return (
    <div style={{...S.row,...(isNova?S.rowNova:S.rowUser),...(isNew?{animation:"fadeUp .3s ease both"}:{})}}>
      {isNova && (<div style={S.novaLabel}><span style={S.novaOrb}>⚡</span><span style={S.novaNm}>NOVA</span></div>)}
      {msg.kind==="summary"   && <SummaryCard {...msg}/>}
      {msg.kind==="gkAnswer"  && <GKAnswerCard {...msg}/>}
      {msg.kind==="gkQuiz"    && <GKQuizCard {...msg} onSend={onSend}/>}
      {msg.kind==="text"      && <TextBubble text={msg.text} isUser={!isNova}/>}
    </div>
  );
}

function TextBubble({ text, isUser }) {
  const lines = text.split("\n");
  return (
    <div style={{...S.bubble,...(isUser?S.bubbleUser:S.bubbleNova)}}>
      {lines.map((line,i)=>{
        const parts=line.split(/(\*\*[^*]+\*\*)/g);
        return (<span key={i}>
          {parts.map((p,j)=>p.startsWith("**")&&p.endsWith("**")
            ?<strong key={j} style={{color:isUser?"#fff":"#c4b5fd"}}>{p.slice(2,-2)}</strong>:p)}
          {i<lines.length-1&&<br/>}
        </span>);
      })}
    </div>
  );
}

function GKAnswerCard({ answer, fact, topic, score }) {
  const [copied, setCopied] = useState(false);
  const confidence = score >= 0.7 ? "High" : score >= 0.5 ? "Good" : "Approximate";
  const confColor  = score >= 0.7 ? "#34d399" : score >= 0.5 ? "#fbbf24" : "#f87171";

  return (
    <div style={{...S.card, animation:"slideIn .35s ease both"}}>
      <div style={S.cardHead}>
        <div style={S.cardHeadLeft}>
          <span style={{fontSize:".85rem"}}>📚</span>
          <span style={S.cardLabel}>GK Answer</span>
          <span style={{...S.reducedBadge, background:`${confColor}18`, color:confColor, borderColor:`${confColor}44`}}>
            {confidence} Match
          </span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={S.statBadge}>{topic}</span>
          <button style={{...S.copyBtn,...(copied?S.copyDone:{})}}
            onClick={()=>{try{navigator.clipboard.writeText(answer);}catch(_){}setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
            {copied?"✓ Copied":"Copy"}
          </button>
        </div>
      </div>
      <div style={{padding:"12px 16px"}}>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#c4b5fd",marginBottom:10}}>{answer}</div>
        <div style={{fontSize:".82rem",lineHeight:1.7,color:"#a0a0c8"}}>{fact}</div>
      </div>
      <div style={S.cardFoot}>
        <span>📖 SSC SmartBook · Testbook × S.Chand</span>
        <span style={{color:"#34d399"}}>✓ GK Database Match</span>
      </div>
    </div>
  );
}

function GKQuizCard({ question, answer, fact, topic, onSend }) {
  const [revealed, setRevealed] = useState(false);
  // Make question readable
  const readable = question.replace(/\b(which|who|what|where|when|name the|give the)\b/gi,"").trim();
  const display  = readable.charAt(0).toUpperCase() + readable.slice(1) + "?";

  return (
    <div style={{...S.card, animation:"slideIn .35s ease both"}}>
      <div style={S.cardHead}>
        <div style={S.cardHeadLeft}>
          <span style={{fontSize:".85rem"}}>🎯</span>
          <span style={S.cardLabel}>GK Quiz</span>
          <span style={S.reducedBadge}>{topic}</span>
        </div>
      </div>
      <div style={{padding:"14px 16px"}}>
        <div style={{fontSize:".95rem",color:"#eaeaf8",marginBottom:14,lineHeight:1.6}}>{display}</div>
        {!revealed
          ? <button onClick={()=>setRevealed(true)} style={{...S.copyBtn,padding:"8px 18px",fontSize:".78rem"}}>
              Reveal Answer 👁️
            </button>
          : <div style={{animation:"slideIn .3s ease both"}}>
              <div style={{fontSize:"1rem",fontWeight:700,color:"#34d399",marginBottom:8}}>✅ {answer}</div>
              <div style={{fontSize:".8rem",lineHeight:1.7,color:"#a0a0c8"}}>{fact}</div>
              <button onClick={()=>onSend("quiz me")} style={{...S.copyBtn,marginTop:12,padding:"7px 16px",fontSize:".75rem"}}>
                Next Question 🎯
              </button>
            </div>
        }
      </div>
      <div style={S.cardFoot}>
        <span>📖 SSC SmartBook Database</span>
        <span style={{color:"#8b5cf6"}}>GK Quiz Mode</span>
      </div>
    </div>
  );
}

function SummaryCard({ summary, reduced, originalWC, summaryWC }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <div style={S.cardHeadLeft}>
          <span style={{fontSize:".85rem"}}>📄</span>
          <span style={S.cardLabel}>Summary</span>
          {reduced>0&&<span style={S.reducedBadge}>↓ {reduced}% shorter</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {originalWC&&<span style={S.statBadge}>{originalWC} → {summaryWC} words</span>}
          <button style={{...S.copyBtn,...(copied?S.copyDone:{})}}
            onClick={()=>{try{navigator.clipboard.writeText(summary);}catch(_){}setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
            {copied?"✓ Copied":"Copy"}
          </button>
        </div>
      </div>
      <div style={S.cardBody}>{summary}</div>
      {summaryWC&&<div style={S.cardFoot}>
        <span>⏱ ~{Math.max(1,Math.round(summaryWC/200))} min read</span>
        <span style={{color:"#34d399"}}>✓ TextRank extracted</span>
      </div>}
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{...S.row,...S.rowNova,animation:"fadeUp .25s ease both"}}>
      <div style={S.novaLabel}><span style={S.novaOrb}>⚡</span><span style={S.novaNm}>NOVA</span></div>
      <div style={{...S.bubble,...S.bubbleNova,padding:"12px 18px"}}>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {[0,1,2].map(i=>(
            <span key={i} style={{display:"block",width:6,height:6,borderRadius:"50%",background:"#8b5cf6",
              animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  root:{minHeight:"100vh",maxHeight:"100vh",background:"#060610",display:"flex",flexDirection:"column",fontFamily:"'Sora', sans-serif",color:"#eaeaf8",position:"relative",overflow:"hidden"},
  glow1:{position:"fixed",top:-120,left:-120,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(91,33,182,.18) 0%, transparent 70%)",pointerEvents:"none",animation:"glow 5s ease-in-out infinite"},
  glow2:{position:"fixed",bottom:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%)",pointerEvents:"none",animation:"glow 7s 2s ease-in-out infinite"},
  header:{padding:"14px 20px",borderBottom:"1px solid rgba(139,92,246,.15)",background:"rgba(6,6,16,.9)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:20,flexShrink:0},
  headerOrb:{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",boxShadow:"0 0 24px rgba(139,92,246,.5)"},
  headerTitle:{fontWeight:800,fontSize:"1.05rem",letterSpacing:"-.3px",background:"linear-gradient(135deg, #c4b5fd, #8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},
  headerSub:{fontSize:".62rem",color:"#6060a0",marginTop:2,letterSpacing:".3px"},
  offlineBadge:{marginLeft:"auto",fontSize:".58rem",fontWeight:800,letterSpacing:".8px",color:"#8b5cf6",background:"rgba(139,92,246,.1)",border:"1px solid rgba(139,92,246,.3)",borderRadius:99,padding:"4px 12px",fontFamily:"'DM Mono', monospace"},
  feed:{flex:1,overflowY:"auto",padding:"20px 16px 10px",display:"flex",flexDirection:"column",gap:12,maxWidth:780,width:"100%",margin:"0 auto",alignSelf:"center"},
  row:{display:"flex",flexDirection:"column"},
  rowNova:{alignItems:"flex-start"},
  rowUser:{alignItems:"flex-end"},
  novaLabel:{display:"flex",alignItems:"center",gap:6,marginBottom:5},
  novaOrb:{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg, #4c1d95, #8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".65rem",boxShadow:"0 0 10px rgba(139,92,246,.4)"},
  novaNm:{fontSize:".62rem",fontWeight:800,color:"#8b5cf6",letterSpacing:".8px",fontFamily:"'DM Mono', monospace"},
  bubble:{maxWidth:"82%",fontSize:".875rem",lineHeight:1.65,wordBreak:"break-word",whiteSpace:"pre-wrap"},
  bubbleUser:{padding:"11px 16px",background:"linear-gradient(155deg, #3a1070 0%, #5f24c0 55%, #7844da 100%)",borderRadius:"18px 18px 4px 18px",color:"#fff",boxShadow:"0 4px 20px rgba(109,40,217,.4)"},
  bubbleNova:{padding:"11px 16px",background:"rgba(139,92,246,.07)",border:"1px solid rgba(139,92,246,.14)",borderRadius:"4px 18px 18px 18px",color:"#ddd6fe"},
  card:{width:"100%",maxWidth:680,background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.22)",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.4)"},
  cardHead:{padding:"10px 16px",background:"linear-gradient(135deg, rgba(91,33,182,.2), rgba(139,92,246,.12))",borderBottom:"1px solid rgba(139,92,246,.18)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},
  cardHeadLeft:{display:"flex",alignItems:"center",gap:8},
  cardLabel:{fontSize:".68rem",fontWeight:800,color:"#a78bfa",letterSpacing:".6px",textTransform:"uppercase",fontFamily:"'DM Mono', monospace"},
  reducedBadge:{fontSize:".6rem",fontWeight:700,background:"rgba(52,211,153,.15)",color:"#34d399",border:"1px solid rgba(52,211,153,.3)",borderRadius:99,padding:"2px 9px"},
  statBadge:{fontSize:".58rem",color:"#7070b0",fontFamily:"'DM Mono', monospace",background:"rgba(255,255,255,.04)",borderRadius:6,padding:"2px 7px"},
  copyBtn:{background:"none",border:"1px solid rgba(139,92,246,.35)",borderRadius:8,color:"#8b5cf6",fontSize:".65rem",fontWeight:700,cursor:"pointer",padding:"4px 12px",fontFamily:"'Sora', sans-serif",transition:"all .2s"},
  copyDone:{borderColor:"rgba(52,211,153,.5)",color:"#34d399"},
  cardBody:{padding:"14px 16px",fontSize:".9rem",lineHeight:1.72,color:"#eaeaf8",whiteSpace:"pre-wrap",wordBreak:"break-word"},
  cardFoot:{padding:"8px 16px",borderTop:"1px solid rgba(139,92,246,.12)",background:"rgba(0,0,0,.2)",display:"flex",justifyContent:"space-between",fontSize:".62rem",color:"#6060a0",fontFamily:"'DM Mono', monospace",letterSpacing:".2px"},
  chips:{display:"flex",flexWrap:"wrap",gap:8,padding:"4px 0 8px",animation:"fadeUp .4s .2s ease both",animationFillMode:"forwards",opacity:0},
  chip:{padding:"7px 16px",borderRadius:99,border:"1px solid rgba(139,92,246,.28)",background:"rgba(139,92,246,.07)",color:"#a78bfa",fontSize:".78rem",fontWeight:600,cursor:"pointer",fontFamily:"'Sora', sans-serif",transition:"all .2s"},
  inputWrap:{padding:"12px 16px 16px",borderTop:"1px solid rgba(139,92,246,.12)",background:"rgba(6,6,16,.95)",maxWidth:780,width:"100%",margin:"0 auto",alignSelf:"center",flexShrink:0},
  inputBox:{display:"flex",alignItems:"flex-end",gap:10,background:"rgba(139,92,246,.06)",border:"1px solid rgba(139,92,246,.22)",borderRadius:18,padding:"10px 10px 10px 16px"},
  textarea:{flex:1,background:"transparent",border:"none",outline:"none",color:"#eaeaf8",fontSize:".875rem",fontFamily:"'Sora', sans-serif",resize:"none",lineHeight:1.6,maxHeight:130,overflowY:"auto"},
  sendBtn:{width:38,height:38,borderRadius:"50%",background:"rgba(139,92,246,.15)",border:"1px solid rgba(139,92,246,.25)",color:"#6464a4",display:"flex",alignItems:"center",justifyContent:"center",cursor:"not-allowed",flexShrink:0,transition:"all .2s"},
  sendActive:{background:"linear-gradient(135deg, #5c16c4, #8b5cf6)",border:"none",color:"#fff",cursor:"pointer",boxShadow:"0 4px 16px rgba(139,92,246,.45)"},
  footer:{textAlign:"center",fontSize:".58rem",color:"#30304a",marginTop:8,letterSpacing:".4px",fontFamily:"'DM Mono', monospace"},
};
