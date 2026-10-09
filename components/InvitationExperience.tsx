"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { invitation } from "@/lib/invitation";

type InvitationData = typeof invitation;
type Language = "en" | "ar";

const LANGUAGE_STORAGE_KEY = "fra7-invitation-language";

const copy = {
  en: {
    brideName: "Farah",
    groomName: "Karim",
    nameConnector: "&",
    coverLabel: "A celebration of love",
    coverIntro: "Together with their families",
    openInvitation: "Open invitation",
    welcome: "Welcome to our wedding",
    momentsLabel: "A little preview",
    momentsTitle: <>Moments to<br /><i>keep forever.</i></>,
    memory: "A memory in the making",
    receptionInfo: "Reception info",
    receptionTitle: <>The reception<br /><i>will take place at:</i></>,
    reception: "Reception",
    countdown: "Countdown",
    countdownAria: "Countdown to the wedding",
    countdownUnits: ["days", "hours", "min", "sec"],
    venueLabel: "The setting",
    venueTitle: <>Meet us at<br /><i>Qasr Hall</i></>,
    venueDescription: "Find your way to the place where our forever starts. We cannot wait to celebrate with you.",
    openMaps: "Open in Google Maps",
    mapAria: "Open the Qasr Hall location in Google Maps",
    wishesLabel: "A little love note",
    wishesTitle: <>Leave us<br /><i>a wish.</i></>,
    wishesDescription: "Your words will be kept privately and treasured by Farah and Karim.",
    name: "Your name",
    namePlaceholder: "How should we remember you?",
    message: "Your message",
    messagePlaceholder: "Write something from the heart...",
    sending: "Sending...",
    sendWishes: "Send your wishes",
    sent: "Your wishes have been sent privately.",
    error: "The inbox is not connected yet. Please try again later.",
    promiseLabel: "A note from us",
    promiseQuote: "“The best thing to hold onto in life is each other.”",
    promiseDescription: "We would love for you to be part of the laughter, the dancing, and every unforgettable moment.",
    time: "8:00 PM",
    languageButton: "AR",
    languageAria: "Switch to Arabic",
    coverAria: "Wedding invitation cover",
    playMusic: "Play music",
    pauseMusic: "Pause music",
    venueName: "Qasr Hall",
  },
  ar: {
    brideName: "فرح",
    groomName: "كريم",
    nameConnector: "و",
    coverLabel: "حكاية حب تبدأ من هنا",
    coverIntro: "بصحبة عائلتينا",
    openInvitation: "افتحوا الدعوة",
    welcome: "نرحّب بكم في حفل زفافنا",
    momentsLabel: "لمحة من لحظاتنا",
    momentsTitle: <>لحظات<br /><i>تبقى معنا للأبد.</i></>,
    memory: "ذكرى نُشكّلها معًا",
    receptionInfo: "تفاصيل الحفل",
    receptionTitle: <>نلتقي في الحفل<br /><i>الذي سيُقام في:</i></>,
    reception: "الحفل",
    countdown: "العدّ التنازلي",
    countdownAria: "العدّ التنازلي حتى موعد الزفاف",
    countdownUnits: ["يوم", "ساعة", "دقيقة", "ثانية"],
    venueLabel: "المكان",
    venueTitle: <>نلتقيكم في<br /><i>قاعة القصر</i></>,
    venueDescription: "تعالوا إلى المكان الذي تبدأ فيه حكايتنا معًا. لا نطيق انتظار الاحتفال بكم.",
    openMaps: "افتحوا الموقع على الخريطة",
    mapAria: "افتحوا موقع قاعة القصر على خرائط جوجل",
    wishesLabel: "رسالة محبّة",
    wishesTitle: <>اتركوا لنا<br /><i>أمنية.</i></>,
    wishesDescription: "سنحتفظ بكلماتكم بكل خصوصية، لتبقى ذكرى عزيزة علينا.",
    name: "الاسم",
    namePlaceholder: "كيف نتذكّركم؟",
    message: "رسالتكم",
    messagePlaceholder: "اكتبوا شيئًا من القلب...",
    sending: "جارٍ الإرسال...",
    sendWishes: "أرسلوا أمنيتكم",
    sent: "وصلتنا أمنيتكم وستبقى بيننا بكل خصوصية.",
    error: "صندوق الرسائل غير متصل حاليًا. حاولوا مرة أخرى لاحقًا.",
    promiseLabel: "كلمة منّا",
    promiseQuote: "«أجمل ما نتمسّك به في الحياة هو أن نكون معًا.»",
    promiseDescription: "يسعدنا أن تشاركونا الضحكات والرقص وكل لحظة لا تُنسى.",
    time: "٨:٠٠ مساءً",
    languageButton: "EN",
    languageAria: "التبديل إلى الإنجليزية",
    coverAria: "غلاف دعوة الزفاف",
    playMusic: "تشغيل الموسيقى",
    pauseMusic: "إيقاف الموسيقى",
    venueName: "قاعة القصر",
  },
} as const;

function getTimeLeft(target: string) {
  const distance = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function formatNumber(value: number, language: Language, minimumIntegerDigits = 1) {
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    useGrouping: false,
    minimumIntegerDigits,
  }).format(value);
}

function getCalendarInfo(target: string, language: Language) {
  const date = new Date(target);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadingDays = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(date);
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 5 + index))));

  return {
    year,
    monthName,
    weekdayName,
    weekdays,
    selectedDay: date.getUTCDate(),
    days: Array.from({ length: leadingDays + daysInMonth }, (_, index) => index < leadingDays ? null : index - leadingDays + 1),
  };
}

export default function InvitationExperience({ invitation }: { invitation: InvitationData }) {
  const [language, setLanguage] = useState<Language>("en");
  const [languageReady, setLanguageReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const [coverVisible, setCoverVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [wish, setWish] = useState({ name: "", message: "" });
  const [wishStatus, setWishStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioObjectUrlRef = useRef<string | null>(null);
  const audioPreparationRef = useRef<Promise<string> | null>(null);
  const activeCopy = copy[language];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const browserLanguage = window.navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
    const nextLanguage: Language = storedLanguage === "ar" || storedLanguage === "en" ? storedLanguage : browserLanguage;
    setLanguage(nextLanguage);
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    if (!languageReady) return;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language, languageReady]);

  function toggleLanguage() {
    setLanguage((currentLanguage) => currentLanguage === "en" ? "ar" : "en");
  }

  function prepareMusic() {
    if (audioObjectUrlRef.current) return Promise.resolve(audioObjectUrlRef.current);
    if (audioPreparationRef.current) return audioPreparationRef.current;

    const preparation = fetch("/api/music", {
      cache: "force-cache",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load music");
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        audioObjectUrlRef.current = objectUrl;
        if (audioRef.current) audioRef.current.src = objectUrl;
        return objectUrl;
      });

    audioPreparationRef.current = preparation.catch((error) => {
      audioPreparationRef.current = null;
      throw error;
    });
    return audioPreparationRef.current;
  }

  async function startMusic() {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      const objectUrl = audioObjectUrlRef.current ?? await prepareMusic();
      if (audio.src !== objectUrl) audio.src = objectUrl;
      await audio.play();
      setMusicPlaying(true);
      return true;
    } catch {
      setMusicPlaying(false);
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    void prepareMusic().then(() => {
      if (!cancelled) void startMusic();
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
      audioPreparationRef.current = null;
    };
  }, [invitation.music]);

  useEffect(() => {
    setTimeLeft(getTimeLeft(invitation.date));
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft(invitation.date)), 1000);
    return () => window.clearInterval(timer);
  }, [invitation.date]);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.12, rootMargin: "0px 0px -48px" },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [contentVisible]);

  const countdownValues = useMemo(() => [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds], [timeLeft]);
  const calendar = useMemo(() => getCalendarInfo(invitation.date, language), [invitation.date, language]);
  const displayDate = useMemo(() => new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(invitation.date)), [invitation.date, language]);
  const formattedCountdown = useMemo(() => countdownValues.map((value) => formatNumber(value, language, 2)), [countdownValues, language]);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }
    await startMusic();
  }

  function openInvitation() {
    if (opened) return;
    void startMusic();
    setOpened(true);
    window.setTimeout(() => {
      setCoverVisible(false);
      setContentVisible(true);
      window.requestAnimationFrame(() => document.getElementById("invitation")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, 780);
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWishStatus("sending");
    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wish),
      });
      if (!response.ok) throw new Error("Unable to send");
      setWish({ name: "", message: "" });
      setWishStatus("sent");
    } catch {
      setWishStatus("error");
    }
  }

  return (
    <main className="invitation-shell">
      <button className="language-switcher language-switcher--floating" onClick={toggleLanguage} aria-label={activeCopy.languageAria}><span className="language-switcher__globe" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5-3.5 6.2-3.5 8.5S9.7 5.8 12 3.5Z" /></svg></span><span>{activeCopy.languageButton}</span></button>
      <audio ref={audioRef} loop preload="none" />

      {coverVisible && (
        <section className={`cover ${opened ? "cover--opened" : ""}`} aria-label={activeCopy.coverAria}>
          <button className="language-switcher language-switcher--cover" onClick={toggleLanguage} aria-label={activeCopy.languageAria}><span className="language-switcher__globe" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.1-3.5-8.5S9.7 5.8 12 3.5Z" /></svg></span><span>{activeCopy.languageButton}</span></button>
          <div className="cover__glow" aria-hidden="true" />
          <div className="cover__sheet">
            <img className="cover__paper" src="/assets/backgrounds/cover-paper.webp" alt="" aria-hidden="true" loading="eager" decoding="async" />
            <div className="cover__copy">
              <p className="eyebrow">{activeCopy.coverLabel}</p>
              <p className="cover__intro">{activeCopy.coverIntro}</p>
              <h1><span>{activeCopy.brideName}</span><em>{activeCopy.nameConnector}</em><span>{activeCopy.groomName}</span></h1>
              <p className="cover__date">{displayDate}</p>
              <button className="button button--primary cover__open-button" onClick={openInvitation}>{activeCopy.openInvitation}</button>
            </div>
          </div>
        </section>
      )}

      <div id="invitation" aria-hidden={!contentVisible} className={`invitation-content ${contentVisible ? "invitation-content--visible" : ""}`}>
        <button className="language-switcher language-switcher--floating" onClick={toggleLanguage} aria-label={activeCopy.languageAria}><span className="language-switcher__globe" aria-hidden="true"><svg viewBox="0 0 24 24" role="presentation"><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.1-3.5-8.5S9.7 5.8 12 3.5Z" /></svg></span><span>{activeCopy.languageButton}</span></button>
        <div className="opening-sections" data-reveal="up">
        <section id="welcome" className="invitation-hero invitation-hero--framed">
          <div className="hero-flower hero-flower--left" aria-hidden="true" />
          <div className="hero-flower hero-flower--right" aria-hidden="true" />
          <div className="hero-content">
            <p className="section-label opening-sequence opening-sequence--label">{activeCopy.welcome}</p>
            <div className="hero-frame-wrap opening-sequence opening-sequence--frame"><img className="hero-frame" src="/assets/decor/frame-1-ribbon-cutout-hq.webp" alt="" aria-hidden="true" loading="eager" decoding="async" /></div>
            <div className="hero-framed-copy opening-sequence opening-sequence--names">
              <h2 className="hero-names"><span>{activeCopy.brideName}</span><i>{activeCopy.nameConnector}</i><span>{activeCopy.groomName}</span></h2>
            </div>
          </div>
        </section>

        <section id="moments" className="moments-section">
          <div className="moments-section__continuation" aria-hidden="true" />
          <div className="section-intro section-intro--center opening-sequence opening-sequence--moments-intro">
            <p className="section-label">{activeCopy.momentsLabel}</p>
            <h3>{activeCopy.momentsTitle}</h3>
          </div>
          <div className="moments-grid opening-sequence opening-sequence--moments-grid">
            {invitation.gallery.slice(0, 2).map((photo, index) => <figure className="moment-card" key={photo.src}><img src={photo.src} alt={language === "ar" ? "صورة من أجواء الزفاف" : photo.alt} loading="lazy" decoding="async" /><figcaption><span>{formatNumber(index + 1, language, 2)}</span> {activeCopy.memory}</figcaption></figure>)}
          </div>
        </section>
        </div>

        <section id="details" className="details-section" data-reveal="up">
          <div className="reception-info">
            <p className="section-label">{activeCopy.receptionInfo}</p>
            <h3>{activeCopy.receptionTitle}</h3>
            <strong className="reception-venue">{activeCopy.venueName}</strong>
            <p className="reception-time">{activeCopy.time}</p>
            <div className="reception-date-row">
              <span>{calendar.weekdayName}</span><b>{formatNumber(calendar.selectedDay, language)}</b><span>{calendar.monthName}</span>
            </div>
            <p className="reception-year">{formatNumber(calendar.year, language)}</p>
            <p className="reception-subtitle">{activeCopy.reception}</p>
            <p className="reception-time reception-time--secondary">{activeCopy.time}</p>
            <p className="reception-subtitle reception-subtitle--countdown">{activeCopy.countdown}</p>
            <div className="reception-countdown" aria-label={activeCopy.countdownAria}>
              {formattedCountdown.map((value, index) => <span key={value + index}><b>{value}</b> {activeCopy.countdownUnits[index]}</span>)}
            </div>
          </div>

          <div className="reception-calendar">
            <div className="calendar-ornament" aria-hidden="true"><span>❧</span><i /><span>❧</span></div>
            <p className="calendar-month">{calendar.monthName} {formatNumber(calendar.year, language)}</p>
            <div className="calendar-grid calendar-grid--head">{calendar.weekdays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid calendar-grid--days">
              {calendar.days.map((day, index) => <span className={day === calendar.selectedDay ? "is-selected" : ""} key={day === null ? `empty-${index}` : day}>{day === null ? "" : formatNumber(day, language)}</span>)}
            </div>
          </div>
        </section>

        <div className="floral-section-divider" aria-hidden="true">
          <img src="/assets/decor/location-wishes-divider.webp" alt="" loading="lazy" decoding="async" />
        </div>

        <section id="venue" className="venue-section" data-reveal="up">
          <div className="venue-section__frame" aria-hidden="true" />
          <div className="venue-card">
            <div className="venue-card__art"><a className="venue-card__map-link" href={invitation.venueUrl} target="_blank" rel="noreferrer" aria-label={activeCopy.mapAria}><img className="venue-card__map" src="/assets/backgrounds/venue-map.webp" alt={language === "ar" ? "خريطة توضّح موقع قاعة القصر" : "Map showing the Qasr Hall location"} loading="lazy" decoding="async" /></a></div>
            <div className="venue-card__copy">
              <p className="section-label">{activeCopy.venueLabel}</p>
              <h3>{activeCopy.venueTitle}</h3>
              <p>{activeCopy.venueDescription}</p>
              <a className="button button--outline" href={invitation.venueUrl} target="_blank" rel="noreferrer">{activeCopy.openMaps}</a>
            </div>
          </div>
        </section>

        <div className="floral-section-divider" aria-hidden="true">
          <img src="/assets/decor/location-wishes-divider.webp" alt="" loading="lazy" decoding="async" />
        </div>

        <section id="wishes" className="wishes-section" data-reveal="up">
          <div className="wishes-section__flower" aria-hidden="true" />
          <div className="wishes-section__branch" aria-hidden="true" />
          <div className="wishes-intro"><p className="section-label">{activeCopy.wishesLabel}</p><h3>{activeCopy.wishesTitle}</h3><p>{activeCopy.wishesDescription}</p></div>
          <form className="wish-form" onSubmit={submitWish}>
            <label><span>{activeCopy.name}</span><input required maxLength={80} value={wish.name} onChange={(event) => setWish({ ...wish, name: event.target.value })} placeholder={activeCopy.namePlaceholder} /></label>
            <label className="wish-field--message"><span>{activeCopy.message}</span><textarea className="wish-textarea" required maxLength={500} value={wish.message} onChange={(event) => setWish({ ...wish, message: event.target.value })} placeholder={activeCopy.messagePlaceholder} rows={3} /></label>
            <button className="button button--primary" disabled={wishStatus === "sending"}>{wishStatus === "sending" ? activeCopy.sending : activeCopy.sendWishes}</button>
            {wishStatus === "sent" && <p className="form-status form-status--success">{activeCopy.sent}</p>}
            {wishStatus === "error" && <p className="form-status form-status--error">{activeCopy.error}</p>}
          </form>
        </section>

        <section className="promise-section" data-reveal="scale">
          <div className="promise-section__vine" aria-hidden="true" />
          <div className="promise-card">
            <p className="section-label">{activeCopy.promiseLabel}</p>
            <blockquote>{activeCopy.promiseQuote}</blockquote>
            <span aria-hidden="true" />
            <p>{activeCopy.promiseDescription}</p>
          </div>
          <div className="promise-section__rose" aria-hidden="true" />
        </section>

      </div>

      <button className={`music-disc ${musicPlaying ? "music-disc--playing" : ""}`} onClick={toggleMusic} aria-label={musicPlaying ? activeCopy.pauseMusic : activeCopy.playMusic}><span className="music-disc__groove" /><span className="music-disc__label">K<br /><small>&amp;</small><br />F</span><span className="music-disc__center" /></button>
    </main>
  );
}
