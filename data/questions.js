/**
 * ============================================================================
 * BANQUE DE QUESTIONS & QUIZ — MARSEILLE PROVENCE HANDBALL (MPHB)
 * Stage Multisport de Noël — Le Grand Quiz du Handball
 * ============================================================================
 *
 * Ce fichier contient toutes les catégories, questions et quiz par défaut.
 * Il est chargé automatiquement par le site (même sans connexion Internet).
 *
 * ASTUCE POUR LES ANIMATEURS :
 * Vous pouvez modifier, ajouter ou supprimer des questions et créer des quiz
 * directement depuis l'interface du site via le bouton « MODE ANIMATEUR / ADMIN » !
 * Vous pouvez aussi modifier ce fichier avec un simple éditeur de texte (Bloc-notes).
 *
 * Rappel des champs d'une question :
 * - id          : Identifiant unique (ex: "q1")
 * - category    : "regles" | "terrain" | "technique" | "arbitrage"
 * - level       : "facile" (6-9 ans) | "moyen" (10-14 ans)
 * - illustration: "court" | "referee" | "goalie" | "shot" | "dribble" | "pass" | "players" | "christmas"
 * - question    : L'énoncé de la question posée aux enfants
 * - options     : Tableau de 4 réponses possibles (exactement 4)
 * - correctIndex: Numéro de la bonne réponse (0 = 1ère, 1 = 2ème, 2 = 3ème, 3 = 4ème)
 * - explanation : Explication pédagogique claire et conforme aux règles officielles FFHandball / IHF
 */

window.MPHB_CATEGORIES = [
  {
    id: "regles",
    name: "Les règles du handball",
    shortName: "Règles",
    icon: "📋",
    color: "#0055A4",
    description: "Pas, dribble, zone, engagement, 7 mètres et fonctionnement du jeu."
  },
  {
    id: "terrain",
    name: "Le terrain et les joueurs",
    shortName: "Terrain & Joueurs",
    icon: "🏟️",
    color: "#0284C7",
    description: "Dimensions, lignes du terrain, gardien, ailiers, arrières et pivot."
  },
  {
    id: "technique",
    name: "Les gestes techniques",
    shortName: "Gestes Techniques",
    icon: "🤾",
    color: "#D97706",
    description: "La passe, le tir, le dribble, la réception, la défense et les déplacements."
  },
  {
    id: "arbitrage",
    name: "L'arbitrage",
    shortName: "Arbitrage",
    icon: "🟨",
    color: "#E63946",
    description: "Les principales fautes, les gestes de l'arbitre, les cartons et remises en jeu."
  }
];

window.INITIAL_QUESTIONS = [
  // ==========================================================================
  // CATÉGORIE 1 — LES RÈGLES DU HANDBALL (12 questions)
  // ==========================================================================
  {
    id: "reg_01",
    category: "regles",
    level: "facile",
    illustration: "players",
    question: "Combien de joueurs d'une même équipe sont présents sur le terrain en même temps ?",
    options: [
      "5 joueurs (4 joueurs + 1 gardien)",
      "7 joueurs (6 joueurs de champ + 1 gardien)",
      "11 joueurs (10 joueurs + 1 gardien)",
      "9 joueurs (8 joueurs + 1 gardien)"
    ],
    correctIndex: 1,
    explanation: "Au handball, une équipe joue à 7 sur le terrain : 6 joueurs de champ (qui attaquent et défendent) et 1 gardien de but. Il y a donc 14 joueurs au total sur le terrain avec les deux équipes !"
  },
  {
    id: "reg_02",
    category: "regles",
    level: "facile",
    illustration: "dribble",
    question: "Combien de pas au maximum peut-on faire avec le ballon dans les mains sans dribbler ?",
    options: [
      "2 pas maximum",
      "3 pas maximum",
      "5 pas maximum",
      "Autant de pas que l'on veut"
    ],
    correctIndex: 1,
    skeleton: "steps",
    explanation: "La règle d'or du handball est celle des 3 pas ! Avec le ballon en main, tu peux faire au maximum 3 pas avant de dribbler, passer ou tirer. Si tu fais un 4e pas, l'arbitre siffle un « marcher »."
  },
  {
    id: "reg_03",
    category: "regles",
    level: "facile",
    illustration: "referee",
    question: "Combien de temps au maximum peut-on garder le ballon dans les mains sans dribbler ni bouger ?",
    options: [
      "3 secondes maximum",
      "5 secondes maximum",
      "10 secondes maximum",
      "30 secondes maximum"
    ],
    correctIndex: 0,
    explanation: "C'est la règle des « 3 secondes » ! Même si tu es complètement arrêté, tu ne peux pas garder le ballon plus de 3 secondes dans les mains sans le dribbler, le passer à un coéquipier ou tirer au but."
  },
  {
    id: "reg_04",
    category: "regles",
    level: "facile",
    illustration: "dribble",
    question: "Qu'est-ce qu'une « reprise de dribble » au handball ?",
    options: [
      "Quand on passe le ballon à un coéquipier qui se met à dribbler",
      "Quand on dribble, qu'on s'arrête en tenant le ballon, puis qu'on recommence à dribbler",
      "Quand on change de main pendant que le ballon rebondit",
      "Quand on récupère le ballon après un arrêt du gardien"
    ],
    correctIndex: 1,
    explanation: "Si tu dribbles puis que tu bloques ou tiens le ballon à une ou deux mains, ton dribble est terminé ! Tu dois alors passer ou tirer. Si tu recommences à dribbler, c'est une faute appelée « reprise de dribble »."
  },
  {
    id: "reg_05",
    category: "regles",
    level: "facile",
    illustration: "court",
    question: "Qu'est-ce que « la zone » au handball ?",
    options: [
      "Le rond central au milieu du terrain",
      "L'espace réservé aux remplaçants sur le côté",
      "La surface de but située devant chaque cage (à 6 mètres), réservée au gardien",
      "Le couloir le long de la ligne de touche"
    ],
    correctIndex: 2,
    explanation: "La zone (ou surface de but) est l'espace délimité par la ligne continue à 6 mètres du but. Seul le gardien de but a le droit d'y marcher et d'y rester !"
  },
  {
    id: "reg_06",
    category: "regles",
    level: "moyen",
    illustration: "shot",
    question: "Que se passe-t-il si un attaquant pose le pied dans la zone de 6 mètres avant d'avoir tiré ?",
    options: [
      "Le but est quand même accordé",
      "C'est empiètement en zone : le but est refusé et le gardien adverse récupère le ballon",
      "L'attaquant reçoit un carton rouge direct",
      "On recommence le tir depuis le milieu du terrain"
    ],
    correctIndex: 1,
    explanation: "Un joueur de champ n'a pas le droit de toucher le sol de la zone ! En revanche, il a le droit de sauter AVANT la ligne des 6 mètres, de tirer pendant qu'il est en l'air, puis de retomber dans la zone après avoir lâché le ballon."
  },
  {
    id: "reg_07",
    category: "regles",
    level: "facile",
    illustration: "shot",
    question: "Qu'est-ce qu'un « jet de 7 mètres » ?",
    options: [
      "Une touche jouée à 7 mètres du coin du terrain",
      "Le penalty du handball : un tir direct face au gardien à 7 mètres du but",
      "Une passe obligatoire de 7 mètres minimum",
      "Un tir qui rapporte 7 points d'un coup"
    ],
    correctIndex: 1,
    explanation: "Le jet de 7 mètres est l'équivalent du penalty ! L'arbitre l'accorde quand une faute empêche une occasion franche de marquer un but. Le tireur se place derrière la ligne des 7 mètres face au gardien seul."
  },
  {
    id: "reg_08",
    category: "regles",
    level: "facile",
    illustration: "court",
    question: "Qu'est-ce qu'un « engagement » et où s'effectue-t-il ?",
    options: [
      "C'est la mise en jeu au centre du terrain au début des mi-temps et après chaque but",
      "C'est le dégagement du gardien depuis sa zone",
      "C'est la poignée de main avec l'arbitre à la fin du match",
      "C'est une remise en jeu depuis le coin du terrain"
    ],
    correctIndex: 0,
    explanation: "L'engagement permet de lancer le jeu au début de chaque mi-temps et de relancer le match après chaque but encaissé. Il se joue au coup de sifflet de l'arbitre, au milieu de la ligne centrale !"
  },
  {
    id: "reg_09",
    category: "regles",
    level: "moyen",
    illustration: "referee",
    question: "Que signifie une « exclusion de 2 minutes » ?",
    options: [
      "Le match s'arrête pendant 2 minutes pour tout le monde",
      "Le joueur fautif sort sur le banc pendant 2 minutes et son équipe joue avec un joueur en moins",
      "L'équipe adverse a 2 minutes pour marquer un but sans gardien",
      "Le joueur doit courir autour du terrain pendant 2 minutes"
    ],
    correctIndex: 1,
    explanation: "Lorsqu'un joueur commet une faute importante ou un mauvais geste, l'arbitre lève deux doigts : le joueur doit sortir pendant 2 minutes de temps de jeu. Son équipe joue donc à 6 contre 7 pendant ces 2 minutes !"
  },
  {
    id: "reg_10",
    category: "regles",
    level: "facile",
    illustration: "players",
    question: "Avec quelles parties du corps un joueur de champ a-t-il INTERDICTION de toucher le ballon ?",
    options: [
      "Avec la paume des mains",
      "Avec le bout des doigts",
      "Avec les pieds ou les jambes en dessous du genou",
      "Avec les deux mains en même temps"
    ],
    correctIndex: 2,
    explanation: "« Handball » veut dire « ballon à la main » ! Les joueurs de champ n'ont pas le droit de toucher volontairement le ballon avec le pied ou la jambe en dessous du genou. Seul le gardien peut utiliser ses pieds pour arrêter un tir dans sa zone !"
  },
  {
    id: "reg_11",
    category: "regles",
    level: "facile",
    illustration: "goalie",
    question: "À quel moment précis un but est-il validé au handball ?",
    options: [
      "Dès que le ballon touche le filet ou le poteau",
      "Quand le ballon a franchi ENTIÈREMENT la ligne de but entre les deux poteaux",
      "Quand la moitié du ballon dépasse la ligne de but",
      "Quand le gardien touche le ballon avec ses mains"
    ],
    correctIndex: 1,
    explanation: "Pour que le but soit accordé (sans faute préalable de l'attaquant), le ballon doit avoir dépassé entièrement la ligne de but tracée au sol entre les poteaux et sous la barre transversale."
  },
  {
    id: "reg_12",
    category: "regles",
    level: "moyen",
    illustration: "players",
    question: "Comment se passent les remplacements de joueurs pendant un match de handball ?",
    options: [
      "Il faut obligatoirement demander à l'arbitre d'arrêter le match",
      "On ne peut faire des changements qu'à la mi-temps",
      "Les remplacements sont libres et illimités dans la zone de changement, dès que le joueur remplacé est sorti",
      "Un joueur sorti n'a plus jamais le droit de revenir en jeu"
    ],
    correctIndex: 2,
    explanation: "Au handball, les changements se font à tout moment sans arrêter le jeu ! La seule règle : le joueur qui sort doit avoir franchi la ligne de touche dans sa zone de changement AVANT que le remplaçant n'entre sur le terrain."
  },

  // ==========================================================================
  // CATÉGORIE 2 — LE TERRAIN ET LES JOUEURS (12 questions)
  // ==========================================================================
  {
    id: "ter_01",
    category: "terrain",
    level: "moyen",
    illustration: "court",
    question: "Quelles sont les dimensions officielles d'un terrain de handball ?",
    options: [
      "20 mètres de long sur 10 mètres de large",
      "40 mètres de long sur 20 mètres de large",
      "100 mètres de long sur 50 mètres de large",
      "60 mètres de long sur 30 mètres de large"
    ],
    correctIndex: 1,
    explanation: "Un terrain de handball officiel est un grand rectangle de 40 mètres de longueur sur 20 mètres de largeur, coupé en deux parties égales de 20m × 20m par la ligne médiane."
  },
  {
    id: "ter_02",
    category: "terrain",
    level: "facile",
    illustration: "goalie",
    question: "Quel est le rôle principal et le privilège unique du gardien de but ?",
    options: [
      "Il doit rester assis dans son but pendant tout le match",
      "Il protège son but, est seul autorisé dans la zone de 6m et peut arrêter le ballon même avec les pieds",
      "Il n'a pas le droit de toucher le ballon avec les mains",
      "Il est obligé de marquer au moins un but par match"
    ],
    correctIndex: 1,
    explanation: "Le gardien de but est le dernier rempart de l'équipe ! Dans sa zone de 6 mètres, il a le droit d'utiliser toutes les parties de son corps (mains, bras, torse, jambes et pieds) pour défendre sa cage."
  },
  {
    id: "ter_03",
    category: "terrain",
    level: "facile",
    illustration: "players",
    question: "Où évoluent les « ailiers » (ailier gauche et ailier droit) et quel est leur rôle ?",
    options: [
      "Au milieu du terrain, ils ne dépassent jamais la ligne centrale",
      "Sur les côtés du terrain près des lignes de touche, ils sont rapides et tirent depuis les coins",
      "Dans les cages à côté du gardien de but",
      "Uniquement sur le banc des remplaçants"
    ],
    correctIndex: 1,
    explanation: "Les ailiers jouent dans les couloirs extérieurs, près des lignes de touche et des coins du terrain. Très rapides et agiles, ils partent souvent en contre-attaque et sautent vers le but pour ouvrir leur angle de tir !"
  },
  {
    id: "ter_04",
    category: "terrain",
    level: "moyen",
    illustration: "players",
    question: "Comment appelle-t-on le joueur placé au centre de l'attaque qui organise le jeu comme un chef d'orchestre ?",
    options: [
      "Le demi-centre",
      "Le libéro",
      "Le gardien volant",
      "L'avant-centre"
    ],
    correctIndex: 0,
    explanation: "Le demi-centre joue au milieu de la base arrière, face au but. C'est le meneur de jeu de l'équipe : il annonce les combinaisons, distribue les passes aux arrières, aux ailiers ou au pivot, et attaque les intervalles !"
  },
  {
    id: "ter_05",
    category: "terrain",
    level: "facile",
    illustration: "shot",
    question: "Quel est le rôle des « arrières » (arrière gauche et arrière droit) au handball ?",
    options: [
      "Ils restent toujours derrière leur propre gardien de but",
      "Placés entre le demi-centre et les ailiers, ils font circuler la balle, attaquent la défense et tirent souvent de loin",
      "Ils ramassent les ballons derrière les cages",
      "Ils n'ont le droit de jouer qu'en défense"
    ],
    correctIndex: 1,
    explanation: "Avec le demi-centre, l'arrière gauche et l'arrière droit forment la « base arrière ». Ce sont souvent des joueurs puissants capables de sauter haut pour tirer par-dessus la défense ou de déborder pour passer aux ailiers et au pivot !"
  },
  {
    id: "ter_06",
    category: "terrain",
    level: "facile",
    illustration: "players",
    question: "Où se place le « pivot » en attaque et quelle est sa mission ?",
    options: [
      "Au cœur de la défense adverse, au bord de la ligne des 6 mètres, pour créer des espaces et tirer de près",
      "Tout seul dans son propre camp près de son gardien",
      "Sur la ligne de touche à côté de l'entraîneur",
      "Sur la ligne médiane pendant tout le match"
    ],
    correctIndex: 0,
    explanation: "Le pivot se faufile au milieu des défenseurs adverses, juste devant la zone des 6 mètres ! Il gêne la défense en faisant des écrans (blocs) pour ses coéquipiers et tente d'attraper les passes pour se retourner et tirer de près."
  },
  {
    id: "ter_07",
    category: "terrain",
    level: "facile",
    illustration: "court",
    question: "À quelle distance du but se trouve la ligne en trait continu qui délimite la zone du gardien ?",
    options: [
      "À 4 mètres",
      "À 6 mètres",
      "À 9 mètres",
      "À 15 mètres"
    ],
    correctIndex: 1,
    explanation: "La ligne de surface de but (la zone) est tracée en trait continu à 6 mètres du but. C'est pourquoi on l'appelle très souvent « la ligne des 6 mètres » !"
  },
  {
    id: "ter_08",
    category: "terrain",
    level: "moyen",
    illustration: "court",
    question: "Comment s'appelle la ligne en POINTILLÉS située à 9 mètres du but ?",
    options: [
      "La ligne de hors-jeu",
      "La ligne de jet franc (ligne des 9 mètres)",
      "La ligne à 3 points",
      "La ligne de sortie de but"
    ],
    correctIndex: 1,
    explanation: "La ligne en pointillés située à 3 mètres derrière la zone (soit à 9 mètres du but) s'appelle la ligne de jet franc. Lorsqu'une faute est commise entre les 6m et les 9m, l'équipe attaquante remet le ballon en jeu derrière cette ligne en pointillés !"
  },
  {
    id: "ter_09",
    category: "terrain",
    level: "moyen",
    illustration: "goalie",
    question: "Quelles sont les dimensions d'un but (une cage) de handball ?",
    options: [
      "2 mètres de large sur 1 mètre de haut",
      "3 mètres de large sur 2 mètres de haut",
      "5 mètres de large sur 3 mètres de haut",
      "7 mètres de large sur 2,50 mètres de haut"
    ],
    correctIndex: 1,
    explanation: "Un but de handball mesure exactement 3 mètres de largeur entre les poteaux et 2 mètres de hauteur sous la barre transversale, avec des bandes bicolores bien visibles."
  },
  {
    id: "ter_10",
    category: "terrain",
    level: "moyen",
    illustration: "goalie",
    question: "À quoi sert la petite ligne tracée à 4 mètres devant le but ?",
    options: [
      "C'est la limite que le gardien ne doit pas dépasser lors d'un jet de 7 mètres avant que le tireur ait lâché le ballon",
      "C'est l'endroit où le pivot doit rester immobile",
      "C'est la ligne où se place l'arbitre pendant tout le match",
      "C'est la ligne de tir pour les enfants"
    ],
    correctIndex: 0,
    explanation: "Sur un jet de 7 mètres (penalty), le gardien de but a le droit d'avancer pour réduire l'angle du tireur, mais il ne doit pas dépasser la petite ligne des 4 mètres tant que le ballon n'a pas quitté la main du tireur !"
  },
  {
    id: "ter_11",
    category: "terrain",
    level: "facile",
    illustration: "court",
    question: "Comment s'appellent les longues lignes situées sur les deux grands côtés du terrain (40 m) ?",
    options: [
      "Les lignes de touche",
      "Les lignes de but",
      "Les lignes de penalty",
      "Les lignes de corner"
    ],
    correctIndex: 0,
    explanation: "Les deux grands côtés du terrain (40 mètres) sont délimités par les lignes de touche. Quand le ballon les franchit complètement, le jeu reprend par une remise en jeu (une touche) !"
  },
  {
    id: "ter_12",
    category: "terrain",
    level: "facile",
    illustration: "players",
    question: "En attaque placée classique, comment se répartissent généralement les 6 joueurs de champ autour de la zone adverse ?",
    options: [
      "Les 6 joueurs restent groupés au rond central",
      "2 ailiers dans les coins, 2 arrières + 1 demi-centre au large, et 1 pivot près des 6 mètres",
      "5 pivots dans la zone et 1 seul joueur dehors",
      "Les 6 joueurs en file indienne face au gardien"
    ],
    correctIndex: 1,
    explanation: "Bien vu ! On retrouve la « base avant » près de la zone (ailier gauche, pivot, ailier droit) et la « base arrière » plus au large (arrière gauche, demi-centre, arrière droit) pour faire circuler le ballon sur toute la largeur du terrain."
  },

  // ==========================================================================
  // CATÉGORIE 3 — LES GESTES TECHNIQUES (12 questions)
  // ==========================================================================
  {
    id: "tec_01",
    category: "technique",
    level: "facile",
    illustration: "pass",
    question: "Quelle est la position idéale du bras pour réussir une bonne passe classique (passe à l'épaule) ?",
    options: [
      "Le bras collé le long de la jambe",
      "Le coude levé à hauteur d'épaule, le bras armé en arrière et le pied opposé à la main de passe vers l'avant",
      "Les deux mains derrière le dos en fermant les yeux",
      "Le ballon posé sur la tête en sautant à pieds joints"
    ],
    correctIndex: 1,
    explanation: "Pour une passe précise et dynamique, on arme le bras avec le coude à hauteur de l'épaule et on avance le pied opposé (pied gauche devant si on lance de la main droite) en accompagnant le ballon vers son partenaire !"
  },
  {
    id: "tec_02",
    category: "technique",
    level: "facile",
    illustration: "pass",
    question: "Comment appelle-t-on une passe où le ballon touche le sol une fois avant d'arriver dans les mains du coéquipier ?",
    options: [
      "Une passe à rebond",
      "Une passe roulée",
      "Une passe lobée",
      "Une passe interdite"
    ],
    correctIndex: 0,
    explanation: "La passe à rebond est super utile au handball, notamment pour servir le pivot en faisant passer le ballon sous les bras levés des défenseurs !"
  },
  {
    id: "tec_03",
    category: "technique",
    level: "facile",
    illustration: "shot",
    question: "Qu'est-ce qu'un « tir en suspension » ?",
    options: [
      "Un tir effectué en restant assis par terre",
      "Un tir où le joueur prend son impulsion sur un pied, saute en l'air et tire avant de retomber au sol",
      "Un tir où le ballon reste coincé dans le filet",
      "Un tir fait depuis le banc de touche"
    ],
    correctIndex: 1,
    explanation: "Le tir en suspension est le geste spectaculaire du handball ! En sautant haut (par-dessus les défenseurs ou au-dessus de la zone de 6m), le joueur voit mieux la cible et se rapproche du but avant de lâcher son tir en l'air."
  },
  {
    id: "tec_04",
    category: "technique",
    level: "facile",
    illustration: "dribble",
    question: "Quel est le bon geste technique pour dribbler efficacement au handball ?",
    options: [
      "Taper fort sur le ballon avec la paume à plat en regardant ses pieds",
      "Accompagner et pousser le ballon vers le sol avec les doigts souples, tout en gardant la tête levée",
      "Attraper le ballon à deux mains à chaque rebond",
      "Passer la main complètement sous le ballon pour le porter"
    ],
    correctIndex: 1,
    explanation: "Un bon dribbleur utilise une main souple qui accompagne le rebond du ballon à hauteur de hanche, et surtout il garde la tête levée pour voir le jeu, ses coéquipiers démarqués et le but !"
  },
  {
    id: "tec_05",
    category: "technique",
    level: "facile",
    illustration: "pass",
    question: "Comment faut-il placer ses mains pour bien réceptionner (attraper) une passe ?",
    options: [
      "Les bras croisés contre la poitrine",
      "Une seule main tendue avec les doigts raides",
      "Les deux mains ouvertes devant soi en formant un panier (pouces et index proches) pour amortir le ballon",
      "Les mains dans le dos"
    ],
    correctIndex: 2,
    explanation: "Pour sécuriser la réception, on présente ses deux mains ouvertes face au ballon (les pouces et les index forment une sorte de triangle ou de cœur) et on amortit le ballon avec des bras souples."
  },
  {
    id: "tec_06",
    category: "technique",
    level: "facile",
    illustration: "players",
    question: "En défense, où un défenseur doit-il toujours chercher à se placer ?",
    options: [
      "Derrière l'attaquant pour le pousser dans le dos",
      "Entre son adversaire direct et son propre but, face à l'attaquant",
      "À l'intérieur de la zone de 6 mètres à côté de son gardien",
      "Dans le camp adverse pour attendre la balle"
    ],
    correctIndex: 1,
    explanation: "Règle fondamentale de la défense : toujours rester placé ENTRE l'attaquant et le but pour protéger sa cage, jambes fléchies sur ses appuis et bras actifs !"
  },
  {
    id: "tec_07",
    category: "technique",
    level: "moyen",
    illustration: "players",
    question: "Quel déplacement utilise-t-on principalement en défense pour suivre un attaquant de côté sans croiser les jambes ?",
    options: [
      "Le saut à cloche-pied",
      "Les pas chassés sur des jambes fléchies",
      "La roulade avant",
      "La course à reculons les yeux fermés"
    ],
    correctIndex: 1,
    explanation: "Les pas chassés (avec les jambes légèrement fléchies et les appuis dynamiques) permettent au défenseur de se déplacer très vite à gauche et à droite tout en restant bien équilibré face à l'attaquant !"
  },
  {
    id: "tec_08",
    category: "technique",
    level: "moyen",
    illustration: "shot",
    question: "Qu'est-ce qu'un « tir en appui » ?",
    options: [
      "Un tir déclenché en gardant au moins un pied en contact avec le sol pour surprendre la défense et le gardien",
      "Un tir où l'on s'appuie sur l'épaule de l'arbitre",
      "Un tir effectué avec la tête",
      "Un tir réservé uniquement au gardien de but"
    ],
    correctIndex: 0,
    explanation: "Contrairement au tir en suspension où l'on saute, le tir en appui est déclenché très vite depuis le sol (souvent à hauteur de hanche ou au-dessus de l'épaule), ce qui surprend souvent le gardien avant qu'il ne soit prêt !"
  },
  {
    id: "tec_09",
    category: "technique",
    level: "facile",
    illustration: "players",
    question: "Que signifie « se démarquer » quand son équipe a le ballon ?",
    options: [
      "Sortir du terrain pour boire de l'eau",
      "Se cacher derrière un défenseur sans bouger",
      "Se déplacer dans un espace libre loin des défenseurs pour pouvoir recevoir une passe",
      "Enlever son maillot d'équipe"
    ],
    correctIndex: 2,
    explanation: "Se démarquer, c'est bouger intelligemment vers un espace libre pour que le porteur de balle puisse te faire une passe sans qu'un défenseur n'intercepte le ballon !"
  },
  {
    id: "tec_10",
    category: "technique",
    level: "moyen",
    illustration: "dribble",
    question: "Qu'est-ce qu'une « feinte » au handball ?",
    options: [
      "Faire semblant d'aller dans une direction, de passer ou de tirer pour tromper son défenseur",
      "Simuler une blessure pour faire arrêter le chrono",
      "Cacher le ballon sous son maillot",
      "Demander un temps mort à l'arbitre"
    ],
    correctIndex: 0,
    explanation: "Il existe la feinte de corps (changer brusquement de direction), la feinte de passe et la feinte de tir ! Elles permettent de déstabiliser le défenseur pour s'ouvrir le chemin du but."
  },
  {
    id: "tec_11",
    category: "technique",
    level: "moyen",
    illustration: "players",
    question: "En défense, comment a-t-on le droit de contrôler un attaquant qui arrive face à soi ?",
    options: [
      "En lui tirant le maillot par-derrière",
      "En lui attrapant le bras qui tient le ballon",
      "En l'accueillant de face avec le buste et les bras fléchis pour stopper sa progression, sans le frapper",
      "En lui faisant un croche-pied"
    ],
    correctIndex: 2,
    explanation: "Le handball est un sport de contact réglementé : un défenseur bien placé de face a le droit de contrôler l'attaquant avec ses bras fléchis sur le buste, mais il est strictement interdit de pousser dans le dos, de tirer le maillot ou d'attraper le bras de tir !"
  },
  {
    id: "tec_12",
    category: "technique",
    level: "facile",
    illustration: "pass",
    question: "Pourquoi dit-on souvent aux jeunes handballeurs que « le ballon va plus vite que le joueur qui court » ?",
    options: [
      "Parce que faire des passes rapides vers l'avant permet d'avancer beaucoup plus vite que de dribbler tout seul",
      "Parce qu'il est interdit de courir sur un terrain de handball",
      "Parce que le ballon a un moteur à l'intérieur",
      "Parce qu'on ne peut faire qu'un seul dribble par match"
    ],
    correctIndex: 0,
    explanation: "Le handball est avant tout un sport collectif ! Une passe bien lancée traverse le terrain en une seconde, bien plus vite qu'un joueur en train de dribbler."
  },

  // ==========================================================================
  // CATÉGORIE 4 — L'ARBITRAGE (12 questions)
  // ==========================================================================
  {
    id: "arb_01",
    category: "arbitrage",
    level: "facile",
    illustration: "referee",
    question: "Quel geste fait l'arbitre lorsqu'un joueur a fait plus de 3 pas avec le ballon (« marcher ») ?",
    options: [
      "Il tourne ses deux avant-bras l'un autour de l'autre (le moulinet)",
      "Il met ses mains sur sa tête",
      "Il saute trois fois sur place",
      "Il montre le coin du terrain"
    ],
    correctIndex: 0,
    explanation: "Quand un joueur fait plus de 3 pas (ou garde le ballon plus de 3 secondes), l'arbitre siffle et fait tourner ses avant-bras l'un autour de l'autre devant lui : c'est le signe du « marcher » !"
  },
  {
    id: "arb_02",
    category: "arbitrage",
    level: "facile",
    illustration: "referee",
    question: "Que signifie le carton JAUNE montré par l'arbitre au handball ?",
    options: [
      "Le joueur est éliminé pour le reste du match",
      "C'est un avertissement officiel donné à un joueur (ou un entraîneur) pour une faute ou un comportement incorrect",
      "L'équipe gagne un point bonus",
      "C'est la fin de la première mi-temps"
    ],
    correctIndex: 1,
    explanation: "Le carton jaune est un avertissement ! Il prévient le joueur et son équipe qu'en cas de nouvelles fautes, la sanction suivante sera une exclusion temporaire de 2 minutes."
  },
  {
    id: "arb_03",
    category: "arbitrage",
    level: "moyen",
    illustration: "referee",
    question: "Que signifie le carton ROUGE au handball ?",
    options: [
      "Une disqualification : le joueur doit quitter le terrain et le banc pour tout le reste du match",
      "Le joueur sort seulement pendant 30 secondes",
      "L'équipe perd automatiquement le match",
      "Le joueur doit devenir gardien de but"
    ],
    correctIndex: 0,
    explanation: "Le carton rouge est une disqualification (pour une faute grave ou après 3 exclusions de 2 minutes). Le joueur disqualifié quitte le terrain pour de bon, et son équipe joue à un joueur de moins pendant 2 minutes avant qu'un autre coéquipier puisse entrer."
  },
  {
    id: "arb_04",
    category: "arbitrage",
    level: "facile",
    illustration: "court",
    question: "Comment doit-on effectuer une remise en jeu en « touche » lorsque le ballon est sorti sur le côté ?",
    options: [
      "En courant le long de la ligne avec le ballon",
      "Avec au moins un pied posé sur la ligne de touche, à l'endroit exact où le ballon est sorti",
      "En tapant dans le ballon avec le pied comme au football",
      "Depuis le milieu du terrain"
    ],
    correctIndex: 1,
    explanation: "Au handball, la touche se joue à la main à l'endroit où le ballon a franchi la ligne, en gardant au moins un pied posé SUR la ligne de touche jusqu'à ce que le ballon ait quitté la main !"
  },
  {
    id: "arb_05",
    category: "arbitrage",
    level: "moyen",
    illustration: "referee",
    question: "Que signifie le geste de l'arbitre lorsqu'il garde un bras levé verticalement au-dessus de sa tête pendant une attaque ?",
    options: [
      "Il signale un « jeu passif » (refus de jeu) : l'équipe qui attaque garde la balle sans chercher à tirer",
      "Il demande le silence dans les tribunes",
      "Il indique qu'il reste une seule minute de jeu",
      "Il salue le gardien de but"
    ],
    correctIndex: 0,
    explanation: "Au handball, on n'a pas le droit de garder le ballon indéfiniment sans attaquer ! Quand l'arbitre lève le bras, c'est l'avertissement de « jeu passif » : l'équipe a alors très peu de passes (4 passes maximum en règle officielle) pour tenter un tir, sinon le ballon est rendu à l'adversaire !"
  },
  {
    id: "arb_06",
    category: "arbitrage",
    level: "moyen",
    illustration: "court",
    question: "Lors d'un jet franc ou d'une remise en jeu, à quelle distance minimum doivent se placer les défenseurs ?",
    options: [
      "À 1 mètre du ballon",
      "À au moins 3 mètres du joueur qui remet le ballon en jeu",
      "À 10 mètres du ballon",
      "Ils peuvent coller le tireur à 10 centimètres"
    ],
    correctIndex: 1,
    explanation: "C'est la règle des 3 mètres ! Sur un engagement, une touche ou un jet franc, les joueurs adverses doivent obligatoirement reculer à au moins 3 mètres du porteur de balle pour le laisser remettre le ballon en jeu."
  },
  {
    id: "arb_07",
    category: "arbitrage",
    level: "facile",
    illustration: "referee",
    question: "Combien d'arbitres dirigent un match officiel de handball sur le terrain ?",
    options: [
      "1 seul arbitre au milieu",
      "2 arbitres sur le terrain (un arbitre de champ et un arbitre de ligne de but)",
      "4 arbitres dans chaque coin",
      "Aucun arbitre, ce sont les gardiens qui arbitrent"
    ],
    correctIndex: 1,
    explanation: "Un match officiel est dirigé par un binôme de 2 arbitres qui ont la même autorité ! L'un se place derrière les attaquants (arbitre de champ) et l'autre près du but (arbitre de ligne de but), et ils inversent leurs rôles à chaque changement d'attaque."
  },
  {
    id: "arb_08",
    category: "arbitrage",
    level: "moyen",
    illustration: "players",
    question: "Qu'est-ce qu'un « passage en force » (faute d'attaque) ?",
    options: [
      "Quand un attaquant tire trop fort dans le ballon",
      "Quand un attaquant fonce et percute un défenseur qui était déjà bien placé et arrêté devant lui",
      "Quand toute l'équipe court ensemble en contre-attaque",
      "Quand le gardien dégage le ballon jusqu'à l'autre bout du terrain"
    ],
    correctIndex: 1,
    explanation: "Les attaquants aussi peuvent faire des fautes ! Si un défenseur est déjà placé de face sur ses appuis et que l'attaquant lui fonce dessus en le renversant, l'arbitre siffle « passage en force » et rend le ballon à la défense."
  },
  {
    id: "arb_09",
    category: "arbitrage",
    level: "facile",
    illustration: "goalie",
    question: "Qui remet le ballon en jeu lorsqu'un attaquant tire à côté du but et que le ballon sort derrière la ligne de but (sans être touché par un défenseur) ?",
    options: [
      "C'est un corner pour l'attaque",
      "C'est un « renvoi » joué par le gardien de but depuis sa zone des 6 mètres",
      "C'est un engagement au milieu du terrain",
      "C'est une touche au niveau des 9 mètres"
    ],
    correctIndex: 1,
    explanation: "C'est un renvoi ! Le gardien de but récupère le ballon et le relance à un coéquipier depuis l'intérieur de sa surface de but (zone des 6 mètres)."
  },
  {
    id: "arb_10",
    category: "arbitrage",
    level: "moyen",
    illustration: "goalie",
    question: "Attention, piège ! Que décide l'arbitre si le GARDIEN DE BUT dévie un tir et que le ballon sort derrière sa propre ligne de sortie de but ?",
    options: [
      "C'est un corner pour les attaquants",
      "Le ballon appartient quand même au gardien (renvoi) !",
      "C'est un jet de 7 mètres",
      "Le ballon est donné à l'équipe qui crie le plus fort"
    ],
    correctIndex: 1,
    explanation: "C'est une particularité géniale du handball ! Si c'est le GARDIEN qui dévie le tir derrière sa ligne de but, il garde le ballon et fait un renvoi ! En revanche, si c'est un DÉFENSEUR de champ qui dévie le ballon derrière la ligne de but, alors il y a touche au coin pour les attaquants."
  },
  {
    id: "arb_11",
    category: "arbitrage",
    level: "facile",
    illustration: "referee",
    question: "Quel geste font les arbitres avec leurs deux mains pour demander d'arrêter le chronomètre (temps mort) ?",
    options: [
      "Ils forment la lettre « T » avec leurs deux mains à plat",
      "Ils tapent trois fois dans leurs mains",
      "Ils croisent les bras sur la poitrine",
      "Ils pointent leurs chaussures du doigt"
    ],
    correctIndex: 0,
    explanation: "Pour signaler un Temps mort (« Time-out »), l'arbitre donne trois petits coups de sifflet et forme la lettre « T » avec ses deux mains !"
  },
  {
    id: "arb_12",
    category: "arbitrage",
    level: "facile",
    illustration: "christmas",
    question: "Quelle est la règle la plus importante pour tous les joueurs du stage de Noël du Marseille Provence Handball ?",
    options: [
      "Râler après chaque coup de sifflet",
      "Le fair-play : respecter l'arbitre, ses coéquipiers et ses adversaires tout en prenant du plaisir à jouer !",
      "Garder le ballon pour soi sans jamais faire de passe",
      "Ne jouer qu'en attaque et ne jamais revenir défendre"
    ],
    correctIndex: 1,
    explanation: "Au Marseille Provence Handball, l'esprit d'équipe, le respect de l'arbitre, le fair-play et la bonne humeur sont les valeurs numéro 1 sur le terrain !"
  }
];

/**
 * QUIZ PRÉDÉFINIS (Modifiables et complétables dans le Panel Admin !)
 */
window.INITIAL_QUIZZES = [
  {
    id: "quiz_noel_mphb",
    title: "🎄 Le Grand Quiz de Noël MPHB (12 questions)",
    description: "Sélection équilibrée des 4 catégories, idéale pour animer une séance complète avec les enfants du stage !",
    timerEnabled: false,
    timerSeconds: 20,
    shuffleQuestions: true,
    questionIds: [
      "reg_01", "reg_02", "reg_05",
      "ter_01", "ter_02", "ter_06",
      "tec_01", "tec_03", "tec_06",
      "arb_01", "arb_02", "arb_12"
    ]
  },
  {
    id: "quiz_decouverte_enfants",
    title: "⭐ Spécial Découverte Mini-Hand (10 questions faciles)",
    description: "Questions simples et essentielles pour les plus jeunes ou ceux qui découvrent le handball.",
    timerEnabled: false,
    timerSeconds: 25,
    shuffleQuestions: true,
    questionIds: [
      "reg_01", "reg_02", "reg_05", "reg_10",
      "ter_02", "ter_03",
      "tec_02", "tec_04",
      "arb_01", "arb_12"
    ]
  },
  {
    id: "quiz_regles_arbitrage",
    title: "🟨 Défi Règles & Arbitrage (15 questions)",
    description: "Pour devenir incollable sur les règles officielles, les lignes du terrain et les décisions de l'arbitre !",
    timerEnabled: true,
    timerSeconds: 20,
    shuffleQuestions: true,
    questionIds: [
      "reg_02", "reg_03", "reg_04", "reg_06", "reg_07", "reg_08", "reg_09", "reg_11",
      "arb_01", "arb_02", "arb_03", "arb_04", "arb_05", "arb_08", "arb_10"
    ]
  },
  {
    id: "quiz_terrain_technique",
    title: "🤾 Champions du Terrain & de la Technique (12 questions)",
    description: "Tout savoir sur les postes (ailiers, arrières, demi-centre, pivot, gardien) et les gestes techniques.",
    timerEnabled: false,
    timerSeconds: 20,
    shuffleQuestions: true,
    questionIds: [
      "ter_01", "ter_02", "ter_03", "ter_04", "ter_05", "ter_06",
      "tec_01", "tec_03", "tec_04", "tec_05", "tec_06", "tec_07"
    ]
  },
  {
    id: "quiz_integral_48",
    title: "🏆 L'Intégrale du Stage MPHB (Les 48 questions !)",
    description: "Le marathon complet avec l'intégralité des 48 questions de la banque officielle.",
    timerEnabled: false,
    timerSeconds: 20,
    shuffleQuestions: true,
    questionIds: window.INITIAL_QUESTIONS.map(function(q) { return q.id; })
  }
];
