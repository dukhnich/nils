export interface BookImage {
  id: string;
  src: string;
  title: string;
  band: 1 | 2;
}

function img(band: 1 | 2, file: string): BookImage {
  const prefix = `Nils Holgersson band ${band}-`;
  const title = file.startsWith(prefix)
    ? file.slice(prefix.length).replace(/\.jpg$/, '')
    : file.replace(/\.jpg$/, '');
  return {
    id: file,
    src: `/images/band${band}/${encodeURIComponent(file)}`,
    title,
    band,
  };
}

export const BOOK_IMAGES: BookImage[] = [
  // Band 1 — Skåne to Östergötland
  img(1, 'Nils Holgersson band 1-Illustration 1.jpg'),
  img(1, 'Nils Holgersson band 1-Illustration 2.jpg'),
  img(1, 'Nils Holgersson band 1-Vittskövle.jpg'),
  img(1, 'Nils Holgersson band 1-Övedsklosters park.jpg'),
  img(1, 'Nils Holgersson band 1-Glimmingehus.jpg'),
  img(1, 'Nils Holgersson band 1-Klipp-port i Kullaberg.jpg'),
  img(1, 'Nils Holgersson band 1-På Kullabergs tak.jpg'),
  img(1, 'Nils Holgersson band 1-Vid Lyckeby å.jpg'),
  img(1, 'Nils Holgersson band 1-Djupafors.jpg'),
  img(1, 'Nils Holgersson band 1-Där land och hav mötas.jpg'),
  img(1, 'Nils Holgersson band 1-Karlskrona.jpg'),
  img(1, 'Nils Holgersson band 1-Väderkvarnar på Öland.jpg'),
  img(1, 'Nils Holgersson band 1-I fara för sälar.jpg'),
  img(1, 'Nils Holgersson band 1-Karlsö, strandparti.jpg'),
  img(1, 'Nils Holgersson band 1-Norra delen av Visby ringmur.jpg'),
  img(1, 'Nils Holgersson band 1-St Katarina ruin (Visby).jpg'),
  img(1, 'Nils Holgersson band 1-Småländsk ryggåsstuga.jpg'),
  img(1, 'Nils Holgersson band 1-Kråkor.jpg'),
  img(1, 'Nils Holgersson band 1-Gammal bondgård.jpg'),
  img(1, 'Nils Holgersson band 1-Jönköping.jpg'),
  img(1, 'Nils Holgersson band 1-Regnbågsfallet i Huskvarnaån.jpg'),
  img(1, 'Nils Holgersson band 1-Tåkern.jpg'),
  img(1, 'Nils Holgersson band 1-Stjärnorps ruin.jpg'),
  img(1, 'Nils Holgersson band 1-Ulvåsa.jpg'),

  // Band 2 — Södermanland to the north and back
  img(2, 'Nils Holgersson band 2-Kolmården norr om Bråviken.jpg'),
  img(2, 'Nils Holgersson band 2-Karr och Gråfäll i Fridskogen.jpg'),
  img(2, 'Nils Holgersson band 2-Eriksberg.jpg'),
  img(2, 'Nils Holgersson band 2-Gripsholm.jpg'),
  img(2, 'Nils Holgersson band 2-Karl IXs sängkammare å Gripsholm.jpg'),
  img(2, 'Nils Holgersson band 2-Örebro slott.jpg'),
  img(2, 'Nils Holgersson band 2-Bondgård från Närkeslätten.jpg'),
  img(2, 'Nils Holgersson band 2-Den gamla hästen.jpg'),
  img(2, 'Nils Holgersson band 2-Gruva med hisstorn.jpg'),
  img(2, 'Hyttnäs2.jpg'),
  img(2, 'Nils Holgersson band 2-Vattenfyllt gruvhål.jpg'),
  img(2, 'Nils Holgersson band 2-Falu gruva.jpg'),
  img(2, 'Nils Holgersson band 2-Leksands kyrka.jpg'),
  img(2, 'Nils Holgersson band 2-Svanor i Hjälstaviken.jpg'),
  img(2, 'Nils Holgersson band 2-Vårsåning på Upplandsslätten.jpg'),
  img(2, 'Nils Holgersson band 2-Uppsala domkyrka.jpg'),
  img(2, 'Nils Holgersson band 2-Uppsala högar.jpg'),
  img(2, 'Nils Holgersson band 2-Strandparti från Stockholmstrakten.jpg'),
  img(2, 'Nils Holgersson band 2-Stockholm från Mälarsidan.jpg'),
  img(2, 'Nils Holgersson band 2-De yttersta skären.jpg'),
  img(2, 'Nils Holgersson band 2-Örnen i fångenskap.jpg'),
  img(2, 'Nils Holgersson band 2-Älvkarlebyfallet.jpg'),
  img(2, 'Nils Holgersson band 2-Sandvikens järnverk.jpg'),
  img(2, 'Nils Holgersson band 2-Ankomsten till fäbodvallen.jpg'),
  img(2, 'Nils Holgersson band 2-Timmerkoja vintertid.jpg'),
  img(2, 'Nils Holgersson band 2-Sågverk på Alnön.jpg'),
  img(2, 'Nils Holgersson band 2-Ångermanälvens dalgång.jpg'),
  img(2, 'Nils Holgersson band 2-Kyrkoby på Västerbottens slättland.jpg'),
  img(2, 'Nils Holgersson band 2-Skogslandskap vid Lule älv.jpg'),
  img(2, 'Nils Holgersson band 2-Kebnekajse.jpg'),
  img(2, 'Nils Holgersson band 2-Gruvhål i Gellivare malmberg.jpg'),
  img(2, 'Nils Holgersson band 2-Lappkåta bland fjällbjörkar.jpg'),
  img(2, 'Nils Holgersson band 2-Renkorna mjölkas.jpg'),
  img(2, 'Nils Holgersson band 2-Torne träsk.jpg'),
  img(2, 'Nils Holgersson band 2-Storsjön och Oviksfjällen.jpg'),
  img(2, 'Nils Holgersson band 2-Ristaforsen.jpg'),
  img(2, 'Nils Holgersson band 2-Klarälven i norra Värmland.jpg'),
  img(2, 'Nils Holgersson band 2-Sonfjället och Ljusnan.jpg'),
  img(2, 'Nils Holgersson band 2-En liten herrgård.jpg'),
  img(2, 'Nils Holgersson band 2-Dalsland omkring Laxsjön.jpg'),
  img(2, 'Nils Holgersson band 2-Fjällbacka fiskeläge.jpg'),
  img(2, 'Nils Holgersson band 2-Båtar på sillfiske.jpg'),
  img(2, 'Nils Holgersson band 2-Jätten från Skalunda hög.jpg'),
  img(2, 'Nils Holgersson band 2-Göteborgs hamn.jpg'),
  img(2, 'Nils Holgersson band 2-En stor herrgård.jpg'),
  img(2, 'Nils Holgersson band 2-Karsefors i Lagan.jpg'),
  img(2, 'Nils Holgersson band 2-Dalälven Lennart Nyblom.jpg'),
  img(2, 'Nils Holgersson band 2-Stockholms slott Prins Eugen.jpg'),
];
