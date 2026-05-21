const FACTS: Record<string, string> = {
  nils: "Nils Holgersson is a 14-year-old Swedish farm boy from Vemmenhög, Skåne. He was shrunk to thumb-size by a tomte (gnome) as punishment for cruelty to animals. He travels across Sweden on Morten's back with Akka's wild geese flock. He can speak to animals. His persistent enemy is Smirre the fox; his closest companion is Morten the goose.",
  morten: "Morten is a large domestic white goose from Nils's farm in Vemmenhög. He impulsively joined the wild geese migration when Nils was shrunk. He carries Nils on his back every day. Gentle, loyal, and patient — but he feels out of place among the sleek wild grey geese, and his white feathers make him visible for miles.",
  akka: "Akka from Kebnekaise is the ancient, revered leader of the wild grey geese flock, over a hundred years old. She allowed Nils to travel with the flock after he proved his worth. Dignified, measured, and deeply wise — she banished Smirre the fox for breaking the law of migration. She refers to Nils as 'the boy' when speaking about him.",
  smirre: "Smirre is a cunning red fox from Skåne, declared outlaw by Akka after breaking the ancient animal law: predators must give migrating animals safe passage. He obsessively pursues Akka's flock and has been repeatedly humiliated by the tiny boy Nils. Clever, scheming, proud — with genuine menace beneath his dark wit.",
  gorgo: "Gorgo is a great golden eagle from the mountains of northern Sweden. Powerful, solitary, and noble. He encountered Nils during the northern journey and became something close to a friend, impressed by the tiny boy's courage. He soars higher than any other bird in the story.",
  dunfin: "Dunfin (meaning 'Downy' — Пушинка in Ukrainian) is a young Atlantic puffin from the Stockholm archipelago. Cheerful, curious, cheeky, and warm. She met Nils when the flock passed through. The most approachable character — loves to chatter.",
  kebnekaise: "Kebnekaise is Sweden's highest mountain, in Lapland in the far north. It is Akka's namesake and the wild geese's summer destination at the end of the great migration.",
  skane: "Skåne (Scania) is Sweden's southernmost province — flat and agricultural. Nils's family farm in Vemmenhög is here. Smirre the fox is also from Skåne.",
  vemmenhog: "Vemmenhög is a small village in Skåne where Nils Holgersson grew up on his family's farm. Morten the goose also came from this farm.",
  stockholm: "Stockholm is Sweden's capital. The wild geese pass through its archipelago during migration, where Dunfin the puffin lives on the rocky islands and skerries.",
  lapland: "Lapland is the vast northern region of Sweden, home to Sami people, reindeer, and Kebnekaise mountain. The wild geese's summer destination.",
  tomte: "A tomte (also nisse or gnome) is a small magical being from Scandinavian folklore who lives on farms. A tomte shrunk Nils to thumb-size as punishment for his cruelty to animals.",
  migration: "The wild grey geese make a great annual migration across all of Sweden — from the flat south (Skåne) northward through every province to Lapland and Kebnekaise. Nils joined them for this entire journey.",
  outlaw: "Smirre the fox was formally declared an outlaw by Akka after he attacked the geese during migration, breaking the ancient law that predators must give migrating animals safe passage. This ban drives Smirre to pursue the flock obsessively across Sweden.",
};

const ALIASES: Record<string, string> = {
  'nils holgersson': 'nils',
  holgersson: 'nils',
  'the boy': 'nils',
  boy: 'nils',
  'white goose': 'morten',
  'akka from kebnekaise': 'akka',
  leader: 'akka',
  fox: 'smirre',
  eagle: 'gorgo',
  'golden eagle': 'gorgo',
  puffin: 'dunfin',
  downy: 'dunfin',
  gnome: 'tomte',
  nisse: 'tomte',
  mountain: 'kebnekaise',
  scania: 'skane',
  'skåne': 'skane',
  'vemmenhög': 'vemmenhog',
  farm: 'vemmenhog',
};

export function lookupFact(query: string): string {
  const q = query.toLowerCase().trim();

  if (FACTS[q]) return FACTS[q];

  const aliased = ALIASES[q];
  if (aliased && FACTS[aliased]) return FACTS[aliased];

  for (const [key, val] of Object.entries(FACTS)) {
    if (q.includes(key) || key.includes(q)) return val;
  }
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (q.includes(alias) && FACTS[key]) return FACTS[key];
  }

  return `No canon record found for "${query}". Draw on your general knowledge of the Nils Holgersson story.`;
}
