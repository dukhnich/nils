export type Lang = 'en' | 'uk';
export type CharId = 'nils' | 'morten' | 'akka' | 'smirre' | 'gorgo' | 'dunfin';

type CharStrings = Record<CharId, { tagline: string; hint: string }>;

const characters: Record<Lang, CharStrings> = {
  en: {
    nils: {
      tagline: 'The boy who flies with wild geese',
      hint: "Ask about the tomte, what it's like to ride Morten, or life at thumb-size.",
    },
    morten: {
      tagline: 'The loyal white goose who carries Nils',
      hint: 'Ask about flying with the wild geese, carrying Nils, or the farm you left behind.',
    },
    akka: {
      tagline: 'The ancient, wise leader of the wild grey geese',
      hint: 'Ask about the laws of migration, the flock, or what you make of the boy.',
    },
    smirre: {
      tagline: 'The cunning fox who will not give up the chase',
      hint: 'Ask about your schemes against the geese, your grudge with Nils, or the hunt.',
    },
    gorgo: {
      tagline: 'The great eagle who soars above it all',
      hint: 'Ask what you see from the heights, why you befriended the tiny boy, or life as an eagle.',
    },
    dunfin: {
      tagline: 'The cheerful puffin of the Stockholm archipelago',
      hint: 'Ask about the island skerries, what you think of Nils, or life on the archipelago.',
    },
  },
  uk: {
    nils: {
      tagline: 'Хлопчик, що летить з дикими гусьми',
      hint: 'Запитай про томте, яково їхати на Мортені або жити з горошину.',
    },
    morten: {
      tagline: 'Вірний білий гусак, що носить Нільса',
      hint: 'Запитай про польоти з дикими гусьми, Нільса на спині або ферму, яку ти покинув.',
    },
    akka: {
      tagline: 'Стара мудра ватажка диких сірих гусей',
      hint: 'Запитай про закони перельоту, зграю або що ти думаєш про хлопця.',
    },
    smirre: {
      tagline: 'Хитрий лис, що не здається в погоні',
      hint: 'Запитай про твої плани проти гусей, образу на Нільса або полювання.',
    },
    gorgo: {
      tagline: 'Великий орел, що ширяє над усім',
      hint: 'Запитай, що видно з висоти, чому ти потоваришував із маленьким хлопцем або про орлине життя.',
    },
    dunfin: {
      tagline: 'Веселий топорик із Стокгольмського архіпелагу',
      hint: 'Запитай про острівні скелі, що ти думаєш про Нільса або про життя на архіпелазі.',
    },
  },
};

export const translations = {
  en: {
    characters: characters.en,
    sendButton: 'Send',
    inputPlaceholder: (name: string) =>
      `Message ${name}… (Enter to send, Shift+Enter for new line)`,
    galleryTitle: (name: string) => `Book illustrations — select to share with ${name}`,
    band1: 'Band I — Skåne to Östergötland',
    band2: 'Band II — Södermanland northward and back',
    examiningIllustration: 'Examining illustration…',
    switchLang: '🇺🇦',
  },
  uk: {
    characters: characters.uk,
    sendButton: 'Надіслати',
    inputPlaceholder: (name: string) =>
      `Повідомлення для ${name}… (Enter — надіслати, Shift+Enter — новий рядок)`,
    galleryTitle: (name: string) => `Ілюстрації з книги — оберіть, щоб показати ${name}`,
    band1: 'Том I — Сконе → Естерґетланд',
    band2: 'Том II — Седерманланд на північ і назад',
    examiningIllustration: 'Розглядаю ілюстрацію…',
    switchLang: '🇬🇧',
  },
};
