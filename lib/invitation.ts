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
    { src: "/assets/placeholders/gallery-01.svg", alt: "Wedding photo placeholder" },
    { src: "/assets/placeholders/gallery-02.svg", alt: "Wedding photo placeholder" },
    { src: "/assets/placeholders/gallery-03.svg", alt: "Wedding photo placeholder" },
    { src: "/assets/placeholders/gallery-04.svg", alt: "Wedding photo placeholder" },
  ],
} as const;

export type WishInput = {
  name: string;
  message: string;
  guestToken?: string;
};
