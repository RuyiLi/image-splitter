import styles from '../styles/SiteSettings.module.scss';

export function SiteSettings() {
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
  }

  return (
    <div class={styles.SiteSettings} onClick={toggleTheme}>
      <a href="#">
        <i class="fas fa-lightbulb"></i>
      </a>
    </div>
  );
}
