"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { invitation } from "@/lib/invitation";

type InvitationData = typeof invitation;

function getTimeLeft(target: string) {
  const distance = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

function getCalendarInfo(target: string) {
  const date = new Date(target);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const leadingDays = (firstDay + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  const weekdayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date);

  return {
    year,
    monthName,
    weekdayName,
    selectedDay: date.getUTCDate(),
    days: Array.from({ length: leadingDays + daysInMonth }, (_, index) => index < leadingDays ? null : index - leadingDays + 1),
  };
}

export default function InvitationExperience({ invitation }: { invitation: InvitationData }) {
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

  const formattedTime = useMemo(
    () => [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds].map((value) => String(value).padStart(2, "0")),
    [timeLeft],
  );
  const calendar = useMemo(() => getCalendarInfo(invitation.date), [invitation.date]);

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
      <audio ref={audioRef} loop preload="none" />

      {coverVisible && (
        <section className={`cover ${opened ? "cover--opened" : ""}`} aria-label="Wedding invitation cover">
          <div className="cover__glow" aria-hidden="true" />
          <div className="cover__sheet">
            <img className="cover__paper" src="/assets/backgrounds/cover-paper.webp" alt="" aria-hidden="true" loading="eager" decoding="async" />
            <div className="cover__copy">
              <p className="eyebrow">A celebration of love</p>
              <p className="cover__intro">Together with their families</p>
              <h1><span>{invitation.bride}</span><em>&amp;</em><span>{invitation.groom}</span></h1>
              <p className="cover__date">{invitation.displayDate}</p>
              <button className="button button--primary cover__open-button" onClick={openInvitation}>Open invitation</button>
            </div>
          </div>
        </section>
      )}

      <div id="invitation" aria-hidden={!contentVisible} className={`invitation-content ${contentVisible ? "invitation-content--visible" : ""}`}>
        <div className="opening-sections" data-reveal="up">
        <section id="welcome" className="invitation-hero invitation-hero--framed">
          <div className="hero-flower hero-flower--left" aria-hidden="true" />
          <div className="hero-flower hero-flower--right" aria-hidden="true" />
          <div className="hero-content">
            <p className="section-label opening-sequence opening-sequence--label">Welcome to our wedding</p>
            <div className="hero-frame-wrap opening-sequence opening-sequence--frame"><img className="hero-frame" src="/assets/decor/frame-1-ribbon-cutout-hq.webp" alt="" aria-hidden="true" loading="eager" decoding="async" /></div>
            <div className="hero-framed-copy opening-sequence opening-sequence--names">
              <h2 className="hero-names"><span>{invitation.bride}</span><i>&amp;</i><span>{invitation.groom}</span></h2>
            </div>
          </div>
        </section>

        <section id="moments" className="moments-section">
          <div className="moments-section__continuation" aria-hidden="true" />
          <div className="section-intro section-intro--center opening-sequence opening-sequence--moments-intro">
            <p className="section-label">A little preview</p>
            <h3>Moments to<br /><i>keep forever.</i></h3>
          </div>
          <div className="moments-grid opening-sequence opening-sequence--moments-grid">
            {invitation.gallery.slice(0, 2).map((photo, index) => <figure className="moment-card" key={photo.src}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" /><figcaption><span>0{index + 1}</span> A memory in the making</figcaption></figure>)}
          </div>
        </section>
        </div>

        <section id="details" className="details-section" data-reveal="up">
          <div className="reception-info">
            <p className="section-label">Reception info</p>
            <h3>The reception<br /><i>will take place at:</i></h3>
            <strong className="reception-venue">{invitation.venue}</strong>
            <p className="reception-time">{invitation.time}</p>
            <div className="reception-date-row">
              <span>{calendar.weekdayName}</span><b>{calendar.selectedDay}</b><span>{calendar.monthName}</span>
            </div>
            <p className="reception-year">{calendar.year}</p>
            <p className="reception-subtitle">Reception</p>
            <p className="reception-time reception-time--secondary">{invitation.time}</p>
            <p className="reception-subtitle reception-subtitle--countdown">Countdown</p>
            <div className="reception-countdown" aria-label="Countdown to the wedding">
              {formattedTime.map((value, index) => <span key={value + index}><b>{value}</b> {['days', 'hours', 'min', 'sec'][index]}</span>)}
            </div>
          </div>

          <div className="reception-calendar">
            <div className="calendar-ornament" aria-hidden="true"><span>❧</span><i /><span>❧</span></div>
            <p className="calendar-month">{calendar.monthName} {calendar.year}</p>
            <div className="calendar-grid calendar-grid--head">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid calendar-grid--days">
              {calendar.days.map((day, index) => <span className={day === calendar.selectedDay ? "is-selected" : ""} key={day === null ? `empty-${index}` : day}>{day}</span>)}
            </div>
          </div>
        </section>

        <div className="floral-section-divider" aria-hidden="true">
          <img src="/assets/decor/location-wishes-divider.webp" alt="" loading="lazy" decoding="async" />
        </div>

        <section id="venue" className="venue-section" data-reveal="up">
          <div className="venue-section__frame" aria-hidden="true" />
          <div className="venue-card">
            <div className="venue-card__art"><a className="venue-card__map-link" href={invitation.venueUrl} target="_blank" rel="noreferrer" aria-label="Open the Qasr Hall location in Google Maps"><img className="venue-card__map" src="/assets/backgrounds/venue-map.webp" alt="Map showing the Qasr Hall location" loading="lazy" decoding="async" /></a></div>
            <div className="venue-card__copy">
              <p className="section-label">The setting</p>
              <h3>Meet us at<br /><i>{invitation.venue}</i></h3>
              <p>Find your way to the place where our forever starts. We cannot wait to celebrate with you.</p>
              <a className="button button--outline" href={invitation.venueUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
            </div>
          </div>
        </section>

        <div className="floral-section-divider" aria-hidden="true">
          <img src="/assets/decor/location-wishes-divider.webp" alt="" loading="lazy" decoding="async" />
        </div>

        <section id="wishes" className="wishes-section" data-reveal="up">
          <div className="wishes-section__flower" aria-hidden="true" />
          <div className="wishes-section__branch" aria-hidden="true" />
          <div className="wishes-intro"><p className="section-label">A little love note</p><h3>Leave us<br /><i>a wish.</i></h3><p>Your words will be kept privately and treasured by Farah and Karim.</p></div>
          <form className="wish-form" onSubmit={submitWish}>
            <label><span>Your name</span><input required maxLength={80} value={wish.name} onChange={(event) => setWish({ ...wish, name: event.target.value })} placeholder="How should we remember you?" /></label>
            <label className="wish-field--message"><span>Your message</span><textarea className="wish-textarea" required maxLength={500} value={wish.message} onChange={(event) => setWish({ ...wish, message: event.target.value })} placeholder="Write something from the heart..." rows={3} /></label>
            <button className="button button--primary" disabled={wishStatus === "sending"}>{wishStatus === "sending" ? "Sending..." : "Send your wishes"}</button>
            {wishStatus === "sent" && <p className="form-status form-status--success">Your wishes have been sent privately.</p>}
            {wishStatus === "error" && <p className="form-status form-status--error">The inbox is not connected yet. Please try again later.</p>}
          </form>
        </section>

        <section className="promise-section" data-reveal="scale">
          <div className="promise-section__vine" aria-hidden="true" />
          <div className="promise-card">
            <p className="section-label">A note from us</p>
            <blockquote>“The best thing to hold onto in life is each other.”</blockquote>
            <span aria-hidden="true" />
            <p>We would love for you to be part of the laughter, the dancing, and every unforgettable moment.</p>
          </div>
          <div className="promise-section__rose" aria-hidden="true" />
        </section>

      </div>

      <button className={`music-disc ${musicPlaying ? "music-disc--playing" : ""}`} onClick={toggleMusic} aria-label={musicPlaying ? "Pause music" : "Play music"}><span className="music-disc__groove" /><span className="music-disc__label">K<br /><small>&amp;</small><br />F</span><span className="music-disc__center" /></button>
    </main>
  );
}
