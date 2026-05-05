export default function FacebookCard() {
  return (
    <article className="fb-card" aria-label="Śledź pływalnię na Facebooku">
      <div className="fb-card__title">Bądź na bieżąco</div>
      <a
        href="https://www.facebook.com/basenbialystok/"
        target="_blank"
        rel="noopener noreferrer"
        className="fb-card__link"
        aria-label="Otwórz profil Facebook pływalni Białystok"
      >
        <span className="fb-card__icon" aria-hidden="true">📘</span>
        Polub nas na Facebooku!
      </a>
    </article>
  )
}
