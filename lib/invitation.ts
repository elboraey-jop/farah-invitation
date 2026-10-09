export const invitation = {
  bride: "Farah",
  groom: "Karim",
  date: "2026-10-17T20:00:00+03:00",
  displayDate: "17 October 2026",
  time: "8:00 PM",
  venue: "Qasr Hall",
  venueUrl: "https://maps.app.goo.gl/teZFMRcaYmbSkw8d9",
  music: "/assets/music/farh-music.mp3",
  gallery: [
    {
      src: "/assets/gallery/farah-karim-certificate.webp",
      alt: "Farah and Karim holding their wedding certificate",
      caption: { en: "Our new beginning", ar: "بداية حكايتنا الجديدة" },
    },
    {
      src: "/assets/gallery/farah-karim-together.webp",
      alt: "Farah and Karim smiling together",
      caption: { en: "Together, always", ar: "معًا دائمًا" },
    },
  ],
} as const;

export type WishInput = {
  name: string;
  message: string;
  guestToken?: string;
};
